import { useEffect, useRef } from 'react';
import { initAudio, play } from '../lib/sound';

export default function PowerOn({ onStart }: { onStart: () => void }) {
  const started = useRef(false);
  const start = () => {
    if (started.current) return;
    started.current = true;
    // First user gesture: browsers only allow audio after this.
    initAudio();
    setTimeout(() => play('enter', 0.8), 150);
    onStart();
  };
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    const onKey = () => startRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <button className="power" data-sound="none" onClick={start}>
      <span className="power-title">UIU FELDTERMINAL WS-07</span>
      <span className="blink">BELIEBIGE TASTE ZUM EINSCHALTEN</span>
    </button>
  );
}
