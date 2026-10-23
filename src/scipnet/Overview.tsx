import { PERSONNEL } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { useAccount } from './session';
import type { Go } from './routes';
import { ReportRow } from './ReportList';

type Notice = { time: string; level: 'info' | 'warn' | 'alert'; title: string; text: string };

const NOTICES: Notice[] = [
  { time: 'Heute 02:00', level: 'info', title: 'Wartung', text: 'SCiPnet-Wartung von 02:00 bis 03:00 Uhr.' },
  { time: 'Gestern', level: 'warn', title: 'Sicherheit', text: 'Anmeldungen nur von zugelassenen Endpunkten.' },
  { time: '14.09.', level: 'alert', title: 'Sperrung', text: 'Archiv 7 bis auf Weiteres gesperrt.' },
];

const LEVEL_LABEL = { info: 'Info', warn: 'Hinweis', alert: 'Dringend' };

export default function Overview({ go }: { go: Go }) {
  const me = useAccount();
  const open = REPORTS.filter((r) => r.status === 'Offen').length;
  const stats = [
    { label: 'Personalakten', value: PERSONNEL.length + 1, onClick: () => go({ view: 'personnel' }) },
    { label: 'Feldberichte', value: REPORTS.length, onClick: () => go({ view: 'reports' }) },
    { label: 'Offene Vorgänge', value: open, onClick: () => go({ view: 'reports' }) },
    { label: 'Standortstatus', value: 'NORMAL' },
  ];

  return (
    <div className="page">
      <div className="box hero">
        <div>
          <div className="label">Sitzung aktiv</div>
          <h2>Willkommen, {me.name.replace(/^Der /, '')}</h2>
          <p className="dim">
            {me.site} · Freigabe {me.clearance}
          </p>
        </div>
        <span className="live">
          <span className="live-dot" /> VERBUNDEN
        </span>
      </div>

      <div className="stats">
        {stats.map((s) => (
          <button key={s.label} className="card stat" onClick={s.onClick} disabled={!s.onClick}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="overview-grid">
        <section className="box">
          <div className="box-head">
            <h3>Neueste Feldberichte</h3>
            <button className="link small" onClick={() => go({ view: 'reports' })}>
              Alle anzeigen
            </button>
          </div>
          <div className="rows">
            {REPORTS.slice(0, 3).map((r) => (
              <ReportRow key={r.id} report={r} go={go} />
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
    </div>
  );
}
