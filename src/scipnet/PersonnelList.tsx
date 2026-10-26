import { useState } from 'react';
import { cardAccess } from './cardAccess';
import { EditButton } from './Editor';
import { AnimatePresence, motion } from 'motion/react';
import { FILTER_CARD } from './filterAnim';
import { ADMIN_PERSON, O5_PERSON, PERSONNEL } from '../data/personnel';
import { biometric, useAccount, useAdminSession, useO5Unlocked } from './session';
import type { Go } from './routes';
import { Corrupt } from './Admin';
import { initials } from './Comms';
import { photoUrl } from '../data/photos';
import Picture from './Picture';
import Redacted from './Redacted';
import Pips, { LevelPill } from './Pips';
import { REPORTS } from '../data/reports';

// field reports a person wrote or appears in
const reportCount = (id: string) => REPORTS.filter((r) => r.author === id || r.involved?.includes(id)).length;
// disciplinary notes, not counting the "none on file" line
const noteCount = (notes: string[]) => notes.filter((n) => !/^Keine\b/.test(n)).length;

const STATUSES = ['Alle', 'Aktiv', 'Beurlaubt', 'Beobachtung', 'Vermisst'] as const;

// "Stufe 3" -> 3 of 6 pips; RAISA counts as 4, external persons as 0.
export const clearanceLevel = (c: string) => (c === 'RAISA' ? 4 : Number(c.match(/\d/)?.[0] ?? 0));

export function ClearancePips({ c }: { c: string }) {
  const n = clearanceLevel(c);
  return (
    <Pips n={n} of={6} title={`Freigabe ${c}`} />
  );
}

export default function PersonnelList({ go }: { go: Go }) {
  const solved = useO5Unlocked();
  const adminIn = useAdminSession();
  const me = useAccount();
  const admin = me.elevated;
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('Alle');
  const q = query.trim().toLowerCase();
  const items = PERSONNEL.filter(
    (p) =>
      (status === 'Alle' || p.status === status) &&
      (!q || [p.id, p.name, p.role, p.department].some((s) => s.toLowerCase().includes(q))),
  );

  return (
    <div className="page page-top">
      <div className="box archive-hero">
        <div>
          <div className="label">Personalverwaltung · Site-80</div>
          <h2>Personalakten</h2>
          <p className="dim">
            {PERSONNEL.length + 2} Einträge ·{' '}
            {admin ? `Biometrie überbrückt durch Freigabe ${me.clearance}` : 'Zugriff nur nach biometrischer Prüfung'}
          </p>
        </div>
        <EditButton kind="personnel" go={go} />
        <span className={admin ? 'bio-chip ok' : 'bio-chip'}>
          <span className="live-dot" /> {admin ? 'BYPASS' : 'BIOMETRIE'}
        </span>
      </div>

      <div className="archive-tools">
        <input
          className="search"
          placeholder="Suche nach Name, Kennung, Abteilung…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips">
          {STATUSES.map((s) => (
            <button key={s} className={status === s ? 'chip active' : 'chip'} onClick={() => setStatus(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="folder-grid filter-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((p) => (
            <motion.button
              key={p.id}
              {...FILTER_CARD}
              className={`folder st-${p.status}${p.id.startsWith('X-') ? ' external' : ''}${cardAccess('personnel', p, me.id).cls}`}
              onClick={() => go({ view: 'person', id: p.id })}
            >
              <span className="folder-tab">{p.id}</span>
              <span className="folder-body">
                <span className="folder-photo" aria-hidden>
                  {p.photo ? <Picture src={photoUrl(p.photo)} alt="" censored={!admin} cover /> : initials(p.name)}
                </span>
                <span className="folder-info">
                  <strong className="folder-name">{cardAccess('personnel', p, me.id).title(p.name)}</strong>
                  <span className="small">{p.role}</span>
                  <span className="dim small">{p.department}</span>
                </span>
                <span className={`state-pill status-${p.status}`}>{p.status}</span>
              </span>
              {/* always a quote line, so cards in a row line up even without one */}
              {cardAccess('personnel', p, me.id).cls ? (
                <span className="folder-quote">{cardAccess('personnel', p, me.id).summary(p.quote ?? p.summary, null)}</span>
              ) : p.quote ? (
                <span className="folder-quote">
                  „<Redacted text={p.quote} />“
                </span>
              ) : (
                <span className="folder-quote none">Keine Aussage auf Akte.</span>
              )}
              <span className="folder-facts">
                <span>
                  <span className="label">Seit</span>
                  <strong>{p.since}</strong>
                </span>
                <span>
                  <span className="label">Berichte</span>
                  <strong>{reportCount(p.id)}</strong>
                </span>
                <span>
                  <span className="label">Vermerke</span>
                  <strong className={noteCount(p.incidents) ? 'warn-text' : undefined}>{noteCount(p.incidents)}</strong>
                </span>
              </span>
              <span className="folder-foot">
                <LevelPill n={clearanceLevel(p.clearance)} of={6} label={p.clearance} title={`Freigabe ${p.clearance}`} />
                {admin || biometric.has(p.id) ? (
                  <span className="card2-chip seal open">Offen</span>
                ) : (
                  <span className="card2-chip seal">Versiegelt</span>
                )}
              </span>
            </motion.button>
          ))}

        {/* O5-13 opens with the minigame, the Administrator with the real login;
            both cards stay distorted until then */}
        {[
          { p: O5_PERSON, open: solved, view: 'o5' as const, lvl: 5 },
          { p: ADMIN_PERSON, open: adminIn, view: 'admin' as const, lvl: 6 },
        ].map(({ p, open, view, lvl }) =>
          open ? (
            <motion.button key={view} {...FILTER_CARD} className="folder admin-folder" onClick={() => go({ view })}>
              <span className="folder-tab">{p.id}</span>
              <span className="folder-body">
                <span className="folder-photo" aria-hidden>
                  ∅
                </span>
                <span className="folder-info">
                  <strong>{p.name}</strong>
                  <span className="small">{p.role}</span>
                  <span className="dim small">{p.department}</span>
                </span>
              </span>
              <span className="folder-foot">
                <LevelPill n={lvl} of={6} label={p.clearance} />
                <span className="card2-chip seal open">Offen</span>
              </span>
            </motion.button>
          ) : (
            <motion.button key={`${view}-locked`} {...FILTER_CARD} className="folder admin-card" onClick={() => go({ view })}>
              <span className="folder-tab">
                <Corrupt text={p.id} amount={0.2} every={400} />
              </span>
              <span className="folder-body">
                <span className="folder-photo" aria-hidden>
                  ?
                </span>
                <span className="folder-info">
                  <strong>
                    <Corrupt text={p.name} amount={0.06} every={250} />
                  </strong>
                  <span className="small">[DATEN BESCHÄDIGT]</span>
                </span>
              </span>
              <span className="folder-foot">
                <span className="small">
                  <Corrupt text="??????" amount={0.5} every={300} />
                </span>
              </span>
            </motion.button>
          ),
        )}
        </AnimatePresence>
      </div>
      {!items.length && <p className="dim">Keine Einträge gefunden.</p>}
    </div>
  );
}
