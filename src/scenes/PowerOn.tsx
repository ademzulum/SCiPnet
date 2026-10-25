import { useEffect, useRef, useState } from 'react';
import { anthem, initAudio, play } from '../lib/sound';
import UiuLogo from '../components/UiuLogo';

// Power-on screen. Browsers block sound until the first click or key press, so
// if the anthem can't autoplay, a minimal "connect" gate comes first: the
// gesture there starts the anthem and the seal animation together. Once both
// have finished the terminal powers on by itself; Enter (or a tap on touch screens) skips ahead.
const SEAL_MS = 5200; // seal assembly plus the shine (see .seal-intro in styles.css)
const MAX_WAIT_MS = 15000; // in case the anthem never reports its end

export default function PowerOn({ onStart }: { onStart: () => void }) {
  const [phase, setPhase] = useState<'probe' | 'gate' | 'seal'>('probe');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const started = useRef(false);

  // Power on automatically when the seal animation and the anthem are done.
  useEffect(() => {
    if (phase !== 'seal') return;
    let live = true;
    const sealDone = new Promise((res) => setTimeout(res, SEAL_MS));
    const songDone = Promise.race([anthem.ended(), new Promise((res) => setTimeout(res, MAX_WAIT_MS))]);
    Promise.all([sealDone, songDone]).then(() => live && pressRef.current());
    return () => {
      live = false;
    };
  }, [phase]);

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
    anthem.fade(400); // skipped with Enter: don't let the anthem run on into the next scene
    initAudio().then(() => play('enter', 0.8));
    onStart();
  };
  const pressRef = useRef(press);
  pressRef.current = press;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // any key opens the gate; skipping the seal needs Enter
      if (phaseRef.current !== 'seal' || e.key === 'Enter') pressRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="power"
      // mouse clicks only open the gate; on touch screens a tap also skips the seal
      onPointerUp={(e) => (phaseRef.current !== 'seal' || e.pointerType === 'touch') && pressRef.current()}
    >
      {phase === 'seal' ? (
        <>
          <UiuLogo className="seal-intro" />
          <span className="power-title power-late">UIU FELDTERMINAL WS-07</span>
          <span className="power-late">
            <span className="blink">
              <span className="key-hint">[ENTER] SOFORT EINSCHALTEN</span>
              <span className="touch-hint">[ TIPPEN ZUM ÜBERSPRINGEN ]</span>
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
