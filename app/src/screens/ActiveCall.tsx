interface Props {
  peerName: string;
  elapsedSec: number;
  muted: boolean;
  onToggleMute: () => void;
  onShareScreen: () => void;
  onEnd: () => void;
  remoteVolume: number;
  onSetRemoteVolume: (v: number) => void;
}

function formatElapsed(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function ActiveCall({ peerName, elapsedSec, muted, onToggleMute, onShareScreen, onEnd, remoteVolume, onSetRemoteVolume }: Props) {
  return (
    <div className="call-f">
      <div className="ct">
        <div className="ct-l"><span className="ct-timer">{formatElapsed(elapsedSec)}</span><span className="ct-gn">{peerName}</span></div>
        <div className="ct-r">
          <div className="qbars"><i></i><i></i><i></i><i></i></div>
          <span className="ct-p">1:1</span>
        </div>
      </div>
      <div className="cg">
        <div className="ctile">
          <div className="ctile-av">{peerName.slice(0, 2).toUpperCase() || '?'}</div>
          <div className="ctile-n">{peerName}</div>
          <div className="ctile-vol" onClick={(e) => e.stopPropagation()}>
            <span>🔈</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={remoteVolume}
              onChange={(e) => onSetRemoteVolume(parseFloat(e.target.value))}
            />
            <span className="ctile-vol-val">{Math.round(remoteVolume * 100)}%</span>
          </div>
        </div>
        <div className="ctile"><div className="ctile-av">{muted ? '🔇' : 'YOU'}</div><div className="ctile-n">You</div>{muted && <span className="ctile-mute">Muted</span>}</div>
      </div>
      <div className="cbar">
        <button className={`cbtn${muted ? ' tog' : ''}`} onClick={onToggleMute}><span className="ci">🎤</span> {muted ? 'Unmute' : 'Mute'}</button>
        <button className="cbtn" onClick={onShareScreen}><span className="ci">🖥</span> Share Screen</button>
        <button className="cbtn end" onClick={onEnd}><span className="ci">✕</span> End</button>
      </div>
    </div>
  );
}
