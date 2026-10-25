import { useEffect, useId, useState } from 'react';

// Image that can be censored. SVGs are fetched and inlined; each rect whose id
// starts with "censor" only marks an area. It is redrawn as a felt-tip
// scribble whose strokes are filled with a smeared, scrambled copy of the
// picture (so they take on its colours but nothing is recognisable), with grey
// scratches darting along them. Strokes stay inside the box. The
// Administrator (censored = false) sees the plain picture. Other formats
// render as <img>.
const cache = new Map<string, Promise<string>>();
const load = (src: string) => {
  if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.text()));
  return cache.get(src)!;
};

const CENSOR = /<rect\b([^>]*?)\sid="(censor[^"]*)"([^>]*?)\/?>(?:<\/rect>)?/g;
const attr = (a: string, name: string) => a.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

function scribble(attrs: string, id: string, salt: number, scope: string) {
  const x = Number(attr(attrs, 'x') ?? 0);
  const y = Number(attr(attrs, 'y') ?? 0);
  const w = Number(attr(attrs, 'width') ?? 0);
  const h = Number(attr(attrs, 'height') ?? 0);
  const transform = attr(attrs, 'transform');
  const tf = transform ? ` transform="${transform}"` : '';
  let seed = 9 + salt * 31;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const f = (v: number) => v.toFixed(1);

  // body: overlapping strokes with round caps, inset so the ends stay inside
  // the box. They are a mask: the scrambled picture shows through them.
  const sw = Math.max(h / 5, 2);
  const rows = Math.max(3, Math.ceil((h - sw) / (sw * 0.55)) + 1);
  let body = '';
  for (let i = 0; i < rows; i++) {
    const ly = y + sw / 2 + ((h - sw) * i) / (rows - 1);
    const x1 = x + sw / 2 + rnd() * w * 0.03;
    const x2 = x + w - sw / 2 - rnd() * w * 0.03;
    const bend = (rnd() - 0.5) * sw * 0.5;
    body += `<path d="M${f(x1)} ${f(ly)} Q${f((x1 + x2) / 2)} ${f(ly + bend)} ${f(x2)} ${f(ly)}" stroke="#fff" stroke-width="${f(sw)}"/>`;
  }

  // scratches: grey dashes darting along the strokes. Each one jumps between
  // random offsets with eased moves, at its own speed and start time.
  let scratches = '';
  const n = Math.max(6, Math.round(h / (sw * 0.5)));
  for (let i = 0; i < n; i++) {
    const t = sw * (0.08 + rnd() * 0.2);
    const ly = y + sw / 2 + rnd() * (h - sw);
    const x1 = x + sw / 2;
    const x2 = x + w - sw / 2;
    const len = x2 - x1;
    const dash = len * (0.08 + rnd() * 0.3);
    const gap = len * (0.3 + rnd() * 0.7);
    const shade = 90 + Math.round(rnd() * 130);
    const steps = 4 + Math.floor(rnd() * 4);
    const values = Array.from({ length: steps }, (_, k) => (k === 0 ? 0 : (rnd() - 0.5) * 2.4 * (dash + gap)));
    values.push(0);
    const dur = (0.35 + rnd() * 0.6).toFixed(2);
    const tilt = (rnd() - 0.5) * sw * 0.8;
    const splines = Array.from({ length: steps }, () => '0.6 0 0.4 1').join(';');
    scratches += `<path d="M${f(x1)} ${f(ly)} L${f(x2)} ${f(ly + tilt)}" stroke="rgb(${shade},${shade},${shade})" stroke-opacity="${(0.35 + rnd() * 0.45).toFixed(2)}" stroke-width="${f(t)}" stroke-dasharray="${f(dash)} ${f(gap)}"><animate attributeName="stroke-dashoffset" values="${values.map(f).join(';')}" calcMode="spline" keySplines="${splines}" dur="${dur}s" begin="-${(rnd() * 2).toFixed(2)}s" repeatCount="indefinite"/></path>`;
  }

  const mask = `${scope}mask${salt}`;
  return `<g id="${id}" class="censor-scribble" fill="none" stroke-linecap="round"><mask id="${mask}"><g${tf}>${body}</g></mask><use href="#${scope}img" mask="url(#${mask})" filter="url(#${scope}smear)"/><g${tf}>${scratches}</g></g>`;
}

function prepare(raw: string, scope: string, cover: boolean) {
  const width = Number(raw.match(/viewBox="[\d.\s-]*?\s([\d.]+)\s[\d.]+"/)?.[1] ?? 2000);
  // Illustrator names its classes cls-1, cls-2, ... in every file; once inlined
  // they would apply page-wide, so each picture gets its own prefix.
  let s = raw.replace(/<\?xml[^>]*>/, '').replace(/\bcls-/g, `${scope}cls-`);
  if (cover) s = s.replace(/<svg\b/, '<svg preserveAspectRatio="xMidYMid slice"');
  s = s.replace(/<image\b/, `<image id="${scope}img"`);

  // smear: rows torn sideways by banded noise that keeps drifting, then
  // blurred hard, so only colours of the face remain
  const smear = `<filter id="${scope}smear" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="${(1 / width).toFixed(5)} ${(60 / width).toFixed(4)}" numOctaves="3" seed="2" result="n"/>
<feOffset in="n" dy="0" result="o"><animate attributeName="dy" values="0;${(width * 0.3).toFixed(0)}" dur="0.8s" repeatCount="indefinite"/></feOffset>
<feDisplacementMap in="SourceGraphic" in2="o" scale="${(width * 0.25).toFixed(0)}" xChannelSelector="R" yChannelSelector="B" result="d"/>
<feGaussianBlur in="d" stdDeviation="${(width * 0.012).toFixed(1)} ${(width * 0.002).toFixed(1)}"/>
</filter>`;

  let n = 0;
  s = s.replace(CENSOR, (_m, before: string, id: string, after: string) => scribble(`${before} ${after}`, id, n++, scope));
  return s.replace(/(<svg\b[^>]*>)/, `$1<defs>${smear}</defs>`);
}

export default function Picture({
  src,
  alt,
  censored,
  cover = false,
}: {
  src?: string;
  alt: string;
  censored: boolean;
  cover?: boolean; // fill the frame and crop, like object-fit: cover
}) {
  const svg = !!src && /\.svg($|\?)/.test(src);
  const [markup, setMarkup] = useState('');
  const scope = `pic${useId().replace(/[^\w-]/g, '')}-`;

  useEffect(() => {
    if (!svg || !src) return;
    let alive = true;
    load(src).then((t) => alive && setMarkup(prepare(t, scope, cover)));
    return () => {
      alive = false;
    };
  }, [svg, src, scope, cover]);

  if (!svg) return <img src={src} alt={alt} loading="lazy" />;
  return (
    <span
      className={`picture${censored ? '' : ' uncensored'}`}
      role="img"
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
