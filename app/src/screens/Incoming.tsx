interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export function Incoming({ onAccept, onDecline }: Props) {
  return (
    <div className="inc-ov">
      <div className="inc-card">
        <div className="inc-label">Incoming Group Call</div>
        <div className="inc-av">CS</div>
        <div className="inc-name">CS2 Squad</div>
        <div className="inc-type">Group call · 3 waiting</div>
        <div className="inc-members"><div className="inc-mem">NF</div><div className="inc-mem">PD</div><div className="inc-mem">IR</div></div>
        <div className="inc-acts">
          <button className="btn-acc" onClick={onAccept}>Accept</button>
          <button className="btn-dec" onClick={onDecline}>Decline</button>
        </div>
      </div>
    </div>
  );
}
