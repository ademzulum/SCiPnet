import { useEffect, useId, useState } from 'react';

// Image that can be censored. SVGs are fetched and inlined; each rect whose id
// starts with "censor" only marks an area. It is redrawn as a felt-tip
// scribble: dense dark strokes with round ends that stay inside the box, and
// thin grey scratches that keep running along them. The Administrator
// (censored = false) sees the plain picture. Other formats render as <img>.
const cache = new Map<string, Promise<string>>();
const load = (src: string) => {
  if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.text()));
  return cache.get(src)!;
};

const CENSOR = /<rect\b([^>]*?)\sid="(censor[^"]*)"([^>]*?)\/?>(?:<\/rect>)?/g;
const attr = (a: string, name: string) => a.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

function scribble(attrs: string, id: string, salt: number) {
  const x = Number(attr(attrs, 'x') ?? 0);
  const y = Number(attr(attrs, 'y') ?? 0);
  const w = Number(attr(attrs, 'width') ?? 0);
  const h = Number(attr(attrs, 'height') ?? 0);
  const transform = attr(attrs, 'transform');
  let seed = 9 + salt * 31;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const f = (v: number) => v.toFixed(1);

  // body: strokes overlap, so nothing shows through; round caps keep the ends
  // inside the box (each line is inset by half its width plus a random bit)
  const sw = Math.max(h / 5, 2);
  const rows = Math.max(3, Math.ceil((h - sw) / (sw * 0.55)) + 1);
  let body = '';
  for (let i = 0; i < rows; i++) {
    const ly = y + sw / 2 + ((h - sw) * i) / (rows - 1);
    const x1 = x + sw / 2 + rnd() * w * 0.03;
    const x2 = x + w - sw / 2 - rnd() * w * 0.03;
    const bend = (rnd() - 0.5) * sw * 0.5;
    const shade = 8 + Math.round(rnd() * 18);
    body += `<path d="M${f(x1)} ${f(ly)} Q${f((x1 + x2) / 2)} ${f(ly + bend)} ${f(x2)} ${f(ly)}" stroke="rgb(${shade},${shade},${shade})" stroke-width="${f(sw)}"/>`;
  }

  // scratches: short grey dashes sliding along the body, each at its own speed
  let scratches = '';
  const n = Math.max(4, Math.round(h / (sw * 0.7)));
  for (let i = 0; i < n; i++) {
    const t = sw * (0.12 + rnd() * 0.18);
    const ly = y + sw / 2 + rnd() * (h - sw);
    const x1 = x + sw / 2;
    const x2 = x + w - sw / 2;
    const len = x2 - x1;
    const dash = len * (0.15 + rnd() * 0.35);
    const gap = len * (0.4 + rnd() * 0.6);
    const shade = 70 + Math.round(rnd() * 90);
    const dir = rnd() < 0.5 ? -1 : 1;
    const dur = (0.9 + rnd() * 1.6).toFixed(2);
    const tilt = (rnd() - 0.5) * sw * 0.8;
    scratches += `<path d="M${f(x1)} ${f(ly)} L${f(x2)} ${f(ly + tilt)}" stroke="rgb(${shade},${shade},${shade})" stroke-opacity="0.7" stroke-width="${f(t)}" stroke-dasharray="${f(dash)} ${f(gap)}"><animate attributeName="stroke-dashoffset" from="0" to="${f(dir * (dash + gap))}" dur="${dur}s" repeatCount="indefinite"/></path>`;
  }

  return `<g id="${id}" class="censor-scribble"${transform ? ` transform="${transform}"` : ''} fill="none" stroke-linecap="round">${body}${scratches}</g>`;
}

function prepare(raw: string, scope: string, cover: boolean) {
  // Illustrator names its classes cls-1, cls-2, ... in every file; once inlined
  // they would apply page-wide, so each picture gets its own prefix.
  let s = raw.replace(/<\?xml[^>]*>/, '').replace(/\bcls-/g, `${scope}cls-`);
  if (cover) s = s.replace(/<svg\b/, '<svg preserveAspectRatio="xMidYMid slice"');
  let n = 0;
  return s.replace(CENSOR, (_m, before: string, id: string, after: string) => scribble(`${before} ${after}`, id, n++));
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
