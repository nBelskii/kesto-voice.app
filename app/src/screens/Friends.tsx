import { useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import type { Screen, SteamFriend, Theme } from '../types';

interface Props {
  friends: SteamFriend[];
  steamConnected: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (screen: Screen) => void;
  onStartGroupCall: (friends: SteamFriend[]) => void;
}

type Filter = 'all' | 'online' | 'incall' | 'kesto';

export function Friends({ friends, steamConnected, theme, onToggleTheme, onNavigate, onStartGroupCall }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return friends.filter((f) => {
      if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === 'online') return f.online;
      if (filter === 'kesto') return f.hasKesto;
      return true;
    });
  }, [friends, filter, query]);

  const toggle = (steamId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(steamId)) next.delete(steamId);
      else next.add(steamId);
      return next;
    });
  };

  const selectedFriends = friends.filter((f) => selected.has(f.steamId));

  return (
    <div className="app-shell">
      <Sidebar active="friends" onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="cnt">
        <div className="cnt-h"><h1>FRIENDS</h1><div className="sub">{steamConnected ? 'Synced from Steam' : 'Steam offline — showing mock data'}</div></div>
        <div className="cnt-b" style={{ paddingBottom: 90 }}>
          <div className="ftool">
            <input className="finput" placeholder="Search friends..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="pills">
              <button className={`pill${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>All ({friends.length})</button>
              <button className={`pill${filter === 'online' ? ' on' : ''}`} onClick={() => setFilter('online')}>Online ({friends.filter(f => f.online).length})</button>
              <button className={`pill${filter === 'kesto' ? ' on' : ''}`} onClick={() => setFilter('kesto')}>Has Kesto ({friends.filter(f => f.hasKesto).length})</button>
            </div>
          </div>
          <div className="fgrid">
            {filtered.map((f) => {
              const canSelect = f.hasKesto;
              const statusClass = !f.online ? 'off' : f.inGame ? 'aw' : 'on';
              return (
                <div className={`card fc${!f.hasKesto ? ' nk' : ''}${!f.online ? ' ofl' : ''}`} key={f.steamId}>
                  <input
                    type="checkbox"
                    className="fchk"
                    checked={selected.has(f.steamId)}
                    disabled={!canSelect}
                    onChange={() => toggle(f.steamId)}
                  />
                  <div className="f-av">{f.avatarInitials}<div className={`f-pr ${statusClass}`}></div></div>
                  <div className="f-info">
                    <b>{f.name}</b>
                    <small>{f.gameName ?? (f.online ? 'Online' : 'Offline')}</small>
                  </div>
                  {f.hasKesto ? (
                    <button className="btn" disabled={!f.online} onClick={() => onStartGroupCall([f])}>Call</button>
                  ) : (
                    <span className="f-badge">No Kesto</span>
                  )}
                </div>
              );
            })}
          </div>
          {selected.size > 0 && (
            <div className="fbar">
              <span>{selected.size} friends selected</span>
              <button className="btn" style={{ padding: '9px 26px', fontSize: 13 }} onClick={() => onStartGroupCall(selectedFriends)}>
                Start Group Call ({selected.size})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
