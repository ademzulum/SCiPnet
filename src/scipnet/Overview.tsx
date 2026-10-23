import { PERSONNEL } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { STOLEN } from '../lib/creds';
import type { Go } from './routes';
import { ReportRow } from './ReportList';

const NOTICES = [
  'SCiPnet-Wartung heute Nacht von 02:00 bis 03:00 Uhr.',
  'Erinnerung: Anmeldungen nur von zugelassenen Endpunkten.',
  'Archiv 7 bis auf Weiteres gesperrt.',
];

export default function Overview({ go }: { go: Go }) {
  const open = REPORTS.filter((r) => r.status === 'Offen').length;
  const stats = [
    { label: 'Personalakten', value: PERSONNEL.length, onClick: () => go({ view: 'personnel' }) },
    { label: 'Feldberichte', value: REPORTS.length, onClick: () => go({ view: 'reports' }) },
    { label: 'Offene Vorgänge', value: open, onClick: () => go({ view: 'reports' }) },
    { label: 'Standortstatus', value: 'NORMAL' },
  ];

  return (
    <div className="page">
      <h2>Willkommen, {STOLEN.name}</h2>
      <p className="dim">
        {STOLEN.site} · Freigabe {STOLEN.clearance}
      </p>

      <div className="stats">
        {stats.map((s) => (
          <button key={s.label} className="card stat" onClick={s.onClick} disabled={!s.onClick}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      <section>
        <h3>Neueste Feldberichte</h3>
        <div className="rows">
          {REPORTS.slice(0, 3).map((r) => (
            <ReportRow key={r.id} report={r} go={go} />
          ))}
        </div>
      </section>

      <section>
        <h3>Mitteilungen</h3>
        <ul className="notices">
          {NOTICES.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
