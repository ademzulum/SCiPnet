import { useEffect, useRef, useState } from 'react';
import { geoGraticule10, geoOrthographic, geoPath, geoDistance, geoInterpolate } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';

// Rotating wireframe globe with a pin on the visitor's city. The location
// comes from /api/geo (Vercel's IP geolocation, city level). Without it, e.g.
// in local dev, the globe just spins and the panel says "unbekannt".

export type Geo = { city: string | null; country: string | null; lat: number | null; lon: number | null };

const topo = world as unknown as Topology<{ countries: GeometryCollection; land: GeometryCollection }>;
const LAND = feature(topo, topo.objects.land);
const BORDERS = mesh(topo, topo.objects.countries, (a, b) => a !== b);
const GRID = geoGraticule10();

// endpoints for the data links: Foundation-ish hubs around the world
const NODES: [number, number][] = [
  [-74.0, 40.7], [-0.1, 51.5], [2.35, 48.86], [13.4, 52.52], [37.6, 55.75], [139.7, 35.7],
  [151.2, -33.9], [-43.2, -22.9], [28.0, -26.2], [31.2, 30.0], [77.2, 28.6], [103.8, 1.35],
  [-122.4, 37.8], [-99.1, 19.4], [18.1, 59.3], [20.2, 67.9], [-149.9, 61.2], [116.4, 39.9],
];
type Link = { a: [number, number]; b: [number, number]; start: number; dur: number; lift: number };
const STEPS = 48;

