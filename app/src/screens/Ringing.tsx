interface Props {
  peerName: string;
  connecting: boolean;
  onCancel: () => void;
}

export function Ringing({ peerName, connecting, onCancel }: Props) {
  return (
    <div className="ring-bg">
      <div className="ring-card">
        <div className="ring-label">{connecting ? 'Connecting...' : 'Calling...'}</div>
        <div className="ring-av">{peerName.slice(0, 2).toUpperCase() || '?'}</div>
        <div className="ring-name">{peerName}</div>
        <div className="ring-dots"><span></span><span></span><span></span></div>
        <button className="btn-d" style={{ padding: '12px 36px', fontSize: 14 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
