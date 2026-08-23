import type { Screen, Theme } from '../types';

interface Props {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const NAV_ITEMS: { screen: Screen; icon: string; label: string }[] = [
  { screen: 'dashboard', icon: '■', label: 'Dashboard' },
  { screen: 'friends', icon: '◉', label: 'Friends' },
  { screen: 'groups', icon: '▣', label: 'Groups' },
  { screen: 'settings', icon: '⚙', label: 'Settings' },
  { screen: 'about', icon: 'ℹ', label: 'About' },
];

export function Sidebar({ active, onNavigate, theme, onToggleTheme }: Props) {
  return (
    <div className="side">
      <div className="logo">K</div>
      <div className="icons">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.screen}
            className={`ni${active === item.screen ? ' on' : ''}`}
            onClick={() => onNavigate(item.screen)}
          >
            {item.icon}
            <span className="tip">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="sbot">
        <button className="tbtn" onClick={onToggleTheme}>◐</button>
        <div className="sdot" title={theme === 'dark' ? 'Online' : 'Online'}></div>
      </div>
    </div>
  );
}
