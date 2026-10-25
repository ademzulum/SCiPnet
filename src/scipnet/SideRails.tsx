import { useEffect, useState } from 'react';
import { PERSONNEL, personById } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { SCP } from '../data/scp';
import { THREADS } from '../data/threads';
import type { Go, Route } from './routes';

// Panels in the empty space left and right of the page on wide screens
// (styles.css shows them from 1500px); they sit in a grid with the page,
// so their tops line up with it and they scroll with it. Left: a live system log, the same on
// every tab. Right: context for the current tab, built from the site data.

const EVENTS = [
  { text: 'Hume-Pegel Sektor 14 im Normbereich', tone: 'ok' },
  { text: 'Zugangskontrolle Tor B · Ausweis geprüft', tone: '' },
  { text: 'Eindämmungszelle 14-B · Druck stabil', tone: 'ok' },
  { text: 'Archiv 7 · Zugriffsversuch blockiert', tone: 'warn' },
  { text: 'Backup Personaldatenbank abgeschlossen', tone: '' },
  { text: 'MTF Delta-5 · Funkcheck', tone: '' },
  { text: 'Kamera K-112 · Bildausfall 2 s', tone: 'warn' },
  { text: 'RAISA-Spiegelung synchronisiert', tone: 'ok' },
  { text: 'Wachwechsel Sektor 3', tone: '' },
  { text: 'Unbekannter Träger auf 79.3 MHz', tone: 'warn' },
];
// a fixed number of lines, so the box is as tall as its content
const LOG_LINES = 8;
const clock = () => new Date().toLocaleTimeString('de-DE');

