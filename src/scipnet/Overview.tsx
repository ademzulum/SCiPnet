import { PERSONNEL, personById } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { SCP } from '../data/scp';
import { useAccount } from './session';
import type { Go } from './routes';
import { classKey } from './ReportList';
import { initials } from './Comms';
import Redacted from './Redacted';
import Globe, { useGeo } from './Globe';
import HumeMeter from './HumeMeter';

type Notice = { time: string; level: 'info' | 'warn' | 'alert'; title: string; text: string };

const NOTICES: Notice[] = [
  { time: 'Heute 02:00', level: 'info', title: 'Wartung', text: 'SCiPnet-Wartung von 02:00 bis 03:00 Uhr.' },
  { time: 'Gestern', level: 'warn', title: 'Sicherheit', text: 'Anmeldungen nur von zugelassenen Endpunkten.' },
  { time: '14.09.', level: 'alert', title: 'Sperrung', text: 'Archiv 7 bis auf Weiteres gesperrt.' },
];

const LEVEL_LABEL = { info: 'Info', warn: 'Hinweis', alert: 'Dringend' };

const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE');
const daysAgo = (d: string) => Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 864e5));

export default function Overview({ go }: { go: Go }) {
  const me = useAccount();
  const geo = useGeo();
  const open = REPORTS.filter((r) => r.status === 'Offen');
  const active = PERSONNEL.filter((p) => p.status === 'Aktiv').length;
  const flagged = PERSONNEL.filter((p) => p.status !== 'Aktiv');
  const latest = [...REPORTS].sort((x, y) => y.date.localeCompare(x.date));
  const keter = SCP.filter((o) => o.objectClass === 'Keter').length;
  const stats = [
    {
      label: 'Aktives Personal',
      value: `${active}/${PERSONNEL.length}`,
      sub: `${flagged.length} mit Statusvermerk`,
      onClick: () => go({ view: 'personnel' }),
    },
    {
      label: 'Offene Vorgänge',
      value: open.length,
      sub: `${open.filter((r) => r.classification === 'Streng geheim').length} streng geheim`,
      onClick: () => go({ view: 'reports' }),
    },
    {
      label: 'Erfasste Objekte',
      value: SCP.length,
      sub: `${keter} Keter`,
      onClick: () => go({ view: 'scps' }),
    },
    {
      label: 'Letzter Bericht',
      value: latest[0] ? `vor ${daysAgo(latest[0].date)} T` : '–',
      sub: latest[0]?.id ?? '',
      onClick: latest[0] ? () => go({ view: 'report', id: latest[0].id }) : undefined,
    },
  ];

  return (
    <div className="page">
      <div className="box hero">
        <div>
          <div className="label">Sitzung aktiv</div>
          <h2>Willkommen, {me.name.replace(/^Der /, '')}</h2>
          <p className="dim">
            {me.site} · Freigabe {me.clearance}
            {geo?.city ? ` · Terminal in ${geo.city}` : ''}
          </p>
        </div>
        <span className="live">
          <span className="live-dot" /> VERBUNDEN
        </span>
      </div>

      <div className="overview-top">
        <Globe geo={geo} />
        <HumeMeter />
      </div>

      <div className="stats">
        {stats.map((s) => (
          <button key={s.label} className="card stat" onClick={s.onClick} disabled={!s.onClick}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </button>
        ))}
      </div>

      <div className="overview-grid">
        <section className="box">
          <div className="box-head">
            <h3>Neueste Feldberichte</h3>
            <button className="link" onClick={() => go({ view: 'reports' })}>
              Alle anzeigen
            </button>
          </div>
          <div className="notice-list">
            {latest.slice(0, 3).map((r) => (
              <button
                key={r.id}
                className={`notice ov-card ov-report cl-${classKey(r.classification)}`}
                onClick={() => go({ view: 'report', id: r.id })}
              >
                <span className="notice-top">
                  <span className="notice-level">{r.classification}</span>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </span>
                <strong>{r.title}</strong>
                <span className="dim ov-summary">{r.summary}</span>
                <span className="ov-foot">
                  <span className="avatar sm">{initials(personById(r.author)?.name ?? '?')}</span>
                  <span className="dim small">
                    {r.id} · {fmt(r.date)} · <Redacted text={r.location} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="box">
          <div className="box-head">
            <h3>Mitteilungen</h3>
          </div>
          <div className="notice-list">
            {NOTICES.map((n) => (
              <div key={n.title} className={`notice notice-${n.level}`}>
                <div className="notice-top">
                  <span className="notice-level">{LEVEL_LABEL[n.level]}</span>
                  <span className="dim small">{n.time}</span>
                </div>
                <strong>{n.title}</strong>
                <span className="dim">{n.text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="overview-grid even">
        <section className="box">
          <div className="box-head">
            <h3>Personal mit Statusvermerk</h3>
            <button className="link" onClick={() => go({ view: 'personnel' })}>
              Personalakten
            </button>
          </div>
          <div className="notice-list">
            {flagged.length ? (
              flagged.map((p) => (
                <button key={p.id} className={`notice ov-card ov-person ps-${p.status}`} onClick={() => go({ view: 'person', id: p.id })}>
                  <span className="avatar sm">{initials(p.name)}</span>
                  <span className="ov-person-info">
                    <strong>{p.name}</strong>
                    <span className="dim small">
                      {p.id} · {p.role}
                    </span>
                  </span>
                  <span className={`status status-${p.status}`}>{p.status}</span>
                </button>
              ))
            ) : (
              <p className="dim">Keine Vermerke.</p>
            )}
          </div>
        </section>

        <section className="box">
          <div className="box-head">
            <h3>Eindämmung</h3>
            <button className="link" onClick={() => go({ view: 'scps' })}>
              Zum Archiv
            </button>
          </div>
          <div className="notice-list">
            {SCP.slice(0, 4).map((o) => (
              <button key={o.id} className={`notice ov-card ov-scp class-edge-${o.objectClass}`} onClick={() => go({ view: 'scp', id: o.id })}>
                <span className="notice-top">
                  <span className="notice-level">{o.objectClass}</span>
                  <span className="dim small">{o.id}</span>
                </span>
                <strong>{o.locked ? '[GESPERRT]' : o.name}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
