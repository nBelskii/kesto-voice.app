import { useEffect, useRef, useState } from 'react';

interface Props {
  micId: string;
}

export function MicTest({ micId }: Props) {
  const [active, setActive] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setActive(false);
    setLevel(0);
  };

  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        setLevel(Math.min(1, rms * 4));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setActive(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access failed');
    }
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="sc-r" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div className="rl">Microphone Test</div><div className="rd">Speak and watch the bar move</div></div>
        <button className="btn-g" onClick={active ? stop : start}>{active ? '■ Stop' : '🎙 Test Microphone'}</button>
      </div>
      {active && (
        <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.round(level * 100)}%`,
              background: level > 0.05 ? 'var(--accent)' : 'var(--text-3)',
              transition: 'width 60ms linear, background 150ms ease',
              borderRadius: 'var(--radius-full)',
            }}
          />
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: 'var(--red)' }}>{error}</div>}
    </div>
  );
}
