import { useCallback, useEffect, useState } from 'react';

export type CallQuality = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface CallRecord {
  id: string;
  peerSteamId: string;
  peerName: string;
  startedAt: number; // epoch ms
  durationSec: number;
  quality: CallQuality;
}

const KEY = 'kesto:callHistory';
const MAX_RECORDS = 200;

function load(): CallRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CallRecord[]) : [];
  } catch {
    return [];
  }
}

function save(records: CallRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
}

export function appendCallRecord(record: Omit<CallRecord, 'id'>) {
  const records = load();
  records.unshift({ ...record, id: crypto.randomUUID() });
  save(records);
  window.dispatchEvent(new Event('kesto:callHistoryChanged'));
}

export function useCallHistory(): CallRecord[] {
  const [records, setRecords] = useState<CallRecord[]>(() => load());

  const refresh = useCallback(() => setRecords(load()), []);

  useEffect(() => {
    window.addEventListener('kesto:callHistoryChanged', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('kesto:callHistoryChanged', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return records;
}

/// Rough packet-loss -> label mapping, computed from RTCPeerConnection stats
/// right before a call ends. Not a substitute for real jitter/RTT scoring,
/// but real signal rather than a hardcoded badge.
export function qualityFromLossRatio(lossRatio: number): CallQuality {
  if (lossRatio < 0.02) return 'Excellent';
  if (lossRatio < 0.05) return 'Good';
  if (lossRatio < 0.12) return 'Fair';
  return 'Poor';
}

export function formatRelativeTime(epochMs: number): string {
  const diffSec = Math.floor((Date.now() - epochMs) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(epochMs).toLocaleDateString();
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  const h = Math.floor(m / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m % 60}m`;
}
