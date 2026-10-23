import { motion } from 'motion/react';
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

  return (
    <div className="page">
      <button className="link back" onClick={() => go({ view: 'reports' })}>
        ← Feldberichte
      </button>

      <article className={`report-doc cl-${classKey(r.classification)}`}>
        <header className="box report-head">
          <div>
            <div className="label">Feldbericht · {r.id}</div>
            <h2>{r.title}</h2>
          </div>
          <motion.span
            className="stamp"
            initial={{ opacity: 0, scale: 1.8, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: -9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.15 }}
          >
            {r.classification}
          </motion.span>
        </header>

        <div className="report-meta">
          <div className="box meta-tile">
            <span className="label">Datum</span>
            <strong>{new Date(r.date).toLocaleDateString('de-DE')}</strong>
          </div>
          <div className="box meta-tile">
            <span className="label">Einsatzort</span>
            <strong>
              <Redacted text={r.location} />
            </strong>
          </div>
          <div className="box meta-tile">
            <span className="label">Status</span>
            <span className={`status status-${r.status}`}>{r.status}</span>
          </div>
        </div>

        <div className="box callout">
          <span className="label">Zusammenfassung</span>
          <p>{r.summary}</p>
        </div>

        <section className="box doc-section">
          <h3>Bericht</h3>
          <ol className="paragraphs">
            {r.body.map((para, i) => (
              <li key={i}>
                <span className="para-num">§{i + 1}</span>
                <p>
                  <Redacted text={para} />
                </p>
              </li>
            ))}
          </ol>
        </section>

        {scp && (
          <button className={`box linked-scp class-edge-${scp.objectClass}`} onClick={() => go({ view: 'scp', id: scp.id })}>
            <span>
              <span className="label">Verknüpftes Objekt</span>
              <strong>
                {scp.id} · {scp.name}
              </strong>
            </span>
            <ClassBadge c={scp.objectClass} />
            <span className="linked-arrow">→</span>
          </button>
        )}

        <footer className="box signature">
          <div className="sig-author">
            <span className="avatar">{initials(author?.name ?? '?')}</span>
            <div>
              <span className="label">Gezeichnet</span>
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
          <div className="sig-dist">
            <span className="label">Verteiler</span>
            <span className="small">Standortleitung · RAISA · Archiv</span>
          </div>
        </footer>
      </article>
    </div>
  );
}
