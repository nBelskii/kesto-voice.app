import { invoke } from '@tauri-apps/api/core';

export type SignalPayload =
  | { kind: 'call-request'; callId: string; fromName: string }
  | { kind: 'call-accept'; callId: string }
  | { kind: 'call-decline'; callId: string }
  | { kind: 'call-cancel'; callId: string }
  | { kind: 'call-end'; callId: string }
  | { kind: 'sdp-offer'; callId: string; sdp: string }
  | { kind: 'sdp-answer'; callId: string; sdp: string }
  | { kind: 'ice-candidate'; callId: string; candidate: RTCIceCandidateInit };

export type SignalHandler = (fromSteamId: string, payload: SignalPayload) => void;

const handlers = new Set<SignalHandler>();
let polling = false;

export function onSignal(handler: SignalHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export async function sendSignal(toSteamId: string, payload: SignalPayload): Promise<void> {
  await invoke('send_signal', { toSteamId, payload: JSON.stringify(payload) });
}

export async function openSignalingSessions(steamIds: string[]): Promise<void> {
  if (steamIds.length === 0) return;
  await invoke('open_signaling_sessions', { steamIds });
}

interface RawSignal {
  from_steam_id: string;
  payload: string;
}

// Steam Networking Messages has no push/callback surface exposed over Tauri
// IPC, so we poll. 250ms keeps call-signaling (ringing, SDP, ICE) feeling
// instant without hammering the IPC bridge.
export function startSignalPolling(): () => void {
  if (polling) return () => {};
  polling = true;
  let stopped = false;

  const loop = async () => {
    if (stopped) return;
    try {
      const messages = await invoke<RawSignal[]>('poll_signals');
      for (const m of messages) {
        try {
          const payload = JSON.parse(m.payload) as SignalPayload;
          handlers.forEach((h) => h(m.from_steam_id, payload));
        } catch (e) {
          console.warn('Bad signal payload', e);
        }
      }
    } catch {
      // Steam not connected - stop polling instead of spamming failed calls.
      polling = false;
      return;
    }
    if (!stopped) setTimeout(loop, 250);
  };

  loop();
  return () => {
    stopped = true;
    polling = false;
  };
}
