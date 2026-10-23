import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { play } from '../lib/sound';
import { Corrupt } from './Admin';

// "Signalpfad": a snake-style minigame that covers the whole shell until it is
// finished. The player steers a signal through the Administrator's firewall
// and collects the letters of the passphrase in order. Wrong letters, walls,
// the signal's own tail and patrolling ICE sentinels each cost a life. Every
// collected letter makes the signal faster and raises a new firewall block.
// Game state lives in refs and is drawn on a canvas; React only re-renders for
// the HUD (letter, lives, time).

const WORD = 'OVERSEER';
const LIVES = 3;
const TIME_S = 90;
const W = 28;
const H = 18;
const START_STEP = 150; // ms per move
const MIN_STEP = 80;
const DECOYS = 3;
const GLYPHS = 'ABCDFGHIJKLMNPQTUWXYZ';

type P = { x: number; y: number };
type Dir = P;
type Sentinel = P & { dx: number; dy: number; every: number; wait: number };
type Letter = P & { ch: string; real: boolean };

const eq = (a: P, b: P) => a.x === b.x && a.y === b.y;
const rand = (n: number) => (Math.random() * n) | 0;

function freshSnake(): P[] {
  const y = H >> 1;
  return [
    { x: 5, y },
    { x: 4, y },
    { x: 3, y },
  ];
}

function makeSentinels(): Sentinel[] {
  return [
    { x: 9, y: 2, dx: 0, dy: 1, every: 2, wait: 0 },
    { x: 18, y: H - 3, dx: 0, dy: -1, every: 2, wait: 1 },
    { x: W - 4, y: 5, dx: -1, dy: 0, every: 3, wait: 0 },
  ];
}

