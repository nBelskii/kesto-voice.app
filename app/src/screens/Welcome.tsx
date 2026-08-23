interface Props {
  onDone: () => void;
}

export function Welcome({ onDone }: Props) {
  return (
    <div className="welcome-bg">
      <div className="welcome-card">
        <div className="welcome-icon">K</div>
        <div className="welcome-title">Welcome to Kesto</div>
        <div className="welcome-desc">Your Steam friends are already here. No setup, no servers — just call.</div>
        <div className="welcome-steps">
          <div className="welcome-step"><div className="ws-num">01</div><div className="ws-text">Your Steam friends<br />sync automatically</div></div>
          <div className="welcome-step"><div className="ws-num">02</div><div className="ws-text">Call anyone<br />with one click</div></div>
          <div className="welcome-step"><div className="ws-num">03</div><div className="ws-text">Share your screen<br />anytime during a call</div></div>
        </div>
        <button className="btn btn-big" onClick={onDone}>Let's Go</button>
      </div>
    </div>
  );
}
