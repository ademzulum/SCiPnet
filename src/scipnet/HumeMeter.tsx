import { useEffect, useRef, useState } from 'react';

// Hume level of the site (reality stability, baseline 100), shown as an
// analogue dial. It drifts around the baseline and every so often spikes out
// for a moment before settling back. Below the dial: low/high of the last
// minute and how many spikes this session has seen.

const MIN = 60;
const MAX = 140;
const SWEEP = 240; // degrees of the dial
const R = 80;
const CX = 100;
const CY = 100;

const angle = (v: number) => -SWEEP / 2 + ((Math.max(MIN, Math.min(MAX, v)) - MIN) / (MAX - MIN)) * SWEEP;
const polar = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};
const arc = (from: number, to: number, r: number) => {
  const [x1, y1] = polar(angle(from), r);
  const [x2, y2] = polar(angle(to), r);
  const large = angle(to) - angle(from) > 180 ? 1 : 0;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};
const ZONES = [
  { from: 60, to: 85, cls: 'bad' },
  { from: 85, to: 94, cls: 'warn' },
  { from: 94, to: 106, cls: 'ok' },
  { from: 106, to: 115, cls: 'warn' },
  { from: 115, to: 140, cls: 'bad' },
];

export default function HumeMeter() {
  const [values, setValues] = useState<number[]>(() => Array(300).fill(100)); // ~1 minute
  const [spikes, setSpikes] = useState(0);
  const spike = useRef<{ until: number; to: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (!spike.current && Math.random() < 0.008) {
        // up or down, short and sharp
        const to = Math.random() < 0.5 ? 100 + 18 + Math.random() * 30 : 100 - 18 - Math.random() * 30;
        spike.current = { until: now + 900 + Math.random() * 1400, to };
        setSpikes((n) => n + 1);
      }
      if (spike.current && now > spike.current.until) spike.current = null;
      setValues((v) => {
        const prev = v[v.length - 1];
        const target = spike.current ? spike.current.to : 100 + (Math.random() - 0.5) * 6;
        const next = prev + (target - prev) * (spike.current ? 0.45 : 0.2) + (Math.random() - 0.5) * 1.5;
        return [...v.slice(1), next];
      });
    }, 200);
    return () => clearInterval(id);
  }, []);

  const cur = values[values.length - 1];
  const dev = Math.abs(cur - 100);
  const state = dev > 15 ? 'bad' : dev > 6 ? 'warn' : 'ok';
  const label = state === 'bad' ? 'ANOMALIE' : state === 'warn' ? 'SCHWANKUNG' : 'STABIL';
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const ticks = Array.from({ length: (MAX - MIN) / 5 + 1 }, (_, i) => MIN + i * 5);

  return (
    <section className={`box hume hume-${state}`}>
      <div className="box-head">
        <h3>Hume-Pegel</h3>
        <span className="small hume-state">
          <span className="live-dot" /> {label}
        </span>
      </div>

      <svg className="hume-dial" viewBox="0 0 200 172" role="img" aria-label={`Hume-Pegel ${cur.toFixed(1)}`}>
        {ZONES.map((z) => (
          <path key={z.from} d={arc(z.from, z.to, R)} className={`hume-zone ${z.cls}`} />
        ))}
        {/* the range swept in the last minute */}
        <path d={arc(lo, hi, R - 12)} className="hume-range" />
        {ticks.map((t) => {
          const major = t % 20 === 0;
          const [x1, y1] = polar(angle(t), R - 6);
          const [x2, y2] = polar(angle(t), R - (major ? 18 : 12));
          const [tx, ty] = polar(angle(t), R - 28);
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={major ? 'hume-tick major' : 'hume-tick'} />
              {major && (
                <text x={tx} y={ty + 3} className="hume-num">
                  {t}
                </text>
              )}
            </g>
          );
        })}
        <g className="hume-needle" style={{ transform: `rotate(${angle(cur)}deg)` }}>
          <path d={`M${CX - 3} ${CY} L${CX} ${CY - R + 8} L${CX + 3} ${CY} Z`} />
        </g>
        <circle cx={CX} cy={CY} r="6" className="hume-hub" />
        <text x={CX} y={CY + 40} className="hume-read">
          {cur.toFixed(1)}
        </text>
        <text x={CX} y={CY + 54} className="hume-unit">
          HUME
        </text>
      </svg>

      <div className="hume-stats">
        <div>
          <span className="label">Min 60 s</span>
          <strong>{lo.toFixed(1)}</strong>
        </div>
        <div>
          <span className="label">Max 60 s</span>
          <strong>{hi.toFixed(1)}</strong>
        </div>
        <div>
          <span className="label">Ausschläge</span>
          <strong>{spikes}</strong>
        </div>
      </div>
    </section>
  );
}
