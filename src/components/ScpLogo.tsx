// Simplified Foundation emblem: outer ring, inner ring, three inward arrows.
export default function ScpLogo({ size = 120 }: { size?: number }) {
  const arrow = (
    <g>
      <line x1="0" y1="-49" x2="0" y2="-23" stroke="var(--bg)" strokeWidth="16" />
      <line x1="0" y1="-49" x2="0" y2="-24" stroke="currentColor" strokeWidth="6" />
      <polyline points="-9,-32 0,-22 9,-32" fill="none" stroke="currentColor" strokeWidth="6" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="-52 -52 104 104" aria-label="SCP Foundation">
      <circle r="40" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle r="15" fill="none" stroke="currentColor" strokeWidth="6" />
      {[0, 120, 240].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          {arrow}
        </g>
      ))}
    </svg>
  );
}
