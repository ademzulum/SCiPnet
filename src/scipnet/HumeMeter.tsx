import { useEffect, useRef, useState } from 'react';

// Hume level of the site (reality stability, baseline 100). Drifts around the
// baseline and every so often spikes out for a moment before settling back.

const HISTORY = 60;

export default function HumeMeter() {
  const [values, setValues] = useState<number[]>(() => Array(HISTORY).fill(100));
  const spike = useRef<{ until: number; to: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (!spike.current && Math.random() < 0.008) {
        // up or down, short and sharp
        const to = Math.random() < 0.5 ? 100 + 18 + Math.random() * 30 : 100 - 18 - Math.random() * 30;
        spike.current = { until: now + 900 + Math.random() * 1400, to };
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
  // chart: 60 ... 140 Hume
  const y = (v: number) => 40 - ((Math.max(60, Math.min(140, v)) - 60) / 80) * 40;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (HISTORY - 1)) * 200).toFixed(1)} ${y(v).toFixed(1)}`).join('');

  return (
    <section className={`box hume hume-${state}`}>
      <div className="box-head">
        <h3>Hume-Pegel</h3>
        <span className="small">
          <span className="live-dot" /> {label}
        </span>
      </div>
      <div className="hume-value">
        {cur.toFixed(1)}
        <span> Hm</span>
      </div>
      <svg className="hume-chart" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden>
        <line x1="0" x2="200" y1={y(100)} y2={y(100)} className="hume-base" />
        <rect x="0" width="200" y={y(115)} height={y(85) - y(115)} className="hume-band" />
        <path d={d} />
      </svg>
      <div className="hume-scale small dim">
        <span>60</span>
        <span>Basis 100</span>
        <span>140</span>
      </div>
    </section>
  );
}
