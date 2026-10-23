import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CANCEL, run, type Ctx, type Line, type Pad } from '../lib/engine';
import { BREACH_SCRIPT } from '../lib/breachScript';
import { initAudio, play } from '../lib/sound';

const MAX_LINES = 120;
const GLITCH_MS = 900;

export default function Breach({ onDone, onAlert }: { onDone: () => void; onAlert: (on: boolean) => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [glitch, setGlitch] = useState(false);
  const [pads, setPads] = useState<Pad[]>([]);
  const skipRef = useRef<() => void>(() => {});
  const termRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ onDone, onAlert });
  cb.current = { onDone, onAlert };

  useEffect(() => {
    let dead = false;
    let id = 0;
    const waiters = new Set<() => void>();
    const finish = () => {
      if (dead) return;
      dead = true;
      waiters.forEach((cancel) => cancel());
      setGlitch(true);
      setTimeout(() => cb.current.onDone(), GLITCH_MS);
    };
    const ctx: Ctx = {
      push: (line) => setLines((l) => [...l.slice(-MAX_LINES), { ...line, id: id++ }]),
      set: (line) => setLines((l) => (l.length ? [...l.slice(0, -1), { ...line, id: l[l.length - 1].id }] : l)),
      clear: () => setLines([]),
      alert: (on) => cb.current.onAlert(on),
      sound: (name, volume) => play(name, volume),
      sleep: (ms) => new Promise((res, rej) => setTimeout(() => (dead ? rej(CANCEL) : res()), ms)),
      key: (handler, keyPads = []) =>
        new Promise((res, rej) => {
          setPads(keyPads);
          const onKey = (e: KeyboardEvent) => {
            if (dead || e.key === 'Escape' || e.metaKey || e.ctrlKey || e.altKey) return;
            e.preventDefault();
            if (handler(e)) {
              stop();
              res();
            }
          };
          const stop = () => {
            setPads([]);
            window.removeEventListener('keydown', onKey);
            waiters.delete(cancel);
          };
          const cancel = () => {
            stop();
            rej(CANCEL);
          };
          waiters.add(cancel);
          window.addEventListener('keydown', onKey);
        }),
    };

    // Ambient terminal hum under the whole intro.
    let stopNoise: (fadeMs?: number) => void = () => {};
    initAudio().then(() => {
      if (!dead) stopNoise = play('terminalNoise', 0.35, true);
    });

    setLines([]);
    run(BREACH_SCRIPT, ctx).then(finish, (e) => {
      if (e !== CANCEL) throw e;
    });

    skipRef.current = finish;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => {
      dead = true;
      stopNoise(800);
      waiters.forEach((cancel) => cancel());
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
            {l.touch === undefined ? (
              l.text
            ) : (
              <>
                <span className="key-hint">{l.text}</span>
                <span className="touch-hint">{l.touch}</span>
              </>
            )}
            {i === lines.length - 1 && <span className="cursor" />}
          </div>
        ))}
      </div>
      {pads.length > 0 && (
        <div className="touch-pads">
          {pads.map((p) => (
            <button
              key={p.key}
              type="button"
              data-sound="none"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: p.key }))}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="skip" data-sound="none" onClick={() => skipRef.current()}>
        <span className="key-hint">[ESC] </span>ÜBERSPRINGEN
      </button>
    </div>
  );
}
