import { REPORTS, type Report } from '../data/reports';
import type { Go } from './routes';

export function ReportRow({ report: r, go }: { report: Report; go: Go }) {
  return (
    <button className="row" onClick={() => go({ view: 'report', id: r.id })}>
      <span className="dim small">{r.id}</span>
      <strong>{r.title}</strong>
      <span className="row-meta">
        <span className="dim small">{new Date(r.date).toLocaleDateString('de-DE')}</span>
        <span className={`status status-${r.status}`}>{r.status}</span>
      </span>
    </button>
  );
}

export default function ReportList({ go }: { go: Go }) {
  return (
    <div className="page">
      <h2>Feldberichte</h2>
      <p className="dim">{REPORTS.length} Berichte · neueste zuerst</p>
      <div className="rows box">
        {REPORTS.map((r) => (
          <ReportRow key={r.id} report={r} go={go} />
        ))}
      </div>
    </div>
  );
}
