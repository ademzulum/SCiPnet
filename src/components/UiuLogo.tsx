import raw from '../../images/uiu_logo.svg?raw';

// The UIU seal, inlined so its named groups (outer_ring, illuminati, eagle,
// sword, compass, unusual, incidents, unit, stars) can be animated in CSS.
// White fills/strokes become currentColor so the seal follows the theme.
const svg = raw.replace(/<\?xml[^>]*\?>/, '').replace(/#fff\b/g, 'currentColor');

export default function UiuLogo({ className = '' }: { className?: string }) {
  return <div className={`uiu-logo ${className}`} aria-label="Unusual Incidents Unit" dangerouslySetInnerHTML={{ __html: svg }} />;
}
