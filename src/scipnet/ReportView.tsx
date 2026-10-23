import { personById } from '../data/personnel';
import { reportById } from '../data/reports';
import type { Go } from './routes';
import Redacted from './Redacted';

export default function ReportView({ id, go }: { id: string; go: Go }) {
  const r = reportById(id);
  if (!r) return <p className="page">Bericht nicht gefunden.</p>;
  const author = personById(r.author);

  return (
    <div className="page">
      <button className="link back" onClick={() => go({ view: 'reports' })}>
        ← Feldberichte
      </button>

      <div className="classified">{r.classification.toUpperCase()}</div>
      <h2>{r.title}</h2>
      <p className="dim">{r.id}</p>

      <dl className="fields">
        <div>
          <dt>Datum</dt>
          <dd>{new Date(r.date).toLocaleDateString('de-DE')}</dd>
        </div>
        <div>
          <dt>Ort</dt>
          <dd>
            <Redacted text={r.location} />
          </dd>
        </div>
        <div>
          <dt>Verfasser</dt>
          <dd>
            {author ? (
              <button className="link" onClick={() => go({ view: 'person', id: author.id })}>
                {author.name}
              </button>
            ) : (
              r.author
            )}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{r.status}</dd>
        </div>
      </dl>

      <section>
        <h3>Zusammenfassung</h3>
        <p>{r.summary}</p>
      </section>

      <section>
        <h3>Bericht</h3>
        {r.body.map((para, i) => (
          <p key={i}>
            <Redacted text={para} />
          </p>
        ))}
      </section>
    </div>
  );
}
