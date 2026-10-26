import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// One confirmation dialog for the whole site: askConfirm() opens it and
// resolves with the answer; <ConfirmHost /> (in Shell) draws it.
type Ask = { title: string; text: string; yes: string; no?: string; danger?: boolean };
let open: (Ask & { done: (ok: boolean) => void }) | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function askConfirm(a: Ask): Promise<boolean> {
  open?.done(false);
  return new Promise((resolve) => {
    open = {
      ...a,
      done: (ok) => {
        open = null;
        emit();
        resolve(ok);
      },
    };
    emit();
  });
}

// Pages with unsaved work register a check here; Shell asks it before leaving.
let guard: (() => boolean) | null = null;
export const setLeaveGuard = (g: (() => boolean) | null) => {
  guard = g;
};
// Resolves true when leaving is fine (nothing unsaved, or the user agreed).
export const confirmLeave = () =>
  !guard?.()
    ? Promise.resolve(true)
    : askConfirm({
        title: 'Ungespeicherte Änderungen',
        text: 'Der Eintrag hat Änderungen, die noch nicht gespeichert sind. Seite trotzdem verlassen? Die Änderungen gehen verloren.',
        yes: 'VERWERFEN',
        no: 'WEITER BEARBEITEN',
        danger: true,
      }).then((ok) => {
        if (ok) guard = null;
        return ok;
      });

export function ConfirmHost() {
  const a = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
  );
  const no = useRef<HTMLButtonElement>(null);
  useEffect(() => no.current?.focus(), [a]);
  return (
    <AnimatePresence>
      {a && (
        <motion.div
          className="admin-login-back"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && a.done(false)}
          onKeyDown={(e) => e.key === 'Escape' && a.done(false)}
        >
          <motion.div className="box admin-login confirm" role="alertdialog" aria-modal initial={{ y: 12 }} animate={{ y: 0 }} exit={{ y: 12 }}>
            <h2>{a.title}</h2>
            <p>{a.text}</p>
            <div className="admin-login-actions">
              <button ref={no} className="card action ghost" onClick={() => a.done(false)}>
                {a.no ?? 'ABBRECHEN'}
              </button>
              <button className={`card action${a.danger ? ' danger' : ''}`} onClick={() => a.done(true)}>
                {a.yes}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
