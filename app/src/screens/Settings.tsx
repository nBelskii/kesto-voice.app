import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MicTest } from '../components/MicTest';
import { useAudioDevices } from '../hooks/useAudioDevices';
import { ACCENT_OPTIONS, AVATAR_OPTIONS, type Profile } from '../store/profile';
import type { Screen, Theme } from '../types';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  onSetTheme: (theme: Theme) => void;
  onNavigate: (screen: Screen) => void;
  micId: string;
  onSetMicId: (id: string) => void;
  speakerId: string;
  onSetSpeakerId: (id: string) => void;
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}

type Tab = 'profile' | 'audio' | 'display' | 'notifications' | 'account';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div className={`tog${on ? ' on' : ''}`} onClick={onClick}>
      <div className="tog-k"></div>
    </div>
  );
}

function playTestTone(sinkDeviceId: string) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 440;
  gain.gain.value = 0.15;
  osc.connect(gain);

  const dest = ctx.createMediaStreamDestination();
  gain.connect(dest);
  gain.connect(ctx.destination);

  const audioEl = new Audio();
  audioEl.srcObject = dest.stream;
  const audioElWithSink = audioEl as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
  if (sinkDeviceId && audioElWithSink.setSinkId) {
    audioElWithSink.setSinkId(sinkDeviceId).catch(() => {});
  }
  audioEl.play().catch(() => {});

  osc.start();
  osc.stop(ctx.currentTime + 0.4);
  osc.onended = () => {
    audioEl.pause();
    ctx.close();
  };
}

