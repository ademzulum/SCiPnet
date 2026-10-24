import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Person } from '../data/personnel';
import { play } from '../lib/sound';
import brainArt from '../../images/brain_scan_2d.svg';

type Metric = { label: string; value: number };
type Tone = 'ok' | 'warn' | 'bad';

// Region overlays for images/brain_scan_2d.svg (viewBox 0 0 511 456, side view,
// forehead on the left). Lobes are cut along the drawn central sulcus and
// Sylvian fissure and clipped to the brain's outer contour; the line art sits on top.
// Outer contour of the line art (its first subpath), so the overlay never leaks past the outline.
const SILHOUETTE =
  'M 319.4,445.5 C 317.5,439.6 314.7,430.6 313.0,425.5 C 307.8,408.8 302.9,393.8 302.3,392.6 C 302.0,392.0 298.8,390.1 295.1,388.4 C 286.0,384.1 280.1,379.9 274.5,374.1 C 266.7,365.9 264.0,359.6 263.5,348.2 C 263.3,344.8 263.1,340.6 262.9,339.0 L 262.6,336.1 L 256.0,342.7 C 246.5,352.3 240.3,356.4 231.0,359.5 C 226.3,361.1 225.7,361.1 215.1,361.1 C 202.4,361.1 197.0,360.3 187.9,356.7 C 185.0,355.5 178.1,353.0 172.7,351.2 C 160.5,347.0 153.8,343.9 147.9,339.5 C 138.0,332.2 132.7,323.1 131.2,311.3 L 130.6,306.0 L 128.5,306.4 C 127.4,306.6 120.1,306.8 112.3,306.8 C 91.9,306.7 80.5,304.9 63.0,299.0 C 39.1,290.9 28.1,283.0 21.0,268.9 C 17.8,262.5 15.2,252.2 15.2,245.8 C 15.2,243.5 14.8,242.7 11.2,238.0 C 6.3,231.6 2.7,224.2 1.0,217.3 C -0.6,210.2 -0.2,198.2 1.9,190.9 C 3.8,184.3 6.1,179.4 9.8,173.8 C 12.7,169.4 12.9,169.1 13.2,164.4 C 15.3,138.2 25.4,117.1 46.2,96.0 C 51.0,91.2 54.6,87.0 56.1,84.4 C 61.6,75.3 71.2,65.3 80.4,59.1 C 85.5,55.8 95.7,50.5 100.4,48.8 C 101.7,48.4 105.4,45.6 109.7,41.7 C 127.7,25.5 144.8,17.8 170.1,14.5 C 177.1,13.6 179.3,13.1 182.0,11.7 C 193.3,6.0 206.5,3.7 218.2,5.3 C 224.2,6.2 233.6,8.6 238.2,10.5 L 242.2,12.2 L 244.9,10.4 C 251.1,6.1 260.2,3.0 272.6,1.0 C 281.8,-0.4 300.9,-0.3 311.9,1.3 C 331.1,4.2 340.0,8.2 350.0,18.4 C 353.4,21.9 355.3,23.4 356.2,23.4 C 358.3,23.4 370.6,26.6 376.2,28.6 C 390.2,33.5 404.2,43.0 413.2,53.6 C 418.7,60.2 420.4,62.8 424.9,71.8 C 428.8,79.5 429.1,79.9 433.2,83.1 C 439.5,88.2 447.4,96.5 450.9,101.8 C 454.8,107.6 458.5,115.4 460.8,122.5 C 462.4,127.2 462.9,128.2 466.3,131.8 C 476.5,142.8 483.5,155.0 486.3,166.8 C 486.9,169.4 487.8,174.6 488.1,178.5 L 488.8,185.5 L 492.3,188.2 C 508.4,201.0 514.7,219.8 508.8,236.8 C 507.5,240.5 506.0,243.0 501.7,249.2 C 500.1,251.5 500.1,251.8 499.8,260.2 C 499.3,274.8 496.3,285.0 489.7,294.7 C 484.8,301.9 475.6,308.0 466.1,310.2 C 463.8,310.8 462.0,311.3 462.0,311.4 C 462.0,311.4 462.5,312.6 463.1,314.0 C 463.7,315.4 464.8,318.6 465.5,321.3 C 466.6,325.5 466.8,327.4 466.7,336.6 C 466.7,346.3 466.6,347.4 465.2,352.1 C 462.1,362.2 457.3,369.6 450.7,374.6 C 444.0,379.6 429.3,385.7 415.3,389.2 C 401.9,392.6 395.6,393.4 381.9,393.4 C 370.6,393.4 369.7,393.3 364.3,391.8 C 359.8,390.6 357.2,390.2 351.6,390.1 C 347.7,390.0 343.2,389.6 341.7,389.3 C 340.2,388.9 338.9,388.7 338.8,388.8 C 338.6,389.0 345.9,407.9 350.7,419.2 C 353.2,425.0 356.5,433.0 358.2,437.1 C 362.3,447.2 362.2,450.6 357.7,453.0 C 355.6,454.1 345.2,455.2 332.2,455.8 L 322.8,456.2 L 319.4,445.5 Z';
