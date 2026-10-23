import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { play } from '../lib/sound';
import { Corrupt } from './Admin';

// Brute-force minigame against the Administrator account (in the spirit of
// GTA V's BruteForce.exe). One column per password letter; the active column
// scrolls, the password letter is shown red, and the player locks it with
// Space / Enter / click while it sits in the capture row. Misses cost a life.
// Only the active column animates, and it is moved via refs (no re-render per
// frame).

const PASSWORD = 'OVERSEER';
const LIVES = 3;
const TIME_S = 60;
const ROWS = 18; // letters per column strip
const VISIBLE = 5; // rows shown; the capture row is the middle one
const ROW_H = 40;
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

type Column = { chars: string[]; target: number; dir: 1 | -1; speed: number };

function makeColumns(): Column[] {
  return [...PASSWORD].map((letter, i) => {
    const chars = Array.from({ length: ROWS }, () => {
      let c = letter;
      while (c === letter) c = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      return c;
    });
    const target = (Math.random() * ROWS) | 0;
    chars[target] = letter;
    return { chars, target, dir: Math.random() < 0.5 ? 1 : -1, speed: 3.2 + i * 0.75 }; // rows per second
  });
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export default function Hack({
  onLose,
  onWin,
  onActive,
}: {
  onLose: () => void;
  onWin: () => void;
  onActive: (playing: boolean) => void;
}) {
  const [cols] = useState(makeColumns);
  const [phase, setPhase] = useState<'intro' | 'play' | 'won'>('intro');
  const [col, setCol] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [time, setTime] = useState(TIME_S);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);

  const strip = useRef<HTMLDivElement>(null);
  const offset = useRef(0); // in rows
  const state = useRef({ phase, col, lives });
  state.current = { phase, col, lives };
  const cb = useRef({ onLose, onWin, onActive });
  cb.current = { onLose, onWin, onActive };

  useEffect(() => {
    cb.current.onActive(phase === 'play');
  }, [phase]);
  useEffect(() => () => cb.current.onActive(false), []);

  // Scroll the active column.
  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    let last = performance.now();
    const c = cols[col];
    offset.current = Math.random() * ROWS;
    const tick = (now: number) => {
      offset.current += ((now - last) / 1000) * c.speed * c.dir;
      last = now;
      if (strip.current) strip.current.style.transform = `translateY(${-mod(offset.current, ROWS) * ROW_H}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, col, cols]);

  // Countdown.
  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const lose = () => {
    setPhase('intro'); // stop loops; the parent takes over with the meltdown
    cb.current.onLose();
  };

  useEffect(() => {
    if (phase === 'play' && time <= 0) lose();
  }, [time, phase]);

  const attempt = () => {
    const { phase: ph, col: c, lives: l } = state.current;
    if (ph === 'intro') {
      setPhase('play');
      return;
    }
    if (ph !== 'play') return;
    const column = cols[c];
    // letter in the middle row = strip index at offset + 2 (rounded to the nearest row)
    const centre = mod(Math.round(offset.current) + Math.floor(VISIBLE / 2), ROWS);
    if (centre === column.target) {
      play('enter', 0.6);
      setFlash('hit');
      if (c + 1 >= cols.length) {
        play('uiuSuccess', 0.8);
        setPhase('won');
        cb.current.onWin();
      } else setCol(c + 1);
    } else {
      play('negative', 0.8);
      setFlash('miss');
      if (l - 1 <= 0) lose();
      else setLives(l - 1);
    }
    setTimeout(() => setFlash(null), 250);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (!e.repeat) attempt();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (phase === 'won')
    return (
      <div className="page">
        <motion.div className="box hack-won" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <span className="hack-won-icon">✓</span>
          <div className="label">Administrator-Ebene</div>
          <h2>ZUGRIFF GEWÄHRT</h2>
          <p className="dim">Das Passwort wurde geknackt. Die Administrator-Ebene wird vorbereitet…</p>
          <p className="small hack-soon">[ WEITERE INHALTE FOLGEN ]</p>
        </motion.div>
      </div>
    );

  return (
    <div className="page">
      <div className={`box hack${flash ? ` hack-${flash}` : ''}`} onPointerDown={attempt} data-sound="none">
        <header className="hack-head">
          <div>
            <div className="label">BruteForce · Zielkonto</div>
            <h2>
              <Corrupt text="DER ADMINISTRATOR" amount={0.08} every={220} />
            </h2>
          </div>
          <div className="hack-stats">
            <span className={time <= 10 ? 'hack-time low' : 'hack-time'}>
              {String(Math.max(0, time)).padStart(2, '0')}s
            </span>
            <span className="hack-lives" aria-label={`${lives} Versuche`}>
              {Array.from({ length: LIVES }, (_, i) => (
                <span key={i} className={i < lives ? 'pip on' : 'pip'} />
              ))}
            </span>
          </div>
        </header>

        <div className="hack-columns" style={{ height: VISIBLE * ROW_H }}>
          <span className="hack-capture" style={{ top: Math.floor(VISIBLE / 2) * ROW_H, height: ROW_H }} />
          {cols.map((c, i) => (
            <div key={i} className={`hack-col${i < col ? ' done' : i === col ? ' active' : ''}`}>
              {i < col ? (
                <span className="hack-solved" style={{ top: Math.floor(VISIBLE / 2) * ROW_H, height: ROW_H }}>
                  {PASSWORD[i]}
                </span>
              ) : (
                <div ref={i === col ? strip : undefined} className="hack-strip">
                  {[...c.chars, ...c.chars].map((ch, j) => (
                    <span key={j} className={j % ROWS === c.target ? 'hot' : ''} style={{ height: ROW_H }}>
                      {ch}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {phase === 'intro' && (
            <motion.div className="hack-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <strong>Passwort knacken</strong>
              <span className="dim">
                Stoppe jede Spalte, wenn der <span className="hot-text">rote Buchstabe</span> im Zielfeld steht.
              </span>
              <span className="dim small">[LEERTASTE] / [ENTER] / Klick · {LIVES} Versuche · {TIME_S} Sekunden</span>
              <span className="hack-start">[ START ]</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
