import { useEffect, useId, useState } from 'react';

// Image that can be censored. SVGs are fetched and inlined so their "censor"
// elements (the black bars) can be hidden with CSS when `censored` is false;
// other formats render as a plain <img>.
const cache = new Map<string, Promise<string>>();
const load = (src: string) => {
  if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.text()));
  return cache.get(src)!;
};

// Fill for the censor bars: black, scratched over with uneven strokes like a
// felt-tip pen, and a filter that roughens the edges. Same ids in every
// picture; the copies are identical, so whichever one resolves is fine.
const SCRATCH = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let lines = '';
  for (let i = 0; i < 26; i++) {
    const y = rnd() * 40;
    const tilt = (rnd() - 0.5) * 8;
    const shade = 18 + Math.round(rnd() * 34);
    lines += `<path d="M${(-10 + rnd() * 20).toFixed(1)} ${y.toFixed(1)} Q60 ${(y + tilt).toFixed(1)} ${(110 + rnd() * 20).toFixed(1)} ${(y - tilt / 2).toFixed(1)}" stroke="rgb(${shade},${shade},${shade})" stroke-width="${(0.4 + rnd() * 1.8).toFixed(2)}" fill="none" stroke-linecap="round"/>`;
  }
  return `<defs>
<pattern id="censor-scratch" width="120" height="40" patternUnits="userSpaceOnUse"><rect width="120" height="40" fill="#070707"/>${lines}</pattern>
<filter id="censor-rough" x="-5%" y="-30%" width="110%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>
</defs>`;
})();

export default function Picture({ src, alt, censored }: { src?: string; alt: string; censored: boolean }) {
  const svg = !!src && /\.svg($|\?)/.test(src);
  const [markup, setMarkup] = useState('');
  // Illustrator names its classes cls-1, cls-2, ... in every file; once inlined
  // they would apply page-wide, so each picture gets its own prefix.
  const scope = `pic${useId().replace(/[^\w-]/g, '')}-`;

  useEffect(() => {
    if (!svg || !src) return;
    let alive = true;
    load(src).then(
      (t) =>
        alive &&
        setMarkup(
          t
            .replace(/<\?xml[^>]*>/, '')
            .replace(/\bcls-/g, `${scope}cls-`)
            .replace(/(<svg[^>]*>)/, `$1${SCRATCH}`),
        ),
    );
    return () => {
      alive = false;
    };
  }, [svg, src, scope]);

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