function SystemLog() {
  const [lines, setLines] = useState(() => EVENTS.slice(0, LOG_LINES).map((e) => ({ ...e, t: clock() })));
  useEffect(() => {
    const id = setInterval(() => {
      const e = EVENTS[(Math.random() * EVENTS.length) | 0];
      setLines((l) => [{ ...e, t: clock() }, ...l].slice(0, LOG_LINES));
    }, 2200 + Math.random() * 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="box rail-box rail-log">
      <div className="box-head">
        <h3>Systemprotokoll</h3>
        <span className="small">
          <span className="live-dot" /> LIVE
        </span>
      </div>
      <ol>
        {lines.map((l, i) => (
          <li key={l.t + l.text + i} className={l.tone}>
            <time>{l.t}</time>
            <span>{l.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// A labelled bar per group, as a share of the total.
function Bars({ title, rows, go }: { title: string; rows: { label: string; n: number; tone?: string; to?: Route }[]; go: Go }) {
  const total = rows.reduce((s, r) => s + r.n, 0) || 1;
  return (
    <section className="box rail-box">
      <div className="box-head">
        <h3>{title}</h3>
        <span className="small dim">{total} gesamt</span>
      </div>
      <ul className="rail-bars">
        {rows.map((r) => (
          <li key={r.label}>
            <button className="rail-row" disabled={!r.to} onClick={() => r.to && go(r.to)}>
              <span className="rail-label">{r.label}</span>
              <span className="rail-n">{r.n}</span>
              <span className="rail-track">
                <span className={`rail-fill ${r.tone ?? ''}`} style={{ width: `${(r.n / total) * 100}%` }} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Links({ title, items, go }: { title: string; items: { label: string; sub: string; to: Route; tone?: string }[]; go: Go }) {
  return (
    <section className="box rail-box">
      <div className="box-head">
        <h3>{title}</h3>
      </div>
      <ul className="rail-links">
        {items.map((it) => (
          <li key={it.label}>
            <button className={`rail-link ${it.tone ?? ''}`} onClick={() => go(it.to)}>
              <strong>{it.label}</strong>
              <span className="dim small">{it.sub}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Context({ route, go }: { route: Route; go: Go }) {
  const count = <T,>(list: T[], key: (x: T) => string, order: string[]) =>
    order.map((label) => ({ label, n: list.filter((x) => key(x) === label).length }));
  switch (route.view) {
    case 'personnel':
    case 'person': {
      const rows = count(PERSONNEL, (p) => p.status, ['Aktiv', 'Beobachtung', 'Beurlaubt', 'Vermisst']).map((r) => ({
        ...r,
        tone: r.label === 'Aktiv' ? 'ok' : r.label === 'Vermisst' ? 'bad' : 'warn',
      }));
      const recent = PERSONNEL.filter((p) => p.status !== 'Aktiv').map((p) => ({
        label: p.name,
        sub: `${p.id} · ${p.status}`,
        to: { view: 'person', id: p.id } as Route,
        tone: 'warn',
      }));
      return (
        <>
          <Bars title="Personalstatus" rows={rows} go={go} />
          <Links title="Mit Statusvermerk" items={recent} go={go} />
        </>
      );
    }
    case 'reports':
    case 'report': {
      const cls = count(REPORTS, (r) => r.classification, ['Vertraulich', 'Geheim', 'Streng geheim']).map((r) => ({
        ...r,
        tone: r.label === 'Streng geheim' ? 'bad' : r.label === 'Geheim' ? 'warn' : 'info',
      }));
      const open = REPORTS.filter((r) => r.status === 'Offen').map((r) => ({
        label: r.title,
        sub: `${r.id} · ${personById(r.author)?.name ?? r.author}`,
        to: { view: 'report', id: r.id } as Route,
      }));
      return (
        <>
          <Bars title="Einstufung" rows={cls} go={go} />
          <Links title="Offene Vorgänge" items={open} go={go} />
        </>
      );
    }
    case 'archive':
    case 'scp': {
      const cls = count(SCP, (o) => o.objectClass, ['Safe', 'Euclid', 'Keter', 'Thaumiel', 'Neutralisiert'])
        .filter((r) => r.n)
        .map((r) => ({ ...r, tone: r.label === 'Keter' ? 'bad' : r.label === 'Euclid' ? 'warn' : 'ok' }));
      const keter = SCP.filter((o) => o.objectClass === 'Keter').map((o) => ({
        label: o.locked ? '[GESPERRT]' : o.name,
        sub: o.id,
        to: { view: 'scp', id: o.id } as Route,
        tone: 'bad',
      }));
      return (
        <>
          <Bars title="Objektklassen" rows={cls} go={go} />
          <Links title="Keter-Objekte" items={keter} go={go} />
        </>
      );
    }
    case 'comms':
    case 'thread':
      return (
        <Links
          title="Kanäle"
          items={THREADS.map((t) => ({
            label: personById(t.contact)?.name ?? t.contact,
            sub: personById(t.contact)?.role ?? '',
            to: { view: 'thread', id: t.id } as Route,
          }))}
          go={go}
        />
      );
    case 'assistant':
      return (
        <section className="box rail-box">
          <div className="box-head">
            <h3>S.C.I.P.A. kann</h3>
          </div>
          <ul className="rail-tips">
            <li>Akten und Feldberichte öffnen</li>
            <li>Benachrichtigungen vorlesen</li>
            <li>Objekte im Archiv suchen</li>
            <li>Fragen zu Personal beantworten</li>
            <li>Spracheingabe über das Mikrofon</li>
          </ul>
        </section>
      );
    default: {
      // overview: who is on duty
      const duty = PERSONNEL.filter((p) => p.status === 'Aktiv').slice(0, 5).map((p) => ({
        label: p.name,
        sub: p.role,
        to: { view: 'person', id: p.id } as Route,
      }));
      return <Links title="Im Dienst" items={duty} go={go} />;
    }
  }
}

export default function SideRails({ side, route, go }: { side: 'left' | 'right'; route: Route; go: Go }) {
  return side === 'left' ? (
    <aside className="rail rail-left" aria-label="Systemprotokoll">
      <SystemLog />
    </aside>
  ) : (
    <aside className="rail rail-right" aria-label="Kontext">
      <Context route={route} go={go} />
    </aside>
  );
}