export default function Hack({
  onLose,
  onWin,
  onActive,
  onOpen,
}: {
  onLose: () => void;
  onWin: () => void;
  onActive: (playing: boolean) => void;
  onOpen: () => void;
}) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'won'>('intro');
  const [got, setGot] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [time, setTime] = useState(TIME_S);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);

  const canvas = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ onLose, onWin, onActive });
  cb.current = { onLose, onWin, onActive };

  const g = useRef({
    snake: freshSnake(),
    dir: { x: 1, y: 0 } as Dir,
    queue: [] as Dir[],
    grow: 0,
    blocks: [] as P[],
    sentinels: makeSentinels(),
    letters: [] as Letter[],
    got: 0,
    lives: LIVES,
    step: START_STEP,
    shield: 0, // moves of invulnerability after a hit
    over: false,
  });

  useEffect(() => {
    cb.current.onActive(phase !== 'won');
  }, [phase]);
  useEffect(() => () => cb.current.onActive(false), []);

  const blink = (f: 'hit' | 'miss') => {
    setFlash(f);
    setTimeout(() => setFlash(null), 220);
  };

  // Free cell away from the head, so letters never spawn under the player.
  const freeCell = (): P => {
    const s = g.current;
    const head = s.snake[0];
    for (;;) {
      const p = { x: 1 + rand(W - 2), y: 1 + rand(H - 2) };
      const taken =
        s.snake.some((q) => eq(q, p)) ||
        s.blocks.some((q) => eq(q, p)) ||
        s.sentinels.some((q) => eq(q, p)) ||
        s.letters.some((q) => eq(q, p));
      if (!taken && Math.abs(p.x - head.x) + Math.abs(p.y - head.y) > 4) return p;
    }
  };

  const placeLetters = () => {
    const s = g.current;
    s.letters = [];
    s.letters.push({ ...freeCell(), ch: WORD[s.got], real: true });
    for (let i = 0; i < DECOYS; i++) s.letters.push({ ...freeCell(), ch: GLYPHS[rand(GLYPHS.length)], real: false });
  };

  const hurt = () => {
    const s = g.current;
    play('negative', 0.8);
    blink('miss');
    s.lives -= 1;
    setLives(s.lives);
    if (s.lives <= 0) {
      s.over = true;
      cb.current.onLose();
      return;
    }
    s.snake = freshSnake();
    s.dir = { x: 1, y: 0 };
    s.queue = [];
    s.grow = 0;
    s.shield = 12;
    s.sentinels = makeSentinels();
    // keep the restart lane clear
    s.blocks = s.blocks.filter((b) => b.y !== H >> 1);
    placeLetters();
  };

  const move = () => {
    const s = g.current;
    if (s.queue.length) s.dir = s.queue.shift()!;
    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

    // Sentinels patrol and bounce off walls and blocks.
    for (const t of s.sentinels) {
      if (++t.wait < t.every) continue;
      t.wait = 0;
      const nx = t.x + t.dx;
      const ny = t.y + t.dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || s.blocks.some((b) => b.x === nx && b.y === ny)) {
        t.dx = -t.dx;
        t.dy = -t.dy;
      } else {
        t.x = nx;
        t.y = ny;
      }
    }

    const shielded = s.shield > 0;
    if (shielded) s.shield -= 1;
    const wall = head.x < 0 || head.y < 0 || head.x >= W || head.y >= H;
    const deadly =
      wall ||
      s.blocks.some((b) => eq(b, head)) ||
      s.snake.slice(0, -1).some((q) => eq(q, head)) ||
      (!shielded && s.sentinels.some((t) => eq(t, head) || s.snake.some((q) => eq(q, t))));
    if (deadly) return hurt();

    s.snake.unshift(head);
    if (s.grow > 0) s.grow -= 1;
    else s.snake.pop();

    const hit = s.letters.find((l) => eq(l, head));
    if (!hit) return;
    if (!hit.real) {
      // decoy: lose a life's worth of length, not a life
      play('negative', 0.6);
      blink('miss');
      s.snake = s.snake.slice(0, Math.max(3, s.snake.length - 3));
      s.letters = s.letters.filter((l) => l !== hit);
      s.letters.push({ ...freeCell(), ch: GLYPHS[rand(GLYPHS.length)], real: false });
      return;
    }
    s.got += 1;
    setGot(s.got);
    s.grow += 2;
    s.step = Math.max(MIN_STEP, s.step - 9);
    blink('hit');
    if (s.got >= WORD.length) {
      s.over = true;
      play('uiuSuccess', 0.8);
      setPhase('won');
      cb.current.onWin();
      return;
    }
    play('enter', 0.5);
    s.blocks.push(freeCell());
    placeLetters();
  };

  const draw = () => {
    const el = canvas.current;
    if (!el) return;
    const c = el.getContext('2d')!;
    const css = getComputedStyle(el);
    const fg = css.getPropertyValue('--fg').trim() || '#dfe7ec';
    const accent = css.getPropertyValue('--accent').trim() || '#d7263d';
    const cell = el.width / W;
    const s = g.current;
    const now = performance.now();

    c.clearRect(0, 0, el.width, el.height);
    // grid
    c.globalAlpha = 0.08;
    c.strokeStyle = fg;
    for (let x = 1; x < W; x++) {
      c.beginPath();
      c.moveTo(x * cell, 0);
      c.lineTo(x * cell, el.height);
      c.stroke();
    }
    for (let y = 1; y < H; y++) {
      c.beginPath();
      c.moveTo(0, y * cell);
      c.lineTo(el.width, y * cell);
      c.stroke();
    }
    c.globalAlpha = 1;

    // firewall blocks
    c.fillStyle = accent;
    for (const b of s.blocks) {
      c.globalAlpha = 0.35;
      c.fillRect(b.x * cell + 1, b.y * cell + 1, cell - 2, cell - 2);
      c.globalAlpha = 1;
      c.strokeStyle = accent;
      c.strokeRect(b.x * cell + 2.5, b.y * cell + 2.5, cell - 5, cell - 5);
    }

    // letters
    c.font = `bold ${cell * 0.7}px "IBM Plex Mono", monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const l of s.letters) {
      const pulse = l.real ? 0.75 + 0.25 * Math.sin(now / 160) : 0.55;
      c.globalAlpha = pulse;
      c.fillStyle = l.real ? accent : fg;
      c.shadowColor = l.real ? accent : 'transparent';
      c.shadowBlur = l.real ? 12 : 0;
      c.fillText(l.ch, (l.x + 0.5) * cell, (l.y + 0.55) * cell);
    }
    c.shadowBlur = 0;
    c.globalAlpha = 1;

    // sentinels: rotating diamonds
    for (const t of s.sentinels) {
      c.save();
      c.translate((t.x + 0.5) * cell, (t.y + 0.5) * cell);
      c.rotate(now / 300);
      c.strokeStyle = accent;
      c.lineWidth = 2;
      c.strokeRect(-cell * 0.3, -cell * 0.3, cell * 0.6, cell * 0.6);
      c.restore();
    }

    // signal
    const blinkOff = s.shield > 0 && Math.floor(now / 90) % 2 === 0;
    if (!blinkOff) {
      s.snake.forEach((q, i) => {
        c.globalAlpha = Math.max(0.25, 1 - i / (s.snake.length + 4));
        c.fillStyle = fg;
        c.shadowColor = fg;
        c.shadowBlur = i === 0 ? 14 : 0;
        const pad = i === 0 ? 1 : 3;
        c.fillRect(q.x * cell + pad, q.y * cell + pad, cell - pad * 2, cell - pad * 2);
      });
      c.shadowBlur = 0;
      c.globalAlpha = 1;
    }
  };

  // Game loop: fixed-step movement, drawing every frame.
  useEffect(() => {
    if (phase !== 'play') {
      draw();
      return;
    }
    placeLetters();
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const s = g.current;
      acc += now - last;
      last = now;
      while (!s.over && acc >= s.step) {
        acc -= s.step;
        move();
      }
      draw();
      if (!s.over) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Countdown.
  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (phase === 'play' && time <= 0 && !g.current.over) {
      g.current.over = true;
      cb.current.onLose();
    }
  }, [time, phase]);

  // Canvas size follows the overlay.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const fit = () => {
      const box = el.parentElement!.getBoundingClientRect();
      const cell = Math.max(8, Math.floor(Math.min(box.width / W, box.height / H)));
      el.width = cell * W;
      el.height = cell * H;
      draw();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
  }, []);

  const steer = (d: Dir) => {
    const s = g.current;
    const lastDir = s.queue[s.queue.length - 1] ?? s.dir;
    if (d.x === -lastDir.x && d.y === -lastDir.y) return; // no reversing into yourself
    if (d.x === lastDir.x && d.y === lastDir.y) return;
    if (s.queue.length < 3) s.queue.push(d);
  };

  useEffect(() => {
    const keys: Record<string, Dir> = {
      arrowup: { x: 0, y: -1 },
      w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 },
      s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 },
      a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 },
      d: { x: 1, y: 0 },
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (phase === 'intro' && (k === ' ' || k === 'enter')) {
        e.preventDefault();
        setPhase('play');
        return;
      }
      if (phase === 'play' && keys[k]) {
        e.preventDefault();
        steer(keys[k]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // Swipe steering on touch screens.
  const touch = useRef<P | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase === 'intro') return setPhase('play');
    touch.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const t0 = touch.current;
    touch.current = null;
    if (!t0 || phase !== 'play') return;
    const dx = e.clientX - t0.x;
    const dy = e.clientY - t0.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    steer(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
  };

  return (
    <motion.div
      className={`hack-overlay${flash ? ` hack-${flash}` : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-sound="none"
    >
      <header className="hack-head">
        <div>
          <div className="label">Signalpfad · Firewall der Administrator-Ebene</div>
          <h2>
            <Corrupt text="DER ADMINISTRATOR" amount={0.08} every={220} />
          </h2>
        </div>
        <div className="hack-word" aria-label={`${got} von ${WORD.length} Zeichen`}>
          {[...WORD].map((ch, i) => (
            <span key={i} className={i < got ? 'done' : i === got ? 'next' : ''}>
              {i < got ? ch : i === got ? ch : '·'}
            </span>
          ))}
        </div>
        <div className="hack-stats">
          <span className={time <= 15 ? 'hack-time low' : 'hack-time'}>{String(Math.max(0, time)).padStart(2, '0')}s</span>
          <span className="hack-lives" aria-label={`${lives} Versuche`}>
            {Array.from({ length: LIVES }, (_, i) => (
              <span key={i} className={i < lives ? 'pip on' : 'pip'} />
            ))}
          </span>
        </div>
      </header>

      <div className="hack-board" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <canvas ref={canvas} />

        <AnimatePresence>
          {phase === 'intro' && (
            <motion.div className="hack-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <strong>Signal durch die Firewall leiten</strong>
              <span className="dim">
                Sammle die Zeichen der Passphrase <span className="hot-text">in Reihenfolge</span>. Das nächste Zeichen
                pulsiert.
              </span>
              <span className="dim">Falsche Zeichen kürzen das Signal. Wände, Firewall-Blöcke, ICE-Wächter ◇ und das eigene Signal kosten einen Versuch.</span>
              <span className="dim small">
                [PFEILTASTEN] / [WASD] / Wischen · {LIVES} Versuche · {TIME_S} Sekunden
              </span>
              <span className="hack-start">[ ENTER ZUM STARTEN ]</span>
            </motion.div>
          )}
          {phase === 'won' && (
            <motion.div className="hack-intro hack-won" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <span className="hack-won-icon">✓</span>
              <div className="label">Administrator-Ebene</div>
              <h2>ZUGRIFF GEWÄHRT</h2>
              <p className="dim">Signal durchgestellt. Der Administrator gewährt Ihnen Einblick in seine Akte.</p>
              <p className="small hack-soon">[ GESPERRTE AKTEN SIND JETZT LESBAR ]</p>
              <button className="card action" onClick={onOpen}>
                AKTE ÖFFNEN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
