import { personById } from '../data/personnel';
import { reportById } from '../data/reports';
import { scpForReport } from '../data/scp';
import type { Go } from './routes';
import Redacted from './Redacted';
import { initials } from './Comms';
import { classKey } from './ReportList';
import { ClassBadge } from './Archive';
import { reportImageUrl } from '../data/photos';
import { useAccount } from './session';

export default function ReportView({ id, go }: { id: string; go: Go }) {
  const r = reportById(id);
  if (!r) return <p className="page">Bericht nicht gefunden.</p>;
  const author = personById(r.author);
  const scp = scpForReport(r.id);
  const admin = useAccount().id === 'admin';

  const sections = 2 + Number(!!r.timeline?.length) + Number(!!r.images?.length) + Number(!!r.measures?.length);
  const involved = (r.involved ?? []).map((id) => personById(id)).filter((x) => x !== undefined);

  return (
    <div className="page page-wide page-top">
      <button className="link back" onClick={() => go({ view: 'reports' })}>
        ← Feldberichte
      </button>

      <article className={`report-doc rv cl-${classKey(r.classification)}`}>
        <header className="box rv-head">
          <div className="rv-head-text">
            <div className="label">
              Feldbericht · {r.id} · {sections} Abschnitte
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
              {involved.length > 0 && (
                <div>
                  <dt>Beteiligte</dt>
                  <dd className="rv-people">
                    {involved.map((p) => (
                      <button key={p.id} className="link small" onClick={() => go({ view: 'person', id: p.id })}>
                        {p.name}
                      </button>
                    ))}
                  </dd>
                </div>
              )}
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
            <Section title="Ausgangslage">
              {r.situation.map((t, i) => (
                <p key={i}>
                  <Redacted text={t} />
                </p>
              ))}
            </Section>

            {r.timeline && r.timeline.length > 0 && (
              <Section title="Verlauf">
                <ol className="rv-timeline">
                  {r.timeline.map((e, i) => (
                    <li key={i}>
                      <time>{e.time}</time>
                      <p>
                        <Redacted text={e.text} />
                      </p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {r.images && r.images.length > 0 && (
              <Section title="Bildmaterial">
                <div className="rv-images">
                  {r.images.map((img, i) => (
                    <figure key={i}>
                      {img.src ? (
                        <div className="rv-img">
                          <img src={reportImageUrl(img.src, !admin)} alt={img.caption} loading="lazy" />
                        </div>
                      ) : (
                        <div className="rv-img-empty" aria-label="Kein Bild hinterlegt">
                          <svg viewBox="0 0 24 24" aria-hidden>
                            <path d="M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15.5 9a1.5 1.5 0 1 0 0-.01" />
                          </svg>
                          <span>Bildmaterial ausstehend</span>
                        </div>
                      )}
                      <figcaption>
                        Abb. {i + 1} · {img.caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </Section>
            )}

            {r.measures && r.measures.length > 0 && (
              <Section title="Maßnahmen">
                <ul className="rv-list">
                  {r.measures.map((m, i) => (
                    <li key={i}>
                      <Redacted text={m} />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Bewertung und Empfehlung">
              {r.assessment.map((t, i) => (
                <p key={i}>
                  <Redacted text={t} />
                </p>
              ))}
            </Section>

            <p className="rv-end">— Ende des Berichts —</p>
          </section>
        </div>
      </article>
    </div>
  );
}

// Report section; CSS counters number the sections that are present.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rv-section">
      <h3>{title}</h3>
      <div className="rv-sec-body">{children}</div>
    </section>
  );
}
