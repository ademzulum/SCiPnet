import { useEffect } from 'react';

export default function PowerOn({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    const go = () => onStart();
    window.addEventListener('keydown', go, { once: true });
    return () => window.removeEventListener('keydown', go);
  }, [onStart]);

  return (
    <button className="power" onClick={onStart}>
      <span className="power-title">UIU FIELD TERMINAL WS-07</span>
      <span className="blink">PRESS ANY KEY TO POWER ON</span>
    </button>
  );
}
