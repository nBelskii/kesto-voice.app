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
import { useCall } from './webrtc/useCall';
import { openSignalingSessions, startSignalPolling } from './webrtc/signaling';
import type { Screen, SteamFriend, Theme } from './types';
import './kesto.css';

// Mock friends shown until Steam is running — see steam.rs for the real path
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

interface RustSteamProfile {
  steam_id: string;
  name: string;
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

const CALL_SCREENS: Screen[] = ['ringing', 'call', 'screenshare', 'incoming'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [theme, setTheme] = useState<Theme>('dark');
  const [friends, setFriends] = useState<SteamFriend[]>(MOCK_FRIENDS);
  const [steamConnected, setSteamConnected] = useState(false);
  const [myName, setMyName] = useState('You');
  const [micId, setMicId] = useState(() => localStorage.getItem('kesto:micId') ?? '');
  const [speakerId, setSpeakerId] = useState(() => localStorage.getItem('kesto:speakerId') ?? '');

  const call = useCall(myName, micId);

  useEffect(() => localStorage.setItem('kesto:micId', micId), [micId]);
  useEffect(() => localStorage.setItem('kesto:speakerId', speakerId), [speakerId]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Point the remote-call <audio> element at the chosen output device where
  // the webview engine supports it (setSinkId isn't in WebKit/macOS yet).
  useEffect(() => {
    const el = call.remoteAudioRef.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (el?.setSinkId && speakerId) {
      el.setSinkId(speakerId).catch(() => {});
    }
  }, [speakerId, call.remoteAudioRef]);

  useEffect(() => {
    invoke<RustSteamProfile>('get_steam_profile')
      .then((p) => setMyName(p.name))
      .catch(() => {});

    invoke<RustSteamFriend[]>('get_steam_friends')
      .then((rustFriends) => {
        setSteamConnected(true);
        const mapped = rustFriends.map((f) => ({
          steamId: f.steam_id,
          name: f.name,
          avatarInitials: initials(f.name),
          online: f.online,
          inGame: f.in_game,
          gameName: f.game_name ?? undefined,
          // Steamworks alone can't tell us who has Kesto installed — that
          // needs our own presence layer. Assume yes since real testing only
          // happens between Kesto users who already know to install it.
          hasKesto: true,
        }));
        setFriends(mapped);
        openSignalingSessions(mapped.map((f) => f.steamId)).catch(() => {});
      })
      .catch((err) => {
        console.warn('Steam friends unavailable, using mock data:', err);
        setSteamConnected(false);
      });

    return startSignalPolling();
  }, []);

  // Drive screen navigation off real call state instead of a fake timer.
  useEffect(() => {
    if (call.incoming) {
      setScreen('incoming');
      return;
    }
    if (call.phase === 'outgoing' || call.phase === 'connecting') {
      setScreen('ringing');
    } else if (call.phase === 'active') {
      setScreen((s) => (s === 'screenshare' ? s : 'call'));
    } else if (call.phase === 'idle') {
      setScreen((s) => (CALL_SCREENS.includes(s) ? 'dashboard' : s));
    }
  }, [call.phase, call.incoming]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const startCall = (targets: SteamFriend[]) => {
    // Group calling isn't wired up yet (Phase 2) — this session is 1:1 only.
    if (targets[0]) call.startCall(targets[0]);
  };

  let screenEl: React.ReactNode;
  switch (screen) {
    case 'login':
      screenEl = <Login onLogin={() => setScreen('welcome')} />;
      break;
    case 'welcome':
      screenEl = <Welcome onDone={() => setScreen('dashboard')} />;
      break;
    case 'dashboard':
      screenEl = (
        <Dashboard
          friends={friends}
          steamConnected={steamConnected}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={setScreen}
          onCallFriend={(f) => startCall([f])}
        />
      );
      break;
    case 'friends':
      screenEl = (
        <Friends
          friends={friends}
          steamConnected={steamConnected}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={setScreen}
          onStartGroupCall={startCall}
        />
      );
      break;
    case 'groups':
      screenEl = <Groups theme={theme} onToggleTheme={toggleTheme} onNavigate={setScreen} />;
      break;
    case 'ringing':
      screenEl = <Ringing peerName={call.peerName} connecting={call.phase === 'connecting'} onCancel={call.cancelOutgoing} />;
      break;
    case 'call':
      screenEl = (
        <ActiveCall
          peerName={call.peerName}
          elapsedSec={call.elapsedSec}
          muted={call.muted}
          onToggleMute={call.toggleMute}
          onShareScreen={() => setScreen('screenshare')}
          onEnd={call.endCall}
        />
      );
      break;
    case 'screenshare':
      screenEl = <ScreenShareView onExit={() => setScreen('call')} onEnd={call.endCall} />;
      break;
    case 'incoming':
      screenEl = (
        <Incoming
          fromName={call.incoming?.fromName ?? ''}
          onAccept={call.acceptIncoming}
          onDecline={call.declineIncoming}
        />
      );
      break;
    case 'settings':
      screenEl = (
        <Settings
          theme={theme}
          onToggleTheme={toggleTheme}
          onSetTheme={setTheme}
          onNavigate={setScreen}
          micId={micId}
          onSetMicId={setMicId}
          speakerId={speakerId}
          onSetSpeakerId={setSpeakerId}
        />
      );
      break;
    case 'about':
      screenEl = <About theme={theme} onToggleTheme={toggleTheme} onNavigate={setScreen} />;
      break;
    default:
      screenEl = null;
  }

  return (
    <>
      {/* Always mounted so voice audio survives navigation (e.g. into Screen Share) */}
      <audio ref={call.remoteAudioRef} autoPlay style={{ display: 'none' }} />
      {screenEl}
    </>
  );
}
