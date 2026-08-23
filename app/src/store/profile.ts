import { useCallback, useEffect, useState } from 'react';

export interface AccentOption {
  id: string;
  label: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
  accent2: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'emerald', label: 'Emerald', accent: '#10b981', accentHover: '#059669', accentGlow: 'rgba(16,185,129,0.3)', accent2: '#06b6d4' },
  { id: 'cyan', label: 'Cyan', accent: '#06b6d4', accentHover: '#0891b2', accentGlow: 'rgba(6,182,212,0.3)', accent2: '#3b82f6' },
  { id: 'violet', label: 'Violet', accent: '#8b5cf6', accentHover: '#7c3aed', accentGlow: 'rgba(139,92,246,0.3)', accent2: '#d946ef' },
  { id: 'amber', label: 'Amber', accent: '#f59e0b', accentHover: '#d97706', accentGlow: 'rgba(245,158,11,0.3)', accent2: '#ef4444' },
  { id: 'rose', label: 'Rose', accent: '#f43f5e', accentHover: '#e11d48', accentGlow: 'rgba(244,63,94,0.3)', accent2: '#f59e0b' },
  { id: 'blue', label: 'Blue', accent: '#3b82f6', accentHover: '#2563eb', accentGlow: 'rgba(59,130,246,0.3)', accent2: '#06b6d4' },
];

export const AVATAR_OPTIONS = ['🐺', '🦊', '🐉', '👾', '🎮', '⚡', '🔥', '💀', '🦅', '🐍', '🦁', '🎯'];

export interface Profile {
  name: string;
  bio: string;
  accentId: string;
  avatar: string;
  nameCustomized: boolean;
}

const KEY = 'kesto:profile';

const DEFAULT_PROFILE: Profile = {
  name: 'You',
  bio: '',
  accentId: 'emerald',
  avatar: '🎮',
  nameCustomized: false,
};

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function save(profile: Profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function getAccent(accentId: string): AccentOption {
  return ACCENT_OPTIONS.find((a) => a.id === accentId) ?? ACCENT_OPTIONS[0];
}

export function applyAccentToDocument(accentId: string) {
  const a = getAccent(accentId);
  const root = document.documentElement.style;
  root.setProperty('--accent', a.accent);
  root.setProperty('--accent-hover', a.accentHover);
  root.setProperty('--accent-glow', a.accentGlow);
  root.setProperty('--accent-soft', `${a.accent}1f`);
  root.setProperty('--accent-border', `${a.accent}40`);
  root.setProperty('--accent2', a.accent2);
  root.setProperty('--gradient', `linear-gradient(135deg, ${a.accent}, ${a.accent2})`);
}

export function useProfile() {
  const [profile, setProfileState] = useState<Profile>(() => load());

  useEffect(() => {
    applyAccentToDocument(profile.accentId);
  }, [profile.accentId]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  // If Steam gives us a real name and the user hasn't picked their own yet,
  // seed it once rather than overwriting a deliberate customization.
  const seedNameFromSteam = useCallback((steamName: string) => {
    setProfileState((prev) => {
      if (prev.nameCustomized || prev.name !== DEFAULT_PROFILE.name) return prev;
      const next = { ...prev, name: steamName };
      save(next);
      return next;
    });
  }, []);

  return { profile, updateProfile, seedNameFromSteam };
}
