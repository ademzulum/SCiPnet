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

type NavItem = { label: string; route?: Route; match?: Route['view'][] };

// Items without a route are shown as locked; add pages here later.
const NAV: NavItem[] = [
  { label: 'Übersicht', route: { view: 'overview' }, match: ['overview'] },
  { label: 'Personalakten', route: { view: 'personnel' }, match: ['personnel', 'person'] },
  { label: 'Feldberichte', route: { view: 'reports' }, match: ['reports', 'report'] },
  { label: 'Kommunikation', route: { view: 'comms' }, match: ['comms', 'thread'] },
  { label: 'SCP-Archiv' },
];

// Brief random signal glitch every 8-20s, plus one on each page change.
function useGlitch(trigger: unknown) {
  const [g, setG] = useState<{ on: boolean; y: number }>({ on: false, y: 50 });
  const fire = () => {
    setG({ on: true, y: 10 + Math.random() * 80 });
    setTimeout(() => setG((s) => ({ ...s, on: false })), 220);
  };
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        fire();
        loop();
      }, 8000 + Math.random() * 12000);
    };
    loop();
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) fire();
  }, [trigger]);
  return g;
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{now.toLocaleTimeString('de-DE')}</span>;
}

export default function Shell({ onLogout }: { onLogout: () => void }) {
  const [route, setRoute] = useState<Route>({ view: 'overview' });
  const glitch = useGlitch(route);
  const go = (r: Route) => {
    setRoute(r);
    document.querySelector('.shell-main')?.scrollTo({ top: 0 });
  };

  const page = (() => {
    switch (route.view) {
      case 'overview':
        return <Overview go={go} />;
      case 'personnel':
        return <PersonnelList go={go} />;
      case 'person':
        return <PersonnelFile id={route.id} go={go} />;
      case 'reports':
        return <ReportList go={go} />;
      case 'report':
        return <ReportView id={route.id} go={go} />;
      case 'comms':
        return <Comms go={go} />;
      case 'thread':
        return <ThreadView id={route.id} go={go} />;
    }
  })();

  return (
    <div
      className={glitch.on ? 'shell glitching' : 'shell'}
      style={{ '--gy': `${glitch.y}%` } as React.CSSProperties}
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
          <button className="link" onClick={onLogout}>
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
            >
              {n.label}
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
            key={JSON.stringify(route)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {page}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
