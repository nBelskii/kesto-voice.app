import { useCallback, useEffect, useState } from 'react';
import type { Theme } from '../types';

export interface AppSettings {
  theme: Theme;
  micId: string;
  speakerId: string;
  micGain: number; // 1.0 = unity gain, 0.0-2.0 range
  noiseSuppression: boolean;
  incomingCallsNotif: boolean;
  friendOnlineNotif: boolean;
}

const KEY = 'kesto:settings';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  micId: '',
  speakerId: '',
  micGain: 1,
  noiseSuppression: true,
  incomingCallsNotif: true,
  friendOnlineNotif: false,
};

function migrateLegacyKeys(base: AppSettings): AppSettings {
  const legacyMic = localStorage.getItem('kesto:micId');
  const legacySpeaker = localStorage.getItem('kesto:speakerId');
  if (legacyMic === null && legacySpeaker === null) return base;
  const merged = {
    ...base,
    micId: legacyMic ?? base.micId,
    speakerId: legacySpeaker ?? base.speakerId,
  };
  localStorage.removeItem('kesto:micId');
  localStorage.removeItem('kesto:speakerId');
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    const base = raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULT_SETTINGS;
    return migrateLegacyKeys(base);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function save(settings: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => load());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
