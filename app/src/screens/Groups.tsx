import { useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useGroups } from '../store/groups';
import { formatDuration, type CallRecord } from '../store/callHistory';
import type { Screen, SteamFriend, Theme } from '../types';

interface Props {
  friends: SteamFriend[];
  callHistory: CallRecord[];
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (screen: Screen) => void;
  onCallFriend: (friend: SteamFriend) => void;
}

export function Groups({ friends, callHistory, theme, onToggleTheme, onNavigate, onCallFriend }: Props) {
  const { groups, createGroup, deleteGroup } = useGroups();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const friendsById = useMemo(() => new Map(friends.map((f) => [f.steamId, f])), [friends]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitCreate = () => {
    const name = newName.trim();
    if (!name || selected.size === 0) return;
    createGroup(name, Array.from(selected));
    setNewName('');
    setSelected(new Set());
    setCreating(false);
  };

  return (
    <div className="app-shell">
      <Sidebar active="groups" onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="cnt">
        <div className="cnt-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>GROUPS</h1><div className="sub">Your saved circles</div></div>
          <button className="btn" onClick={() => setCreating(true)}>+ Create Group</button>
        </div>
        <div className="cnt-b">
          {creating && (
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <input
                className="finput"
                style={{ width: '100%', marginBottom: 10 }}
                placeholder="Group name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div className="fgrid" style={{ marginBottom: 12 }}>
                {friends.filter((f) => f.hasKesto).map((f) => (
                  <label key={f.steamId} className="card fc" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" className="fchk" checked={selected.has(f.steamId)} onChange={() => toggleSelected(f.steamId)} />
                    <div className="f-av">{f.avatarInitials}</div>
                    <div className="f-info"><b>{f.name}</b></div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={submitCreate}>Create</button>
                <button className="btn-o" onClick={() => { setCreating(false); setNewName(''); setSelected(new Set()); }}>Cancel</button>
              </div>
            </div>
          )}

          {groups.length === 0 && !creating && (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No groups yet. Create one from your Kesto friends above.
            </div>
          )}

          {groups.map((g, i) => {
            const members = g.memberSteamIds.map((id) => friendsById.get(id)).filter((f): f is SteamFriend => !!f);
            const memberIdSet = new Set(g.memberSteamIds);
            const groupCalls = callHistory.filter((c) => memberIdSet.has(c.peerSteamId));
            const totalCalls = groupCalls.length;
            const avgDurationSec = totalCalls > 0 ? Math.round(groupCalls.reduce((s, c) => s + c.durationSec, 0) / totalCalls) : 0;
            const qualityRank: Record<string, number> = { Excellent: 4, Good: 3, Fair: 2, Poor: 1 };
            let avgQuality = '—';
            if (totalCalls > 0) {
              const avgRank = groupCalls.reduce((s, c) => s + qualityRank[c.quality], 0) / totalCalls;
              avgQuality = Object.entries(qualityRank).reduce((best, [q, rank]) =>
                Math.abs(rank - avgRank) < Math.abs(qualityRank[best] - avgRank) ? q : best,
              'Good');
            }
            const callableMember = members.find((m) => m.online);

            return (
              <div className="card gc stagger-item" key={g.id} style={{ '--i': i } as React.CSSProperties}>
                <div className="gc-m">
                  <div className="gc-i">{g.name.slice(0, 2).toUpperCase()}</div>
                  <div className="gc-info">
                    <b>{g.name}</b>
                    <small>{members.map((m) => m.name).join(', ') || 'No members'}</small>
                  </div>
                  {callableMember ? (
                    <button className="btn" onClick={() => onCallFriend(callableMember)}>Call {callableMember.name}</button>
                  ) : (
                    <button className="btn dis">Nobody online</button>
                  )}
                  <button className="btn-o" style={{ marginLeft: 4 }} onClick={() => deleteGroup(g.id)}>✕</button>
                </div>
                <div className="gc-stats">
                  <div className="gc-s"><div className="v">{totalCalls}</div><div className="l">Total Calls</div></div>
                  <div className="gc-s"><div className="v">{totalCalls > 0 ? formatDuration(avgDurationSec) : '—'}</div><div className="l">Avg Duration</div></div>
                  <div className="gc-s"><div className="v">{avgQuality}</div><div className="l">Avg Quality</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
