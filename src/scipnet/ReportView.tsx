import { personById } from '../data/personnel';
import { masked } from './cardAccess';
import { Broken } from './Admin';
import { EditButton } from './Editor';
import { reportById, TEMPLATES } from '../data/reports';
import { SCP } from '../data/scp';
import { mtfById } from '../data/mtf';
import { REPORT_LEVEL } from '../data/access';
import type { Go } from './routes';
import Redacted from './Redacted';
import { initials } from './Comms';
import { classKey } from './ReportList';
import { ClassBadge } from './Archive';
import { MtfInsignia } from './Departments';
import { CLEARANCE } from './Acs';
import { reportImageUrl } from '../data/photos';
import Picture from './Picture';
import Pips from './Pips';
import { useAccount } from './session';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

// A report's file, built like the SCP and task force files: a head with the
// number, title and clearance level, a panel of key data (the template's
// facts first, then date, place, status and who took part), the linked
// objects and units, then numbered document sections and the sign-off.
export default function ReportView({ id, go }: { id: string; go: Go }) {
  const admin = useAccount().elevated;
  const r = reportById(id);
  if (!r) return <p className="page">Bericht nicht gefunden.</p>;
  const author = personById(r.author);
  const level = REPORT_LEVEL[r.classification] ?? 3;
  const clear = CLEARANCE[level - 1];
  const template = r.template ? TEMPLATES[r.template] : undefined;
  const involved = (r.involved ?? []).map((pid) => personById(pid) ?? pid);
  // objects: those listing this report, and those the report names itself
  const objects = SCP.filter((s) => s.reports?.includes(r.id) || r.objects?.includes(s.id));
  const missing = (r.objects ?? []).filter((oid) => !SCP.some((s) => s.id === oid));
  const units = (r.units ?? []).map((uid) => mtfById(uid) ?? uid);

  const sections: { title: string; body: React.ReactNode }[] = [];
  const paras = (ps: string[]) => ps.map((t, i) => <p key={i}>{<Redacted text={t} />}</p>);
  if (r.situation.length) sections.push({ title: 'Ausgangslage', body: paras(r.situation) });
  for (const s of r.sections ?? []) if (s.body?.length) sections.push({ title: s.title || 'Abschnitt', body: paras(s.body) });
  if (r.timeline?.length)
    sections.push({
      title: 'Verlauf',
      body: (
        <ol className="mtf-log">
          {r.timeline.map((e, i) => (
            <li key={i}>
              <time>{e.time}</time>
              <span>
                <Redacted text={e.text} />
              </span>
            </li>
          ))}
        </ol>
      ),
    });
  if (r.measures?.length)
    sections.push({
      title: 'Maßnahmen',
      body: (
        <ul className="rv-list">
          {r.measures.map((m, i) => (
            <li key={i}>
              <Redacted text={m} />
            </li>
          ))}
        </ul>
      ),
    });
  if (r.images?.length)
    sections.push({
      title: 'Bildmaterial',
      body: (
        <div className="rv-images">
          {r.images.map((img, i) => (
            <figure key={i}>
              {img.src ? (
                <div className="rv-img">
                  <Picture src={reportImageUrl(img.src)} alt={img.caption} censored={!admin} />
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
      ),
    });
  if (r.assessment.length) sections.push({ title: 'Bewertung und Empfehlung', body: paras(r.assessment) });

  return (
    <div className="page page-top">
      <EditButton kind="report" id={r.id} go={go} />
      <button className="link back" onClick={() => go({ view: 'reports' })}>
        ← Feldberichte
      </button>

      <article className={`scp-doc report-file cl-${classKey(r.classification)}`}>
        <section className="acs rep-acs">
          <div className={`acs-head lvl-${level}`}>
            <div className="acs-id">
              <span className="label">{template?.label ?? 'Bericht'} #</span>
              <strong>{r.id}</strong>
              <span className="acs-name">
                <Redacted text={r.title} />
              </span>
            </div>
            <div className="acs-clear" title={clear.info}>
              <span className="acs-lvl-badge">
                <small>Level</small>
                {level}
              </span>
              <span className="acs-clear-text">
                <strong>{clear.name}</strong>
                <span className="acs-pips" style={{ '--st': 'var(--lvl)' } as React.CSSProperties}>
                  <Pips n={level} of={5} />
                </span>
                <small>{clear.info}</small>
              </span>
            </div>
          </div>

          <dl className="rep-facts">
            {(r.facts ?? []).map((f, i) => (
              <div key={`f${i}`}>
                <dt>{f.label}</dt>
                <dd>{f.value ? <Redacted text={f.value} /> : <span className="dim">–</span>}</dd>
              </div>
            ))}
            <div>
              <dt>Datum</dt>
              <dd>{fmtDate(r.date)}</dd>
            </div>
            <div>
              <dt>Einsatzort</dt>
              <dd>
                <Redacted text={r.location || '–'} />
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`state-pill status-${r.status}`}>{r.status}</span>
              </dd>
            </div>
            {involved.length > 0 && (
              <div className="wide">
                <dt>Beteiligte</dt>
                <dd className="rv-people">
                  {involved.map((p) =>
                    typeof p === 'string' ? (
                      <span key={p} className="small broken-ref">
                        <Broken />
                      </span>
                    ) : (
                      <button key={p.id} className="link small" onClick={() => go({ view: 'person', id: p.id })}>
                        {masked('personnel', p, p.name)}
                      </button>
                    ),
                  )}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="box doc-section">
          <h3>Zusammenfassung</h3>
          <p>
            <Redacted text={r.summary} />
          </p>
        </section>

        {(objects.length > 0 || missing.length > 0 || units.length > 0) && (
          <div className="linked rep-links">
            {objects.map((s) => (
              <button key={s.id} className={`linked-card class-edge-${s.objectClass}`} onClick={() => go({ view: 'scp', id: s.id })}>
                <span className="dim small">{s.id}</span>
                <strong>{masked('scp', s, s.name)}</strong>
                <ClassBadge c={s.objectClass} />
                <span className="linked-arrow">→</span>
              </button>
            ))}
            {missing.map((oid) => (
              <div key={oid} className="linked-card broken-ref">
                <span className="dim small">{oid}</span>
                <strong>
                  <Broken />
                </strong>
              </div>
            ))}
            {units.map((m) =>
              typeof m === 'string' ? (
                <div key={m} className="linked-card broken-ref">
                  <strong>
                    <Broken />
                  </strong>
                </div>
              ) : (
                <button key={m.id} className="linked-card rep-unit" onClick={() => go({ view: 'mtf', id: m.id })}>
                  <MtfInsignia m={m} size={28} />
                  <strong>
                    MTF {m.code} „{masked('mtf', m, m.nickname)}“
                  </strong>
                  <span className="linked-arrow">→</span>
                </button>
              ),
            )}
          </div>
        )}

        {sections.map((s, i) => (
          <section key={s.title + i} className="box doc-section rep-section">
            <h3>
              <span className="rep-num">{String(i + 1).padStart(2, '0')}</span>
              {s.title}
            </h3>
            {s.body}
          </section>
        ))}

        <section className="box rep-sign">
          <span className="avatar">{initials(author?.name ?? '?')}</span>
          <div>
            <span className="label">Gezeichnet</span>
            {author ? (
              <button className="link sig-name" onClick={() => go({ view: 'person', id: author.id })}>
                {masked('personnel', author, author.name)}
              </button>
            ) : (
              <span className="broken-ref">
                <Broken />
              </span>
            )}
            <div className="dim small">{author?.role}</div>
          </div>
          <span className="dim small rep-dist">Verteiler: Standortleitung · RAISA · Archiv</span>
        </section>
      </article>
    </div>
  );
}
