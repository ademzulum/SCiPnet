import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAccount } from './session';
import { play } from '../lib/sound';

// Login in front of the communications hub: the channel key fills in,
// the user connects (button or Enter), a short handshake runs, then the
// hub opens with the communications_hub_login sound.

type Phase = 'filling' | 'ready' | 'handshake' | 'ok';

const KEY = 'KX-80-7F3A-91C2-E04D';
const HANDSHAKE = ['Kanal öffnen', 'Schlüssel austauschen', 'Identität bestätigen'];
const STEP_MS = 520;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CommsGate({ onDone }: { onDone: () => void }) {
  const me = useAccount();
  const [phase, setPhase] = useState<Phase>('filling');
  const [key, setKey] = useState('');
  const [steps, setSteps] = useState(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const done = useRef(onDone);
  done.current = onDone;
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    (async () => {
      await wait(450);
      for (let i = 1; i <= KEY.length && alive.current; i++) {
        setKey(KEY.slice(0, i));
        await wait(28 + Math.random() * 30);
      }
      if (alive.current) setPhase('ready');
    })();
    return () => {
      alive.current = false;
    };
  }, []);

  const connect = async () => {
    if (phaseRef.current !== 'ready') return;
    phaseRef.current = 'handshake';
    setPhase('handshake');
    for (let i = 1; i <= HANDSHAKE.length; i++) {
      await wait(STEP_MS);
      if (!alive.current) return;
      setSteps(i);
    }
    await wait(200);
    if (!alive.current) return;
    play('commsLogin');
    setPhase('ok');
    await wait(1300);
    if (alive.current) done.current();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || phaseRef.current !== 'ready') return;
      play('enter', 0.8);
      connect();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="page">
      <div className={`commsgate box cg-${phase}`}>
        <div className="cg-emblem" aria-hidden>
          <span className="cg-wave w1" />
          <span className="cg-wave w2" />
          <span className="cg-wave w3" />
          <span className="cg-core">{phase === 'ok' ? '✓' : '⌁'}</span>
        </div>

        <div className="label">Kommunikationszentrale · Site-80</div>
        <h2>Kanalanmeldung</h2>
        <p className="dim">Für den Zugriff auf interne Kanäle ist ein gültiger Kanalschlüssel erforderlich.</p>

        <div className="cg-fields">
          <label>
            <span className="label">Teilnehmer</span>
            <span className="cg-value">{me.user}</span>
          </label>
          <label>
            <span className="label">Kanalschlüssel</span>
            <span className="cg-value mono">
              {key}
              {phase === 'filling' && <span className="cursor" />}
            </span>
          </label>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'filling' || phase === 'ready' ? (
            <motion.button
              key="btn"
              className={`card action cg-connect ${phase === 'ready' ? 'pulse' : ''}`}
              disabled={phase !== 'ready'}
              onClick={connect}
              exit={{ opacity: 0, y: -6 }}
            >
              {phase === 'ready' ? (
                <>
                  VERBINDEN<span className="key-hint">  [ENTER]</span>
                </>
              ) : (
                'SCHLÜSSEL WIRD GELADEN…'
              )}
            </motion.button>
          ) : (
            <motion.ul key="steps" className="cg-steps" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {HANDSHAKE.map((h, i) => (
                <li key={h} className={i < steps ? 'ok' : i === steps && phase === 'handshake' ? 'busy' : ''}>
                  <span className="mod-dot" />
                  {h}
                </li>
              ))}
              {phase === 'ok' && (
                <motion.li className="cg-ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  VERBINDUNG HERGESTELLT
                </motion.li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
