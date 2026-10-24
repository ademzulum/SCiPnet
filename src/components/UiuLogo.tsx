import raw from '../../images/uiu_terminal/uiu_logo.svg?raw';
import url from '../../images/uiu_terminal/uiu_logo.svg?url';

// The UIU seal, inlined so its named groups (outer_ring, illuminati, eagle with
// wing_left/wing_right, sword, compass, unusual, incidents, unit, stars) can be
// animated in CSS. White fills/strokes become currentColor so the seal follows
// the theme. The file URL doubles as a mask for the metallic shine sweep.
// The compass sits in a group clipped to the inner ring, so while it slides in
// from the outline it only shows inside the seal.
const clip = '<clipPath id="seal-inner"><circle cx="119.47" cy="119.44" r="98"/></clipPath>';
const svg = raw
  .replace(/<\?xml[^>]*\?>/, '')
  .replace(/#fff\b/g, 'currentColor')
  .replace('</defs>', `${clip}</defs>`)
  .replace(/<g id="compass">[\s\S]*?<\/g>/, (g) => `<g clip-path="url(#seal-inner)">${g}</g>`);

export default function UiuLogo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`uiu-logo ${className}`}
      aria-label="Unusual Incidents Unit"
      style={{ '--seal-mask': `url("${url}")` } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
