import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAudioDevices } from '../hooks/useAudioDevices';
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
}

type Tab = 'audio' | 'display' | 'notifications' | 'account';

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
  // setSinkId (device-specific output) isn't supported in WebKit (macOS) yet —
  // falls back to the system default output there.
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

export function Settings({ theme, onToggleTheme, onSetTheme, onNavigate, micId, onSetMicId, speakerId, onSetSpeakerId }: Props) {
  const [tab, setTab] = useState<Tab>('audio');
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
              <button className={`s-nb${tab === 'audio' ? ' on' : ''}`} onClick={() => setTab('audio')}>Audio</button>
              <button className={`s-nb${tab === 'display' ? ' on' : ''}`} onClick={() => setTab('display')}>Display</button>
              <button className={`s-nb${tab === 'notifications' ? ' on' : ''}`} onClick={() => setTab('notifications')}>Notifications</button>
              <button className={`s-nb${tab === 'account' ? ' on' : ''}`} onClick={() => setTab('account')}>Account</button>
            </div>
            <div className="s-panel">
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
                    <div className="sc-r"><div><div className="rl">Test Audio</div><div className="rd">Play a test tone</div></div><button className="btn-g" onClick={() => playTestTone(speakerId)}>▶ Test</button></div>
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
                    <div className="sc-r"><div><div className="rl">Steam Profile</div><div className="rd">ShadowByte_92</div></div><button className="btn-g">View Profile</button></div>
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
