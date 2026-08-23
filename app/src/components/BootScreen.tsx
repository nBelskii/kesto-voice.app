import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

const LINES = [
  '$ kesto --init',
  'loading voice engine............ OK',
  'linking steam runtime............ OK',
  'establishing p2p mesh............ OK',
  'ready.',
];

const CHAR_DELAY = 12;
const LINE_PAUSE = 120;
const HOLD_AFTER = 500;

export function BootScreen({ onDone }: Props) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    if (skip) {
      onDone();
      return;
    }
    if (lineIdx >= LINES.length) {
      const t = setTimeout(onDone, HOLD_AFTER);
      return () => clearTimeout(t);
    }
    const current = LINES[lineIdx];
    if (charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), CHAR_DELAY);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLineIdx((l) => l + 1);
      setCharIdx(0);
    }, LINE_PAUSE);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, skip, onDone]);

  return (
    <div
      onClick={() => setSkip(true)}
      style={{
        height: '100vh',
        background: '#06060a',
        color: '#10b981',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        padding: '18px 22px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {LINES.slice(0, lineIdx).map((l, i) => (
        <div key={i} style={{ opacity: 0.85 }}>{l}</div>
      ))}
      {lineIdx < LINES.length && (
        <div>
          {LINES[lineIdx].slice(0, charIdx)}
          <span style={{ animation: 'blink 1s step-end infinite' }}>▋</span>
        </div>
      )}
      <style>{'@keyframes blink { 50% { opacity: 0; } }'}</style>
    </div>
  );
}
