import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import type { Screen, Theme } from '../types';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  onSetTheme: (theme: Theme) => void;
  onNavigate: (screen: Screen) => void;
}

type Tab = 'audio' | 'display' | 'notifications' | 'account';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div className={`tog${on ? ' on' : ''}`} onClick={onClick}>
      <div className="tog-k"></div>
    </div>
  );
}

export function Settings({ theme, onToggleTheme, onSetTheme, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('audio');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [incomingCallsNotif, setIncomingCallsNotif] = useState(true);
  const [friendOnlineNotif, setFriendOnlineNotif] = useState(false);

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
                    <div className="sc-r"><div><div className="rl">Microphone</div><div className="rd">Input device</div></div><select className="sc-sel"><option>Blue Yeti Stereo — USB</option></select></div>
                    <div className="sc-r"><div><div className="rl">Speakers</div><div className="rd">Output device</div></div><select className="sc-sel"><option>HyperX Cloud II — USB</option></select></div>
                    <div className="sc-r"><div><div className="rl">Test Audio</div><div className="rd">Play a test tone</div></div><button className="btn-g">▶ Test</button></div>
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
