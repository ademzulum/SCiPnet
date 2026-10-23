import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { play } from '../lib/sound';
import { initials } from './Comms';

// Press-and-hold fingerprint scan, then a face-mesh analysis and the result.
// External persons (ids starting with "X-") come back without a match.

type Phase = 'idle' | 'hold' | 'abort' | 'analyze' | 'done';

const HOLD_MS = 2400;
const ANALYZE_MS = 2900;

// Fingerprint: nested arches with gaps so it reads as ridges.
const RIDGES = Array.from({ length: 8 }, (_, i) => {
  const r = 8 + i * 5;
  const top = 58 - r * 1.25;
  return {
    d: `M ${50 - r} 82 C ${50 - r} ${top}, ${50 + r} ${top}, ${50 + r} 82`,
    dash: i % 3 === 0 ? '60 8 30 6' : i % 2 ? '40 6 80 10' : 'none',
  };
});

// Stylised face landmarks (viewBox 100x120), linked to their 3 nearest neighbours.
const POINTS: [number, number][] = [
  [50, 14], [34, 20], [66, 20], [24, 34], [76, 34],
  [34, 46], [42, 44], [58, 44], [66, 46],
  [22, 56], [78, 56], [50, 52], [44, 64], [56, 64],
  [40, 78], [50, 81], [60, 78], [28, 76], [72, 76],
  [38, 94], [62, 94], [50, 102],
];
const EDGES = (() => {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  POINTS.forEach(([x, y], i) => {
    POINTS.map(([x2, y2], j) => ({ j, d: (x - x2) ** 2 + (y - y2) ** 2 }))
      .filter((n) => n.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .forEach(({ j }) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(k)) {
          seen.add(k);
          out.push([i, j]);
        }
      });
  });
  return out;
})();

const CHECKS = ['Fingerabdruck', 'Gesichtsgeometrie', 'Iris-Muster', 'Stimmprofil'];

export default function Biometric({ id, name }: { id: string; name: string }) {
  const external = id.startsWith('X-');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [checks, setChecks] = useState(0);
  const raf = useRef(0);
  const stopSound = useRef<() => void>(() => {});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      timers.current.forEach(clearTimeout);
      stopSound.current();
    },
    [],
  );

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const startHold = () => {
    if (phase !== 'idle') return;
    setPhase('hold');
    stopSound.current = play('biometric', 0.8);
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / HOLD_MS);
      setProgress(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else analyze();
    };
    raf.current = requestAnimationFrame(tick);
  };

  const release = () => {
    if (phase !== 'hold') return;
    cancelAnimationFrame(raf.current);
    stopSound.current();
    play('negative', 0.8);
    setPhase('abort');
    later(() => {
      setProgress(0);
      setPhase('idle');
    }, 1200);
  };

  const analyze = () => {
    setPhase('analyze');
    setChecks(0);
    CHECKS.forEach((_, i) => later(() => setChecks(i + 1), ((i + 1) * ANALYZE_MS) / (CHECKS.length + 1)));
    later(() => {
      stopSound.current();
      if (external) play('error', 0.6);
      setPhase('done');
    }, ANALYZE_MS);
  };

  const reset = () => {
    if (phase !== 'done') return;
    setProgress(0);
    setPhase('idle');
  };

  const ring = 2 * Math.PI * 46;

  return (
    <div className={`scanner scanner-${phase}${external && phase === 'done' ? ' nomatch' : ''}`}>
      <button
        className="scanner-pad"
        data-sound="none"
        aria-label="Biometrischen Scan gedrückt halten"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          startHold();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && startHold()}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && release()}
        onClick={reset}
      >
        <AnimatePresence mode="wait">
          {(phase === 'idle' || phase === 'hold' || phase === 'abort') && (
            <motion.svg key="print" viewBox="0 0 100 100" className="print" exit={{ opacity: 0, scale: 0.9 }}>
              <circle cx="50" cy="50" r="46" className="ring-bg" />
              <circle
                cx="50"
                cy="50"
                r="46"
                className="ring"
                strokeDasharray={ring}
                strokeDashoffset={ring * (1 - progress)}
              />
              <g className="ridges">
                {RIDGES.map((r, i) => (
                  <path
                    key={i}
                    d={r.d}
                    strokeDasharray={r.dash}
                    className={progress > i / RIDGES.length ? 'lit' : ''}
                  />
                ))}
              </g>
              {phase === 'hold' && <line className="sweep" x1="14" x2="86" y1={86 - progress * 70} y2={86 - progress * 70} />}
            </motion.svg>
          )}

          {phase === 'analyze' && (
            <motion.svg
              key="mesh"
              viewBox="0 0 100 120"
              className="mesh"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {EDGES.map(([a, b], i) => (
                <motion.line
                  key={i}
                  x1={POINTS[a][0]}
                  y1={POINTS[a][1]}
                  x2={POINTS[b][0]}
                  y2={POINTS[b][1]}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ delay: i * 0.025, duration: 0.3 }}
                />
              ))}
              {POINTS.map(([x, y], i) => (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                />
              ))}
              <rect className="mesh-sweep" x="0" width="100" height="3" />
            </motion.svg>
          )}

          {phase === 'done' && (
            <motion.div
              key="result"
              className="result"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="result-initials">{external ? '?' : initials(name)}</span>
              <span className="result-match">{external ? '0.0%' : '99.7%'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <div className="scanner-readout" aria-live="polite">
        {phase === 'idle' && <span>GEDRÜCKT HALTEN</span>}
        {phase === 'hold' && <span>ERFASSE… {Math.round(progress * 100)}%</span>}
        {phase === 'abort' && <span className="warn-text">SCAN ABGEBROCHEN</span>}
        {phase === 'analyze' && (
          <ul>
            {CHECKS.slice(0, checks).map((c) => (
              <motion.li key={c} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                ✓ {c}
              </motion.li>
            ))}
          </ul>
        )}
        {phase === 'done' &&
          (external ? (
            <span className="warn-text">KEINE ÜBEREINSTIMMUNG</span>
          ) : (
            <span className="ok-text">IDENTITÄT BESTÄTIGT</span>
          ))}
      </div>
    </div>
  );
}
