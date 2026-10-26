// The site's one level meter: a row of small pips, the first n lit in the
// colour of --st (personnel clearance, SCP file clearance, GoI threat).
export default function Pips({ n, of, title }: { n: number; of: number; title?: string }) {
  return (
    <span className="pips" title={title} aria-hidden={!title}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < n ? 'pip on' : 'pip'} />
      ))}
    </span>
  );
}

// A clearance or level as a pill in the level's colour: pips plus a label.
// Used by every list card (SCP files, personnel).
export function LevelPill({ n, of, label, title }: { n: number; of: number; label: string; title?: string }) {
  return (
    <span className={`level-pill lvl-${Math.min(n, 6)}`} title={title}>
      <Pips n={n} of={of} />
      {label}
    </span>
  );
}
