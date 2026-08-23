interface Props {
  onLogin: () => void;
}

export function Login({ onLogin }: Props) {
  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">K<em>E</em>STO</div>
        <div className="login-sub">Steam-native voice chat for gamers</div>
        <button className="login-steam" onClick={onLogin}>⬡ Sign in with Steam</button>
        <div className="login-note">Kesto uses your Steam account. No separate registration needed.</div>
      </div>
    </div>
  );
}
