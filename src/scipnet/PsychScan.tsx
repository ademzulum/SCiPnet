import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Person } from '../data/personnel';
import { play } from '../lib/sound';
import brainSvg from '../../images/scipnet_terminal/brain_2d_scan_with_regions.svg?raw';

type Metric = { label: string; value: number };
type Tone = 'ok' | 'warn' | 'bad';

// images/scipnet_terminal/brain_2d_scan_with_regions.svg: side view, forehead on the left. The
// "regionen" group holds one path per lobe (by id), "gehirn" is the line art.
const pathById = (id: string) => brainSvg.match(new RegExp(`id="${id}"[^>]*? d="([^"]+)"`))?.[1] ?? '';
const [, , W, H] = (brainSvg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 1448.56 1293.23').split(/\s+/).map(Number);
const ART = pathById('gehirn');
const REGIONS = [
  { id: 'frontallappen', name: 'Frontallappen' },
  { id: 'partietallappen', name: 'Parietallappen' },
  { id: 'okzipitallappen', name: 'Okzipitallappen' },
  { id: 'temporallappen', name: 'Temporallappen' },
  { id: 'kleinhirn', name: 'Kleinhirn' },
].map((r) => ({ ...r, d: pathById(r.id) }));
const U = W / 511; // stroke and marker sizes were tuned for a 511-wide drawing
const PAD = 36 * U; // the grid reaches a little past the brain on every side

// low values glow red, high ones green
const heat = (v: number) => `hsl(${Math.round(v * 1.2)} 80% 55%)`;

// The first regions show the person's metrics; the rest a baseline (their mean).
const regionMetric = (metrics: Metric[], i: number): Metric => {
  if (metrics[i]) return metrics[i];
  const avg = metrics.length ? Math.round(metrics.reduce((n, m) => n + m.value, 0) / metrics.length) : 50;
  return { label: 'Basisaktivität', value: avg };
};

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
    // the searching sweep from the UIU terminal, quiet, for as long as the scan runs
    const stopSweep = play('triangulate', 0.25, true);
    const tick = (t: number) => {
      const n = Math.min(100, ((t - start) / 2600) * 100);
      setPct(n);
      if (n < 100) raf = requestAnimationFrame(tick);
      else {
        setPhase('done');
        setSel(0);
        stopSweep(250);
        play('uiuSuccess', 0.35);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      stopSweep(150);
    };
  }, [phase]);

  const pick = (i: number) => {
    play('click', 0.5);
    setSel(i);
  };

  const avg = metrics.length ? Math.round(metrics.reduce((n, m) => n + m.value, 0) / metrics.length) : 0;
  const m = sel !== null ? regionMetric(metrics, sel) : null;
  const sweepX = (pct / 100) * W;
  // hotspot per region at the centre of its bounding box
  const refs = useRef<(SVGPathElement | null)[]>([]);
  const [nodes, setNodes] = useState<{ x: number; y: number }[]>([]);
  useLayoutEffect(() => {
    setNodes(
      refs.current.map((el) => {
        const b = el?.getBBox();
        return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : { x: 0, y: 0 };
      }),
    );
  }, []);

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
        <div className="brain-stage">
          <svg className="brain-svg" viewBox={`${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`} role="img" aria-label="Gehirnscan">
            <defs>
              <pattern id="brain-grid" width={16 * U} height={16 * U} patternUnits="userSpaceOnUse">
                <path d={`M${16 * U} 0H0V${16 * U}`} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth={U} />
              </pattern>
              {/* the grid fades out towards its edges, so it has no hard border */}
              <radialGradient id="brain-fade" cx="0.5" cy="0.5" r="0.62">
                <stop offset="0.6" stopColor="#fff" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <mask id="brain-grid-mask">
                <rect x={-PAD} y={-PAD} width={W + 2 * PAD} height={H + 2 * PAD} fill="url(#brain-fade)" />
              </mask>
              <linearGradient id="brain-trail" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <rect x={-PAD} y={-PAD} width={W + 2 * PAD} height={H + 2 * PAD} fill="url(#brain-grid)" mask="url(#brain-grid-mask)" />
            {/* heat overlay under the line art */}
            {REGIONS.map((r, i) => {
              const v = regionMetric(metrics, i).value;
              const revealed = phase === 'done' || (phase === 'scan' && sweepX > (nodes[i]?.x ?? 0));
              return (
                <path
                  key={r.id}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  d={r.d}
                  className={`brain-region${sel === i ? ' sel' : ''}`}
                  style={revealed ? { fill: heat(v), fillOpacity: 0.25 + (v / 100) * 0.45 } : undefined}
                  onClick={() => phase === 'done' && pick(i)}
                />
              );
            })}
            <path d={ART} className="brain-art" />
            {/* sweep and hotspots above the line art */}
            {phase === 'scan' && (
              <>
                {/* fading trail, a glowing beam and a reticle riding along it */}
                <rect x={sweepX - 120 * U} y="0" width={120 * U} height={H} fill="url(#brain-trail)" />
                <line x1={sweepX} x2={sweepX} y1="0" y2={H} className="brain-glow" strokeWidth={8 * U} />
                <line x1={sweepX} x2={sweepX} y1="0" y2={H} className="brain-line" strokeWidth={1.5 * U} />
                {[0.2, 0.4, 0.6, 0.8].map((t) => (
                  <line key={t} x1={sweepX - 6 * U} x2={sweepX + 6 * U} y1={H * t} y2={H * t} className="brain-line" strokeWidth={U} />
                ))}
                <circle cx={sweepX} cy={H * (0.5 + Math.sin(pct / 6) * 0.3)} r={6 * U} className="brain-reticle" strokeWidth={1.5 * U} />
              </>
            )}
            {phase === 'done' &&
              nodes.map((n, i) => (
                <circle
                  key={REGIONS[i].id}
                  cx={n.x}
                  cy={n.y}
                  r={(sel === i ? 10 : 7) * U}
                  className="brain-node"
                  onClick={() => pick(i)}
                />
              ))}
          </svg>
        </div>

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

// Vital signs beside the EEG: slow drift around a resting value, rougher for
// a worse assessment.
const VITALS: { label: string; unit: string; base: number; spread: number; digits?: number }[] = [
  { label: 'Herzfrequenz', unit: 'bpm', base: 68, spread: 4 },
  { label: 'HRV', unit: 'ms', base: 54, spread: 6 },
  { label: 'Hautleitwert', unit: 'µS', base: 4.2, spread: 0.6, digits: 1 },
  { label: 'Atmung', unit: '/min', base: 14, spread: 1.5 },
];

export function Vitals({ tone = 'ok' }: { tone?: Tone }) {
  const stress = tone === 'bad' ? 1.6 : tone === 'warn' ? 1.25 : 1;
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((n) => n + 1), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <section className={`box vitals eeg-${tone}`}>
      <div className="brain-head">
        <div className="label">Vitalwerte · Sensorweste</div>
        <span className="small dim">1 Hz</span>
      </div>
      <div className="vitals-grid">
        {VITALS.map((v, i) => {
          // HRV drops under stress, everything else rises
          const base = i === 1 ? v.base / stress : v.base * (1 + (stress - 1) * 0.4);
          const val = base + Math.sin(t * 0.7 + i * 1.9) * v.spread * stress * 0.5 + Math.sin(t * 1.9 + i) * v.spread * 0.2;
          return (
            <div key={v.label} className="vital">
              <span className="label">{v.label}</span>
              <span className="vital-value">
                {val.toFixed(v.digits ?? 0)}
                <small>{v.unit}</small>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
