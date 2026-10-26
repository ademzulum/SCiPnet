import { useEffect, useState } from 'react';
import { cardAccess } from './cardAccess';
import AccessDenied from './AccessDenied';
import { READER_LEVEL, levelOf } from '../data/access';
import { useAccount } from './session';
import { EditButton } from './Editor';
import { AnimatePresence, motion } from 'motion/react';
import { FILTER_CARD } from './filterAnim';
import { SCP, scpById, type ObjectClass, mtfIds } from '../data/scp';
import { REPORTS } from '../data/reports';
import { play } from '../lib/sound';
import type { Go } from './routes';
import Redacted from './Redacted';
import { Corrupt } from './Admin';
import { useCleared } from './session';
import ScpLogo from '../components/ScpLogo';
import { AcsBar, AcsIcon, AddendumBox, WarnIcon } from './Acs';
import { MtfInsignia } from './Departments';
import { LevelPill } from './Pips';
import { mtfById } from '../data/mtf';
import { Broken } from './Admin';

const CLASSES: ObjectClass[] = ['Safe', 'Euclid', 'Keter', 'Esoteric'];

export function ClassBadge({ c }: { c: ObjectClass }) {
  return <span className={`class-badge class-${c}`}>{c}</span>;
}

export default function Archive({ go }: { go: Go }) {
  const solved = useCleared();
  const account = useAccount().id;
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
        <EditButton kind="scp" go={go} />
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
          {items.map((s) => {
            const ca = cardAccess('scp', s, account);
            return (
            <motion.button
              key={s.id}
              {...FILTER_CARD}
              className={`report-card archive-card scp-card2 acs class-${s.acs.containment ?? s.objectClass} class-edge-${s.objectClass}${s.locked && !solved ? ' locked' : ''}${ca.cls}`}
              onClick={() => go({ view: 'scp', id: s.id })}
            >
              <span className="scp-card2-top">
                <AcsIcon name={s.acs.containment ?? s.objectClass} />
                <span className="scp-card2-id">
                  <strong>{s.id}</strong>
                  <ClassBadge c={s.objectClass} />
                </span>
                {mtfIds(s).map(mtfById).filter((m) => m !== undefined).slice(0, 1).map((m) => <MtfInsignia key={m.id} m={m} size={30} />)}
              </span>
              <strong className="report-card-title">
                {s.locked && solved ? (
                  s.locked.realName ?? s.name
                ) : s.locked?.corrupt ? (
                  <Corrupt text={s.name} amount={0.15} every={300} />
                ) : (
                  ca.title(s.name)
                )}
              </strong>
              <span className="dim report-card-summary">{s.locked && !solved ? 'Inhalt gesperrt.' : ca.summary(s.summary, s.summary)}</span>
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
                {((s.locked && !solved) || ca.blocked || ca.closed) && <span className="lock">{ca.closed ? 'BESCHRÄNKT' : 'GESPERRT'}</span>}
              </span>
            </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      {!items.length && <p className="dim">Keine Einträge gefunden.</p>}
    </div>
  );
}

export function ScpView({ id, go }: { id: string; go: Go }) {
  const s = scpById(id);
  const solved = useCleared();
  const account = useAccount().id;
  const sealed = !!s?.locked && !solved;
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    if (sealed) play('negative', 0.8);
  }, [s, sealed]);

  if (!s) return <p className="page">Eintrag nicht gefunden.</p>;

  const back = (
    <>
      <EditButton kind="scp" id={s.id} go={go} />
      <button className="link back" onClick={() => go({ view: 'scps' })}>
        ← SCP-Archiv
      </button>
    </>
  );

  if (s.locked && sealed)
    return (
      <AccessDenied
        id={s.id}
        reason="level"
        required={Math.max(levelOf(s.locked.required), READER_LEVEL[account] + 1)}
        requiredLabel={`${s.locked.required} · versiegelt`}
        corrupt={s.locked.corrupt}
        back={{ view: 'scps' }}
        backLabel="SCP-Archiv"
        go={go}
      />
    );

  const reports = (s.reports ?? []).map((rid) => REPORTS.find((r) => r.id === rid) ?? rid);

  return (
    <div className="page">
      {back}
      <article className={`scp-doc${s.antimemetic ? ' antimemetic' : ''}`}>
        <AcsBar s={s} go={go} name={s.locked && solved ? (s.locked.realName ?? s.name) : s.name} />

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
              {reports.map((r) =>
                typeof r === 'string' ? (
                  <div key={r} className="linked-card broken-ref">
                    <span className="dim small">{r}</span>
                    <strong>
                      <Broken />
                    </strong>
                  </div>
                ) : (
                <button key={r.id} className="linked-card" onClick={() => go({ view: 'report', id: r.id })}>
                  <span className="dim small">{r.id}</span>
                  <strong>{r.title}</strong>
                  <span className="linked-arrow">→</span>
                </button>
                ),
              )}
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
  return <LevelPill n={n} of={5} label={`Level ${n}`} title={`Freigabe ${c}`} />;
}
