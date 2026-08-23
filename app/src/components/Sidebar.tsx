import { LayoutDashboard, Users, UsersRound, Settings as SettingsIcon, Info, SunMedium, Moon, Droplets } from 'lucide-react';
import type { Screen, Theme } from '../types';

// Toggle cycles dark -> light -> glass -> dark; icon shows where clicking takes you.
const NEXT_THEME_ICON: Record<Theme, typeof SunMedium> = { dark: SunMedium, light: Droplets, glass: Moon };

interface Props {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const NAV_ITEMS: { screen: Screen; icon: typeof LayoutDashboard; label: string }[] = [
  { screen: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { screen: 'friends', icon: Users, label: 'Friends' },
  { screen: 'groups', icon: UsersRound, label: 'Groups' },
  { screen: 'settings', icon: SettingsIcon, label: 'Settings' },
  { screen: 'about', icon: Info, label: 'About' },
];

export function Sidebar({ active, onNavigate, theme, onToggleTheme }: Props) {
  return (
    <div className="side">
      <div className="brand-row">
        <div className="logo">K</div>
        <div className="brand">KESTO</div>
      </div>
      <div className="icons">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.screen}
              className={`ni${active === item.screen ? ' on' : ''}`}
              onClick={() => onNavigate(item.screen)}
            >
              <Icon strokeWidth={2.1} />
              <span className="label">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="sbot">
        <button className="tbtn" onClick={onToggleTheme} title="Switch theme">
          {(() => { const NextIcon = NEXT_THEME_ICON[theme]; return <NextIcon size={14} />; })()}
        </button>
        <div className="sdot" title="Online"></div>
      </div>
    </div>
  );
}
