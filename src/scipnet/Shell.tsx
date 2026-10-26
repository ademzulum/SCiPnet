import { plural } from '../lib/plural';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ScpLogo, { LOGO_MASK as embossLogo } from '../components/ScpLogo';
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
import { MemeticKick, ScipaDestruct, SelfDestruct, setKickHandler } from './Admin';
import Guard from './Guard';
import { ADMIN_PERSON, O5_PERSON } from '../data/personnel';
import AdminLogin from './AdminLogin';
import Editor from './Editor';
import AdminChannel from './AdminChannel';
import { ConfirmHost, confirmLeave } from './Confirm';
import { useEntriesVersion } from '../data/store';
import CommsGate from './CommsGate';
import Archive, { ScpView } from './Archive';
import { ArchiveHub, Departments, GoiList, GoiView, MtfView } from './Departments';
import Assistant from './Assistant';
import Hack from './Hack';
import Sessions from './Sessions';
import SideRails from './SideRails';
import { Nav } from './EntityLinks';
import { o5Access, commsAuth, switchAccount, useAdminSession, useO5Unlocked } from './session';
import { Bell, Toast, useNotifications } from './Notifications';
import { play, type SoundName } from '../lib/sound';
import { savedSession, SESSION_MS } from '../lib/persist';
import { setPref, usePrefs } from '../lib/prefs';

function ThemeToggle() {
  const { light } = usePrefs();
  return (
    <button
      className="bell theme-toggle"
      onClick={() => setPref('light', !light)}
      title={light ? 'Dunkles Design' : 'Helles Design'}
      aria-label={light ? 'Dunkles Design' : 'Helles Design'}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <path
          d={
            light
              ? 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'
              : 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4'
          }
        />
      </svg>
    </button>
  );
}

const WARN_S = 30;

type NavItem = { label: string; icon: string; route?: Route; match?: Route['view'][]; sound?: SoundName };

