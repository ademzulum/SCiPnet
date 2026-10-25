import { useEffect, useId, useState } from 'react';

// Image that can be censored. SVGs are fetched and inlined so their "censor"
// elements (the black bars) can be hidden with CSS when `censored` is false;
// other formats render as a plain <img>.
const cache = new Map<string, Promise<string>>();
const load = (src: string) => {
  if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.text()));
  return cache.get(src)!;
};

// Fill for the censor bars: black with grey scratch strokes that keep jumping
// around (pattern offset and noise seed step a few times a second), so the
// bar looks like it is being scrambled. Greys only. Same ids in every
// picture; the copies are identical, so whichever one resolves is fine.
const SCRATCH = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let lines = '';
  for (let i = 0; i < 30; i++) {
    const y = rnd() * 40;
    const tilt = (rnd() - 0.5) * 10;
    const shade = 30 + Math.round(rnd() * 110);
    const dash = rnd() < 0.5 ? ` stroke-dasharray="${(4 + rnd() * 30).toFixed(0)} ${(2 + rnd() * 12).toFixed(0)}"` : '';
    lines += `<path d="M${(-10 + rnd() * 20).toFixed(1)} ${y.toFixed(1)} Q60 ${(y + tilt).toFixed(1)} ${(110 + rnd() * 20).toFixed(1)} ${(y - tilt / 2).toFixed(1)}" stroke="rgb(${shade},${shade},${shade})" stroke-width="${(0.3 + rnd() * 1.6).toFixed(2)}"${dash} fill="none"/>`;
  }
  const jumps = Array.from({ length: 9 }, () => `${Math.round(rnd() * 120)} ${Math.round(rnd() * 40)}`).join(';');
  return `<defs>
<pattern id="censor-scratch" width="120" height="40" patternUnits="userSpaceOnUse"><rect width="120" height="40" fill="#070707"/>${lines}<animateTransform attributeName="patternTransform" type="translate" values="${jumps}" dur="0.9s" calcMode="discrete" repeatCount="indefinite"/></pattern>
<filter id="censor-rough" x="-5%" y="-30%" width="110%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.3" numOctaves="2" seed="1"><animate attributeName="seed" values="1;4;9;2;7;5" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="8" xChannelSelector="R" yChannelSelector="G"/></filter>
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
