import { useEffect, useRef, useState } from 'react';
import { anthem, initAudio, play } from '../lib/sound';
import UiuLogo from '../components/UiuLogo';

// Power-on screen. Browsers block sound until the first click or key press, so
// if the anthem can't autoplay, a minimal "connect" gate comes first: the
// gesture there starts the anthem and the seal animation together. A second
// Enter / tap then powers the terminal on.
export default function PowerOn({ onStart }: { onStart: () => void }) {
  const [phase, setPhase] = useState<'probe' | 'gate' | 'seal'>('probe');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const started = useRef(false);

  // Try autoplay right away (works when the browser already trusts the site).
  useEffect(() => {
    anthem.start().then((ok) => setPhase((p) => (p === 'probe' ? (ok ? 'seal' : 'gate') : p)));
  }, []);

  const press = () => {
    if (phaseRef.current !== 'seal') {
      // First gesture: unlock audio, start anthem and seal together.
      void anthem.start();
      void initAudio();
      setPhase('seal');
      return;
    }
    if (started.current) return;
    started.current = true;
    initAudio().then(() => play('enter', 0.8));
    onStart();
  };
  const pressRef = useRef(press);
  pressRef.current = press;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // any key opens the gate; powering on needs Enter or Space
      if (phaseRef.current !== 'seal' || e.key === 'Enter' || e.key === ' ') pressRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="power" onClick={() => pressRef.current()}>
      {phase === 'seal' ? (
        <>
          <UiuLogo className="seal-intro" />
          <span className="power-title power-late">UIU FELDTERMINAL WS-07</span>
          <span className="power-late">
            <span className="blink">
              <span className="key-hint">[ENTER] ZUM EINSCHALTEN</span>
              <span className="touch-hint">[ TIPPEN ZUM EINSCHALTEN ]</span>
            </span>
          </span>
        </>
      ) : phase === 'gate' ? (
        <>
          <span className="power-title">FEDERAL BUREAU OF INVESTIGATION</span>
          <span className="blink">
            <span className="key-hint">[ BELIEBIGE TASTE ZUM VERBINDEN ]</span>
            <span className="touch-hint">[ TIPPEN ZUM VERBINDEN ]</span>
          </span>
        </>
      ) : null}
    </div>
  );
}
