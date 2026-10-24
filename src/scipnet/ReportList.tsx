import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { REPORTS, type Report } from '../data/reports';
import { personById } from '../data/personnel';
import type { Go } from './routes';
import Redacted from './Redacted';
import { initials } from './Comms';

const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE');
export const classKey = (c: Report['classification']) => c.replace(' ', '-');

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

      <div className="report-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((r) => {
            const author = personById(r.author);
            return (
              <motion.button
                layout
                key={r.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
                whileHover={{ y: -2 }}
                className={`report-card cl-${classKey(r.classification)}`}
                onClick={() => go({ view: 'report', id: r.id })}
              >
                <span className="report-card-top">
                  <span className="dim small">{r.id}</span>
                  <span className="cl-pill">{r.classification}</span>
                </span>
                <strong className="report-card-title">{r.title}</strong>
                <span className="dim report-card-summary">{r.summary}</span>
                <span className="report-card-foot">
                  <span className="avatar sm">{initials(author?.name ?? '?')}</span>
                  <span className="small">
                    {fmt(r.date)} · <Redacted text={r.location} />
                  </span>
                  <span className={`status status-${r.status}`}>{r.status}</span>
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
