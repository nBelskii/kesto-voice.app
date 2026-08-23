import { useCallback, useEffect, useRef, useState } from 'react';
import { onSignal, sendSignal, type SignalPayload } from './signaling';
import type { SteamFriend } from '../types';

// Public STUN only for now — enough for most home NATs to find a direct P2P
// path. No TURN relay yet, so calls across some symmetric-NAT/CGNAT setups
// may fail to connect; see plans/kesto-development-plan.md (Steam Relay is
// the intended fallback, not wired up).
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

export type CallPhase = 'idle' | 'outgoing' | 'connecting' | 'active';

export interface IncomingCall {
  callId: string;
  fromSteamId: string;
  fromName: string;
}

export function useCall(myName: string, micId: string) {
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [peerName, setPeerName] = useState('');
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [muted, setMuted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Mirrors of the state above, for reads inside the async signal handler —
  // React state captured in a closure would go stale between renders.
  const phaseRef = useRef<CallPhase>('idle');
  const incomingRef = useRef<IncomingCall | null>(null);
  const micIdRef = useRef(micId);
  micIdRef.current = micId;

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef('');
  const peerIdRef = useRef('');
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const timerRef = useRef<number | null>(null);

  const setPhaseBoth = (p: CallPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const setIncomingBoth = (v: IncomingCall | null) => {
    incomingRef.current = v;
    setIncoming(v);
  };

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pendingCandidatesRef.current = [];
    callIdRef.current = '';
    peerIdRef.current = '';
    setElapsedSec(0);
    setMuted(false);
    setPeerName('');
    setPhaseBoth('idle');
    setIncomingBoth(null);
  }, []);

  const createPeerConnection = useCallback(
    (peerSteamId: string, callId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal(peerSteamId, { kind: 'ice-candidate', callId, candidate: e.candidate.toJSON() });
        }
      };
      pc.ontrack = (e) => {
        const [stream] = e.streams;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setPhaseBoth('active');
          if (timerRef.current === null) {
            timerRef.current = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
          }
        }
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          cleanup();
        }
      };
      pcRef.current = pc;
      return pc;
    },
    [cleanup],
  );

  const attachLocalStream = useCallback(async (pc: RTCPeerConnection) => {
    const id = micIdRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: id ? { deviceId: { exact: id } } : true,
    });
    localStreamRef.current = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  }, []);

  const startCall = useCallback(
    async (friend: SteamFriend) => {
      const callId = crypto.randomUUID();
      callIdRef.current = callId;
      peerIdRef.current = friend.steamId;
      setPeerName(friend.name);
      setPhaseBoth('outgoing');
      await sendSignal(friend.steamId, { kind: 'call-request', callId, fromName: myName });
    },
    [myName],
  );

  const cancelOutgoing = useCallback(() => {
    if (callIdRef.current && peerIdRef.current) {
      sendSignal(peerIdRef.current, { kind: 'call-cancel', callId: callIdRef.current });
    }
    cleanup();
  }, [cleanup]);

  const acceptIncoming = useCallback(async () => {
    const call = incomingRef.current;
    if (!call) return;
    callIdRef.current = call.callId;
    peerIdRef.current = call.fromSteamId;
    setPeerName(call.fromName);
    setIncomingBoth(null);
    setPhaseBoth('connecting');
    await sendSignal(call.fromSteamId, { kind: 'call-accept', callId: call.callId });
    const pc = createPeerConnection(call.fromSteamId, call.callId);
    await attachLocalStream(pc);
    // We wait for the caller's SDP offer, sent right after they see call-accept.
  }, [createPeerConnection, attachLocalStream]);

  const declineIncoming = useCallback(() => {
    const call = incomingRef.current;
    if (call) sendSignal(call.fromSteamId, { kind: 'call-decline', callId: call.callId });
    setIncomingBoth(null);
  }, []);

  const endCall = useCallback(() => {
    if (callIdRef.current && peerIdRef.current) {
      sendSignal(peerIdRef.current, { kind: 'call-end', callId: callIdRef.current });
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  useEffect(() => {
    return onSignal(async (fromSteamId: string, payload: SignalPayload) => {
      switch (payload.kind) {
        case 'call-request':
          if (phaseRef.current === 'idle' && !incomingRef.current) {
            setIncomingBoth({ callId: payload.callId, fromSteamId, fromName: payload.fromName });
          } else {
            sendSignal(fromSteamId, { kind: 'call-decline', callId: payload.callId });
          }
          break;

        case 'call-accept':
          if (payload.callId === callIdRef.current) {
            setPhaseBoth('connecting');
            const pc = createPeerConnection(fromSteamId, payload.callId);
            await attachLocalStream(pc);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal(fromSteamId, { kind: 'sdp-offer', callId: payload.callId, sdp: offer.sdp! });
          }
          break;

        case 'sdp-offer':
          if (payload.callId === callIdRef.current && pcRef.current) {
            await pcRef.current.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
            for (const c of pendingCandidatesRef.current) await pcRef.current.addIceCandidate(c);
            pendingCandidatesRef.current = [];
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            await sendSignal(fromSteamId, { kind: 'sdp-answer', callId: payload.callId, sdp: answer.sdp! });
          }
          break;

        case 'sdp-answer':
          if (payload.callId === callIdRef.current && pcRef.current) {
            await pcRef.current.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
            for (const c of pendingCandidatesRef.current) await pcRef.current.addIceCandidate(c);
            pendingCandidatesRef.current = [];
          }
          break;

        case 'ice-candidate':
          if (payload.callId === callIdRef.current) {
            if (pcRef.current?.remoteDescription) {
              await pcRef.current.addIceCandidate(payload.candidate);
            } else {
              pendingCandidatesRef.current.push(payload.candidate);
            }
          }
          break;

        case 'call-decline':
        case 'call-cancel':
          if (incomingRef.current?.callId === payload.callId) {
            setIncomingBoth(null);
          }
          if (payload.callId === callIdRef.current) {
            cleanup();
          }
          break;

        case 'call-end':
          if (payload.callId === callIdRef.current) cleanup();
          break;
      }
    });
  }, [createPeerConnection, attachLocalStream, cleanup]);

  return {
    phase,
    peerName,
    incoming,
    muted,
    elapsedSec,
    remoteAudioRef,
    startCall,
    cancelOutgoing,
    acceptIncoming,
    declineIncoming,
    endCall,
    toggleMute,
  };
}