const REGIONS = [
  { id: 'frontal', name: 'Frontallappen', d: 'M0 0 L245 0 L240 100 L250 170 L220 193 L173 213 L127 267 L127 380 L0 380 Z', nx: 120, ny: 150 },
  { id: 'parietal', name: 'Parietallappen', d: 'M245 0 L400 0 L400 175 L373 180 L313 167 L267 177 L250 170 L240 100 Z', nx: 320, ny: 90 },
  { id: 'occipital', name: 'Okzipitallappen', d: 'M400 0 L520 0 L520 300 L400 300 L400 175 Z', nx: 450, ny: 205 },
  { id: 'temporal', name: 'Temporallappen', d: 'M127 267 L173 213 L220 193 L267 177 L313 167 L373 180 L400 175 L400 300 L300 300 L260 380 L127 380 Z', nx: 255, ny: 245 },
  { id: 'cerebellum', name: 'Kleinhirn', d: 'M305 337 A78 48 0 1 0 461 337 A78 48 0 1 0 305 337 Z', nx: 383, ny: 337 },
] as const;
const W = 511;
const H = 456;

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
  const sweepX = (pct / 100) * W;

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
          {/* heat overlay under the line art */}
          <svg className="brain-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gehirnscan">
            <defs>
              <clipPath id="brain-cerebrum">
                <path d={SILHOUETTE} />
              </clipPath>
              <pattern id="brain-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#brain-grid)" />
            {REGIONS.map((r, i) => {
              const v = regionMetric(metrics, i).value;
              const revealed = phase === 'done' || (phase === 'scan' && sweepX > r.nx);
              return (
                <path
                  key={r.id}
                  d={r.d}
                  clipPath="url(#brain-cerebrum)"
                  className={`brain-region${sel === i ? ' sel' : ''}`}
                  style={revealed ? { fill: heat(v), fillOpacity: 0.25 + (v / 100) * 0.45 } : undefined}
                  onClick={() => phase === 'done' && setSel(i)}
                />
              );
            })}
          </svg>
          <div className="brain-art" style={{ maskImage: `url(${brainArt})`, WebkitMaskImage: `url(${brainArt})` }} aria-hidden />
          {/* sweep and hotspots above the line art */}
          <svg className="brain-svg brain-top" viewBox={`0 0 ${W} ${H}`} aria-hidden>
            {phase === 'scan' && (
              <>
                <rect x={sweepX - 40} y="0" width="40" height={H} className="brain-sweep" />
                <line x1={sweepX} x2={sweepX} y1="0" y2={H} className="brain-line" />
              </>
            )}
            {phase === 'done' &&
              REGIONS.map((r, i) => (
                <circle
                  key={r.id}
                  cx={r.nx}
                  cy={r.ny}
                  r={sel === i ? 10 : 7}
                  className="brain-node"
                  onClick={() => setSel(i)}
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
