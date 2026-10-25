import raw from '../../images/scipnet_terminal/scipnet_logo.svg?raw';

// SCiPnet emblem. The SVG is black with white detail shapes (class cls-1).
// It is used as a CSS mask with those details made transparent, and the mask
// is filled with the theme's text colour: white on the dark screen, black in
// light mode. No invert filter or blend mode, which used to make the logo
// shift whenever something around it animated.
export const LOGO_MASK = `data:image/svg+xml,${encodeURIComponent(
  raw.replace(/<metadata>[\s\S]*?<\/metadata>/, '').replace(/fill:\s*#fff/i, 'fill: transparent'),
)}`;

export default function ScpLogo({ size = 120 }: { size?: number }) {
  return (
    <span
      className="scp-logo"
      role="img"
      aria-label="SCiPnet"
      style={{ width: size, height: size, '--logo': `url("${LOGO_MASK}")` } as React.CSSProperties}
    />
  );
}
