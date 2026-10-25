import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ADMIN_PERSON, PERSONNEL } from '../data/personnel';
import { biometric, useAccount, useAdminUnlocked } from './session';
import type { Go } from './routes';
import { Corrupt } from './Admin';
import { initials } from './Comms';

const STATUSES = ['Alle', 'Aktiv', 'Beurlaubt', 'Beobachtung', 'Vermisst'] as const;

// "Stufe 3" -> 3 of 6 pips; RAISA counts as 4, external persons as 0.
export const clearanceLevel = (c: string) => (c === 'RAISA' ? 4 : Number(c.match(/\d/)?.[0] ?? 0));

export function ClearancePips({ c }: { c: string }) {
  const n = clearanceLevel(c);
  return (
    <span className="pips" title={`Freigabe ${c}`}>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={i < n ? 'pip on' : 'pip'} />
      ))}
    </span>
  );
}

export default function PersonnelList({ go }: { go: Go }) {
  const solved = useAdminUnlocked();
  const admin = useAccount().id === 'admin';
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
            {PERSONNEL.length + 1} Einträge ·{' '}
            {admin ? 'Biometrie überbrückt durch Freigabe Stufe 6' : 'Zugriff nur nach biometrischer Prüfung'}
          </p>
        </div>
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

      <div className="folder-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((p) => (
            <motion.button
              layout
              key={p.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
              whileHover={{ y: -2 }}
              className={`folder st-${p.status}${p.id.startsWith('X-') ? ' external' : ''}`}
              onClick={() => go({ view: 'person', id: p.id })}
            >
              <span className="folder-tab">{p.id}</span>
              {p.status !== 'Aktiv' && <span className={`folder-status status-${p.status}`}>{p.status}</span>}
              <span className="folder-body">
                <span className="folder-photo" aria-hidden>
                  {p.photo ? <><img src={p.photo} alt="" />{p.eyeBar && !admin && <span className="eye-bar" style={{ top: `${p.eyeBar.top}%`, left: `${p.eyeBar.left}%`, width: `${p.eyeBar.width}%` }} />}</> : initials(p.name)}
                </span>
                <span className="folder-info">
                  <strong className="folder-name">{p.name}</strong>
                  <span className="small">{p.role}</span>
                  <span className="dim small">{p.department}</span>
                </span>
              </span>
              <span className="folder-foot">
                <ClearancePips c={p.clearance} />
                <span className="small">{p.clearance}</span>
                <span className="folder-end">
                  {admin || biometric.has(p.id) ? (
                    <span className="folder-seal open">◉ OFFEN</span>
                  ) : (
                    <span className="folder-seal">⬢ VERSIEGELT</span>
                  )}
                  <span className="folder-hover">ÖFFNEN ▸</span>
                </span>
              </span>
            </motion.button>
          ))}

        {solved ? (
          <motion.button layout key="admin" whileHover={{ y: -2 }} className="folder admin-folder" onClick={() => go({ view: 'admin' })}>
            <span className="folder-tab">{ADMIN_PERSON.id}</span>
            <span className="folder-body">
              <span className="folder-photo" aria-hidden>
                ∅
              </span>
              <span className="folder-info">
                <strong>{ADMIN_PERSON.name}</strong>
                <span className="small">{ADMIN_PERSON.role}</span>
                <span className="dim small">{ADMIN_PERSON.department}</span>
              </span>
            </span>
            <span className="folder-foot">
              <ClearancePips c={ADMIN_PERSON.clearance} />
              <span className="small">{ADMIN_PERSON.clearance}</span>
              <span className="folder-end">
                <span className="folder-seal open">◉ OFFEN</span>
                <span className="folder-hover">ÖFFNEN ▸</span>
              </span>
            </span>
          </motion.button>
        ) : (
          <motion.button layout key="admin-locked" whileHover={{ y: -2 }} className="folder admin-card" onClick={() => go({ view: 'admin' })}>
            <span className="folder-tab">
              <Corrupt text="A-00-0000" amount={0.2} every={400} />
            </span>
            <span className="folder-body">
              <span className="folder-photo" aria-hidden>
                ?
              </span>
              <span className="folder-info">
                <strong>
                  <Corrupt text="Der Administrator" amount={0.06} every={250} />
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
        )}
        </AnimatePresence>
      </div>
      {!items.length && <p className="dim">Keine Einträge gefunden.</p>}
    </div>
  );
}
