import { useEffect, useRef, useState } from 'react';
import type { Person } from '../data/personnel';
import SuccessMark from './SuccessMark';
import { play } from '../lib/sound';

// Full-page biometric check in front of a personnel file:
// hold the pad (fingerprint) -> face scan -> database match -> result.
// Per-frame values are written straight to the DOM through refs so the
// scan never re-renders React while it animates.
// External persons (ids starting with "X-") come back without a match.

type Phase = 'idle' | 'hold' | 'abort' | 'face' | 'match' | 'granted' | 'nomatch';

// Hold + face + match together span the scan sound (biometric_scan.mp3, ~8.4 s).
const HOLD_MS = 3600;
const FACE_MS = 2700;
const MATCH_MS = 2100;
const RESULT_MS = 1300;
const RECORDS = 4812;

const STEPS = ['Fingerabdruck', 'Gesichtsscan', 'Abgleich'];
const stepOf = (p: Phase) => (p === 'face' ? 1 : p === 'match' ? 2 : p === 'granted' || p === 'nomatch' ? 3 : 0);

const RING = 2 * Math.PI * 46;

// Fingerprint: fine nested loops; each ridge arches over the core and its
// sides sweep outward toward the base, broken by small gaps. Cropped to a
// fingertip outline.
const RIDGES = Array.from({ length: 11 }, (_, i) => {
  const r = 2.5 + i * 3.2;
  const top = 46 - r * 1.25;
  const flare = r * 0.22;
  return {
    d:
      `M ${50 - r - flare} 98 C ${50 - r - flare * 0.6} 74, ${50 - r} 60, ${50 - r} 46 ` +
      `C ${50 - r} ${top}, ${50 + r} ${top}, ${50 + r} 46 ` +
      `C ${50 + r} 60, ${50 + r + flare * 0.6} 74, ${50 + r + flare} 98`,
    dash: i % 4 === 1 ? '34 3 70 4' : i % 4 === 3 ? '52 4 24 3' : undefined,
  };
});
const RidgePaths = () => (
  <>
    {RIDGES.map((r, i) => (
      <path key={i} d={r.d} strokeDasharray={r.dash} />
    ))}
  </>
);

