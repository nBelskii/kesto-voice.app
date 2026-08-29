import { Sidebar } from '../components/Sidebar';
import type { Screen, Theme } from '../types';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (screen: Screen) => void;
}

export function About({ theme, onToggleTheme, onNavigate }: Props) {
  return (
    <div className="app-shell">
      <Sidebar active="about" onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="cnt">
        <div className="cnt-b">
          <div className="ab-c">
            <div className="ab-logo">K<em>E</em>STO</div>
            <div className="ab-ver">v0.1.0-alpha · build 2026.08.23</div>
            <div className="ab-tag">Steam-native voice chat.<br />No servers. No subscriptions. Just call.</div>
            <div className="ab-links">
              <a href="#" className="ab-link">Steam Page</a>
              <a href="#" className="ab-link">Support</a>
              <a href="#" className="ab-link">Privacy</a>
              <a href="#" className="ab-link">Changelog</a>
            </div>
            <button className="btn-o" style={{ marginTop: 24 }} onClick={() => onNavigate('directtest')}>
              🔧 Direct P2P Test (diagnostic, no Steam)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
