import { useEffect, useState } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Download } from 'lucide-react';

export function UpdateBanner() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    check()
      .then((u) => {
        if (u?.available) setUpdate(u);
      })
      .catch(() => {
        // No network, no releases published yet, etc. — silently stay on current version.
      });
  }, []);

  if (!update) return null;

  const install = async () => {
    setInstalling(true);
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch {
      setInstalling(false);
    }
  };

  return (
    <div className="update-banner">
      <span>New version {update.version} is available</span>
      <button className="btn" onClick={install} disabled={installing}>
        <Download size={13} /> {installing ? 'Installing...' : 'Restart & Update'}
      </button>
    </div>
  );
}
