import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Person } from '../data/personnel';
import { play } from '../lib/sound';

type Metric = { label: string; value: number };
type Tone = 'ok' | 'warn' | 'bad';

// Brain regions of the side view; each one shows one of the person's metrics.
const REGIONS = [
  { id: 'frontal', name: 'Frontallappen', d: 'M22 82 C14 46 40 18 82 15 L90 70 L42 100 Z', lx: 48, ly: 58 },
  { id: 'parietal', name: 'Parietallappen', d: 'M82 15 C122 9 160 24 173 55 L122 71 L90 70 Z', lx: 124, ly: 40 },
  { id: 'occipital', name: 'Okzipitallappen', d: 'M173 55 C186 75 181 99 161 107 L132 93 L122 71 Z', lx: 160, ly: 82 },
  { id: 'temporal', name: 'Temporallappen', d: 'M42 100 L90 70 L122 71 L132 93 C110 113 70 117 42 100 Z', lx: 92, ly: 94 },
] as const;

// low values glow red, high ones green
const heat = (v: number) => `hsl(${Math.round(v * 1.2)} 80% 55%)`;

const regionMetric = (metrics: Metric[], i: number): Metric =>
  metrics.length
    ? metrics[i % metrics.length]
    : { label: 'Keine Daten', value: 50 };

