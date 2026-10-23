import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { THREADS } from '../data/threads';
import { personById } from '../data/personnel';
import { play } from '../lib/sound';
import { threadState } from './session';
import type { Go, Route } from './routes';

// Site notifications: one for an unread message shortly after login, then
// random site events every 30-70 s. Each shows as a toast and is kept in the
// bell panel in the header.

export type Level = 'info' | 'warn' | 'alert' | 'msg';
export type Notice = {
  id: number;
  level: Level;
  title: string;
  text: string;
  time: string;
  route?: Route;
  read: boolean;
};

type Template = Omit<Notice, 'id' | 'time' | 'read'>;

const POOL: Template[] = [
  { level: 'info', title: 'SCP-8002', text: 'Der Kuckuck hat gerufen. Seismik-Team informiert.', route: { view: 'scp', id: 'SCP-8002' } },
  { level: 'warn', title: 'Archiv 7', text: 'Zugriffsversuch ohne Filter abgewiesen.', route: { view: 'scp', id: 'SCP-8007' } },
  { level: 'info', title: 'Wartung', text: 'SCiPnet-Wartung heute von 02:00 bis 03:00 Uhr.' },
  { level: 'warn', title: 'SCP-8041', text: 'Pulsintervall um 3 Minuten verkürzt. Wassertemperatur prüfen.', route: { view: 'scp', id: 'SCP-8041' } },
  { level: 'info', title: 'Feldbericht', text: 'FB-80-2026-031 wurde aktualisiert.', route: { view: 'report', id: 'FB-80-2026-031' } },
  { level: 'alert', title: 'Sicherheit', text: 'Ungewöhnliche Anmeldung erkannt. RAISA prüft.' },
  { level: 'info', title: 'Zelle 14-B', text: 'Kamera 3 meldet kurzzeitigen Bildausfall.', route: { view: 'scp', id: 'SCP-8019' } },
  { level: 'warn', title: 'Personal', text: 'Dr. Reyes hat das Gelände betreten. Status: beurlaubt.', route: { view: 'person', id: 'P-80-0588' } },
  { level: 'info', title: 'Kantine', text: 'Heute: Eintopf. Bitte nicht mit SCP-8041 in Verbindung bringen.' },
];

const clock = () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const ICON: Record<Level, string> = { info: 'i', warn: '!', alert: '⚠', msg: '✉' };

export function useNotifications(paused: boolean) {
  const [items, setItems] = useState<Notice[]>([]);
  const [toast, setToast] = useState<Notice | null>(null);
  const nextId = useRef(1);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const push = (t: Template) => {
    if (pausedRef.current) return;
    const n: Notice = { ...t, id: nextId.current++, time: clock(), read: false };
    setItems((l) => [n, ...l].slice(0, 30));
    setToast(n);
    play('notify', 0.7);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToast(null), 6000);
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const unread = THREADS.find((t) => threadState.isNew(t.id));
    if (unread)
      timers.push(
        setTimeout(
          () =>
            push({
              level: 'msg',
              title: personById(unread.contact)?.name ?? 'Neue Nachricht',
              text: unread.subject,
              route: { view: 'thread', id: unread.id },
            }),
          3500,
        ),
      );
    let bag = [...POOL].sort(() => Math.random() - 0.5);
    const loop = () => {
      timers.push(
        setTimeout(() => {
          if (!bag.length) bag = [...POOL].sort(() => Math.random() - 0.5);
          push(bag.pop()!);
          loop();
        }, 30000 + Math.random() * 40000),
      );
    };
    loop();
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(hideTimer.current);
    };
  }, []);

  return {
    items,
    toast,
    unread: items.filter((n) => !n.read).length,
    dismiss: () => setToast(null),
    markRead: (id: number) => setItems((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))),
    markAll: () => setItems((l) => l.map((n) => ({ ...n, read: true }))),
    clear: () => setItems([]),
  };
}

type Api = ReturnType<typeof useNotifications>;

export function Toast({ api, go, hidden }: { api: Api; go: Go; hidden: boolean }) {
  const n = api.toast;
  return (
    <AnimatePresence>
      {n && !hidden && (
        <motion.button
          key={n.id}
          className={`toast lvl-${n.level}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          onClick={() => {
            api.dismiss();
            api.markRead(n.id);
            if (n.route) go(n.route);
          }}
        >
          <span className="notice-icon">{ICON[n.level]}</span>
          <span>
            <span className="label">{n.level === 'msg' ? 'Neue Nachricht' : n.title}</span>
            <strong>{n.level === 'msg' ? n.title : n.text}</strong>
            {n.level === 'msg' && <span className="dim small">{n.text}</span>}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function Bell({ api, go, disabled }: { api: Api; go: Go; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div className="bell-wrap" ref={ref}>
      <button
        className={`bell${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-label={`Benachrichtigungen, ${api.unread} ungelesen`}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20a2 2 0 0 0 4 0" />
        </svg>
        <AnimatePresence>
          {api.unread > 0 && (
            <motion.span key={api.unread} className="bell-count" initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              {api.unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notify-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div className="notify-head">
              <span className="label">Benachrichtigungen</span>
              <span className="notify-actions">
                <button className="link small" onClick={api.markAll} disabled={!api.unread}>
                  Alle gelesen
                </button>
                <button className="link small" onClick={api.clear} disabled={!api.items.length}>
                  Leeren
                </button>
              </span>
            </div>
            <div className="notify-list">
              {api.items.length === 0 && <p className="dim small notify-empty">Keine Benachrichtigungen.</p>}
              {api.items.map((n) => (
                <button
                  key={n.id}
                  className={`notify-item lvl-${n.level}${n.read ? ' read' : ''}`}
                  onClick={() => {
                    api.markRead(n.id);
                    if (n.route) {
                      setOpen(false);
                      go(n.route);
                    }
                  }}
                >
                  <span className="notice-icon">{ICON[n.level]}</span>
                  <span className="notify-text">
                    <span className="notify-top">
                      <strong>{n.title}</strong>
                      <span className="dim small">{n.time}</span>
                    </span>
                    <span className="dim small">{n.text}</span>
                  </span>
                  {!n.read && <span className="unread-dot" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
