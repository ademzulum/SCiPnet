import { useEffect, useRef } from 'react';
import { initAudio, play } from '../lib/sound';

export default function PowerOn({ onStart }: { onStart: () => void }) {
  const started = useRef(false);
  const start = (viaEnter: boolean) => {
    if (started.current) return;
    started.current = true;
    // First user gesture: browsers only allow audio after this.
    const ready = initAudio();
    if (viaEnter) ready.then(() => play('enter', 0.8));
    onStart();
  };
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => startRef.current(e.key === 'Enter');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <button className="power" onClick={() => start(false)}>
      <span className="power-title">UIU FELDTERMINAL WS-07</span>
      <span className="blink">BELIEBIGE TASTE ZUM EINSCHALTEN</span>
    </button>
  );
}