// Interactive "neural scan": sweep the brain, then click regions for readouts.
export function BrainScan({ p }: { p: Person }) {
  const metrics = p.psych.metrics ?? [];
  const [phase, setPhase] = useState<'idle' | 'scan' | 'done'>('idle');
  const [pct, setPct] = useState(0);
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== 'scan') return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const n = Math.min(100, ((t - start) / 2600) * 100);
      setPct(n);
      if (n < 100) raf = requestAnimationFrame(tick);
      else {
        setPhase('done');
        setSel(0);
        play('uiuSuccess', 0.35);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const avg = metrics.length ? Math.round(metrics.reduce((n, m) => n + m.value, 0) / metrics.length) : 0;
  const m = sel !== null ? regionMetric(metrics, sel) : null;

  return (
    <section className={`box brain-scan ${phase}`}>
      <div className="brain-head">
        <div>
          <div className="label">Neuralscan · fMRT-Rekonstruktion</div>
          <strong>{p.name}</strong>
        </div>
        {phase === 'idle' ? (
          <button className="card action" onClick={() => setPhase('scan')}>
            SCAN STARTEN
          </button>
        ) : phase === 'scan' ? (
          <span className="brain-pct">{Math.floor(pct)}%</span>
        ) : (
          <button className="link small" onClick={() => (setSel(null), setPct(0), setPhase('scan'))}>
            Erneut scannen
          </button>
        )}
      </div>

      <div className="brain-body">
        <svg className="brain-svg" viewBox="0 0 200 140" role="img" aria-label="Gehirnscan">
          <defs>
            <clipPath id="brain-clip">
              {REGIONS.map((r) => (
                <path key={r.id} d={r.d} />
              ))}
              <ellipse cx="150" cy="114" rx="22" ry="12" />
            </clipPath>
            <pattern id="brain-grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M6 0H0V6" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="200" height="140" fill="url(#brain-grid)" />
          {REGIONS.map((r, i) => {
            const v = regionMetric(metrics, i).value;
            const revealed = phase === 'done' || (phase === 'scan' && pct > ((r.lx - 10) / 190) * 100);
            return (
              <path
                key={r.id}
                d={r.d}
                className={`brain-region${sel === i ? ' sel' : ''}`}
                style={{ fill: revealed ? heat(v) : undefined, fillOpacity: revealed ? 0.18 + (v / 100) * 0.45 : undefined }}
                onClick={() => phase === 'done' && setSel(i)}
              />
            );
          })}
          <ellipse cx="150" cy="114" rx="22" ry="12" className="brain-region cerebellum" />
          <path d="M138 120 C140 130 142 136 146 140" className="brain-stem" />
          {/* folds */}
          <path className="brain-fold" d="M50 40 C60 50 58 62 70 70 M100 30 C104 44 98 52 108 60 M140 40 C136 52 146 58 150 68 M70 96 C84 90 100 94 112 88" />
          {phase === 'done' &&
            REGIONS.map((r, i) => (
              <circle
                key={r.id}
                cx={r.lx}
                cy={r.ly}
                r={sel === i ? 3.2 : 2.2}
                className="brain-node"
                onClick={() => setSel(i)}
              />
            ))}
          {phase === 'scan' && (
            <g clipPath="url(#brain-clip)">
              <rect x={(pct / 100) * 200 - 14} y="0" width="14" height="140" className="brain-sweep" />
            </g>
          )}
          {phase === 'scan' && <line x1={(pct / 100) * 200} x2={(pct / 100) * 200} y1="4" y2="136" className="brain-line" />}
        </svg>

        <div className="brain-side">
          <AnimatePresence mode="wait">
            {phase !== 'done' ? (
              <motion.p key="wait" className="dim small" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {phase === 'idle'
                  ? 'Startet eine Rekonstruktion der letzten Beurteilung. Danach Regionen anklicken.'
                  : 'Erfasse neuronale Aktivität…'}
              </motion.p>
            ) : (
              m &&
              sel !== null && (
                <motion.div
                  key={sel}
                  className="brain-readout"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                >
                  <div className="label">{REGIONS[sel].name}</div>
                  <div className="brain-value" style={{ color: heat(m.value) }}>
                    {m.value}
                    <span>%</span>
                  </div>
                  <div className="small">{m.label}</div>
                  <div className="dim small">
                    {m.value < 40 ? 'Auffällig. Nachuntersuchung empfohlen.' : m.value < 70 ? 'Im Toleranzbereich.' : 'Unauffällig.'}
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
          <div className="brain-legend">
            <span>0</span>
            <span className="brain-ramp" />
            <span>100</span>
          </div>
          {phase === 'done' && <div className="small">Mittelwert: {avg}%</div>}
        </div>
      </div>
    </section>
  );
}

// Live EEG trace. Calm for "ok", jumpy for "warn", erratic spikes for "bad".
export function Eeg({ tone = 'ok' }: { tone?: Tone }) {
  const [d, setD] = useState<string[]>(['', '', '']);
  const t0 = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    const chaos = tone === 'bad' ? 1 : tone === 'warn' ? 0.5 : 0.15;
    const tick = (now: number) => {
      const t = (now - t0.current) / 1000;
      setD(
        [0, 1, 2].map((ch) => {
          let path = '';
          for (let x = 0; x <= 300; x += 3) {
            const k = x / 300;
            let y =
              Math.sin(k * 22 + t * (3 + ch) + ch) * 5 +
              Math.sin(k * 61 - t * 5.3 + ch * 2) * 2.5 * (1 + chaos) +
              Math.sin(k * 140 + t * 9) * chaos * 3;
            if (chaos > 0.4 && Math.sin(k * 9 + t * 1.3 + ch) > 0.97) y -= 12 * chaos;
            path += `${x ? 'L' : 'M'}${x} ${(20 + y).toFixed(1)}`;
          }
          return path;
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tone]);

  return (
    <section className={`box eeg eeg-${tone}`}>
      <div className="brain-head">
        <div className="label">EEG · Live-Telemetrie</div>
        <span className="small">
          <span className="live-dot" /> {tone === 'bad' ? 'IRREGULÄR' : tone === 'warn' ? 'SCHWANKEND' : 'STABIL'}
        </span>
      </div>
      {['Fp1-F3', 'C3-P3', 'O1-O2'].map((ch, i) => (
        <div key={ch} className="eeg-row">
          <span className="dim small">{ch}</span>
          <svg viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden>
            <path d={d[i]} />
          </svg>
        </div>
      ))}
    </section>
  );
}
