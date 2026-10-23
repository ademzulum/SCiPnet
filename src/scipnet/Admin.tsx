import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { play } from '../lib/sound';

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
          <Corrupt text="▓▓▓▓" amount={0.9} every={60} />
        </div>
        <div className="dossier-main">
          <h2>
            <Corrupt text={NAMES[name]} amount={0.25} />
          </h2>
          <dl className="fields">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  <Corrupt text={v} amount={0.5} every={70} />
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
