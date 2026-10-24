import { useEffect, useRef, useState } from 'react';
import { useAccount } from './session';
import { play } from '../lib/sound';

const GLYPHS = '█▓▒░#%&@$01';

// Renders text, turning [[...]] into a redaction bar of similar length.
// Logged in as the Administrator, a click declassifies the passage.
export default function Redacted({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[(.+?)\]\]/).map((part, i) => (i % 2 ? <Bar key={i} secret={part} /> : part))}
    </>
  );
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
