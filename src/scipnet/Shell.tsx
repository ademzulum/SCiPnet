import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ScpLogo from '../components/ScpLogo';
import { STOLEN } from '../lib/creds';
import type { Route } from './routes';
import Overview from './Overview';
import PersonnelList from './PersonnelList';
import PersonnelFile from './PersonnelFile';
import ReportList from './ReportList';
import ReportView from './ReportView';
import Comms from './Comms';
import ThreadView from './ThreadView';
import GlitchLayer from './GlitchLayer';
import { AdminFile, SelfDestruct } from './Admin';
import CommsGate from './CommsGate';
import Archive, { ScpView } from './Archive';
import { commsAuth, threadState } from './session';
import { THREADS } from '../data/threads';
import { personById } from '../data/personnel';
import { play } from '../lib/sound';

type NavItem = { label: string; route?: Route; match?: Route['view'][] };

// Items without a route are shown as locked; add pages here later.
const NAV: NavItem[] = [
  { label: 'Übersicht', route: { view: 'overview' }, match: ['overview'] },
  { label: 'Personalakten', route: { view: 'personnel' }, match: ['personnel', 'person', 'admin'] },
  { label: 'Feldberichte', route: { view: 'reports' }, match: ['reports', 'report'] },
  { label: 'Kommunikation', route: { view: 'comms' }, match: ['comms', 'thread'] },
  { label: 'SCP-Archiv', route: { view: 'archive' }, match: ['archive', 'scp'] },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{now.toLocaleTimeString('de-DE')}</span>;
}

// "New message" popup a few seconds into the session, if a thread is unread.
function useNotify() {
  const [toast, setToast] = useState<{ name: string; subject: string } | null>(null);
  useEffect(() => {
    const unread = THREADS.find((t) => threadState.isNew(t.id));
    if (!unread) return;
    const show = setTimeout(() => {
      play('notify', 0.8);
      setToast({ name: personById(unread.contact)?.name ?? unread.contact, subject: unread.subject });
    }, 3500);
    const hide = setTimeout(() => setToast(null), 3500 + 7000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);
  return [toast, () => setToast(null)] as const;
}

export default function Shell({ onLogout }: { onLogout: () => void }) {
  const [route, setRoute] = useState<Route>({ view: 'overview' });
  const [destruct, setDestruct] = useState<'none' | 'countdown' | 'collapse'>('none');
  const [commsOk, setCommsOk] = useState(commsAuth.has);
  const [toast, closeToast] = useNotify();
  // Once the Administrator file is opened there is no way out.
  const locked = route.view === 'admin' || destruct !== 'none';
  const go = (r: Route) => {
    if (locked) return;
    setRoute(r);
    document.querySelector('.shell-main')?.scrollTo({ top: 0 });
  };

  const page = (() => {
    if ((route.view === 'comms' || route.view === 'thread') && !commsOk)
      return (
        <CommsGate
          onDone={() => {
            commsAuth.grant();
            setCommsOk(true);
          }}
        />
      );
    switch (route.view) {
      case 'overview':
        return <Overview go={go} />;
      case 'personnel':
        return <PersonnelList go={go} />;
      case 'person':
        return <PersonnelFile id={route.id} go={go} />;
      case 'admin':
        return <AdminFile onDone={() => setDestruct('countdown')} />;
      case 'reports':
        return <ReportList go={go} />;
      case 'report':
        return <ReportView id={route.id} go={go} />;
      case 'archive':
        return <Archive go={go} />;
      case 'scp':
        return <ScpView id={route.id} go={go} />;
      case 'comms':
        return <Comms go={go} />;
      case 'thread':
        return <ThreadView id={route.id} go={go} />;
    }
  })();

  return (
    <motion.div
      className={locked && destruct !== 'collapse' ? 'shell meltdown' : 'shell'}
      animate={
        destruct === 'collapse'
          ? { scaleY: [1, 0.004, 0.004], scaleX: [1, 1, 0], opacity: [1, 1, 0] }
          : undefined
      }
      transition={{ duration: 0.7, times: [0, 0.55, 1], ease: 'easeIn' }}
      onAnimationComplete={() => destruct === 'collapse' && onLogout()}
    >
      <header className="topbar">
        <div className="brand">
          <ScpLogo size={30} />
          <span>SCiPnet</span>
          <span className="dim">// {STOLEN.site.toUpperCase()}</span>
        </div>
        <div className="topbar-right">
          <span className="dim">{STOLEN.name}</span>
          <span className="badge">{STOLEN.clearance}</span>
          <Clock />
          <button className="link" onClick={onLogout} disabled={locked}>
            ABMELDEN
          </button>
        </div>
      </header>

      <nav className="sidenav">
        {NAV.map((n) =>
          n.route ? (
            <button
              key={n.label}
              className={n.match?.includes(route.view) ? 'active' : ''}
              onClick={() => go(n.route!)}
              disabled={locked}
            >
              {n.match?.includes(route.view) && (
                <motion.span
                  layoutId="nav-indicator"
                  className="nav-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span className="nav-label">{n.label}</span>
            </button>
          ) : (
            <button key={n.label} disabled title="Zugriff verweigert">
              {n.label} <span className="lock">GESPERRT</span>
            </button>
          ),
        )}
      </nav>

      <main className="shell-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(route) + commsOk}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {page}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toast && !locked && (
          <motion.button
            className="toast"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={() => {
              closeToast();
              go({ view: 'comms' });
            }}
          >
            <span className="toast-dot" />
            <span>
              <span className="label">Neue Nachricht</span>
              <strong>{toast.name}</strong>
              <span className="dim small">{toast.subject}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <GlitchLayer pulse={route} storm={locked && destruct !== 'collapse'} />
      {destruct !== 'none' && <SelfDestruct onDone={() => setDestruct('collapse')} />}
    </motion.div>
  );
}