// Stylised face landmarks (viewBox 100x120), each linked to its 3 nearest neighbours.
const POINTS: [number, number][] = [
  [50, 12], [34, 18], [66, 18], [24, 32], [76, 32],
  [34, 45], [42, 43], [58, 43], [66, 45],
  [22, 56], [78, 56], [50, 51], [44, 64], [56, 64],
  [40, 78], [50, 81], [60, 78], [28, 76], [72, 76],
  [38, 94], [62, 94], [50, 103],
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

const hex = () =>
  Array.from({ length: 6 }, () =>
    Array.from({ length: 8 }, () => ((Math.random() * 256) | 0).toString(16).padStart(2, '0')).join(' '),
  ).join('\n');

export default function BiometricGate({
  person,
  onVerified,
  onCancel,
}: {
  person: Person;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const external = person.id.startsWith('X-');
  const [phase, setPhase] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const setP = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const clip = useRef<SVGRectElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const hexOut = useRef<HTMLPreElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stopSound = useRef<() => void>(() => {});
  const done = useRef({ onVerified });
  done.current = { onVerified };

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  // Write the hold progress (0..1) to the DOM.
  const paint = (p: number) => {
    ring.current?.setAttribute('stroke-dashoffset', String(RING * (1 - p)));
    clip.current?.setAttribute('y', String(100 - p * 100));
    if (pct.current) pct.current.textContent = `${Math.round(p * 100)}%`;
    root.current?.style.setProperty('--p', p.toFixed(3));
  };

  useEffect(() => {
    // Telemetry stream while the scan runs; text only, no React state.
    const t = setInterval(() => {
      const p = phaseRef.current;
      if ((p === 'hold' || p === 'face' || p === 'match') && hexOut.current) hexOut.current.textContent = hex();
    }, 140);
    return () => {
      clearInterval(t);
      cancelAnimationFrame(raf.current);
      timers.current.forEach(clearTimeout);
      stopSound.current();
    };
  }, []);

  const startHold = () => {
    if (phaseRef.current !== 'idle') return;
    setP('hold');
    stopSound.current = play('biometric', 0.36); // file is ~7 dB louder than the old one
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / HOLD_MS);
      paint(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else face();
    };
    raf.current = requestAnimationFrame(tick);
  };

  const release = () => {
    if (phaseRef.current !== 'hold') return;
    cancelAnimationFrame(raf.current);
    stopSound.current();
    play('negative', 0.8);
    setP('abort');
    later(() => {
      paint(0);
      setP('idle');
    }, 1200);
  };

  const face = () => {
    setP('face');
    later(match, FACE_MS);
  };

  const match = () => {
    setP('match');
    const t0 = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / MATCH_MS);
      if (counter.current) counter.current.textContent = Math.round(p * RECORDS).toLocaleString('de-DE');
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    later(() => {
      stopSound.current();
      if (external) {
        play('error', 0.6);
        setP('nomatch');
        later(() => done.current.onVerified(), RESULT_MS + 900);
      } else {
        play('fileUnlocked', 0.8);
        setP('granted');
        later(() => done.current.onVerified(), RESULT_MS);
      }
    }, MATCH_MS);
  };

  const step = stepOf(phase);
  const busy = phase === 'hold' || phase === 'face' || phase === 'match';

  return (
    <div className="page">
      <button className="link back" onClick={onCancel}>
        ← Personalakten
      </button>

      <div ref={root} className={`biogate box bio-${phase}`}>
        <header className="biogate-head">
          <div>
            <div className="label">Biometrische Verifizierung</div>
            <h2>Zugriff auf Akte {person.id}</h2>
          </div>
          <span className={`secure-tag ${busy ? 'busy' : ''}`}>{busy ? 'SCAN AKTIV' : 'SENSOR BEREIT'}</span>
        </header>

        <ol className="biogate-steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? 'done' : i === step && phase !== 'idle' && phase !== 'abort' ? 'active' : ''}>
              <span className="step-dot">{i < step ? '✓' : i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <div className="biogate-grid">
          <button
            className="bio-pad"
            data-sound="none"
            aria-label="Gedrückt halten, um den Fingerabdruck zu scannen"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              startHold();
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && startHold()}
            onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && release()}
          >
            <span className="bio-corner tl" />
            <span className="bio-corner tr" />
            <span className="bio-corner bl" />
            <span className="bio-corner br" />

            {(phase === 'idle' || phase === 'hold' || phase === 'abort') && (
              <svg viewBox="0 0 100 100" className="bio-print">
                <defs>
                  <clipPath id="bio-fill">
                    <rect ref={clip} x="0" y="100" width="100" height="100" />
                  </clipPath>
                  <clipPath id="bio-finger">
                    <ellipse cx="50" cy="52" rx="33" ry="40" />
                  </clipPath>
                </defs>
                <circle cx="50" cy="50" r="46" className="bio-ring-bg" />
                <circle
                  ref={ring}
                  cx="50"
                  cy="50"
                  r="46"
                  className="bio-ring"
                  strokeDasharray={RING}
                  strokeDashoffset={RING}
                />
                <g clipPath="url(#bio-finger)">
                  <g className="bio-ridges">
                    <RidgePaths />
                  </g>
                  <g className="bio-ridges lit" clipPath="url(#bio-fill)">
                    <RidgePaths />
                  </g>
                </g>
                <ellipse cx="50" cy="52" rx="33" ry="40" className="bio-finger" />
              </svg>
            )}

            {(phase === 'face' || phase === 'match') && (
              <svg viewBox="0 0 100 120" className="bio-mesh">
                {EDGES.map(([a, b], i) => (
                  <line
                    key={i}
                    pathLength={1}
                    x1={POINTS[a][0]}
                    y1={POINTS[a][1]}
                    x2={POINTS[b][0]}
                    y2={POINTS[b][1]}
                    style={{ animationDelay: `${i * 22}ms` }}
                  />
                ))}
                {POINTS.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="1.5" style={{ animationDelay: `${i * 35}ms` }} />
                ))}
                <rect className="bio-mesh-sweep" x="0" width="100" height="2.5" />
              </svg>
            )}

            {(phase === 'granted' || phase === 'nomatch') && (
              <div className="bio-result">
                {phase === 'granted' ? <SuccessMark /> : <span className="bio-result-icon">✕</span>}
              </div>
            )}

            <span className="bio-sweep" />
          </button>

          <div className="bio-panel">
            <div className="bio-status">
              {phase === 'idle' && (
                <>
                  <strong>Finger auflegen</strong>
                  <span className="dim">Sensor gedrückt halten, bis der Ring geschlossen ist.</span>
                </>
              )}
              {phase === 'hold' && (
                <>
                  <strong>
                    Erfasse Fingerabdruck <span ref={pct}>0%</span>
                  </strong>
                  <span className="dim">Nicht loslassen.</span>
                </>
              )}
              {phase === 'abort' && (
                <>
                  <strong className="warn-text">Scan abgebrochen</strong>
                  <span className="dim">Kontakt verloren. Erneut versuchen.</span>
                </>
              )}
              {phase === 'face' && (
                <>
                  <strong>Gesichtsgeometrie wird erfasst</strong>
                  <span className="dim">22 Messpunkte · Tiefenkarte aktiv</span>
                </>
              )}
              {phase === 'match' && (
                <>
                  <strong>
                    Abgleich: <span ref={counter}>0</span> / {RECORDS.toLocaleString('de-DE')}
                  </strong>
                  <span className="dim">Foundation-Personaldatenbank</span>
                </>
              )}
              {phase === 'granted' && (
                <>
                  <strong className="ok-text">Identität bestätigt · 99,7 %</strong>
                  <span className="dim">Akte wird geöffnet…</span>
                </>
              )}
              {phase === 'nomatch' && (
                <>
                  <strong className="warn-text">Keine Übereinstimmung</strong>
                  <span className="dim">Externe Akte. Zugriff wird protokolliert.</span>
                </>
              )}
            </div>

            <div className="bio-meters">
              {['Kontaktdruck', 'Auflagefläche', 'Signalqualität'].map((m, i) => (
                <div key={m} className="bio-meter">
                  <span className="label">{m}</span>
                  <span className="bio-meter-track">
                    <span className="bio-meter-fill" style={{ ['--k' as string]: 0.7 + i * 0.12 }} />
                  </span>
                </div>
              ))}
            </div>

            <div className="bio-telemetry">
              <div className="label">Sensordaten</div>
              <pre ref={hexOut}>{'-- -- -- -- -- -- -- --\n'.repeat(6)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
