import { useEffect, useRef, useState } from 'react';
import { useAccount } from './session';
import { play } from '../lib/sound';
import { useEntityLinks } from './EntityLinks';

const GLYPHS = '█▓▒░#%&@$01';

// Punctuation that must stay on the same line as the bar next to it.
const CLOSE = /^[.,;:!?…)\]»“”"'’%-]+/;
const OPEN = /[(\[„«"'‚]+$/;

// Renders text, turning [[...]] into a redaction bar of similar length.
// Logged in as the Administrator, a click declassifies the passage.
// Each bar is glued to the punctuation around it ("[[x]]." or "([[x]])"), so
// a line never breaks between the bar and a full stop or bracket.
// Names of entries with their own page (Groups of Interest) become links.
export default function Redacted({ text }: { text: string }) {
  const link = useEntityLinks();
  const parts = text.split(/\[\[(.+?)\]\]/);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      out.push(parts[i]);
      continue;
    }
    const before = (out.pop() as string) ?? '';
    const open = before.match(OPEN)?.[0] ?? '';
    const close = parts[i + 1].match(CLOSE)?.[0] ?? '';
    parts[i + 1] = parts[i + 1].slice(close.length);
    out.push(
      before.slice(0, before.length - open.length),
      <span key={i} className="redact-glue">
        {open}
        <Bar secret={parts[i]} />
        {close}
      </span>,
    );
  }
  // One inline wrapper: inside a flex or grid parent, loose text and bars would
  // each become their own item and break onto separate lines.
  return <span className="redacted-text">{out.flatMap((o, i) => (typeof o === 'string' ? link(o, i) : [o]))}</span>;
}

function Bar({ secret }: { secret: string }) {
  const admin = useAccount().id === 'admin';
  const [shown, setShown] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);

  const reveal = () => {
    if (shown !== null) return;
    if (!admin) {
      play('negative', 0.6);
      setDenied(true);
      setTimeout(() => setDenied(false), 500);
      return;
    }
    play('click', 0.5);
    // decrypt from left to right, scrambling the rest
    let n = 0;
    timer.current = setInterval(() => {
      n++;
      const done = Math.floor(n / 2);
      setShown(
        secret
          .split('')
          .map((c, j) => (j < done || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(''),
      );
      if (done >= secret.length) clearInterval(timer.current);
    }, 28);
  };

  if (shown !== null)
    return (
      <span className="declassified" title="Freigegeben durch den Administrator">
        {shown}
      </span>
    );
  return (
    <span
      className={`redact${admin ? ' can-reveal' : ''}${denied ? ' denied' : ''}`}
      title={admin ? 'Schwärzung aufheben' : 'Geschwärzt'}
      role="button"
      tabIndex={0}
      onClick={reveal}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), reveal())}
    >
      {'█'.repeat(Math.max(4, secret.length))}
    </span>
  );
}
