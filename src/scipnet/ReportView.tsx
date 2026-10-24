import { personById } from '../data/personnel';
import { reportById } from '../data/reports';
import { scpForReport } from '../data/scp';
import type { Go } from './routes';
import Redacted from './Redacted';
import { initials } from './Comms';
import { classKey } from './ReportList';
import { ClassBadge } from './Archive';

export default function ReportView({ id, go }: { id: string; go: Go }) {
  const r = reportById(id);
  if (!r) return <p className="page">Bericht nicht gefunden.</p>;
  const author = personById(r.author);
  const scp = scpForReport(r.id);

  const paragraphs = r.body.length;

  return (
    <div className="page page-wide page-top">
      <button className="link back" onClick={() => go({ view: 'reports' })}>
        ← Feldberichte
      </button>

      <article className={`report-doc rv cl-${classKey(r.classification)}`}>
        <header className="box rv-head">
          <div className="rv-head-text">
            <div className="label">
              Feldbericht · {r.id} · {paragraphs} Abschnitte
            </div>
            <h2>{r.title}</h2>
            <p className="dim">{r.summary}</p>
          </div>
          <span className="rv-stamp" aria-label={`Klassifizierung: ${r.classification}`}>
            {r.classification}
          </span>
        </header>

        <div className="rv-body">
          <aside className="rv-aside">
            <dl className="box rv-facts">
              <div>
                <dt>Datum</dt>
                <dd>{new Date(r.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
              </div>
              <div>
                <dt>Einsatzort</dt>
                <dd>
                  <Redacted text={r.location} />
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </dd>
              </div>
              <div>
                <dt>Klassifizierung</dt>
                <dd className="rv-cl">{r.classification}</dd>
              </div>
            </dl>

            {scp && (
              <button className={`box linked-scp class-edge-${scp.objectClass}`} onClick={() => go({ view: 'scp', id: scp.id })}>
                <span>
                  <span className="label">Verknüpftes Objekt</span>
                  <strong>{scp.id}</strong>
                  <span className="dim small">{scp.name}</span>
                </span>
                <ClassBadge c={scp.objectClass} />
              </button>
            )}

            <div className="box rv-sign">
              <span className="label">Gezeichnet</span>
              <div className="sig-author">
                <span className="avatar">{initials(author?.name ?? '?')}</span>
                <div>
                  {author ? (
                    <button className="link sig-name" onClick={() => go({ view: 'person', id: author.id })}>
                      {author.name}
                    </button>
                  ) : (
                    r.author
                  )}
                  <div className="dim small">{author?.role}</div>
                </div>
              </div>
              <span className="dim small">Verteiler: Standortleitung · RAISA · Archiv</span>
            </div>
          </aside>

          <section className="box rv-text">
            <h3>Bericht</h3>
            <ol className="rv-paras">
              {r.body.map((para, i) => (
                <li key={i}>
                  <span className="rv-num">§{String(i + 1).padStart(2, '0')}</span>
                  <p>
                    <Redacted text={para} />
                  </p>
                </li>
              ))}
            </ol>
            <p className="rv-end">— Ende des Berichts —</p>
          </section>
        </div>
      </article>
    </div>
  );
}
