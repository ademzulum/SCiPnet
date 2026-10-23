import { useEffect, useRef } from 'react';
import { initAudio, play } from '../lib/sound';

export default function PowerOn({ onStart }: { onStart: () => void }) {
  const started = useRef(false);
  const start = () => {
    if (started.current) return;
    started.current = true;
    // First user gesture: browsers only allow audio after this.
    initAudio().then(() => play('enter', 0.8));
    onStart();
  };
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && startRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="power">
      <span className="power-title">UIU FELDTERMINAL WS-07</span>
      <span className="blink">[ENTER] ZUM EINSCHALTEN</span>
    </div>
  );
}
