import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { READER_LABEL, READER_LEVEL } from '../data/access';
import { play } from '../lib/sound';
import { useAccount } from './session';
import { Corrupt } from './Admin';
import Pips from './Pips';
import type { Go, Route } from './routes';

// The lock in its hexagon, shared by this screen and the psych profile gate.
// Only the lock moves: it shakes when access is refused and its shackle
// springs open when access is granted.
export function LockHex({ state }: { state: 'locked' | 'denied' | 'open' }) {
  return (
    <svg className={`lockhex ${state}`} viewBox="0 0 64 64" aria-hidden>
      <path className="lockhex-frame" d="M32 4l24 14v28L32 60 8 46V18z" />
      <g className="lockhex-lock">
        <path className="lockhex-shackle" d="M24 30v-5a8 8 0 0 1 16 0v5" />
        <rect x="21" y="30" width="22" height="16" rx="2" />
        <path d="M32 36v4" />
      </g>
    </svg>
  );
}

// The screen for a file the reader may not open: too low a clearance, a file
// sealed until the signal puzzle, or one that doesn't exist for this account
// (closed, deleted). Shows what is required against what the reader holds,
// and a log line of the attempt.
export default function AccessDenied({
  id,
  reason,
  required,
  requiredLabel,
  corrupt,
  back,
  backLabel,
  go,
}: {
  id: string;
  reason: 'level' | 'missing';
  required?: number;
  requiredLabel?: string;
  corrupt?: boolean;
  back: Route;
  backLabel: string;
  go: Go;
}) {
  const me = useAccount();
  const [time] = useState(() => new Date().toLocaleTimeString('de-DE'));
  useEffect(() => {
    play('negative', 0.8);
  }, []);
  const title = reason === 'missing' ? 'AKTE NICHT VERFÜGBAR' : 'ZUGRIFF VERWEIGERT';
  return (
    <div className="page page-top">
      <button className="link back" onClick={() => go(back)}>
        ← {backLabel}
      </button>
      <motion.section className="box denied2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="denied2-strip">
          <span>SCIPNET · ZUGRIFFSKONTROLLE</span>
          <span>{id}</span>
        </div>
        <div className="denied2-body">
          <LockHex state="denied" />
          <div className="denied2-text">
            <h2>{corrupt ? <Corrupt text={title} amount={0.12} every={160} /> : title}</h2>
            <p>
              {reason === 'missing'
                ? 'Diese Akte ist verschlossen oder existiert nicht mehr. Für Ihr Konto liegt kein Eintrag vor.'
                : 'Ihre Freigabe reicht für dieses Dokument nicht aus.'}
            </p>
          </div>
        </div>
        {reason === 'level' && required != null && (
          <div className="denied2-levels">
            <div>
              <span className="label">Erforderlich</span>
              <strong>{requiredLabel ?? `Level ${required}`}</strong>
              <span className="denied2-pips need">
                <Pips n={required} of={6} />
              </span>
            </div>
            <div>
              <span className="label">Ihre Freigabe</span>
              <strong>{READER_LABEL[me.id]}</strong>
              <span className="denied2-pips have">
                <Pips n={READER_LEVEL[me.id]} of={6} />
              </span>
            </div>
          </div>
        )}
        <div className="denied2-log">
          <span className="live-dot" />
          {time} · Zugriffsversuch durch {me.name} protokolliert und an die Standortdirektion gemeldet.
        </div>
      </motion.section>
    </div>
  );
}
