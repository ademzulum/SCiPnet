import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// A value with the text shown for it; a plain string is both.
export type Opt = string | [value: string, label: string];
export const optValue = (o: Opt) => (typeof o === 'string' ? o : o[0]);
export const optLabel = (o: Opt) => (typeof o === 'string' ? o : o[1]);

// Drop-down in the site's look, replacing the browser's <select>. Arrow keys
// move, Enter picks, Escape closes; long lists get a search field.
// `show` draws an option (in the list and on the button) instead of its label.
export default function Dropdown({
  value,
  options,
  onChange,
  empty,
  show,
}: {
  value: string;
  options: Opt[];
  onChange: (v: string) => void;
  empty?: string;
  show?: (o: Opt) => React.ReactNode;
}) {
  const draw = (o: Opt) => (show && optValue(o) ? show(o) : optLabel(o));
  const all: Opt[] = empty ? [['', empty], ...options] : options;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  // only keyboard moves scroll the list to the highlight; the pointer never does
  const byKey = useRef(false);
  const list = q ? all.filter((o) => optLabel(o).toLowerCase().includes(q.toLowerCase())) : all;
  const current = all.find((o) => optValue(o) === value);

  useEffect(() => {
    if (!open) return;
    byKey.current = true; // show the current choice
    setHi(Math.max(0, list.findIndex((o) => optValue(o) === value)));
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => {
    if (!byKey.current) return;
    byKey.current = false;
    // scroll the panel itself, never the page around it
    const panel = ref.current?.querySelector<HTMLElement>('.dd-panel');
    const opt = panel?.querySelector<HTMLElement>('.dd-opt.hi');
    if (!panel || !opt) return;
    if (opt.offsetTop < panel.scrollTop) panel.scrollTop = opt.offsetTop - 4;
    else if (opt.offsetTop + opt.offsetHeight > panel.scrollTop + panel.clientHeight) panel.scrollTop = opt.offsetTop + opt.offsetHeight - panel.clientHeight + 4;
  }, [hi, open]);

  const pick = (o: Opt) => {
    onChange(optValue(o));
    setOpen(false);
    setQ('');
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      byKey.current = true;
      setHi((h) => (h + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % Math.max(1, list.length));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (list[hi]) pick(list[hi]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className={`dd${open ? ' open' : ''}`} ref={ref} onKeyDown={key}>
      <button type="button" className="search dd-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={current && optValue(current) ? '' : 'dim'}>{current ? draw(current) : value || '–'}</span>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="dd-panel"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            {all.length > 8 && (
              <input
                className="search dd-search"
                autoFocus
                placeholder="Suchen…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setHi(0);
                }}
              />
            )}
            {list.map((o, i) => (
              <button
                key={optValue(o)}
                type="button"
                role="option"
                aria-selected={optValue(o) === value}
                className={`dd-opt${i === hi ? ' hi' : ''}${optValue(o) === value ? ' on' : ''}`}
                onPointerEnter={() => setHi(i)}
                onClick={() => pick(o)}
              >
                {draw(o)}
              </button>
            ))}
            {!list.length && <span className="dim small dd-none">Keine Treffer</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
