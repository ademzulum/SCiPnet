import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { play } from '../lib/sound';
import warningUrl from '../../sounds/assistant/administrator_warning.mp3';
import selfDestructVoiceUrl from '../../sounds/assistant/self_destruct_voice.mp3';

const GLYPHS = '█▓▒░#@$%&*!?/\\<>ΣΔΞ01';
const scramble = (text: string, amount: number) =>
  [...text].map((c) => (c !== ' ' && Math.random() < amount ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : c)).join('');

// Text that keeps corrupting itself; `amount` is the share of broken glyphs.
export function Corrupt({ text, amount = 0.15, every = 90 }: { text: string; amount?: number; every?: number }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    const t = setInterval(() => setOut(scramble(text, amount)), every);
    return () => clearInterval(t);
  }, [text, amount, every]);
  return (
    <span className="corrupt" data-text={out}>
      {out}
    </span>
  );
}

// Corrupted entries: opening one plays the memetic agent and ends the session.
// Shell registers what that does.
let kickHandler: (() => void) | null = null;
export const setKickHandler = (h: (() => void) | null) => {
  kickHandler = h;
};
export const memeticKick = () => kickHandler?.();

// The memetic agent alone, then the session ends.
export function MemeticKick({ onDone }: { onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const stop = play('memetic', 0.7);
    const t = setTimeout(() => done.current(), 5200);
    return () => {
      clearTimeout(t);
      stop?.(300);
    };
  }, []);
  return (
    <motion.div className="destruct scipa-destruct memetic" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <MemeticGlyph />
      <div className="memetic-title">MEMETISCHER TÖTUNGSAGENT</div>
      <p className="scipa-destruct-text">Korrumpierte Akte geöffnet. Sitzung wird getrennt.</p>
      <p className="scipa-destruct-text dim">Nicht wegsehen.</p>
    </motion.div>
  );
}

// A link to an entry that was deleted.
export const Broken = () => <Corrupt text="[DATEN BESCHÄDIGT]" amount={0.12} every={160} />;

// The kill agent itself: nested, counter-rotating geometry around an eye.
// Slow motion only (no strobing).
function MemeticGlyph() {
  const ring = (r: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const x = 100 + Math.cos(a) * r;
      const y = 100 + Math.sin(a) * r;
      return `M${x},${y - 6} L${x + 5},${y + 4} L${x - 5},${y + 4} Z`;
    }).join(' ');
  return (
    <svg className="memetic-glyph" viewBox="0 0 200 200" aria-hidden>
      <g className="mg-spin-a">
        <circle cx="100" cy="100" r="92" />
        <path d={ring(80, 24)} />
      </g>
      <g className="mg-spin-b">
        <polygon points="100,22 168,140 32,140" />
        <polygon points="100,178 32,60 168,60" />
      </g>
      <g className="mg-spin-a">
        <circle cx="100" cy="100" r="46" strokeDasharray="4 6" />
        <path d={ring(38, 12)} />
      </g>
      <ellipse cx="100" cy="100" rx="22" ry="12" />
      <circle className="mg-pupil" cx="100" cy="100" r="6" />
    </svg>
  );
}

