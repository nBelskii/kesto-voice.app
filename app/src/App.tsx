import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { BootScreen } from './components/BootScreen';
import { Login } from './screens/Login';
import { Welcome } from './screens/Welcome';
import { Dashboard } from './screens/Dashboard';
import { Friends } from './screens/Friends';
import { Groups } from './screens/Groups';
import { Messages } from './screens/Messages';
import { Ringing } from './screens/Ringing';
import { ActiveCall } from './screens/ActiveCall';
import { ScreenShareView } from './screens/ScreenShareView';
import { Incoming } from './screens/Incoming';
import { Settings } from './screens/Settings';
import { About } from './screens/About';
import { ChatPanel, type ChatThread } from './components/ChatPanel';
import { UpdateBanner } from './components/UpdateBanner';
import { useCall } from './webrtc/useCall';
import { onSignal, openSignalingSessions, startSignalPolling } from './webrtc/signaling';
import { useProfile } from './store/profile';
import { useGroups } from './store/groups';
import { useCallHistory } from './store/callHistory';
import { appendChatMessage } from './store/chat';
import { useSettings } from './store/settings';
import { playIncomingCallSound, playMessageSound } from './lib/sound';
import type { Screen, SteamFriend } from './types';
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
  const [screen, setScreen] = useState<Screen>('boot');
  const [friends, setFriends] = useState<SteamFriend[]>(MOCK_FRIENDS);
  const [steamConnected, setSteamConnected] = useState(false);
  const [steamId, setSteamId] = useState('');
  const [chatThread, setChatThread] = useState<ChatThread | null>(null);

  const { settings, updateSettings } = useSettings();
  const { profile, updateProfile, seedNameFromSteam } = useProfile();
  const { groups } = useGroups();
  const callHistory = useCallHistory();
  const call = useCall(profile.name, settings.micId, settings.micGain);

  // Point the remote-call <audio> element at the chosen output device where
  // the webview engine supports it (setSinkId isn't in WebKit/macOS yet).
  useEffect(() => {
    const el = call.remoteAudioRef.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (el?.setSinkId && settings.speakerId) {
      el.setSinkId(settings.speakerId).catch(() => {});
    }
  }, [settings.speakerId, call.remoteAudioRef]);

  useEffect(() => {
    invoke<RustSteamProfile>('get_steam_profile')
      .then((p) => {
        setSteamId(p.steam_id);
        seedNameFromSteam(p.name);
      })
      .catch(() => {});

    const fetchFriends = () => {
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
    };

    fetchFriends();
    // Steam presence (online/offline/in-game) isn't pushed to us — poll for it
    // so a friend coming online shows up without restarting the app.
    const friendsInterval = window.setInterval(fetchFriends, 10_000);
    const stopPolling = startSignalPolling();
    return () => {
      window.clearInterval(friendsInterval);
      stopPolling();
    };
  }, [seedNameFromSteam]);

  useEffect(() => {
    return onSignal((fromSteamId, payload) => {
      if (payload.kind !== 'chat-message') return;
      appendChatMessage({
        threadId: payload.threadId,
        threadName: payload.threadName,
        fromSteamId,
        fromName: payload.fromName,
        text: payload.text,
        timestamp: Date.now(),
        mine: false,
      });
      // Skip the ding if you're already looking at that exact conversation.
      if (chatThread?.id !== payload.threadId) playMessageSound();
    });
  }, [chatThread]);

  // Play a ringtone the moment an incoming call shows up (not on every
  // re-render while it's still ringing).
  useEffect(() => {
    if (call.incoming) playIncomingCallSound();
  }, [call.incoming?.callId]);

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

  const THEME_CYCLE: Record<typeof settings.theme, typeof settings.theme> = { dark: 'light', light: 'glass', glass: 'dark' };
  const toggleTheme = () => updateSettings({ theme: THEME_CYCLE[settings.theme] });

  const startCall = (targets: SteamFriend[]) => {
    // Group calling isn't wired up yet (Phase 2) — this session is 1:1 only.
    if (targets[0]) call.startCall(targets[0]);
  };

  let screenEl: React.ReactNode;
  switch (screen) {
    case 'boot':
      screenEl = <BootScreen onDone={() => setScreen('login')} />;
      break;
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
          profile={profile}
          steamId={steamId}
          callHistory={callHistory}
          groups={groups}
          theme={settings.theme}
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
          theme={settings.theme}
          onToggleTheme={toggleTheme}
          onNavigate={setScreen}
          onStartGroupCall={startCall}
          onOpenChat={setChatThread}
        />
      );
      break;
    case 'groups':
      screenEl = (
        <Groups
          friends={friends}
          callHistory={callHistory}
          theme={settings.theme}
          onToggleTheme={toggleTheme}
          onNavigate={setScreen}
          onCallFriend={(f) => startCall([f])}
          onOpenChat={setChatThread}
        />
      );
      break;
    case 'messages':
      screenEl = (
        <Messages
          friends={friends}
          theme={settings.theme}
          onToggleTheme={toggleTheme}
          onNavigate={setScreen}
          onOpenChat={setChatThread}
        />
      );
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
          onOpenChat={() => call.peerId && setChatThread({ id: call.peerId, name: call.peerName, recipientIds: [call.peerId] })}
          remoteVolume={call.remoteVolume}
          onSetRemoteVolume={call.setRemoteVolume}
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
          onNavigate={setScreen}
          settings={settings}
          onUpdateSettings={updateSettings}
          profile={profile}
          onUpdateProfile={updateProfile}
        />
      );
      break;
    case 'about':
      screenEl = <About theme={settings.theme} onToggleTheme={toggleTheme} onNavigate={setScreen} />;
      break;
    default:
      screenEl = null;
  }

  return (
    <>
      <div className="ambient"><span /><span /><span /></div>
      {/* Always mounted so voice audio survives navigation (e.g. into Screen Share) */}
      <audio ref={call.remoteAudioRef} autoPlay style={{ display: 'none' }} />
      <div key={screen} className="screen-transition">
        {screenEl}
      </div>
      <ChatPanel thread={chatThread} myName={profile.name} onClose={() => setChatThread(null)} />
      <UpdateBanner />
    </>
  );
}
