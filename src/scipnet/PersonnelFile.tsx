import { personById } from '../data/personnel';
import { REPORTS } from '../data/reports';
import type { Go } from './routes';
import Redacted from './Redacted';
import { ReportRow } from './ReportList';

export default function PersonnelFile({ id, go }: { id: string; go: Go }) {
  const p = personById(id);
  if (!p) return <p className="page">Akte nicht gefunden.</p>;
  const reports = REPORTS.filter((r) => r.author === p.id);

  const fields: [string, string][] = [
    ['Kennung', p.id],
    ['Funktion', p.role],
    ['Abteilung', p.department],
    ['Freigabe', p.clearance],
    ['Status', p.status],
    ['Im Dienst seit', p.since],
  ];

  return (
    <div className="page">
      <button className="link back" onClick={() => go({ view: 'personnel' })}>
        ← Personalakten
      </button>

      <div className="dossier">
        <div className="photo" aria-hidden>
          <span>KEIN BILD</span>
        </div>
        <div>
          <h2>{p.name}</h2>
          <dl className="fields">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section>
        <h3>Zusammenfassung</h3>
        <p>
          <Redacted text={p.summary} />
        </p>
      </section>

      <section>
        <h3>Vermerke</h3>
        <ul className="notices">
          {p.notes.map((n) => (
            <li key={n}>
              <Redacted text={n} />
            </li>
          ))}
        </ul>
      </section>

      {reports.length > 0 && (
        <section>
          <h3>Verfasste Feldberichte</h3>
          <div className="rows">
            {reports.map((r) => (
              <ReportRow key={r.id} report={r} go={go} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
