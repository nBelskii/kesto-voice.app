import type { SteamFriend } from '../types';

interface Props {
  target: SteamFriend | null;
  onCancel: () => void;
}

export function Ringing({ target, onCancel }: Props) {
  return (
    <div className="ring-bg">
      <div className="ring-card">
        <div className="ring-label">Calling...</div>
        <div className="ring-av">{target?.avatarInitials ?? '?'}</div>
        <div className="ring-name">{target?.name ?? 'Unknown'}</div>
        <div className="ring-sub">{target?.gameName ?? 'Online'}</div>
        <div className="ring-dots"><span></span><span></span><span></span></div>
        <button className="btn-d" style={{ padding: '12px 36px', fontSize: 14 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
