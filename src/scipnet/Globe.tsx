import { useEffect, useRef, useState } from 'react';
import { geoGraticule10, geoOrthographic, geoPath, geoDistance } from 'd3-geo';
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

const countryName = (code: string | null) => {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(['de'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
};

export function useGeo() {
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/geo')
      .then((r) => (r.ok ? r.json() : null))
      .then((g: Geo | null) => alive && setGeo(g ?? { city: null, country: null, lat: null, lon: null }))
      .catch(() => alive && setGeo({ city: null, country: null, lat: null, lon: null }));
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
    let bg = '#07090b';
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
      bg = css.getPropertyValue('--bg').trim() || bg;
      light = !!canvas.closest("[data-mode='light']");

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

      // pin fades out over the last 30° before the horizon and back in after it
      const fade = pin ? Math.max(0, Math.min(1, (Math.PI / 2 - geoDistance(pin, [-lon, -tilt])) / (Math.PI / 6))) : 0;
      if (pin && fade > 0) {
        const [x, y] = projection(pin)!;
        const pulse = (now / 1400) % 1;
        ctx.globalAlpha = (1 - pulse) * fade;
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse * 18, 0, Math.PI * 2);
        ctx.strokeStyle = fg; // text colour: dark in light mode, light in dark mode
        ctx.lineWidth = 2;
        ctx.stroke();
        // red dot with a background-coloured halo and a text-coloured rim, so it
        // stands out from the land outlines in both modes
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = light ? '#d0001c' : '#ff5a5f';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = fg;
        ctx.stroke();
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
