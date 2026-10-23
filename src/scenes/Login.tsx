import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import ScpLogo from '../components/ScpLogo';
import { STOLEN } from '../lib/creds';

type Phase = 'filling' | 'ready' | 'auth' | 'ok';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [phase, setPhase] = useState<Phase>('filling');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Credentials type themselves in, as if replayed from the intro.
  useEffect(() => {
    let dead = false;
    (async () => {
      await wait(900);
      for (let i = 1; i <= STOLEN.user.length && !dead; i++) {
        setUser(STOLEN.user.slice(0, i));
        await wait(55 + Math.random() * 60);
      }
      await wait(300);
      for (let i = 1; i <= STOLEN.password.length && !dead; i++) {
        setPass('•'.repeat(i));
        await wait(45 + Math.random() * 40);
      }
      if (!dead) setPhase('ready');
    })();
    return () => {
      dead = true;
    };
  }, []);

  const submit = async () => {
    if (phaseRef.current !== 'ready') return;
    setPhase('auth');
    await wait(1800);
    setPhase('ok');
    await wait(1100);
    onSuccess();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && submit();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="scip">
      <motion.div
        className="scip-head"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ScpLogo />
        <h1>SCP FOUNDATION</h1>
        <p className="motto">SICHERN · EINDÄMMEN · BEWAHREN</p>
      </motion.div>

      <motion.form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
      >
        <div className="panel-title">SCiPnet SICHERES ZUGANGSTERMINAL</div>
        <label>
          <span>BENUTZERKENNUNG</span>
          <input value={user} readOnly />
        </label>
        <label>
          <span>PASSWORT</span>
          <input value={pass} readOnly />
        </label>

        <button type="submit" className={phase === 'ready' ? 'pulse' : ''} disabled={phase !== 'ready'}>
          {phase === 'filling' && 'WARTE AUF ZUGANGSDATEN…'}
          {phase === 'ready' && 'ANMELDEN  [ENTER]'}
          {phase === 'auth' && <span className="dots">AUTHENTIFIZIERUNG</span>}
          {phase === 'ok' && 'ZUGRIFF GEWÄHRT'}
        </button>
      </motion.form>

      <p className="legal">
        Unbefugter Zugriff auf Systeme der Foundation verstößt gegen Overseer-Direktive 05-117. Alle Sitzungen werden
        überwacht.
      </p>
    </div>
  );
}