// Items without a route are shown as locked; add pages here later.
const NAV: NavItem[] = [
  // icon: SVG path data on a 24×24 grid, drawn as strokes
  { label: 'Übersicht', icon: 'M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z', route: { view: 'overview' }, match: ['overview'] },
  {
    label: 'Personal',
    icon: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14.5c1.8.8 3 2.6 3 5',
    route: { view: 'personnel' },
    match: ['personnel', 'person', 'o5', 'admin'],
    sound: 'tabPersonnel',
  },
  {
    label: 'Berichte',
    icon: 'M6 3h9l4 4v14H6z M15 3v4h4 M9 11h7 M9 15h7 M9 19h4',
    route: { view: 'reports' },
    match: ['reports', 'report'],
    sound: 'tabReports',
  },
  {
    label: 'Archiv',
    icon: 'M3 4h18v4H3z M5 8v12h14V8 M10 12h4',
    route: { view: 'archive' },
    match: ['archive', 'scps', 'scp', 'departments', 'mtf', 'gois', 'goi'],
    sound: 'tabArchive',
  },
  { label: 'Nachrichten', icon: 'M4 5h16v11H9l-5 4z M8 9h8 M8 12h5', route: { view: 'comms' }, match: ['comms', 'thread', 'admin-chat'], sound: 'tabComms' },
  { label: 'S.C.I.P.A.', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 11v2', route: { view: 'assistant' }, match: ['assistant'] },
];

// Section sound for dock items, played together with the click.
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

  // Remember the page for reloads; never the O5-13 or Administrator file.
  useEffect(
    () => savedSession.setRoute(['o5', 'admin', 'hack', 'edit'].includes(route.view) ? { view: 'personnel' } : route),
    [route],
  );

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
      // the Administrator's session never runs out; it is extended quietly
      if (adminRef.current) {
        setSecondsLeft(null);
        if (left < 120) setExpiresAt(savedSession.extend());
        return;
      }
      if (left <= 0) onLogoutRef.current();
      else setSecondsLeft(left <= WARN_S ? left : null);
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [expiresAt]);
  const adminRef = useRef(false);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;
  const [destruct, setDestruct] = useState<'none' | 'countdown' | 'scipa' | 'memetic' | 'collapse'>('none');
  useEffect(() => {
    setKickHandler(() => setDestruct((d) => (d === 'none' ? 'memetic' : d)));
    return () => setKickHandler(null);
  }, []);
  const [commsOk, setCommsOk] = useState(commsAuth.has);
  // Once the O5-13 file is opened there is no way out.
  const [hacking, setHacking] = useState(false);
  const o5Solved = useO5Unlocked();
  const adminIn = useAdminSession();
  adminRef.current = adminIn;
  useEntriesVersion(); // pages re-render after an entry was saved or deleted
  // the Administrator's login form; opening that file without a session shows it
  const [login, setLogin] = useState(false);
  // Before the puzzle is solved, opening the O5-13 file goes straight into the
  // self-destruct countdown.
  const meltdown = (route.view === 'o5' && !o5Solved) || destruct !== 'none';
  useEffect(() => {
    if (route.view === 'o5' && !o5Solved && destruct === 'none') setDestruct('countdown');
  }, [route.view, o5Solved, destruct]);
  // logged out elsewhere (or the session ran out): leave the Administrator file
  useEffect(() => {
    if ((route.view === 'admin' || route.view === 'edit') && !adminIn) setRoute({ view: 'personnel' });
  }, [route.view, adminIn]);
  const locked = meltdown || hacking;
  const notes = useNotifications(locked);
  // Rails beside a page that fits without scrolling sit centred on it; beside
  // a longer page they line up with its top.
  const fitRails = (el: HTMLDivElement | null) => {
    if (!el) return;
    const check = () => {
      const main = el.closest('.shell-main');
      const page = el.querySelector<HTMLElement>(':scope > .page');
      if (main && page) el.classList.toggle('rails-center', page.offsetHeight < main.clientHeight * 0.8);
    };
    check();
    new ResizeObserver(check).observe(el);
  };

  // unsaved changes in the editor are confirmed before any page change
  const go = (r: Route) => {
    if (locked) return;
    void confirmLeave().then((ok) => ok && goNow(r));
  };
  const goNow = (r: Route) => {
    if (r.view === 'admin' && !adminIn) return setLogin(true);
    setRoute(r);
    document.querySelector('.shell-main')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 }); // phones scroll the page itself
  };

  const page = (() => {
    if ((route.view === 'comms' || route.view === 'thread' || route.view === 'admin-chat') && !commsOk)
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
        return (
          <Guard kind="personnel" id={route.id} go={go}>
            <PersonnelFile id={route.id} go={go} />
          </Guard>
        );
      case 'hack':
        // the minigame itself is a full-screen overlay, see below
        return <PersonnelList go={go} />;
      case 'o5':
        return o5Solved ? <PersonnelFile id={O5_PERSON.id} go={go} /> : null;
      case 'admin':
        return adminIn ? <PersonnelFile id={ADMIN_PERSON.id} go={go} /> : null;
      case 'reports':
        return <ReportList go={go} />;
      case 'report':
        return (
          <Guard kind="report" id={route.id} go={go}>
            <ReportView id={route.id} go={go} />
          </Guard>
        );
      case 'archive':
        return <ArchiveHub go={go} />;
      case 'scps':
        return <Archive go={go} />;
      case 'departments':
        return <Departments go={go} />;
      case 'mtf':
        return (
          <Guard kind="mtf" id={route.id} go={go}>
            <MtfView id={route.id} go={go} />
          </Guard>
        );
      case 'gois':
        return <GoiList go={go} />;
      case 'goi':
        return <GoiView id={route.id} go={go} />;
      case 'scp':
        return (
          <Guard kind="scp" id={route.id} go={go}>
            <ScpView id={route.id} go={go} />
          </Guard>
        );
      case 'assistant':
        return <Assistant go={go} notes={notes} ask={route.ask} onSelfDestruct={() => setDestruct('scipa')} />;
      case 'comms':
        return <Comms go={go} />;
      case 'thread':
        return <ThreadView id={route.id} go={go} />;
      case 'admin-chat':
        return <AdminChannel go={go} />;
      case 'edit':
        return <Editor key={`${route.kind}-${route.id}`} kind={route.kind} id={route.id} go={go} />;
    }
  })();

  return (
    <motion.div
      className="shell"
      animate={
        destruct === 'collapse'
          ? { scaleY: [1, 0.004, 0.004], scaleX: [1, 1, 0], opacity: [1, 1, 0] }
          : undefined
      }
      transition={{ duration: 0.7, times: [0, 0.55, 1], ease: 'easeIn' }}
      onAnimationComplete={() => destruct === 'collapse' && onLogout()}
    >
      <div className="emboss" style={{ '--emboss-logo': `url("${embossLogo}")` } as React.CSSProperties} aria-hidden>
        <span />
      </div>
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
          <ThemeToggle />
          <Bell api={notes} go={go} disabled={locked} />
          <Sessions disabled={locked} onO5={() => go(o5Solved ? { view: 'o5' } : { view: 'hack' })} onAdmin={() => setLogin(true)} />
          <button className="logout" onClick={() => void confirmLeave().then((ok) => ok && onLogout())} disabled={locked} title="Abmelden" aria-label="Abmelden">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M14 4h5v16h-5 M10 8l-4 4 4 4 M6 12h10" />
            </svg>
          </button>
        </div>
      </header>

      <nav className="dock" aria-label="Bereiche">
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
              aria-label={n.label}
              title={n.label}
            >
              {n.match?.includes(route.view) && (
                <motion.span
                  layoutId="nav-indicator"
                  className="nav-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <svg className="dock-icon" viewBox="0 0 24 24" aria-hidden>
                <path d={n.icon} />
              </svg>
              <span className="nav-label">{n.label}</span>
            </button>
          ) : (
            <button key={n.label} disabled title="Zugriff verweigert">
              <svg className="dock-icon" viewBox="0 0 24 24" aria-hidden>
                <path d={n.icon} />
              </svg>
              <span className="lock">GESPERRT</span>
            </button>
          ),
        )}
      </nav>

      <main className="shell-main">
        <Nav.Provider value={{ go, route }}>
          <AnimatePresence mode="wait">
            <motion.div
              // a side rail question (ask) goes to the open S.C.I.P.A. chat, not a new page
              key={JSON.stringify(route.view === 'assistant' ? { view: 'assistant' } : route) + commsOk}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* wide screens: system log and tab context beside the page, top-aligned
                  with it and scrolling with it; the comms login brings its own panels */}
              {!locked && !((route.view === 'comms' || route.view === 'thread') && !commsOk) && route.view !== 'o5' && route.view !== 'admin' ? (
                <div className="rail-layout" ref={fitRails}>
                  <SideRails side="left" route={route} go={go} />
                  {page}
                  <SideRails side="right" route={route} go={go} />
                </div>
              ) : (
                page
              )}
            </motion.div>
          </AnimatePresence>
        </Nav.Provider>
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
              <span className="dim small">Automatische Abmeldung in {plural(secondsLeft, 'Sekunde', 'Sekunden')}.</span>
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
            onWin={() => {
              o5Access.grant();
              switchAccount('o5'); // a win logs straight into the O5-13 account
            }}
            onOpen={() => {
              setHacking(false);
              setRoute({ view: 'o5' });
            }}
            onLose={() => {
              setHacking(false);
              setRoute({ view: 'o5' });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {login && (
          <AdminLogin
            key="login"
            onClose={() => setLogin(false)}
            onDone={() => {
              setLogin(false);
              setRoute({ view: 'admin' });
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmHost />
      <GlitchLayer pulse={route} storm={false} />
      {destruct === 'memetic' && <MemeticKick onDone={() => setDestruct('collapse')} />}
      {destruct === 'scipa' && <ScipaDestruct onDone={() => setDestruct('collapse')} />}
      {destruct === 'countdown' && <SelfDestruct onDone={() => setDestruct('collapse')} />}
    </motion.div>
  );
}
