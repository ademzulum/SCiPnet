import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import ScpLogo from '../components/ScpLogo';
import { STOLEN } from '../lib/creds';
import { play } from '../lib/sound';

// SCiPnet boot after a successful login: logo locks in with the chime,
// modules load, then hands over to the shell. Click or Enter skips.

const MODULES = ['Identität', 'Personalakten', 'Feldberichte', 'Kommunikation', 'Sicherheitsprotokolle'];
const CHIME_AT = 650;
const MODULES_FROM = 1100;
const MODULE_STEP = 340;
const TOTAL = MODULES_FROM + MODULES.length * MODULE_STEP + 700;

export default function Startup({ onDone }: { onDone: () => void }) {
  const [loaded, setLoaded] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const timers = [
      setTimeout(() => play('startup'), CHIME_AT),
      ...MODULES.map((_, i) => setTimeout(() => setLoaded(i + 1), MODULES_FROM + (i + 1) * MODULE_STEP)),
      setTimeout(() => setLeaving(true), TOTAL - 450),
      setTimeout(() => done.current(), TOTAL),
    ];
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== 'Escape') return;
      done.current();
    };
    // Defer so the Enter that submitted the login does not skip straight away.
    const arm = setTimeout(() => {
      window.addEventListener('keydown', skip);
      window.addEventListener('pointerdown', skip);
    }, 400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(arm);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, []);

  const pct = Math.round((loaded / MODULES.length) * 100);

  return (
    <motion.div
      className="startup"
      animate={leaving ? { opacity: 0, scale: 1.04, filter: 'blur(6px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, ease: 'easeIn' }}
    >
      <div className="startup-emblem">
        <motion.span
          className="startup-pulse"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 2.4], opacity: [0, 0.55, 0] }}
          transition={{ delay: CHIME_AT / 1000, duration: 1.4, ease: 'easeOut' }}
        />
        <svg className="startup-orbit" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="92" className="orbit-track" />
          <motion.circle
            cx="100"
            cy="100"
            r="92"
            className="orbit-arc"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 0.28 + 0.72 * (loaded / MODULES.length) }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </svg>
        <motion.div
          initial={{ opacity: 0, scale: 0.7, filter: 'blur(14px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <ScpLogo size={120} />
        </motion.div>
      </div>

      <h1 className="startup-title" aria-label="SCiPnet">
        {[...'SCiPnet'].map((c, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.75 + i * 0.05, duration: 0.4 }}
          >
            {c}
          </motion.span>
        ))}
      </h1>
      <motion.p
        className="startup-motto"
        initial={{ opacity: 0, letterSpacing: '0.9em' }}
        animate={{ opacity: 0.65, letterSpacing: '0.45em' }}
        transition={{ delay: 1, duration: 0.9, ease: 'easeOut' }}
      >
        SECURE. CONTAIN. PROTECT.
      </motion.p>

      <motion.div
        className="startup-load"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: MODULES_FROM / 1000 - 0.2 }}
      >
        <div className="startup-bar">
          <motion.div className="startup-bar-fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
        </div>
        <div className="startup-meta">
          <span>{loaded < MODULES.length ? `Lade ${MODULES[loaded]}` : `Willkommen, ${STOLEN.name}`}</span>
          <span>{pct}%</span>
        </div>
        <ul className="startup-modules">
          {MODULES.map((m, i) => (
            <li key={m} className={i < loaded ? 'ok' : i === loaded ? 'busy' : ''}>
              <span className="mod-dot" />
              {m}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
