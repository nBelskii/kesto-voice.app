import { Sidebar } from '../components/Sidebar';
import type { Screen, SteamFriend, Theme } from '../types';

interface Props {
  friends: SteamFriend[];
  steamConnected: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (screen: Screen) => void;
  onCallFriend: (friend: SteamFriend) => void;
}

export function Dashboard({ friends, steamConnected, theme, onToggleTheme, onNavigate, onCallFriend }: Props) {
  const quickCallFriends = friends.slice(0, 3);

  return (
    <div className="app-shell">
      <Sidebar active="dashboard" onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="cnt">
        <div className="cnt-h"><h1>DASHBOARD</h1><div className="sub">Account overview {steamConnected ? '· Steam connected' : '· Steam offline (mock data)'}</div></div>
        <div className="cnt-b">
          <div className="bento">
            <div className="card b-profile" style={{ gridColumn: 'span 5' }}>
              <div className="b-av">MK</div>
              <div>
                <div className="b-name">ShadowByte_92</div>
                <div className="b-id">STEAM_0:1:48502817</div>
                <div className="b-status"><span className="b-dot"></span> Online</div>
              </div>
            </div>
            <div className="card b-stat" style={{ gridColumn: 'span 2' }}><div className="b-val">147</div><div className="b-label">Total Calls</div></div>
            <div className="card b-stat" style={{ gridColumn: 'span 2' }}><div className="b-val">62h</div><div className="b-label">Call Time</div></div>
            <div className="card b-stat"><div className="b-val" style={{ fontSize: 20 }}>{friends.filter(f => f.online).length}</div><div className="b-label">Online</div></div>
            <div className="card b-stat"><div className="b-val" style={{ fontSize: 20 }}>4</div><div className="b-label">Groups</div></div>
            <div className="card b-stat"><div className="b-val" style={{ fontSize: 20 }}>2</div><div className="b-label">In Call</div></div>
            <div className="card b-activity" style={{ gridColumn: 'span 7' }}>
              <div className="card-h">Recent Activity <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>Last 7 days</span></div>
              <div className="ai"><div className="ai-i">▶</div><div className="ai-n">Group call — CS2 Squad</div><div className="ai-m">42 min · 4</div><span className="ai-q ex">Excellent</span></div>
              <div className="ai"><div className="ai-i">▶</div><div className="ai-n">Direct call — NightFox</div><div className="ai-m">18 min · 1:1</div><span className="ai-q gd">Good</span></div>
              <div className="ai"><div className="ai-i">▶</div><div className="ai-n">Group call — Valorant Team</div><div className="ai-m">1h 03m · 5</div><span className="ai-q ex">Excellent</span></div>
              <div className="ai"><div className="ai-i">▶</div><div className="ai-n">Direct call — PixelDrift</div><div className="ai-m">7 min · 1:1</div><span className="ai-q fr">Fair</span></div>
            </div>
            <div className="card b-quick" style={{ gridColumn: 'span 5' }}>
              <div className="card-h">Quick Call</div>
              <div style={{ padding: '6px 10px' }}>
                {quickCallFriends.map((f) => (
                  <div className="qi" key={f.steamId}>
                    <div className="qi-av">{f.avatarInitials}<div className={`qi-d ${f.online ? 'on' : 'off'}`}></div></div>
                    <div className="qi-info"><b>{f.name}</b><small>{f.gameName ?? (f.online ? 'Online' : 'Offline')}</small></div>
                    <button className={`btn${f.online ? '' : ' dis'}`} onClick={() => onCallFriend(f)}>Call</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
