import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ACCOUNTS, type Account } from '../lib/creds';
import { initials } from './Comms';
import { photoUrl } from '../data/photos';

const maynardPhoto = photoUrl('duncan_maynard');
import { Corrupt } from './Admin';
import { adminLogout, switchAccount, useAccount, useAdminSession, useO5Unlocked } from './session';

// Header user chip with a drop-down of the sessions. "O5-13" is a distorted
// entry that opens the signal puzzle, "Der Administrator" one that opens the
// real login; once open, picking an entry switches the active account.
// Maynard has an ID photo; the others keep their initials.
const Avatar = ({ id, name }: { id: Account; name: string }) => (
  <span className="avatar">{id === 'maynard' ? <img src={maynardPhoto} alt="" /> : initials(name)}</span>
);

export default function Sessions({ disabled, onO5, onAdmin }: { disabled: boolean; onO5: () => void; onAdmin: () => void }) {
  const solved = useO5Unlocked();
  const adminIn = useAdminSession();
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
              <span className="dim small">{1 + Number(solved) + Number(adminIn)}</span>
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
              {/* O5-13 opens with the signal puzzle, the Administrator with the
                  real login; both stay distorted until then */}
              {[
                { id: 'o5' as const, open: solved, hint: 'Ursprung unbekannt · Stufe 5', lock: 'SIGNAL', start: onO5 },
                { id: 'admin' as const, open: adminIn, hint: 'Gesicherte Anmeldung · Stufe 6', lock: 'LOGIN', start: onAdmin },
              ].map(({ id, open: ok, hint, lock, start }) =>
                ok ? (
                  <button key={id} className={`session-item admin-solved${me.id === id ? ' current' : ''}`} onClick={() => pick(id)}>
                    <Avatar id={id} name={ACCOUNTS[id].name} />
                    <span className="notify-text">
                      <strong>{ACCOUNTS[id].name}</strong>
                      <span className="dim small">
                        {ACCOUNTS[id].user} · {ACCOUNTS[id].clearance}
                        {me.id === id ? ' · aktiv' : ''}
                      </span>
                    </span>
                    {me.id === id ? <span className="live-dot" /> : <span className="lock">WECHSELN</span>}
                  </button>
                ) : (
                  <button
                    key={id}
                    className="session-item admin-session"
                    onClick={() => {
                      setOpen(false);
                      start();
                    }}
                  >
                    <span className="avatar ghost">
                      <Corrupt text="??" amount={0.6} every={180} />
                    </span>
                    <span className="notify-text">
                      <strong>
                        <Corrupt text={ACCOUNTS[id].name} amount={0.1} every={200} />
                      </strong>
                      <span className="dim small">
                        <Corrupt text={hint} amount={0.15} every={300} />
                      </span>
                    </span>
                    <span className="lock">{lock}</span>
                  </button>
                ),
              )}
              {adminIn && (
                <button
                  className="session-item"
                  onClick={() => {
                    setOpen(false);
                    void adminLogout();
                  }}
                >
                  <span className="notify-text">
                    <strong>Administrator abmelden</strong>
                    <span className="dim small">Beendet die gesicherte Sitzung</span>
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
