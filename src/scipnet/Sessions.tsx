import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { STOLEN } from '../lib/creds';
import { initials } from './Comms';
import { Corrupt } from './Admin';

// Header user chip. A second, glitching session ("Der Administrator") hangs
// off it; picking that session starts the brute-force minigame.
export default function Sessions({ disabled, onAdmin }: { disabled: boolean; onAdmin: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div className="sessions" ref={ref}>
      <button className={`hdr-user${open ? ' open' : ''}`} onClick={() => setOpen((o) => !o)} disabled={disabled}>
        <span className="avatar-stack">
          <span className="avatar">{initials(STOLEN.name)}</span>
          <span className="avatar ghost" aria-hidden>
            <Corrupt text="A" amount={0.5} every={260} />
          </span>
        </span>
        <div>
          <strong>{STOLEN.name}</strong>
          <span className="badge">{STOLEN.clearance}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notify-panel sessions-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div className="notify-head">
              <span className="label">Aktive Sitzungen</span>
              <span className="dim small">2</span>
            </div>
            <div className="notify-list">
              <div className="session-item current">
                <span className="avatar">{initials(STOLEN.name)}</span>
                <span className="notify-text">
                  <strong>{STOLEN.name}</strong>
                  <span className="dim small">
                    {STOLEN.user} · {STOLEN.clearance} · diese Sitzung
                  </span>
                </span>
                <span className="live-dot" />
              </div>
              <button
                className="session-item admin-session"
                onClick={() => {
                  setOpen(false);
                  onAdmin();
                }}
              >
                <span className="avatar ghost">
                  <Corrupt text="??" amount={0.6} every={180} />
                </span>
                <span className="notify-text">
                  <strong>
                    <Corrupt text="Der Administrator" amount={0.1} every={200} />
                  </strong>
                  <span className="dim small">
                    <Corrupt text="Ursprung unbekannt · Stufe 6" amount={0.15} every={300} />
                  </span>
                </span>
                <span className="lock">VERBINDEN</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
