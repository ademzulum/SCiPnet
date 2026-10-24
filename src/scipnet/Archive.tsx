import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SCP, scpById, type ObjectClass } from '../data/scp';
import { REPORTS } from '../data/reports';
import { play } from '../lib/sound';
import type { Go } from './routes';
import Redacted from './Redacted';
import { Corrupt } from './Admin';
import { useAdminUnlocked } from './session';
import ScpLogo from '../components/ScpLogo';

const CLASSES: ObjectClass[] = ['Safe', 'Euclid', 'Keter', 'Thaumiel'];

export function ClassBadge({ c }: { c: ObjectClass }) {
  return <span className={`class-badge class-${c}`}>{c}</span>;
}

export default function Archive({ go }: { go: Go }) {
  const solved = useAdminUnlocked();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ObjectClass | 'Alle'>('Alle');
  const q = query.trim().toLowerCase();
  const items = SCP.filter(
    (s) =>
      (filter === 'Alle' || s.objectClass === filter) &&
      (!q || s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)),
  );

  return (
    <div className="page page-top">
      <div className="box archive-hero">
        <div>
          <div className="label">Anomaliendatenbank · Site-80</div>
          <h2>SCP-Archiv</h2>
          <p className="dim">{SCP.length} Einträge in Verwahrung von Site-80.</p>
        </div>
        <ScpLogo size={64} />
      </div>

      <div className="archive-tools">
        <input
          className="search"
          placeholder="Suche nach Nummer oder Name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips">
          {(['Alle', ...CLASSES] as const).map((c) => (
            <button key={c} className={filter === c ? 'chip active' : 'chip'} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="archive-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((s) => (
            <motion.button
              layout
              key={s.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
                whileHover={{ y: -2 }}
              className={`scp-card class-edge-${s.objectClass}${s.locked && !solved ? ' locked' : ''}`}
              onClick={() => go({ view: 'scp', id: s.id })}
            >
              <span className="scp-card-top">
                <span className="scp-num">{s.id}</span>
                <ClassBadge c={s.objectClass} />
              </span>
              <strong>
                {s.locked && solved ? (
                  s.locked.realName ?? s.name
                ) : s.locked?.corrupt ? (
                  <Corrupt text={s.name} amount={0.15} every={300} />
                ) : (
                  s.name
                )}
              </strong>
              <span className="dim small">{s.locked && !solved ? 'Inhalt gesperrt.' : s.summary}</span>
              <span className="scp-card-foot">
                <span className="small">{s.clearance}</span>
                {s.locked && !solved && <span className="lock">GESPERRT</span>}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      {!items.length && <p className="dim">Keine Einträge gefunden.</p>}
    </div>
  );
}

export function ScpView({ id, go }: { id: string; go: Go }) {
  const s = scpById(id);
  const solved = useAdminUnlocked();
  const sealed = !!s?.locked && !solved;
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    if (sealed) play('negative', 0.8);
  }, [s, sealed]);

  if (!s) return <p className="page">Eintrag nicht gefunden.</p>;

  const back = (
    <button className="link back" onClick={() => go({ view: 'archive' })}>
      ← SCP-Archiv
    </button>
  );

  if (s.locked && sealed)
    return (
      <div className="page">
        {back}
        <div className="box denied-doc">
          <span className="denied-icon">⬢</span>
          <div className="label">{s.id}</div>
          <h2>{s.locked.corrupt ? <Corrupt text="ZUGRIFF VERWEIGERT" amount={0.12} every={160} /> : 'ZUGRIFF VERWEIGERT'}</h2>
          <p>
            Dieses Dokument erfordert Freigabe <strong>{s.locked.required}</strong>. Ihre Freigabe: RAISA.
          </p>
          <p className="dim small">Der Zugriffsversuch wurde protokolliert und an die Standortdirektion gemeldet.</p>
        </div>
      </div>
    );

  const reports = REPORTS.filter((r) => s.reports?.includes(r.id));

  return (
    <div className="page">
      {back}
      <article className={`scp-doc${s.antimemetic ? ' antimemetic' : ''}`}>
        <header className="scp-doc-head box">
          <ScpLogo size={54} />
          <div className="scp-doc-title">
            <div className="label">SCP Foundation · Secure. Contain. Protect.</div>
            <h2>{s.id}</h2>
            <p>{s.locked && solved ? (s.locked.realName ?? s.name) : s.name}</p>
          </div>
        </header>

        <div className="scp-meta">
          <div className={`box meta-tile class-edge-${s.objectClass}`}>
            <span className="label">Objektklasse</span>
            <ClassBadge c={s.objectClass} />
          </div>
          <div className="box meta-tile">
            <span className="label">Freigabe</span>
            <strong>{s.clearance}</strong>
          </div>
          <div className="box meta-tile">
            <span className="label">Standort</span>
            <strong>Site-80</strong>
          </div>
        </div>

        {s.antimemetic && (
          <div className="box amnestic-note">
            ⚠ Antimemetischer Inhalt. Text verblasst, sobald Sie wegsehen. Mit dem Mauszeiger festhalten.
          </div>
        )}

        <section className="box doc-section">
          <h3>Besondere Eindämmungsmaßnahmen</h3>
          {s.containment.map((p, i) => (
            <p key={i} className="fade-text">
              <Redacted text={p} />
            </p>
          ))}
        </section>

        <section className="box doc-section">
          <h3>Beschreibung</h3>
          {s.description.map((p, i) => (
            <p key={i} className="fade-text">
              <Redacted text={p} />
            </p>
          ))}
        </section>

        {s.addenda.length > 0 && (
          <section className="addenda">
            {s.addenda.map((a, i) => (
              <div key={a.title} className={`box addendum${open === i ? ' open' : ''}`}>
                <button className="addendum-head" onClick={() => setOpen(open === i ? null : i)}>
                  <span>
                    <span className="label">Addendum {String.fromCharCode(65 + i)}</span>
                    {a.title}
                  </span>
                  <span className="addendum-arrow">{open === i ? '−' : '+'}</span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="addendum-body">
                        {a.body.map((p, j) => (
                          <p key={j} className="fade-text">
                            <Redacted text={p} />
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </section>
        )}

        {reports.length > 0 && (
          <section className="box doc-section">
            <h3>Verknüpfte Feldberichte</h3>
            <div className="linked">
              {reports.map((r) => (
                <button key={r.id} className="linked-card" onClick={() => go({ view: 'report', id: r.id })}>
                  <span className="dim small">{r.id}</span>
                  <strong>{r.title}</strong>
                  <span className="linked-arrow">→</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