const countryName = (code: string | null) => {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(['de'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
};

// fetched once per page load and kept, so coming back to the overview shows
// the location at once instead of loading it again
const NONE: Geo = { city: null, country: null, lat: null, lon: null };
let cached: Geo | null = null;
let pending: Promise<Geo> | null = null;
const loadGeo = () =>
  (pending ??= fetch('/api/geo')
    .then((r) => (r.ok ? (r.json() as Promise<Geo>) : NONE))
    .catch(() => NONE)
    .then((g) => (cached = g)));

export function useGeo() {
  const [geo, setGeo] = useState<Geo | null>(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    loadGeo().then((g) => alive && setGeo(g));
    return () => {
      alive = false;
    };
  }, []);
  return geo;
}

export default function Globe({ geo }: { geo: Geo | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pin = geo?.lat != null && geo?.lon != null ? ([geo.lon, geo.lat] as [number, number]) : null;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    // theme colours are re-read every frame so a light/dark switch applies at once
    const css = getComputedStyle(canvas);
    let accent = '#e8b85a';
    let fg = '#cfd8dc';
    let light = false;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let size = 0;
    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath(projection, ctx);
    // start facing the pin, then keep turning west to east
    let lon = pin ? -pin[0] : 0;
    const tilt = pin ? -Math.max(-40, Math.min(40, pin[1] * 0.6)) : -20;
    let last = performance.now();
    const links: Link[] = [];
    let nextLink = 0;
    // prefer endpoints facing the viewer so most links are actually seen
    const node = () => {
      const front = NODES.filter((n) => geoDistance(n, [-lon, -tilt]) < 1.3);
      const pool = front.length > 2 ? front : NODES;
      return pool[(Math.random() * pool.length) | 0];
    };

    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      projection.translate([size / 2, size / 2]).scale(size / 2 - 2);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!still) lon += dt * 0.012;
      projection.rotate([lon, tilt]);
      ctx.clearRect(0, 0, size, size);
      accent = css.getPropertyValue('--accent').trim() || accent;
      fg = css.getPropertyValue('--fg').trim() || fg;
      light = !!canvas.closest("[data-mode='light']");
      // links and pin: bright text colour on the dark globe, deep crimson on the light one
      const ink = light ? '#8f0a1c' : fg;

      // sphere
      ctx.beginPath();
      path({ type: 'Sphere' });
      ctx.fillStyle = light ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)';
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      path(GRID);
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.08;
      ctx.stroke();

      ctx.beginPath();
      path(LAND);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.16;
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = accent;
      ctx.stroke();

      ctx.beginPath();
      path(BORDERS);
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // data links: lifted great-circle arcs; a bright head runs from a to b
      // dragging a fading trail, then the arc fades away
      if (!still && now > nextLink && links.length < 9) {
        const a = pin && Math.random() < 0.4 ? pin : node();
        let b = node();
        while (b === a) b = node();
        const dist = geoDistance(a, b);
        links.push({ a, b, start: now, dur: 1400 + dist * 900, lift: 0.1 + dist * 0.18 });
        nextLink = now + 250 + Math.random() * 500;
      }
      const centre: [number, number] = [-lon, -tilt];
      const [cx, cy] = projection.translate();
      for (let i = links.length - 1; i >= 0; i--) {
        const l = links[i];
        const t = (now - l.start) / l.dur; // head position 0..1, then 1..1.6 fade out
        if (t > 1.6) {
          links.splice(i, 1);
          continue;
        }
        const head = Math.min(1, t);
        const tail = Math.max(0, head - 0.55);
        const out = t > 1 ? 1 - (t - 1) / 0.6 : 1;
        const at = geoInterpolate(l.a, l.b);
        let prev: [number, number] | null = null;
        for (let k = Math.floor(tail * STEPS); k <= Math.ceil(head * STEPS); k++) {
          const u = Math.min(head, Math.max(tail, k / STEPS));
          const ll = at(u);
          // hidden behind the globe: skip; near the horizon: fade
          const front = Math.PI / 2 - geoDistance(ll, centre);
          const vis = Math.max(0, Math.min(1, front / 0.35 + 0.4));
          const [px, py] = projection(ll) ?? [cx, cy];
          const h = 1 + Math.sin(u * Math.PI) * l.lift; // height above the surface
          const p: [number, number] = [cx + (px - cx) * h, cy + (py - cy) * h];
          if (front < -0.25 || !projection(ll)) {
            prev = null;
            continue;
          }
          if (prev) {
            ctx.globalAlpha = (0.15 + 0.85 * ((u - tail) / Math.max(0.001, head - tail))) * vis * out;
            ctx.beginPath();
            ctx.moveTo(prev[0], prev[1]);
            ctx.lineTo(p[0], p[1]);
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
          prev = p;
        }
        if (t <= 1 && prev) {
          ctx.globalAlpha = out;
          ctx.beginPath();
          ctx.arc(prev[0], prev[1], 2.2, 0, Math.PI * 2);
          ctx.fillStyle = ink;
          ctx.fill();
        }
      }

      // pin fades out over the last 30° before the horizon and back in after it
      const fade = pin ? Math.max(0, Math.min(1, (Math.PI / 2 - geoDistance(pin, [-lon, -tilt])) / (Math.PI / 6))) : 0;
      if (pin && fade > 0) {
        const [x, y] = projection(pin)!;
        const pulse = (now / 1400) % 1;
        ctx.globalAlpha = (1 - pulse) * fade;
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse * 18, 0, Math.PI * 2);
        ctx.strokeStyle = light ? ink : '#ff5a5f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = light ? ink : '#ff5a5f';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [pin?.[0], pin?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const country = countryName(geo?.country ?? null);
  return (
    <section className="box globe-box">
      <div className="box-head">
        <h3>Standortbestimmung</h3>
        <span className="small dim">{geo ? (pin ? 'Signal trianguliert' : 'Kein Signal') : 'Peile an…'}</span>
      </div>
      <div className="globe-body">
        <canvas ref={ref} className="globe" aria-label="Globus mit Ihrem Standort" />
        <dl className="globe-facts">
          <div>
            <dt className="label">Land</dt>
            <dd>{geo ? (country ?? 'unbekannt') : '…'}</dd>
          </div>
          <div>
            <dt className="label">Stadt</dt>
            <dd>{geo ? (geo.city ?? 'unbekannt') : '…'}</dd>
          </div>
          <div>
            <dt className="label">Koordinaten</dt>
            <dd>{pin ? `${Math.abs(pin[1]).toFixed(2)}° ${pin[1] < 0 ? 'S' : 'N'} · ${Math.abs(pin[0]).toFixed(2)}° ${pin[0] < 0 ? 'W' : 'O'}` : '—'}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
