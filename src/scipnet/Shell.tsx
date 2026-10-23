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
import { AdminFile, SelfDestruct } from './Admin';
import CommsGate from './CommsGate';
import Archive, { ScpView } from './Archive';
import { commsAuth } from './session';
import { Bell, Toast, useNotifications } from './Notifications';
import { initials } from './Comms';
import { play, type SoundName } from '../lib/sound';
import { savedSession, SESSION_MS } from '../lib/persist';

type NavItem = { label: string; route?: Route; match?: Route['view'][]; sound?: SoundName };

// Items without a route are shown as locked; add pages here later.
const NAV: NavItem[] = [
  { label: 'Übersicht', route: { view: 'overview' }, match: ['overview'] },
  { label: 'Personalakten', route: { view: 'personnel' }, match: ['personnel', 'person', 'admin'], sound: 'tabPersonnel' },
  { label: 'Feldberichte', route: { view: 'reports' }, match: ['reports', 'report'], sound: 'tabReports' },
  { label: 'Kommunikation', route: { view: 'comms' }, match: ['comms', 'thread'], sound: 'tabComms' },
  { label: 'SCP-Archiv', route: { view: 'archive' }, match: ['archive', 'scp'], sound: 'tabArchive' },
];

// Section sound for sidebar tabs, played once the new page has loaded in.
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

// Runs `fn` when the page it sits in mounts (after the old page has left).
function OnEnter({ fn }: { fn: () => void }) {
  useEffect(fn, []);
  return null;
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
  const pendingSound = useRef<SoundName | null>(null);

  // Remember the page for reloads; never the Administrator file.
  useEffect(() => savedSession.setRoute(route.view === 'admin' ? { view: 'personnel' } : route), [route]);

  // Overview sound once, right after a real login (not after a reload).
  const greeted = useRef(false);
  useEffect(() => {
    if (fresh && !greeted.current) play('tabOverview', 0.55);
    greeted.current = true;
  }, []);

  // Auto logout when the 15-minute session runs out.
  useEffect(() => {
    const left = savedSession.expiresAt() - Date.now();
    const t = setTimeout(() => onLogoutRef.current(), left > 0 ? left : SESSION_MS);
    return () => clearTimeout(t);
  }, []);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;
  const [destruct, setDestruct] = useState<'none' | 'countdown' | 'collapse'>('none');
  const [commsOk, setCommsOk] = useState(commsAuth.has);
  // Once the Administrator file is opened there is no way out.
  const locked = route.view === 'admin' || destruct !== 'none';
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
          <div className="hdr-user">
            <span className="avatar">{initials(STOLEN.name)}</span>
            <div>
              <strong>{STOLEN.name}</strong>
              <span className="badge">{STOLEN.clearance}</span>
            </div>
          </div>
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
              data-sound="none"
              onClick={() => {
                // only when actually switching section; plays once the page loads in
                if (n.sound && !n.match?.includes(route.view)) pendingSound.current = n.sound;
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
            <OnEnter
              fn={() => {
                if (pendingSound.current) playTabSound(pendingSound.current);
                pendingSound.current = null;
              }}
            />
            {page}
          </motion.div>
        </AnimatePresence>
      </main>

      <Toast api={notes} go={go} hidden={locked} />

      <GlitchLayer pulse={route} storm={locked && destruct !== 'collapse'} />
      {destruct !== 'none' && <SelfDestruct onDone={() => setDestruct('collapse')} />}
    </motion.div>
  );
}
