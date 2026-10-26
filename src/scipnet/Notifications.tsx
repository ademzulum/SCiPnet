import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { THREADS } from '../data/threads';
import { personById } from '../data/personnel';
import { play } from '../lib/sound';
import { getPrefs, setPref, usePrefs } from '../lib/prefs';
import { currentAccount, threadState } from './session';
import { markNoticesSeen, unseenMessages, unseenNotices } from '../data/messages';
import { refreshKind } from '../data/store';
import type { Go, Route } from './routes';

// Site notifications: one for an unread message shortly after login, then
// site events every 30-70 s. Every other event is written by the model behind
// /api/scipa (falling back to POOL when that fails). Each shows as a toast and
// is kept in the bell panel in the header; S.C.I.P.A. can read and act on them.

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

// Model-written notification, or null if the function is unavailable.
async function aiNotice(recent: string[]): Promise<Template | null> {
  try {
    const res = await fetch('/api/scipa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'notice', recent }),
    });
    if (!res.ok) return null;
    const n = (await res.json()) as Template;
    return n.title && n.text ? n : null;
  } catch {
    return null;
  }
}

const clock = () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
// Level icons as strokes on a 24×24 grid (glyphs like ✉ render tiny in the mono font).
const ICON_PATH: Record<Level, string> = {
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v6 M12 7.5v.5',
  warn: 'M12 3l10 18H2z M12 10v5 M12 18v.5',
  alert: 'M8 2h8l6 6v8l-6 6H8l-6-6V8z M12 7v6 M12 16.5v.5',
  msg: 'M3 6h18v12H3z M3 6l9 7 9-7',
};
const ICON: Record<Level, React.ReactNode> = Object.fromEntries(
  Object.entries(ICON_PATH).map(([k, d]) => [
    k,
    <svg key={k} viewBox="0 0 24 24" aria-hidden>
      <path d={d} />
    </svg>,
  ]),
) as Record<Level, React.ReactNode>;

export function useNotifications(paused: boolean) {
  const [items, setItems] = useState<Notice[]>([]);
  const [toast, setToast] = useState<Notice | null>(null);
  const nextId = useRef(1);
  const recent = useRef<string[]>([]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const push = (t: Template) => {
    if (pausedRef.current) return;
    const n: Notice = { ...t, id: nextId.current++, time: clock(), read: false };
    recent.current = [`${t.title}: ${t.text}`, ...recent.current].slice(0, 8);
    setItems((l) => [n, ...l].slice(0, 30));
    // muted notifications still land in the bell list
    const { noticeSound, noticePopups } = getPrefs();
    if (noticeSound) play('notify', 0.7);
    if (!noticePopups) return;
    setToast(n);
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
    // The Administrator's messages: announced once each, at login and whenever
    // a new one arrives (checked every 15 s). The Administrator isn't told
    // about his own messages.
    const announced = new Set<string>();
    const announce = () => {
      if (currentAccount() === 'admin') return;
      const fresh = unseenMessages().filter((m) => !announced.has(m.id));
      if (!fresh.length) return;
      fresh.forEach((m) => announced.add(m.id));
      push({
        level: 'msg',
        title: 'Der Administrator',
        text: fresh.length > 1 ? `${fresh.length} neue Nachrichten · Kanal einseitig` : 'Neue Nachricht · Kanal einseitig',
        route: { view: 'admin-chat' },
      });
    };
    // New notices ("Mitteilungen") the same way; each is announced once per browser.
    // The first visit only takes note of the existing ones.
    try {
      if (localStorage.getItem('scipnet.seenNotices') === null) markNoticesSeen();
    } catch {
      // storage unavailable
    }
    const announceNotices = () => {
      if (currentAccount() === 'admin') return markNoticesSeen();
      const fresh = unseenNotices();
      if (!fresh.length) return;
      markNoticesSeen();
      fresh.forEach((n) => push({ level: n.level, title: `Mitteilung · ${n.title}`, text: n.text, route: { view: 'overview' } }));
    };
    timers.push(setTimeout(announce, unread ? 7000 : 3500));
    timers.push(setTimeout(announceNotices, unread ? 9000 : 5500));
    const poll = setInterval(() => {
      void refreshKind('message').then(announce);
      void refreshKind('notice').then(announceNotices);
    }, 15000);
    timers.push(poll);
    let bag = [...POOL].sort(() => Math.random() - 0.5);
    let useAi = true;
    let alive = true;
    const fromPool = () => {
      if (!bag.length) bag = [...POOL].sort(() => Math.random() - 0.5);
      return bag.pop()!;
    };
    const loop = () => {
      timers.push(
        setTimeout(async () => {
          const t = (useAi && !pausedRef.current && (await aiNotice(recent.current))) || fromPool();
          useAi = !useAi;
          if (!alive) return;
          push(t);
          loop();
        }, 30000 + Math.random() * 40000),
      );
    };
    loop();
    return () => {
      alive = false;
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

export type Api = ReturnType<typeof useNotifications>;

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
        data-unread={api.unread}
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
              <NoticeToggles />
              <span className="notify-actions">
                <button className="icon-toggle" onClick={api.markAll} disabled={!api.unread} title="Alle gelesen" aria-label="Alle gelesen">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M2 12l5 5L18 6 M12 16l1 1L22 8" />
                  </svg>
                </button>
                <button className="icon-toggle" onClick={api.clear} disabled={!api.items.length} title="Leeren" aria-label="Leeren">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6" />
                  </svg>
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

// Mute switches for notification sound and pop-ups (independent of each other).
function NoticeToggles() {
  const { noticeSound, noticePopups } = usePrefs();
  return (
    <span className="notify-toggles">
      <button
        className={`icon-toggle${noticeSound ? '' : ' off'}`}
        onClick={() => setPref('noticeSound', !noticeSound)}
        aria-pressed={!noticeSound}
        title={noticeSound ? 'Ton stummschalten' : 'Ton einschalten'}
        aria-label={noticeSound ? 'Ton stummschalten' : 'Ton einschalten'}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d={noticeSound ? 'M4 9h4l5-4v14l-5-4H4z M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11' : 'M4 9h4l5-4v14l-5-4H4z M16 9l5 6 M21 9l-5 6'} />
        </svg>
      </button>
      <button
        className={`icon-toggle${noticePopups ? '' : ' off'}`}
        onClick={() => setPref('noticePopups', !noticePopups)}
        aria-pressed={!noticePopups}
        title={noticePopups ? 'Pop-ups ausblenden' : 'Pop-ups einblenden'}
        aria-label={noticePopups ? 'Pop-ups ausblenden' : 'Pop-ups einblenden'}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d={noticePopups ? 'M4 5h16v10H9l-5 4z M8 9h8 M8 12h5' : 'M4 5h16v10H9l-5 4z M3 3l18 18'} />
        </svg>
      </button>
    </span>
  );
}
