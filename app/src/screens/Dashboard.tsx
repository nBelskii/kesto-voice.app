import { Sidebar } from '../components/Sidebar';
import { formatDuration, formatRelativeTime, type CallRecord } from '../store/callHistory';
import type { Group } from '../store/groups';
import type { Profile } from '../store/profile';
import type { Screen, SteamFriend, Theme } from '../types';

interface Props {
  friends: SteamFriend[];
  steamConnected: boolean;
  profile: Profile;
  steamId: string;
  callHistory: CallRecord[];
  groups: Group[];
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (screen: Screen) => void;
  onCallFriend: (friend: SteamFriend) => void;
}

const QUALITY_CLASS: Record<CallRecord['quality'], string> = {
  Excellent: 'ex',
  Good: 'gd',
  Fair: 'fr',
  Poor: 'fr',
};

export function Dashboard({ friends, steamConnected, profile, steamId, callHistory, groups, theme, onToggleTheme, onNavigate, onCallFriend }: Props) {
  const quickCallFriends = friends.slice(0, 3);
  const totalCallTimeSec = callHistory.reduce((sum, c) => sum + c.durationSec, 0);
  const recent = callHistory.slice(0, 4);

  return (
    <div className="app-shell">
      <Sidebar active="dashboard" onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="cnt">
        <div className="cnt-h"><h1>DASHBOARD</h1><div className="sub">Account overview {steamConnected ? '· Steam connected' : '· Steam offline (mock data)'}</div></div>
        <div className="cnt-b">
          <div className="bento">
            <div className="card b-profile" style={{ gridColumn: 'span 5' }}>
              <div className="b-av" style={{ fontSize: 24 }}>{profile.avatar}</div>
              <div>
                <div className="b-name">{profile.name}</div>
                <div className="b-id">{steamId ? `STEAM_ID ${steamId}` : profile.bio || 'No bio set'}</div>
                <div className="b-status"><span className="b-dot"></span> Online</div>
              </div>
            </div>
            <div className="card b-stat" style={{ gridColumn: 'span 2' }}><div className="b-val">{callHistory.length}</div><div className="b-label">Total Calls</div></div>
            <div className="card b-stat" style={{ gridColumn: 'span 2' }}><div className="b-val">{totalCallTimeSec > 0 ? formatDuration(totalCallTimeSec) : '0m'}</div><div className="b-label">Call Time</div></div>
            <div className="card b-stat"><div className="b-val" style={{ fontSize: 20 }}>{friends.filter(f => f.online).length}</div><div className="b-label">Online</div></div>
            <div className="card b-stat"><div className="b-val" style={{ fontSize: 20 }}>{groups.length}</div><div className="b-label">Groups</div></div>
            <div className="card b-stat"><div className="b-val" style={{ fontSize: 20 }}>{friends.filter(f => f.inGame).length}</div><div className="b-label">In Game</div></div>
            <div className="card b-activity" style={{ gridColumn: 'span 7' }}>
              <div className="card-h">Recent Activity <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>Last calls</span></div>
              {recent.length === 0 && (
                <div style={{ padding: '20px 16px', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                  No recent calls. Call a friend to get started!
                </div>
              )}
              {recent.map((c) => (
                <div className="ai" key={c.id}>
                  <div className="ai-i">▶</div>
                  <div className="ai-n">Direct call — {c.peerName}</div>
                  <div className="ai-m">{formatDuration(c.durationSec)} · {formatRelativeTime(c.startedAt)}</div>
                  <span className={`ai-q ${QUALITY_CLASS[c.quality]}`}>{c.quality}</span>
                </div>
              ))}
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
