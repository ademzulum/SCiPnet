import { useEffect, useRef, useState } from 'react';
import { geoDistance, geoOrthographic, geoPath } from 'd3-geo';
import { BORDERS, GRID, LAND, countryName, useGeo } from '../scipnet/Globe';
import { hum, initAudio, play } from '../lib/sound';

// Between the UIU seal and the terminal: the field terminal locates itself.
// A wireframe globe spins up, three satellite fixes converge on the visitor's
// city (Vercel IP geolocation, city level), the globe turns and zooms onto it,
// the lock is shown, then the terminal takes over. Esc skips.

const SPIN_MS = 1400; // globe spins up
const FIX_MS = 2200; // satellites triangulate
const ZOOM_MS = 1600; // turn and zoom onto the target
const HOLD_MS = 1300; // lock readout
const TOTAL = SPIN_MS + FIX_MS + ZOOM_MS + HOLD_MS;

const FALLBACK: [number, number] = [-77.0, 38.9]; // no fix: the UIU home office
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (t: number) => Math.max(0, Math.min(1, t));

export default function Locate({ onDone }: { onDone: () => void }) {
  const geo = useGeo();
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'spin' | 'fix' | 'zoom' | 'lock'>('spin');
  const [readout, setReadout] = useState('');
  const geoRef = useRef(geo);
  geoRef.current = geo;
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const color = getComputedStyle(canvas).getPropertyValue('--fg').trim() || '#ffb000';
    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath(projection, ctx);
    let size = 0;
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    // three "satellites" at fixed spots on the screen rim
    const sats = [0.15, 0.48, 0.81].map((a) => a * Math.PI * 2);
    const start = performance.now();
    let raf = 0;
    let finished = false;
    let shown = '';
    let locked = false;
    let searching = false;
    let stopSearch: (fadeMs?: number) => void = () => {};
    const finish = () => {
      if (finished) return;
      finished = true;
      done.current();
    };

    const draw = (now: number) => {
      const t = now - start;
      const g = geoRef.current;
      const target: [number, number] = g?.lat != null && g?.lon != null ? [g.lon, g.lat] : FALLBACK;
      const r = size / 2 - 4;
      const c = size / 2;

      // rotation: fast spin, slowing into the target's longitude
      const spinLon = t * 0.25;
      const zoomT = ease(clamp((t - SPIN_MS - FIX_MS) / ZOOM_MS));
      const fixT = clamp((t - SPIN_MS) / FIX_MS);
      // faces the target by the middle of the fix, so the satellite lines are seen
      const settle = ease(clamp((t - SPIN_MS * 0.4) / (SPIN_MS * 0.6 + FIX_MS * 0.5)));
      const lonNow = -spinLon * (1 - settle) + -target[0] * settle;
      const latNow = -20 * (1 - settle) + -target[1] * settle;
      projection
        .translate([c, c])
        .scale(r * (1 + zoomT * 5))
        .rotate([lonNow, latNow]);

      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      path({ type: 'Sphere' });
      ctx.stroke();
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 1;
      ctx.beginPath();
      path(GRID);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      path(LAND);
      ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      path(BORDERS);
      ctx.stroke();

      const p = geoDistance(target, [-lonNow, -latNow]) < Math.PI / 2 ? projection(target) : null;

      // triangulation: lines from each satellite to a point that wanders and
      // converges on the target, with shrinking uncertainty rings
      if (t > SPIN_MS && p && zoomT < 1) {
        const wobble = (1 - fixT) * r * 0.6;
        const [tx, ty] = [
          p[0] + Math.sin(t / 130) * wobble,
          p[1] + Math.cos(t / 170) * wobble,
        ];
        sats.forEach((a, i) => {
          const sx = c + Math.cos(a + t / 4000) * (size / 2);
          const sy = c + Math.sin(a + t / 4000) * (size / 2);
          ctx.globalAlpha = 0.85 * (1 - zoomT);
          ctx.setLineDash([4, 6]);
          ctx.lineDashOffset = -t / 20;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 0.9 * (1 - zoomT);
          ctx.fillRect(sx - 3, sy - 3, 6, 6);
          const ring = 6 + (1 - fixT) * r * 0.5 + i * 4 * (1 - fixT);
          ctx.globalAlpha = 0.5 * (1 - zoomT);
          ctx.beginPath();
          ctx.arc(tx, ty, ring, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // target crosshair once zooming
      if (p && t > SPIN_MS + FIX_MS) {
        const k = clamp((t - SPIN_MS - FIX_MS) / 400);
        const s = 14 + (1 - k) * 40;
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p[0], p[1], s, 0, Math.PI * 2);
        ctx.moveTo(p[0] - s - 10, p[1]);
        ctx.lineTo(p[0] - s + 6, p[1]);
        ctx.moveTo(p[0] + s - 6, p[1]);
        ctx.lineTo(p[0] + s + 10, p[1]);
        ctx.moveTo(p[0], p[1] - s - 10);
        ctx.lineTo(p[0], p[1] - s + 6);
        ctx.moveTo(p[0], p[1] + s - 6);
        ctx.lineTo(p[0], p[1] + s + 10);
        ctx.stroke();
        if ((t / 300) % 2 < 1.4) {
          ctx.beginPath();
          ctx.arc(p[0], p[1], 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // text readout: scrambled coordinates until the fix settles
      const lat = target[1];
      const lon = target[0];
      const noise = (v: number) => v + (Math.random() - 0.5) * 80 * (1 - fixT);
      const coord = (v: number, pos: string, neg: string, n: number) =>
        `${Math.abs(n).toFixed(4).padStart(8, '0')}°${v < 0 ? neg : pos}`;
      const text =
        t < SPIN_MS
          ? 'SATELLITENVERBINDUNG …'
          : `${coord(lat, 'N', 'S', noise(lat))}  ${coord(lon, 'O', 'W', noise(lon))}`;
      if (text !== shown) {
        shown = text;
        setReadout(text);
      }
      const nextStep = t < SPIN_MS ? 'spin' : t < SPIN_MS + FIX_MS ? 'fix' : t < SPIN_MS + FIX_MS + ZOOM_MS ? 'zoom' : 'lock';
      setStep(nextStep);
      // search sound loops from just after the globe appears, through the
      // triangulation and the zoom; the lock cuts it and plays the "found" tone
      if (t > 300 && !searching) {
        searching = true;
        initAudio().then(() => {
          if (!locked && !finished) stopSearch = play('triangulate', 0.6, true);
        });
      }
      if (nextStep === 'lock' && !locked) {
        locked = true;
        stopSearch(250);
        initAudio().then(() => play('frequencyFound', 0.6));
        hum.start(); // runs on into the terminal
      }

      if (t >= TOTAL) return finish();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    addEventListener('keydown', onKey);
    return () => {
      finished = true;
      stopSearch(250);
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      removeEventListener('keydown', onKey);
    };
  }, []);

  const place = geo?.city ? `${geo.city.toUpperCase()}, ${(countryName(geo.country) ?? '').toUpperCase()}` : 'STANDORT VERSCHLEIERT';
  const label = {
    spin: 'UIU OS · STANDORTBESTIMMUNG',
    fix: 'TRIANGULIERE STANDORT',
    zoom: 'SIGNAL ERFASST',
    lock: `STANDORT BESTÄTIGT: ${place}`,
  }[step];

  return (
    <div className="locate">
      <div className="locate-head">
        <span className="power-title">{label}</span>
      </div>
      <div className="locate-stage">
        <canvas ref={ref} className="locate-globe" aria-label="Standortbestimmung" />
      </div>
      <div className="locate-read">{readout}</div>
      <button type="button" className="skip" data-sound="none" onClick={() => dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>
        <span className="key-hint">[ESC] </span>ÜBERSPRINGEN
      </button>
    </div>
  );
}
