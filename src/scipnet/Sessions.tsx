import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ACCOUNTS, type Account } from '../lib/creds';
import { initials } from './Comms';
import { photoUrl } from '../data/photos';

const maynardPhoto = photoUrl('duncan_maynard');
import { Corrupt } from './Admin';
import { switchAccount, useAccount, useAdminUnlocked } from './session';

// Header user chip with a drop-down of both sessions. "Der Administrator" is a
// distorted entry that opens the signal puzzle; once solved, picking an entry
// switches the active account.
// Maynard has an ID photo; the Administrator keeps his initials.
const Avatar = ({ id, name }: { id: Account; name: string }) => (
  <span className="avatar">{id === 'maynard' ? <img src={maynardPhoto} alt="" /> : initials(name)}</span>
);

export default function Sessions({ disabled, onAdmin }: { disabled: boolean; onAdmin: () => void }) {
  const solved = useAdminUnlocked();
  const me = useAccount();
  const pick = (a: Account) => {
    setOpen(false);
    if (a !== me.id) switchAccount(a);
  };
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
        <Avatar id={me.id} name={me.name} />
        <div>
          <strong>{me.name}</strong>
          <span className="badge">{me.clearance}</span>
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
              <button className={`session-item${me.id === 'maynard' ? ' current' : ''}`} onClick={() => pick('maynard')}>
                <Avatar id="maynard" name={ACCOUNTS.maynard.name} />
                <span className="notify-text">
                  <strong>{ACCOUNTS.maynard.name}</strong>
                  <span className="dim small">
                    {ACCOUNTS.maynard.user} · {ACCOUNTS.maynard.clearance}
                    {me.id === 'maynard' ? ' · aktiv' : ''}
                  </span>
                </span>
                {me.id === 'maynard' ? <span className="live-dot" /> : <span className="lock">WECHSELN</span>}
              </button>
              {solved ? (
                <button className={`session-item admin-solved${me.id === 'admin' ? ' current' : ''}`} onClick={() => pick('admin')}>
                  <span className="avatar">DA</span>
                  <span className="notify-text">
                    <strong>{ACCOUNTS.admin.name}</strong>
                    <span className="dim small">
                      {ACCOUNTS.admin.user} · {ACCOUNTS.admin.clearance}
                      {me.id === 'admin' ? ' · aktiv' : ''}
                    </span>
                  </span>
                  {me.id === 'admin' ? <span className="live-dot" /> : <span className="lock">WECHSELN</span>}
                </button>
              ) : (
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
                  <span className="lock">SIGNAL</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
