import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FILTER_CARD } from './filterAnim';
import { REPORTS, type Report } from '../data/reports';
import { personById } from '../data/personnel';
import type { Go } from './routes';
import Redacted from './Redacted';
import { initials } from './Comms';
import { LevelPill } from './Pips';

const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE');
export const classKey = (c: Report['classification']) => c.replace(' ', '-');
// classification as a clearance level, the scale every list card uses
const LEVEL: Record<string, number> = { Uneingeschränkt: 1, Eingeschränkt: 2, Vertraulich: 3, Geheim: 4, 'Streng geheim': 5 };

// Compact row, used on the overview and in personnel files.
export function ReportRow({ report: r, go }: { report: Report; go: Go }) {
  return (
    <button className={`row report-row cl-${classKey(r.classification)}`} onClick={() => go({ view: 'report', id: r.id })}>
      <span className="dim small">{r.id}</span>
      <strong>{r.title}</strong>
      <span className="row-meta">
        <span className="dim small">{fmt(r.date)}</span>
        <span className={`status status-${r.status}`}>{r.status}</span>
        <span className="row-arrow" aria-hidden>
          →
        </span>
      </span>
    </button>
  );
}

const FILTERS = ['Alle', 'Offen', 'Abgeschlossen'] as const;

export default function ReportList({ go }: { go: Go }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Alle');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const items = REPORTS.filter(
    (r) =>
      (filter === 'Alle' || r.status === filter) &&
      (!q || [r.id, r.title, r.summary, personById(r.author)?.name ?? ''].some((s) => s.toLowerCase().includes(q))),
  );

  return (
    <div className="page page-top">
      <div className="box archive-hero">
        <div>
          <div className="label">Einsatzdokumentation · Site-80</div>
          <h2>Feldberichte</h2>
          <p className="dim">
            {REPORTS.length} Berichte · {REPORTS.filter((r) => r.status === 'Offen').length} offen
          </p>
        </div>
      </div>

      <div className="archive-tools">
        <input
          className="search"
          placeholder="Suche nach Kennung, Titel, Verfasser…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? 'chip active' : 'chip'} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="report-grid filter-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((r) => {
            const author = personById(r.author);
            return (
              <motion.button
                key={r.id}
                {...FILTER_CARD}
                className={`report-card card2 cl-${classKey(r.classification)}`}
                onClick={() => go({ view: 'report', id: r.id })}
              >
                <span className="card2-top">
                  <span className="card2-id">
                    <strong>{r.id}</strong>
                    <span className="dim small">{fmt(r.date)}</span>
                  </span>
                  {/* who signed the report, top right like the insignia on SCP cards */}
                  <span className="rep-author" title={`Gezeichnet: ${author?.name ?? 'Unbekannt'}`}>
                    <span className="avatar sm">{initials(author?.name ?? '?')}</span>
                    <span className="rep-author-text">
                      <span className="label">Gezeichnet</span>
                      <span>{author?.name ?? 'Unbekannt'}</span>
                    </span>
                  </span>
                </span>
                <strong className="report-card-title">{r.title}</strong>
                <span className="dim report-card-summary">{r.summary}</span>
                {/* the place gets its own line above the footer, clear of the signer */}
                <span className="rep-place">
                  <span className="label">Einsatzort</span>
                  <span>
                    <Redacted text={r.location} />
                  </span>
                </span>
                <span className="card2-foot">
                  <LevelPill n={LEVEL[r.classification] ?? 3} of={5} label={`Level ${LEVEL[r.classification] ?? 3}`} title={r.classification} />
                  <span className={`card2-chip seal${r.status === 'Offen' ? ' open' : ''}`}>{r.status}</span>
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
