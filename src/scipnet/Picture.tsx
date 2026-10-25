import { useEffect, useId, useState } from 'react';

// Image that can be censored. SVGs are fetched and inlined so their "censor"
// elements (the black bars) can be hidden with CSS when `censored` is false;
// other formats render as a plain <img>.
const cache = new Map<string, Promise<string>>();
const load = (src: string) => {
  if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.text()));
  return cache.get(src)!;
};

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
      (t) => alive && setMarkup(t.replace(/<\?xml[^>]*>/, '').replace(/\bcls-/g, `${scope}cls-`)),
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
