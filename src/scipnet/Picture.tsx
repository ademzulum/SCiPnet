import { useEffect, useId, useState } from 'react';

// Image that can be censored. SVGs are fetched and inlined; each element whose
// id starts with "censor" only marks an area. That area shows the picture
// itself cut into thin horizontal lines that slide sideways, like a scrambled
// signal. The Administrator (censored = false) sees the plain picture.
// Other formats render as a plain <img>.
const cache = new Map<string, Promise<string>>();
const load = (src: string) => {
  if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.text()));
  return cache.get(src)!;
};

const CENSOR = /<(rect|path|polygon|ellipse|circle)\b([^>]*?)\sid="(censor[^"]*)"([^>]*?)\/?>(?:<\/\1>)?/g;

function prepare(raw: string, scope: string, cover: boolean) {
  const width = Number(raw.match(/viewBox="[\d.\s-]*?\s([\d.]+)\s[\d.]+"/)?.[1] ?? 2000);
  // Illustrator names its classes cls-1, cls-2, ... in every file; once inlined
  // they would apply page-wide, so each picture gets its own prefix.
  let s = raw.replace(/<\?xml[^>]*>/, '').replace(/\bcls-/g, `${scope}cls-`);
  if (cover) s = s.replace(/<svg\b/, '<svg preserveAspectRatio="xMidYMid slice"');
  s = s.replace(/<image\b/, `<image id="${scope}img"`);

  // Bands vary only along y (baseFrequency 0 in x), so the displacement moves
  // whole rows sideways. Scrolling the noise down makes the rows drift.
  const shift = (width * 0.06).toFixed(1);
  const filter = `<filter id="${scope}scramble" x="-10%" y="-60%" width="120%" height="220%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0 ${(14 / width).toFixed(4)}" numOctaves="2" seed="4" result="n"/>
<feOffset in="n" dy="0" result="o"><animate attributeName="dy" values="0;${(width * 0.4).toFixed(0)}" dur="6s" repeatCount="indefinite"/></feOffset>
<feColorMatrix in="o" type="matrix" values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1" result="m"/>
<feDisplacementMap in="SourceGraphic" in2="m" scale="${shift}" xChannelSelector="R" yChannelSelector="G"/>
</filter>`;

  let n = 0;
  s = s.replace(CENSOR, (_m, tag: string, before: string, id: string, after: string) => {
    const attrs = `${before}${after}`.replace(/\sclass="[^"]*"/, '');
    const clip = `${scope}clip${n++}`;
    return `<g id="${id}" class="censor-scramble"><clipPath id="${clip}"><${tag}${attrs}/></clipPath><use href="#${scope}img" clip-path="url(#${clip})" filter="url(#${scope}scramble)"/></g>`;
  });
  return s.replace(/(<svg\b[^>]*>)/, `$1<defs>${filter}</defs>`);
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
