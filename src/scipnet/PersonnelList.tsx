import { useState } from 'react';
import { motion } from 'motion/react';
import { ADMIN_PERSON, PERSONNEL, type Person } from '../data/personnel';
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
  const [pulling, setPulling] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const items = PERSONNEL.filter(
    (p) =>
      (status === 'Alle' || p.status === status) &&
      (!q || [p.id, p.name, p.role, p.department].some((s) => s.toLowerCase().includes(q))),
  );

  // the folder slides out of the cabinet before the file opens
  const open = (p: Person) => {
    if (pulling) return;
    // the click sound comes from the global button handler (App.tsx)
    setPulling(p.id);
    setTimeout(() => go({ view: 'person', id: p.id }), 420);
  };

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
        {items.map((p) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0 }}
              animate={pulling === p.id ? { opacity: 0, y: -24, rotate: -1.5 } : { opacity: 1, y: 0 }}
              transition={{ duration: pulling === p.id ? 0.4 : 0.2 }}
              className={`folder st-${p.status}${p.id.startsWith('X-') ? ' external' : ''}`}
              onClick={() => open(p)}
            >
              <span className="folder-tab">{p.id}</span>
              <span className="folder-body">
                <span className="folder-photo" aria-hidden>
                  {p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}
                </span>
                <span className="folder-info">
                  <strong>{p.name}</strong>
                  <span className="small">{p.role}</span>
                  <span className="dim small">{p.department}</span>
                </span>
              </span>
              <span className="folder-foot">
                <ClearancePips c={p.clearance} />
                <span className="small">{p.clearance}</span>
                <span className="folder-end">
                  {p.status !== 'Aktiv' ? (
                    <span className="stamp">{p.status}</span>
                  ) : (
                    <span className="folder-seal">{admin || biometric.has(p.id) ? '◉ OFFEN' : '⬢ VERSIEGELT'}</span>
                  )}
                  <span className="folder-hover">ÖFFNEN ▸</span>
                </span>
              </span>
            </motion.button>
          ))}

        {solved ? (
          <button className="folder admin-folder" onClick={() => go({ view: 'admin' })}>
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
                <span className="folder-seal">◉ OFFEN</span>
                <span className="folder-hover">ÖFFNEN ▸</span>
              </span>
            </span>
          </button>
        ) : (
          <button className="folder admin-card" onClick={() => go({ view: 'admin' })}>
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
          </button>
        )}
      </div>
      {!items.length && <p className="dim">Keine Einträge gefunden.</p>}
    </div>
  );
}
