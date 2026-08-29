import { useRef, useState } from 'react';

// TEMPORARY diagnostic tool — not part of the product. Tests whether a plain
// WebRTC/STUN voice connection can establish between two networks with zero
// involvement from Steam: no signaling server at all, just copy-paste the
// SDP blob to the other person over Telegram/Discord/whatever. If this
// connects, the problem is specifically in Steam's P2P transport. If it
// doesn't, it's a NAT/network issue on this pairing regardless of Steam.
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

type Role = 'idle' | 'offerer' | 'answerer';

function waitIceComplete(pc: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', check);
  });
}

export function DirectTest({ onBack }: { onBack: () => void }) {
  const [role, setRole] = useState<Role>('idle');
  const [localSdp, setLocalSdp] = useState('');
  const [remoteInput, setRemoteInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const createPc = async () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onconnectionstatechange = () => setStatus(pc.connectionState);
    pc.oniceconnectionstatechange = () => console.log('ICE state:', pc.iceConnectionState);
    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
        audioRef.current.play().catch(() => {});
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;
    return pc;
  };

  const startOffer = async () => {
    setError('');
    setBusy(true);
    try {
      setRole('offerer');
      const pc = await createPc();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitIceComplete(pc);
      setLocalSdp(JSON.stringify(pc.localDescription));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const acceptOfferAndAnswer = async () => {
    setError('');
    setBusy(true);
    try {
      const pc = await createPc();
      const offer = JSON.parse(remoteInput) as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitIceComplete(pc);
      setLocalSdp(JSON.stringify(pc.localDescription));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const completeWithAnswer = async () => {
    setError('');
    try {
      const pc = pcRef.current;
      if (!pc) return;
      const answer = JSON.parse(remoteInput) as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const boxStyle: React.CSSProperties = { width: '100%', fontFamily: 'monospace', fontSize: 11, marginTop: 8, marginBottom: 8 };

  return (
    <div style={{ padding: 32, background: '#0a0a10', color: '#e8e8f0', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>&larr; Back to Kesto</button>
      <h2>Direct P2P Test (no Steam)</h2>
      <p style={{ color: '#8888a0', fontSize: 13 }}>
        One person clicks "I'll call", the other clicks "I'll answer". Copy/paste the text blobs to each other manually (Telegram, Discord, anything).
      </p>
      <p><b>Connection status:</b> {status}</p>
      {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}
      <audio ref={audioRef} autoPlay />

      {role === 'idle' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button disabled={busy} onClick={startOffer}>I'll call (Create Offer)</button>
          <button disabled={busy} onClick={() => setRole('answerer')}>I'll answer (Paste Offer)</button>
        </div>
      )}

      {role === 'answerer' && !localSdp && (
        <>
          <div>Paste the offer text you received:</div>
          <textarea style={boxStyle} rows={6} value={remoteInput} onChange={(e) => setRemoteInput(e.target.value)} />
          <button disabled={busy || !remoteInput} onClick={acceptOfferAndAnswer}>Create Answer</button>
        </>
      )}

      {localSdp && (
        <>
          <div>Copy this and send it to the other person:</div>
          <textarea
            style={boxStyle}
            rows={8}
            readOnly
            value={localSdp}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        </>
      )}

      {role === 'offerer' && localSdp && (
        <>
          <div>Paste their answer text here:</div>
          <textarea style={boxStyle} rows={6} value={remoteInput} onChange={(e) => setRemoteInput(e.target.value)} />
          <button disabled={!remoteInput} onClick={completeWithAnswer}>Connect</button>
        </>
      )}
    </div>
  );
}
