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

const NAMES = ['DER ADMINISTRATOR', 'D3R 4DM1N1STR4T0R', 'DIESE AKTE EXISTIERT NICHT', 'SIE SOLLTEN NICHT HIER SEIN'];
const WARNINGS = [
  'SPEICHERFEHLER 0x0000',
  'AKTENINTEGRITÄT: 0%',
  'UNBEKANNTE SIGNATUR',
  'SITZUNG KOMPROMITTIERT',
  'ZUGRIFF PROTOKOLLIERT',
];

export function AdminFile({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState(0);
  const [warn, setWarn] = useState<string[]>([]);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const stopSound = play('selfDestruct');
    const n = setInterval(() => setName((i) => (i + 1) % NAMES.length), 420);
    const w = setInterval(() => setWarn((l) => [...l, WARNINGS[l.length % WARNINGS.length]].slice(-6)), 380);
    let finished = false;
    const end = setTimeout(() => {
      finished = true;
      done.current();
    }, 3600);
    return () => {
      clearInterval(n);
      clearInterval(w);
      clearTimeout(end);
      // keep playing into the countdown; only cut it if the file is torn down early
      if (!finished) stopSound();
    };
  }, []);

  const fields: [string, string][] = [
    ['Kennung', 'A-00-0000'],
    ['Funktion', 'Gründer'],
    ['Freigabe', 'Stufe 6'],
    ['Status', 'Unbekannt'],
  ];

  return (
    <div className="page admin">
      <div className="dossier">
        <div className="photo admin-photo">
          <Corrupt text="▓▓▓▓" amount={0.9} every={140} />
        </div>
        <div className="dossier-main">
          <h2>
            <Corrupt text={NAMES[name]} amount={0.25} every={120} />
          </h2>
          <dl className="fields">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  <Corrupt text={v} amount={0.5} every={140} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="admin-warnings">
        {warn.map((w, i) => (
          <motion.div key={i + w} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            !! {w}
          </motion.div>
        ))}
      </div>
    </div>
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
    let next = false;
    const advance = () => {
      if (next) return;
      next = true;
      if (phase === 'warning') setPhase('countdown');
    };
    voice.onended = advance;
    voice.onerror = advance;
    voice.play().catch(advance);
    const fallback = phase === 'warning' ? setTimeout(advance, 8000) : undefined;
    const stopSiren = phase === 'countdown' ? play('selfDestruct', 0.5) : undefined;
    return () => {
      clearTimeout(fallback);
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
    <motion.div className="destruct scipa-destruct" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {phase === 'warning' ? (
        <>
          <div className="destruct-title">S.C.I.P.A. · WARNUNG</div>
          <p className="scipa-destruct-text">Unautorisierte Anfrage zum Administrator erkannt.</p>
          <p className="scipa-destruct-text blink">Gegenmaßnahmen werden eingeleitet…</p>
        </>
      ) : (
        <>
          <div className="destruct-title">SELBSTZERSTÖRUNG EINGELEITET</div>
          <motion.div key={count} className="destruct-count" initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {count}
          </motion.div>
          <ul>
            <li>▸ Anfrage protokolliert: Der Administrator</li>
            {count <= 3 && <li>▸ Lösche Gesprächsverlauf…</li>}
            {count <= 1 && <li>▸ Trenne Terminal von SCiPnet…</li>}
          </ul>
        </>
      )}
    </motion.div>
  );
}

const STEPS = ['Lösche Sitzungsdaten', 'Trenne Verbindung zu SCiPnet', 'Vernichte Terminal'];

export function SelfDestruct({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3);
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
      <div className="destruct-title">SELBSTZERSTÖRUNG</div>
      <motion.div key={count} className="destruct-count" initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        {count}
      </motion.div>
      <ul>
        {STEPS.slice(0, 3 - count + 1).map((s) => (
          <li key={s}>▸ {s}…</li>
        ))}
      </ul>
    </motion.div>
  );
}
