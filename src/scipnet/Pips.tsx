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
