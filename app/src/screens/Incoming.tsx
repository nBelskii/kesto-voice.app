interface Props {
  fromName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function Incoming({ fromName, onAccept, onDecline }: Props) {
  return (
    <div className="inc-ov">
      <div className="inc-card">
        <div className="inc-label">Incoming Call</div>
        <div className="inc-av">{fromName.slice(0, 2).toUpperCase() || '?'}</div>
        <div className="inc-name">{fromName}</div>
        <div className="inc-type">Voice call</div>
        <div className="inc-acts">
          <button className="btn-acc" onClick={onAccept}>Accept</button>
          <button className="btn-dec" onClick={onDecline}>Decline</button>
        </div>
      </div>
    </div>
  );
}
