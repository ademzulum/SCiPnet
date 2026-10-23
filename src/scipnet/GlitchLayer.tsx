import { useEffect, useRef, useState } from 'react';

// Subtle signal interference: a few thin bands that tint and shear what is
// behind them for a fraction of a second. Content itself never moves.

type Band = { y: number; h: number; dx: number; tone: 'cyan' | 'red' | 'white' };

const TONES: Band['tone'][] = ['cyan', 'red', 'white'];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeBands(): Band[] {
  const n = 1 + ((Math.random() * 3) | 0);
  const base = 5 + Math.random() * 85;
  return Array.from({ length: n }, () => ({
    y: Math.min(98, base + (Math.random() - 0.5) * 12),
    h: 1 + Math.random() * 6,
    dx: (Math.random() - 0.5) * 24,
    tone: TONES[(Math.random() * TONES.length) | 0],
  }));
}

// Heavy interference used while the Administrator file is open.
function makeStorm(): Band[] {
  const n = 6 + ((Math.random() * 8) | 0);
  return Array.from({ length: n }, () => ({
    y: Math.random() * 100,
    h: 2 + Math.random() * 45,
    dx: (Math.random() - 0.5) * 160,
    tone: TONES[(Math.random() * TONES.length) | 0],
  }));
}

export default function GlitchLayer({ pulse, storm = false }: { pulse: unknown; storm?: boolean }) {
  const [bands, setBands] = useState<Band[]>([]);
  const alive = useRef(true);

  const burst = async () => {
    if (reduced()) return;
    const frames = 2 + ((Math.random() * 3) | 0);
    for (let i = 0; i < frames && alive.current; i++) {
      setBands(makeBands());
      await wait(35 + Math.random() * 55);
    }
    if (alive.current) setBands([]);
  };

  useEffect(() => {
    alive.current = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(async () => {
        await burst();
        loop();
      }, 6000 + Math.random() * 14000);
    };
    loop();
    return () => {
      alive.current = false;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    burst();
  }, [pulse]);

  useEffect(() => {
    if (!storm || reduced()) return;
    const t = setInterval(() => setBands(Math.random() < 0.15 ? [] : makeStorm()), 55);
    return () => {
      clearInterval(t);
      setBands([]);
    };
  }, [storm]);

  return (
    <div className={storm ? 'glitch-layer storm' : 'glitch-layer'} aria-hidden>
      {bands.map((b, i) => (
        <span
          key={i}
          className={`gband gband-${b.tone}`}
          style={{ top: `${b.y}%`, height: `${b.h}px`, transform: `translateX(${b.dx}px)` }}
        />
      ))}
    </div>
  );
}
