import raw from '../../images/uiu_logo.svg?raw';
import url from '../../images/uiu_logo.svg?url';

// The UIU seal, inlined so its named groups (outer_ring, illuminati, eagle with
// wing_left/wing_right, sword, compass, unusual, incidents, unit, stars) can be
// animated in CSS. White fills/strokes become currentColor so the seal follows
// the theme. The file URL doubles as a mask for the metallic shine sweep.
const svg = raw.replace(/<\?xml[^>]*\?>/, '').replace(/#fff\b/g, 'currentColor');

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
