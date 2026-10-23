import { useEffect, useRef, useState } from 'react';
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
import { AdminFile, ScipaDestruct, SelfDestruct } from './Admin';
import { ADMIN_PERSON } from '../data/personnel';
import CommsGate from './CommsGate';
import Archive, { ScpView } from './Archive';
import Assistant from './Assistant';
import Hack from './Hack';
import Sessions from './Sessions';
import { adminAccess, commsAuth, useAdminUnlocked } from './session';
import { Bell, Toast, useNotifications } from './Notifications';
import { play, type SoundName } from '../lib/sound';
import { savedSession, SESSION_MS } from '../lib/persist';

const WARN_S = 30;

type NavItem = { label: string; route?: Route; match?: Route['view'][]; sound?: SoundName };

// Items without a route are shown as locked; add pages here later.
const NAV: NavItem[] = [
  { label: 'Übersicht', route: { view: 'overview' }, match: ['overview'] },
  { label: 'Personalakten', route: { view: 'personnel' }, match: ['personnel', 'person', 'admin'], sound: 'tabPersonnel' },
  { label: 'Feldberichte', route: { view: 'reports' }, match: ['reports', 'report'], sound: 'tabReports' },
  { label: 'Kommunikation', route: { view: 'comms' }, match: ['comms', 'thread'], sound: 'tabComms' },
  { label: 'SCP-Archiv', route: { view: 'archive' }, match: ['archive', 'scp'], sound: 'tabArchive' },
  { label: 'KI-Assistent', route: { view: 'assistant' }, match: ['assistant'] },
];

// Section sound for sidebar tabs, played together with the click.
// One at a time (the previous one fades out) and at most one every 300 ms,
// so fast clicking can't stack them up.
let stopTabSound: (fadeMs?: number) => void = () => {};
let lastTabSound = 0;
function playTabSound(name: SoundName) {
  const now = performance.now();
  if (now - lastTabSound < 300) return;
  lastTabSound = now;
  stopTabSound(120);
  stopTabSound = play(name, 0.55);
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hdr-clock">
      <strong>{now.toLocaleTimeString('de-DE')}</strong>
      <span className="dim small">{now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
    </div>
  );
}

export default function Shell({ onLogout, fresh }: { onLogout: () => void; fresh: boolean }) {
  const [route, setRoute] = useState<Route>(() => (savedSession.route() as Route | undefined) ?? { view: 'overview' });

  // Remember the page for reloads; never the Administrator file.
  useEffect(() => savedSession.setRoute(route.view === 'admin' || route.view === 'hack' ? { view: 'personnel' } : route), [route]);

  // Overview sound once, right after a real login (not after a reload).
  const greeted = useRef(false);
  useEffect(() => {
    if (fresh && !greeted.current) play('tabOverview', 0.55);
    greeted.current = true;
  }, []);

  // Session timer: a 30-second warning with a countdown, then auto logout.
  const [expiresAt, setExpiresAt] = useState(() => {
    const at = savedSession.expiresAt();
    return at > Date.now() ? at : Date.now() + SESSION_MS;
  });
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const left = Math.ceil((expiresAt - Date.now()) / 1000);
      if (left <= 0) onLogoutRef.current();
      else setSecondsLeft(left <= WARN_S ? left : null);
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [expiresAt]);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;
  const [destruct, setDestruct] = useState<'none' | 'countdown' | 'scipa' | 'collapse'>('none');
  const [commsOk, setCommsOk] = useState(commsAuth.has);
  // Once the Administrator file is opened there is no way out.
  const [hacking, setHacking] = useState(false);
  const adminSolved = useAdminUnlocked();
  // Before the puzzle is solved the Administrator file triggers the meltdown.
  const meltdown = (route.view === 'admin' && !adminSolved) || destruct !== 'none';
  const locked = meltdown || hacking;
  const notes = useNotifications(locked);
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
      case 'hack':
        // the minigame itself is a full-screen overlay, see below
        return <PersonnelList go={go} />;
      case 'admin':
        return adminSolved ? <PersonnelFile id={ADMIN_PERSON.id} go={go} /> : <AdminFile onDone={() => setDestruct('countdown')} />;
      case 'reports':
        return <ReportList go={go} />;
      case 'report':
        return <ReportView id={route.id} go={go} />;
      case 'archive':
        return <Archive go={go} />;
      case 'scp':
        return <ScpView id={route.id} go={go} />;
      case 'assistant':
        return <Assistant go={go} onSelfDestruct={() => setDestruct('scipa')} />;
      case 'comms':
        return <Comms go={go} />;
      case 'thread':
        return <ThreadView id={route.id} go={go} />;
    }
  })();

  return (
    <motion.div
      className={meltdown && destruct !== 'collapse' ? 'shell meltdown' : 'shell'}
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
          <ScpLogo size={38} />
          <div className="brand-text">
            <span className="brand-name">SCiPnet</span>
            <span className="brand-sub">
              {STOLEN.site.toUpperCase()} · <span className="live-dot" /> Gesicherte Verbindung
            </span>
          </div>
        </div>
        <div className="topbar-right">
          <div className="hdr-status">
            <span className="label">Standortstatus</span>
            <span className="threat">
              <span className="threat-bar" /> NORMAL
            </span>
          </div>
          <span className="hdr-sep" />
          <Clock />
          <span className="hdr-sep" />
          <Bell api={notes} go={go} disabled={locked} />
          <Sessions disabled={locked} onAdmin={() => go(adminSolved ? { view: 'admin' } : { view: 'hack' })} />
          <button className="logout" onClick={onLogout} disabled={locked} title="Abmelden" aria-label="Abmelden">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M14 4h5v16h-5 M10 8l-4 4 4 4 M6 12h10" />
            </svg>
          </button>
        </div>
      </header>

      <nav className="sidenav">
        {NAV.map((n) =>
          n.route ? (
            <button
              key={n.label}
              className={n.match?.includes(route.view) ? 'active' : ''}
              onClick={() => {
                // only when actually switching section
                if (n.sound && !n.match?.includes(route.view)) playTabSound(n.sound);
                go(n.route!);
              }}
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

      <Toast api={notes} go={go} hidden={locked} />

      <AnimatePresence>
        {secondsLeft !== null && !meltdown && (
          <motion.div
            className="expiry"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            role="alert"
          >
            <span className="expiry-count">{secondsLeft}</span>
            <span>
              <strong>Sitzung läuft ab</strong>
              <span className="dim small">Automatische Abmeldung in {secondsLeft} Sekunden.</span>
            </span>
            <button className="card action" onClick={() => setExpiresAt(savedSession.extend())}>
              VERLÄNGERN
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {route.view === 'hack' && (
          <Hack
            key="hack"
            onActive={setHacking}
            onWin={() => adminAccess.grant()}
            onOpen={() => {
              setHacking(false);
              setRoute({ view: 'admin' });
            }}
            onLose={() => {
              setHacking(false);
              setRoute({ view: 'admin' });
            }}
          />
        )}
      </AnimatePresence>

      <GlitchLayer pulse={route} storm={meltdown && destruct !== 'collapse'} />
      {destruct === 'scipa' && <ScipaDestruct onDone={() => setDestruct('collapse')} />}
      {destruct === 'countdown' && <SelfDestruct onDone={() => setDestruct('collapse')} />}
    </motion.div>
  );
}
