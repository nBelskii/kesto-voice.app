interface Props {
  onExit: () => void;
  onEnd: () => void;
}

export function ScreenShareView({ onExit, onEnd }: Props) {
  return (
    <div className="ss-view">
      <div className="ss-top">
        <div className="sharing-badge"><span className="rec-dot"></span> NightFox is sharing</div>
        <span className="ct-timer" style={{ fontSize: 13, marginLeft: 12 }}>00:42:18</span>
        <div className="ss-strip">
          <div className="ss-mini speak">NF</div>
          <div className="ss-mini">PD</div>
          <div className="ss-mini">IR</div>
          <div className="ss-mini">MK</div>
        </div>
      </div>
      <div className="ss-screen">
        <div className="ss-placeholder">
          <div className="ss-icon">🖥</div>
          <p>NightFox's Screen</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>1920×1080 · 60 FPS</p>
        </div>
      </div>
      <div className="cbar">
        <button className="cbtn tog"><span className="ci">🎤</span> Mute</button>
        <button className="cbtn tog"><span className="ci">🔇</span> Deafen</button>
        <button className="cbtn" onClick={onExit}><span className="ci">⬚</span> Exit Fullscreen</button>
        <button className="cbtn end" onClick={onEnd}><span className="ci">✕</span> End</button>
      </div>
    </div>
  );
}
