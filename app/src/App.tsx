import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Login } from './screens/Login';
import { Welcome } from './screens/Welcome';
import { Dashboard } from './screens/Dashboard';
import { Friends } from './screens/Friends';
import { Groups } from './screens/Groups';
import { Ringing } from './screens/Ringing';
import { ActiveCall } from './screens/ActiveCall';
import { ScreenShareView } from './screens/ScreenShareView';
import { Incoming } from './screens/Incoming';
import { Settings } from './screens/Settings';
import { About } from './screens/About';
import type { Screen, SteamFriend, Theme } from './types';
import './kesto.css';

// Mock friends until Steamworks (AppID 480) is wired up — see task #3
const MOCK_FRIENDS: SteamFriend[] = [
  { steamId: '1', name: 'NightFox', avatarInitials: 'NF', online: true, inGame: true, gameName: 'Playing CS2', hasKesto: true },
  { steamId: '2', name: 'PixelDrift', avatarInitials: 'PD', online: true, inGame: false, hasKesto: true },
  { steamId: '3', name: 'IronClad_X', avatarInitials: 'IR', online: true, inGame: true, gameName: 'Playing Dota 2', hasKesto: true },
  { steamId: '4', name: 'VortexKing', avatarInitials: 'VX', online: true, inGame: false, hasKesto: true },
  { steamId: '5', name: 'BlazeTech', avatarInitials: 'BZ', online: true, inGame: true, gameName: 'Playing Valorant', hasKesto: true },
  { steamId: '6', name: 'RocketJoe', avatarInitials: 'RK', online: true, inGame: false, hasKesto: false },
  { steamId: '7', name: 'SmokeTrail', avatarInitials: 'SM', online: true, inGame: true, gameName: 'Apex Legends', hasKesto: false },
  { steamId: '8', name: 'DarkRune', avatarInitials: 'DR', online: false, inGame: false, hasKesto: true },
  { steamId: '9', name: 'ZeroGravity', avatarInitials: 'ZR', online: false, inGame: false, hasKesto: true },
];

interface RustSteamFriend {
  steam_id: string;
  name: string;
  online: boolean;
  in_game: boolean;
  game_name: string | null;
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [theme, setTheme] = useState<Theme>('dark');
  const [callTarget, setCallTarget] = useState<SteamFriend | null>(null);
  const [friends, setFriends] = useState<SteamFriend[]>(MOCK_FRIENDS);
  const [steamConnected, setSteamConnected] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    invoke<RustSteamFriend[]>('get_steam_friends')
      .then((rustFriends) => {
        setSteamConnected(true);
        setFriends(
          rustFriends.map((f) => ({
            steamId: f.steam_id,
            name: f.name,
            avatarInitials: initials(f.name),
            online: f.online,
            inGame: f.in_game,
            gameName: f.game_name ?? undefined,
            // Steamworks alone can't tell us who has Kesto installed — that
            // needs our own presence layer (Phase 1 signaling). Assume yes
            // for now since real testing only happens between Kesto users.
            hasKesto: true,
          })),
        );
      })
      .catch((err) => {
        console.warn('Steam friends unavailable, using mock data:', err);
        setSteamConnected(false);
      });
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const startCall = (friends: SteamFriend[]) => {
    setCallTarget(friends[0] ?? null);
    setScreen('ringing');
    // Ringing is simulated for now — real answer/connect flow lands with WebRTC signaling (Phase 1)
    setTimeout(() => setScreen('call'), 1800);
  };

  switch (screen) {
    case 'login':
      return <Login onLogin={() => setScreen('welcome')} />;
    case 'welcome':
      return <Welcome onDone={() => setScreen('dashboard')} />;
    case 'dashboard':
      return (
        <Dashboard
          friends={friends}
          steamConnected={steamConnected}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={setScreen}
          onCallFriend={(f) => startCall([f])}
        />
      );
    case 'friends':
      return (
        <Friends
          friends={friends}
          steamConnected={steamConnected}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={setScreen}
          onStartGroupCall={startCall}
        />
      );
    case 'groups':
      return <Groups theme={theme} onToggleTheme={toggleTheme} onNavigate={setScreen} />;
    case 'ringing':
      return <Ringing target={callTarget} onCancel={() => setScreen('dashboard')} />;
    case 'call':
      return <ActiveCall onShareScreen={() => setScreen('screenshare')} onEnd={() => setScreen('dashboard')} />;
    case 'screenshare':
      return <ScreenShareView onExit={() => setScreen('call')} onEnd={() => setScreen('dashboard')} />;
    case 'incoming':
      return <Incoming onAccept={() => setScreen('call')} onDecline={() => setScreen('dashboard')} />;
    case 'settings':
      return <Settings theme={theme} onToggleTheme={toggleTheme} onSetTheme={setTheme} onNavigate={setScreen} />;
    case 'about':
      return <About theme={theme} onToggleTheme={toggleTheme} onNavigate={setScreen} />;
    default:
      return null;
  }
}