export function Settings({
  theme, onToggleTheme, onSetTheme, onNavigate,
  micId, onSetMicId, speakerId, onSetSpeakerId,
  profile, onUpdateProfile,
}: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [incomingCallsNotif, setIncomingCallsNotif] = useState(true);
  const [friendOnlineNotif, setFriendOnlineNotif] = useState(false);
  const { inputs, outputs, permissionGranted, requestPermission } = useAudioDevices();

  return (
    <div className="app-shell">
      <Sidebar active="settings" onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="cnt">
        <div className="cnt-h"><h1>SETTINGS</h1><div className="sub">Configuration</div></div>
        <div className="cnt-b">
          <div className="s-layout">
            <div className="s-nav">
              <button className={`s-nb${tab === 'profile' ? ' on' : ''}`} onClick={() => setTab('profile')}>Profile</button>
              <button className={`s-nb${tab === 'audio' ? ' on' : ''}`} onClick={() => setTab('audio')}>Audio</button>
              <button className={`s-nb${tab === 'display' ? ' on' : ''}`} onClick={() => setTab('display')}>Display</button>
              <button className={`s-nb${tab === 'notifications' ? ' on' : ''}`} onClick={() => setTab('notifications')}>Notifications</button>
              <button className={`s-nb${tab === 'account' ? ' on' : ''}`} onClick={() => setTab('account')}>Account</button>
            </div>
            <div className="s-panel">
              {tab === 'profile' && (
                <div className="card">
                  <div className="sc-h">Profile</div>
                  <div className="sc-b">
                    <div className="sc-r">
                      <div><div className="rl">Display Name</div><div className="rd">Shown across Kesto</div></div>
                      <input
                        className="sc-sel"
                        value={profile.name}
                        onChange={(e) => onUpdateProfile({ name: e.target.value, nameCustomized: true })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="sc-r">
                      <div><div className="rl">Bio</div><div className="rd">Short status line</div></div>
                      <input
                        className="sc-sel"
                        value={profile.bio}
                        onChange={(e) => onUpdateProfile({ bio: e.target.value.slice(0, 80) })}
                        placeholder="Say something..."
                      />
                    </div>
                    <div className="sc-r">
                      <div><div className="rl">Avatar</div><div className="rd">Pick your icon</div></div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 260 }}>
                        {AVATAR_OPTIONS.map((a) => (
                          <button
                            key={a}
                            onClick={() => onUpdateProfile({ avatar: a })}
                            style={{
                              width: 34, height: 34, fontSize: 16, borderRadius: 'var(--radius-md)',
                              border: `2px solid ${profile.avatar === a ? 'var(--accent)' : 'var(--border)'}`,
                              background: 'var(--bg-input)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="sc-r">
                      <div><div className="rl">Accent Color</div><div className="rd">Your personal color</div></div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {ACCENT_OPTIONS.map((a) => (
                          <button
                            key={a.id}
                            title={a.label}
                            onClick={() => onUpdateProfile({ accentId: a.id })}
                            style={{
                              width: 26, height: 26, borderRadius: 'var(--radius-full)', background: a.accent,
                              border: profile.accentId === a.id ? '2px solid var(--text-1)' : '2px solid transparent',
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'audio' && (
                <div className="card">
                  <div className="sc-h">Audio</div>
                  <div className="sc-b">
                    {!permissionGranted && (
                      <div className="sc-r">
                        <div><div className="rl">Microphone access</div><div className="rd">Required to list real devices and place calls</div></div>
                        <button className="btn-g" onClick={() => requestPermission()}>Grant Access</button>
                      </div>
                    )}
                    <div className="sc-r">
                      <div><div className="rl">Microphone</div><div className="rd">Input device</div></div>
                      <select className="sc-sel" value={micId} onChange={(e) => onSetMicId(e.target.value)}>
                        <option value="">System default</option>
                        {inputs.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="sc-r">
                      <div><div className="rl">Speakers</div><div className="rd">Output device</div></div>
                      <select className="sc-sel" value={speakerId} onChange={(e) => onSetSpeakerId(e.target.value)}>
                        <option value="">System default</option>
                        {outputs.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="sc-r"><div><div className="rl">Test Speakers</div><div className="rd">Play a test tone</div></div><button className="btn-g" onClick={() => playTestTone(speakerId)}>▶ Test</button></div>
                    <MicTest micId={micId} />
                    <div className="sc-r"><div><div className="rl">Noise Suppression</div><div className="rd">Reduce background noise</div></div><Toggle on={noiseSuppression} onClick={() => setNoiseSuppression(!noiseSuppression)} /></div>
                  </div>
                </div>
              )}
              {tab === 'display' && (
                <div className="card">
                  <div className="sc-h">Display</div>
                  <div className="sc-b">
                    <div className="sc-r">
                      <div><div className="rl">Theme</div><div className="rd">Choose visual theme</div></div>
                      <div className="th-sw">
                        <div className={`th-s dk${theme === 'dark' ? ' sel' : ''}`} onClick={() => onSetTheme('dark')}></div>
                        <div className={`th-s lt${theme === 'light' ? ' sel' : ''}`} onClick={() => onSetTheme('light')}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'notifications' && (
                <div className="card">
                  <div className="sc-h">Notifications</div>
                  <div className="sc-b">
                    <div className="sc-r"><div><div className="rl">Incoming Calls</div><div className="rd">Show overlay</div></div><Toggle on={incomingCallsNotif} onClick={() => setIncomingCallsNotif(!incomingCallsNotif)} /></div>
                    <div className="sc-r"><div><div className="rl">Friend Online</div><div className="rd">Notify when online</div></div><Toggle on={friendOnlineNotif} onClick={() => setFriendOnlineNotif(!friendOnlineNotif)} /></div>
                  </div>
                </div>
              )}
              {tab === 'account' && (
                <div className="card">
                  <div className="sc-h">Account</div>
                  <div className="sc-b">
                    <div className="sc-r"><div><div className="rl">Steam Profile</div><div className="rd">{profile.name}</div></div><button className="btn-g">View Profile</button></div>
                    <div className="sc-r"><div><div className="rl">Sign Out</div><div className="rd">Disconnect</div></div><button className="btn-d">Sign Out</button></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
