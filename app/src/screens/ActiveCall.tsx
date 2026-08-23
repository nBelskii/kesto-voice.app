import { useState } from 'react';

interface Props {
  onShareScreen: () => void;
  onEnd: () => void;
}

export function ActiveCall({ onShareScreen, onEnd }: Props) {
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  return (
    <div className="call-f">
      <div className="ct">
        <div className="ct-l"><span className="ct-timer">00:42:18</span><span className="ct-gn">CS2 Squad</span></div>
        <div className="ct-r">
          <div className="qbars"><i></i><i></i><i></i><i></i></div>
          <span className="ct-p">4 participants</span>
        </div>
      </div>
      <div className="cg">
        <div className="ctile speak"><div className="ctile-av">NF</div><div className="ctile-n">NightFox</div><div className="ctile-s">Speaking</div></div>
        <div className="ctile"><div className="ctile-av">PD</div><div className="ctile-n">PixelDrift</div><span className="ctile-mute">Muted</span></div>
        <div className="ctile"><div className="ctile-av">IR</div><div className="ctile-n">IronClad_X</div></div>
        <div className="ctile" style={{ borderStyle: 'dashed' }}>
          <div className="ctile-av" style={{ opacity: 0.4 }}>MK</div>
          <div className="ctile-n" style={{ color: 'var(--text-3)' }}>You</div>
          {deafened && <div className="ctile-s" style={{ color: 'var(--text-3)' }}>Deafened</div>}
        </div>
      </div>
      <div className="cbar">
        <button className={`cbtn${muted ? ' tog' : ''}`} onClick={() => setMuted(!muted)}><span className="ci">🎤</span> {muted ? 'Unmute' : 'Mute'}</button>
        <button className={`cbtn${deafened ? ' tog' : ''}`} onClick={() => setDeafened(!deafened)}><span className="ci">🔇</span> Deafen</button>
        <button className="cbtn" onClick={onShareScreen}><span className="ci">🖥</span> Share Screen</button>
        <button className="cbtn"><span className="ci">💬</span> Chat</button>
        <button className="cbtn"><span className="ci">＋</span> Add</button>
        <button className="cbtn end" onClick={onEnd}><span className="ci">✕</span> End</button>
      </div>
    </div>
  );
}
