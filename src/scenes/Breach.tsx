import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CANCEL, run, type Ctx, type Line } from '../lib/engine';
import { BREACH_SCRIPT } from '../lib/breachScript';

const MAX_LINES = 120;
const GLITCH_MS = 900;

export default function Breach({ onDone, onAlert }: { onDone: () => void; onAlert: (on: boolean) => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [glitch, setGlitch] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ onDone, onAlert });
  cb.current = { onDone, onAlert };

  useEffect(() => {
    let dead = false;
    let id = 0;
    const finish = () => {
      if (dead) return;
      dead = true;
      setGlitch(true);
      setTimeout(() => cb.current.onDone(), GLITCH_MS);
    };
    const ctx: Ctx = {
      push: (line) => setLines((l) => [...l.slice(-MAX_LINES), { ...line, id: id++ }]),
      set: (line) => setLines((l) => (l.length ? [...l.slice(0, -1), { ...line, id: l[l.length - 1].id }] : l)),
      clear: () => setLines([]),
      alert: (on) => cb.current.onAlert(on),
      sleep: (ms) => new Promise((res, rej) => setTimeout(() => (dead ? rej(CANCEL) : res()), ms)),
    };

    setLines([]);
    run(BREACH_SCRIPT, ctx).then(finish, (e) => {
      if (e !== CANCEL) throw e;
    });

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => {
      dead = true;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useLayoutEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div className={glitch ? 'fill glitch' : 'fill'}>
      <div className="term" ref={termRef}>
        {lines.map((l, i) => (
          <div key={l.id} className={l.cls}>
            {l.prompt && <span className="prompt">{l.prompt}</span>}
            {l.text}
            {i === lines.length - 1 && <span className="cursor" />}
          </div>
        ))}
      </div>
      <div className="skip">[ESC] SKIP</div>
    </div>
  );
}
