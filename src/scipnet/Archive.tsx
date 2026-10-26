import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FILTER_CARD } from './filterAnim';
import { SCP, scpById, type ObjectClass } from '../data/scp';
import { REPORTS } from '../data/reports';
import { play } from '../lib/sound';
import type { Go } from './routes';
import Redacted from './Redacted';
import { Corrupt } from './Admin';
import { useAdminUnlocked } from './session';
import ScpLogo from '../components/ScpLogo';
import { AcsBar, AcsIcon, AddendumBox, WarnIcon } from './Acs';
import { MtfInsignia } from './Departments';
import Pips from './Pips';
import { mtfById } from '../data/mtf';

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
      <button className="link back" onClick={() => go({ view: 'archive' })}>
        ← Archiv
      </button>
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

      {/* same card as the field reports; the class colour takes the place of the classification colour */}
      <div className="report-grid filter-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((s) => (
            <motion.button
              key={s.id}
              {...FILTER_CARD}
              className={`report-card archive-card scp-card2 acs class-${s.acs.containment ?? s.objectClass} class-edge-${s.objectClass}${s.locked && !solved ? ' locked' : ''}`}
              onClick={() => go({ view: 'scp', id: s.id })}
            >
              <span className="scp-card2-top">
                <AcsIcon name={s.acs.containment ?? s.objectClass} />
                <span className="scp-card2-id">
                  <strong>{s.id}</strong>
                  <ClassBadge c={s.objectClass} />
                </span>
                {s.mtf && mtfById(s.mtf) && <MtfInsignia m={mtfById(s.mtf)!} size={30} />}
              </span>
              <strong className="report-card-title">
                {s.locked && solved ? (
                  s.locked.realName ?? s.name
                ) : s.locked?.corrupt ? (
                  <Corrupt text={s.name} amount={0.15} every={300} />
                ) : (
                  s.name
                )}
              </strong>
              <span className="dim report-card-summary">{s.locked && !solved ? 'Inhalt gesperrt.' : s.summary}</span>
              <span className="scp-card2-foot">
                <span className={`scp-card2-cls dis-${s.acs.disruption}`}>
                  <AcsIcon name={s.acs.disruption} />
                  {s.acs.disruption}
                </span>
                <span className={`scp-card2-cls risk-${s.acs.risk}`}>
                  <AcsIcon name={s.acs.risk} />
                  {s.acs.risk}
                </span>
                <ClearanceLevel c={s.clearance} />
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
    <button className="link back" onClick={() => go({ view: 'scps' })}>
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

        <AcsBar s={s} go={go} />

        {s.warning && (
          <div className="file-warning" role="note">
            <WarnIcon shape="octagon" />
            <div>
              <div className="file-warning-label">Warnhinweis</div>
              <p>{s.warning}</p>
            </div>
          </div>
        )}

        {s.antimemetic && (
          <div className="box amnestic-note">
            <WarnIcon />
            Antimemetischer Inhalt. Text verblasst, sobald Sie wegsehen. Mit dem Mauszeiger festhalten.
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
              <AddendumBox key={a.title} a={a} n={i} id={s.id} open={open === i} toggle={() => setOpen(open === i ? null : i)} />
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

// Clearance level of a file, in the level's colour: pips plus "Level n".
function ClearanceLevel({ c }: { c: string }) {
  const n = Number(c.match(/\d/)?.[0] ?? 1);
  return (
    <span className={`scp-card2-lvl lvl-${n}`} title={`Freigabe ${c}`}>
      <Pips n={n} of={5} />
      Level {n}
    </span>
  );
}
