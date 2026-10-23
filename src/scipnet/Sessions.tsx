import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { STOLEN } from '../lib/creds';
import { initials } from './Comms';
import { Corrupt } from './Admin';
import { useAdminUnlocked } from './session';

// Header user chip with a drop-down. "Der Administrator" is listed as a
// distorted entry that opens the signal puzzle; once solved it is a normal
// entry that opens the Administrator file.
export default function Sessions({ disabled, onAdmin }: { disabled: boolean; onAdmin: () => void }) {
  const solved = useAdminUnlocked();
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
        <span className="avatar">{initials(STOLEN.name)}</span>
        <div>
          <strong>{STOLEN.name}</strong>
          <span className="badge">{STOLEN.clearance}</span>
        </div>
        <span className={`chevron${open ? ' up' : ''}`} aria-hidden>
          ▾
        </span>
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
                className={solved ? 'session-item admin-solved' : 'session-item admin-session'}
                onClick={() => {
                  setOpen(false);
                  onAdmin();
                }}
              >
                <span className={solved ? 'avatar' : 'avatar ghost'}>
                  {solved ? 'DA' : <Corrupt text="??" amount={0.6} every={180} />}
                </span>
                <span className="notify-text">
                  <strong>{solved ? 'Der Administrator' : <Corrupt text="Der Administrator" amount={0.1} every={200} />}</strong>
                  <span className="dim small">
                    {solved ? 'Stufe 6 · Akte lesbar' : <Corrupt text="Ursprung unbekannt · Stufe 6" amount={0.15} every={300} />}
                  </span>
                </span>
                <span className="lock">{solved ? 'AKTE' : 'SIGNAL'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
