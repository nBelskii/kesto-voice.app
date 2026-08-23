import { Sidebar } from '../components/Sidebar';
import type { Screen, Theme } from '../types';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (screen: Screen) => void;
}

const GROUPS = [
  { id: 'cs2', name: 'CS2 Squad', members: 'NightFox, PixelDrift, IronClad_X, VortexKing', ago: '2h ago', last: '42m', calls: 23, avg: '38m', quality: 'Excellent' },
  { id: 'val', name: 'Valorant Team', members: 'NightFox, BlazeTech, PixelDrift, IronClad_X, DarkRune', ago: 'Yesterday', last: '1h 03m', calls: 11, avg: '55m', quality: 'Good' },
  { id: 'duo', name: 'Duo — NightFox', members: 'NightFox, You', ago: '3d ago', last: '22m', calls: 47, avg: '19m', quality: 'Excellent' },
];

export function Groups({ theme, onToggleTheme, onNavigate }: Props) {
  return (
    <div className="app-shell">
      <Sidebar active="groups" onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="cnt">
        <div className="cnt-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>GROUPS</h1><div className="sub">Saved from calls</div></div>
          <button className="btn">+ Create Group</button>
        </div>
        <div className="cnt-b">
          {GROUPS.map((g) => (
            <div className="card gc" key={g.id}>
              <div className="gc-m">
                <div className="gc-i">{g.name.slice(0, 2).toUpperCase()}</div>
                <div className="gc-info"><b>{g.name}</b><small>{g.members}</small></div>
                <div className="gc-meta"><span>{g.ago}</span><span>{g.last}</span></div>
                <button className="btn">Call</button>
                <button className="btn-o" style={{ marginLeft: 4 }}>✕</button>
              </div>
              <div className="gc-stats">
                <div className="gc-s"><div className="v">{g.calls}</div><div className="l">Total Calls</div></div>
                <div className="gc-s"><div className="v">{g.avg}</div><div className="l">Avg Duration</div></div>
                <div className="gc-s"><div className="v">{g.quality}</div><div className="l">Avg Quality</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
