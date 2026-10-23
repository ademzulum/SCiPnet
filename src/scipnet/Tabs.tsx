import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&';

// Label that briefly decodes itself from random glyphs on hover.
function Decode({ text }: { text: string }) {
  const [out, setOut] = useState(text);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const run = () => {
    clearInterval(timer.current);
    let f = 0;
    timer.current = setInterval(() => {
      f++;
      const shown = Math.floor((f / 8) * text.length);
      setOut(
        [...text].map((c, i) => (i < shown || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(''),
      );
      if (shown >= text.length) clearInterval(timer.current);
    }, 28);
  };
  return <span onMouseEnter={run}>{out}</span>;
}

// Segmented tab bar with a sliding highlight and arrow-key navigation.
export default function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly T[];
  value: T;
  onChange: (t: T) => void;
}) {
  const group = useId();
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.indexOf(value);
    if (e.key === 'ArrowRight') onChange(tabs[(i + 1) % tabs.length]);
    if (e.key === 'ArrowLeft') onChange(tabs[(i - 1 + tabs.length) % tabs.length]);
  };
  return (
    <div className="tabs" role="tablist" onKeyDown={onKey}>
      {tabs.map((t, i) => (
        <button
          key={t}
          role="tab"
          aria-selected={value === t}
          tabIndex={value === t ? 0 : -1}
          className={value === t ? 'active' : ''}
          onClick={() => onChange(t)}
        >
          {value === t && (
            <motion.span
              layoutId={`tab-${group}`}
              className="tab-pill"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="tab-index">{String(i + 1).padStart(2, '0')}</span>
          <Decode text={t} />
        </button>
      ))}
    </div>
  );
}
