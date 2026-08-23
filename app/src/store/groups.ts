import { useCallback, useState } from 'react';

export interface Group {
  id: string;
  name: string;
  memberSteamIds: string[];
}

const KEY = 'kesto:groups';

function load(): Group[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Group[]) : [];
  } catch {
    return [];
  }
}

function save(groups: Group[]) {
  localStorage.setItem(KEY, JSON.stringify(groups));
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>(() => load());

  const createGroup = useCallback((name: string, memberSteamIds: string[]) => {
    setGroups((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), name, memberSteamIds }];
      save(next);
      return next;
    });
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { groups, createGroup, deleteGroup };
}