// S.C.I.P.A.'s own self-destruct, triggered by asking her about the
// Administrator: a spoken warning first, then the self-destruct voice line
// over a countdown. Timers stand in if a voice file can't play.
export function ScipaDestruct({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'warning' | 'countdown'>('warning');
  const [count, setCount] = useState(5);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const voice = new Audio(phase === 'warning' ? warningUrl : selfDestructVoiceUrl);
    // The warning stays up at least 4 s, even if its voice line is shorter or fails.
    let next = false;
    let minDone = phase !== 'warning';
    let voiceDone = false;
    const advance = () => {
      voiceDone = true;
      if (next || !minDone) return;
      next = true;
      if (phase === 'warning') setPhase('countdown');
    };
    const min = setTimeout(() => {
      minDone = true;
      if (voiceDone) advance();
    }, 4000);
    voice.onended = advance;
    voice.onerror = advance;
    voice.play().catch(advance);
    const fallback = phase === 'warning' ? setTimeout(advance, 8000) : undefined;
    const stopSiren = phase === 'countdown' ? play('selfDestruct', 0.5) : play('memetic', 0.6);
    return () => {
      clearTimeout(fallback);
      clearTimeout(min);
      voice.pause();
      stopSiren?.(300);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      const t = setTimeout(() => done.current(), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  return (
    <motion.div className={`destruct scipa-destruct${phase === 'warning' ? ' memetic' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {phase === 'warning' ? (
        <>
          <MemeticGlyph />
          <div className="memetic-title">MEMETISCHER TÖTUNGSAGENT</div>
          <p className="scipa-destruct-text">S.C.I.P.A. · Unautorisierte Anfrage zum Administrator.</p>
          <p className="scipa-destruct-text dim">Agent wird über das Terminal ausgespielt. Nicht wegsehen.</p>
        </>
      ) : (
        <DestructStage
          title="SELBSTZERSTÖRUNG EINGELEITET"
          count={count}
          total={5}
          steps={['Anfrage protokolliert: Der Administrator', 'Lösche Gesprächsverlauf', 'Trenne Terminal von SCiPnet']}
        />
      )}
    </motion.div>
  );
}

// Paths the purge log "deletes" while the countdown runs.
const PURGE = [
  '/scipnet/sitzung/token',
  '/scipnet/akten/P-80-0117',
  '/scipnet/akten/A-00-0000',
  '/site-80/archiv/7/index',
  '/scipnet/kanal/hofstetter',
  '/scipnet/kanal/quebec',
  '/site-80/kamera/14-B',
  '/scipnet/cache/biometrie',
  '/scipnet/feldberichte/FB-80-2026-031',
  '/scipnet/scipa/gedaechtnis',
  '/terminal/firmware',
  '/terminal/schluessel',
];

// Shared countdown stage for both self-destructs: a rotating
// radar sweep, counter-rotating rings with a draining progress arc around the
// number, a fast purge log and a jolt on every tick.
function DestructStage({ title, count, total, steps }: { title: string; count: number; total: number; steps: string[] }) {
  const [log, setLog] = useState<string[]>([]);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      const path = PURGE[i++ % PURGE.length];
      const hex = ((Math.random() * 0xffffff) | 0).toString(16).padStart(6, '0').toUpperCase();
      setLog((l) => [...l, `0x${hex}  LÖSCHE ${path}`].slice(-9));
    }, 140);
    return () => clearInterval(t);
  }, []);

  const R = 92;
  const C = 2 * Math.PI * R;
  const shown = Math.min(steps.length, Math.ceil(((total - count + 1) / total) * steps.length));

  return (
    <div className="ds">
      <div className="ds-sweep" aria-hidden />
      <motion.div key={count} className="ds-jolt" initial={{ x: -8, y: 4 }} animate={{ x: 0, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="destruct-title">{title}</div>
        <div className="ds-core">
          <svg className="ds-rings" viewBox="0 0 220 220" aria-hidden>
            <circle className="ds-ring a" cx="110" cy="110" r="104" />
            <circle className="ds-ring b" cx="110" cy="110" r="80" />
            <circle className="ds-track" cx="110" cy="110" r={R} />
            <circle
              className="ds-progress"
              cx="110"
              cy="110"
              r={R}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - count / total)}
            />
          </svg>
          <motion.span key={count} className="destruct-count" initial={{ scale: 1.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {count}
          </motion.span>
        </div>
        <ul className="ds-steps">
          {steps.slice(0, shown).map((s) => (
            <motion.li key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              ▸ {s}…
            </motion.li>
          ))}
        </ul>
      </motion.div>
      <pre className="ds-log" aria-hidden>
        {log.join('\n')}
      </pre>
    </div>
  );
}

export function SelfDestruct({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(5);
  useEffect(() => {
    const stop = play('selfDestruct');
    return () => stop(600);
  }, []);
  useEffect(() => {
    if (count === 0) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return (
    <motion.div className="destruct" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <DestructStage
        title="SELBSTZERSTÖRUNG"
        count={count}
        total={5}
        steps={['Lösche Sitzungsdaten', 'Vernichte Personalakten', 'Trenne Verbindung zu SCiPnet', 'Vernichte Terminal']}
      />
    </motion.div>
  );
}
