import { motion } from 'motion/react';
import { MTFS, mtfById, type Mtf } from '../data/mtf';
import { GOIS, goiById } from '../data/gois';
import { SCP } from '../data/scp';
import type { Go } from './routes';
import Redacted from './Redacted';
import ScpLogo from '../components/ScpLogo';
import { ClassBadge } from './Archive';
import { useAdminUnlocked } from './session';

// The archive hub and what hangs off it: SCP objects, Foundation departments
// (for now the Mobile Task Forces) and Groups of Interest, so the dock keeps one
// "Archiv" entry for all of them.

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.07 },
});

// The insignia is black line art, so it is drawn as a mask in the page's colours.
export function MtfInsignia({ m, size = 48 }: { m: Mtf; size?: number }) {
  return (
    <span
      className="mtf-insignia"
      role="img"
      aria-label={`Abzeichen MTF ${m.code}`}
      style={{ width: size, height: size, '--img': `url(${m.insignia})` } as React.CSSProperties}
    />
  );
}

export function ArchiveHub({ go }: { go: Go }) {
  const parts = [
    {
      key: 'scps',
      label: 'SCP-Objekte',
      sub: 'Anomaliendatenbank mit Eindämmungsakten.',
      n: SCP.length,
      to: { view: 'scps' } as const,
      icon: <ScpLogo size={44} />,
    },
    {
      key: 'departments',
      label: 'Abteilungen',
      sub: 'Interne Stellen der Foundation. Mobile Einsatzkräfte.',
      n: MTFS.length,
      to: { view: 'departments' } as const,
      icon: <MtfInsignia m={MTFS[1]} size={44} />,
    },
    {
      key: 'gois',
      label: 'Interessengruppen',
      sub: 'Organisationen außerhalb der Foundation mit Bezug zum Anomalen.',
      n: GOIS.length,
      to: { view: 'gois' } as const,
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" className="hub-goi-icon" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18 M12 3c3 3.2 3 14.8 0 18 M12 3c-3 3.2-3 14.8 0 18" />
        </svg>
      ),
    },
  ];
  return (
    <div className="page page-top">
      <div className="box archive-hero">
        <div>
          <div className="label">Datenbank · Site-80</div>
          <h2>Archiv</h2>
          <p className="dim">Wählen Sie einen Bestand.</p>
        </div>
        <ScpLogo size={64} />
      </div>
      <div className="hub-grid">
        {parts.map((p, i) => (
          <motion.button key={p.key} {...rise(i)} className={`box hub-card hub-${p.key}`} onClick={() => go(p.to)}>
            <span className="hub-icon">{p.icon}</span>
            <span className="hub-n">{p.n}</span>
            <strong>{p.label}</strong>
            <span className="dim small">{p.sub}</span>
            <span className="hub-go">Öffnen →</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const back = (go: Go, to: Parameters<Go>[0], label: string) => (
  <button className="link back" onClick={() => go(to)}>
    ← {label}
  </button>
);

export function Departments({ go }: { go: Go }) {
  // further departments come later; shown so the structure is clear
  const later = ['O5-Rat', 'RAISA', 'Ethikkomitee', 'Abteilung Memetik'];
  return (
    <div className="page page-top">
      {back(go, { view: 'archive' }, 'Archiv')}
      <div className="box archive-hero">
        <div>
          <div className="label">Foundation intern</div>
          <h2>Abteilungen</h2>
          <p className="dim">Mobile Einsatzkräfte (MTF) mit Zuständigkeit für Site-80.</p>
        </div>
      </div>
      <h3 className="hub-section">Mobile Einsatzkräfte</h3>
      <div className="mtf-grid">
        {MTFS.map((m, i) => (
          <motion.button key={m.id} {...rise(i)} className={`box mtf-card st-${m.status.replace(' ', '-')}`} onClick={() => go({ view: 'mtf', id: m.id })}>
            <MtfInsignia m={m} size={64} />
            <span className="mtf-card-text">
              <span className="dim small">MTF {m.code}</span>
              <strong>„{m.nickname}“</strong>
              <span className="mtf-status small">{m.status}</span>
            </span>
          </motion.button>
        ))}
      </div>
      <h3 className="hub-section">Weitere Abteilungen</h3>
      <div className="mtf-grid">
        {later.map((l) => (
          <div key={l} className="box mtf-card locked">
            <span className="mtf-lock">⬢</span>
            <span className="mtf-card-text">
              <strong>{l}</strong>
              <span className="dim small">Kein Eintrag freigegeben</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MtfView({ id, go }: { id: string; go: Go }) {
  const m = mtfById(id);
  const solved = useAdminUnlocked();
  if (!m) return <p className="page">Eintrag nicht gefunden.</p>;
  const objects = SCP.filter((s) => s.mtf === m.id);
  return (
    <div className="page">
      {back(go, { view: 'departments' }, 'Abteilungen')}
      <article className="scp-doc">
        <header className="box mtf-head">
          <motion.span initial={{ opacity: 0, scale: 0.7, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.6 }}>
            <MtfInsignia m={m} size={128} />
          </motion.span>
          <div>
            <div className="label">Mobile Task Force</div>
            <h2>{m.code}</h2>
            <p className="mtf-nick">„{m.nickname}“</p>
            <span className={`mtf-status st-${m.status.replace(' ', '-')}`}>{m.status}</span>
          </div>
        </header>
        <dl className="box mtf-facts">
          <div>
            <dt className="label">Stationierung</dt>
            <dd>{m.base}</dd>
          </div>
          <div>
            <dt className="label">Stärke</dt>
            <dd>{m.strength}</dd>
          </div>
          <div>
            <dt className="label">Führung</dt>
            <dd>{m.lead}</dd>
          </div>
        </dl>
        <section className="box doc-section">
          <h3>Auftrag</h3>
          {m.mission.map((p, i) => (
            <p key={i}>
              <Redacted text={p} />
            </p>
          ))}
          <div className="mtf-tags">
            {m.specialty.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </section>
        <section className="box doc-section">
          <h3>Zugewiesene Objekte</h3>
          {objects.length ? (
            <div className="linked">
              {objects.map((s) => (
                <button key={s.id} className="linked-card" onClick={() => go({ view: 'scp', id: s.id })}>
                  <span className="dim small">{s.id}</span>
                  <strong>{s.locked && !solved ? '[GESPERRT]' : (s.locked?.realName ?? s.name)}</strong>
                  <ClassBadge c={s.objectClass} />
                  <span className="linked-arrow">→</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="dim">Derzeit keinem Objekt an Site-80 zugewiesen.</p>
          )}
        </section>
      </article>
    </div>
  );
}

export function GoiList({ go }: { go: Go }) {
  return (
    <div className="page page-top">
      {back(go, { view: 'archive' }, 'Archiv')}
      <div className="box archive-hero">
        <div>
          <div className="label">Groups of Interest</div>
          <h2>Interessengruppen</h2>
          <p className="dim">Organisationen mit Kenntnis des Anomalen außerhalb der Foundation.</p>
        </div>
      </div>
      <div className="goi-grid">
        {GOIS.map((g, i) => (
          <motion.button key={g.id} {...rise(i)} className={`goi-card goi-${g.theme}`} onClick={() => go({ view: 'goi', id: g.id })}>
            <GoiMark theme={g.theme} />
            <span className="goi-card-text">
              <strong>{g.name}</strong>
              <span className="small">{g.short}</span>
              <span className="goi-threat small">Bedrohung: {g.threat}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Each group's own mark, drawn for this site.
function GoiMark({ theme }: { theme: 'valravn' | 'mcd' }) {
  return theme === 'valravn' ? (
    <svg className="goi-mark" viewBox="0 0 64 64" aria-hidden>
      {/* a raven's head in a shield */}
      <path className="goi-mark-frame" d="M32 3 L58 12 V32 C58 47 46 56 32 61 C18 56 6 47 6 32 V12 Z" />
      <path className="goi-mark-fill" d="M17 30 C22 21 33 18 41 22 L51 24 L42 28 C44 34 41 42 33 45 L35 52 L28 46 C21 44 16 38 17 30 Z" />
      <circle cx="35" cy="28" r="2.2" className="goi-mark-eye" />
    </svg>
  ) : (
    <svg className="goi-mark" viewBox="0 0 64 64" aria-hidden>
      {/* monogram in a double ring */}
      <circle cx="32" cy="32" r="29" className="goi-mark-frame" />
      <circle cx="32" cy="32" r="24.5" className="goi-mark-frame thin" />
      <text x="32" y="39" className="goi-mark-text">
        MC&amp;D
      </text>
    </svg>
  );
}

export function GoiView({ id, go }: { id: string; go: Go }) {
  const g = goiById(id);
  if (!g) return <p className="page">Eintrag nicht gefunden.</p>;
  return (
    <div className={`page goi-page goi-${g.theme}`}>
      {back(go, { view: 'gois' }, 'Interessengruppen')}
      <motion.header className="goi-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <GoiMark theme={g.theme} />
        <div>
          <div className="goi-kicker">Group of Interest · Akte Site-80</div>
          <h2>{g.name}</h2>
          <p className="goi-tagline">“{g.tagline}”</p>
        </div>
      </motion.header>

      <div className="goi-body">
        <aside className="goi-side">
          <dl>
            {g.facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div>
              <dt>Bedrohung</dt>
              <dd className={`goi-threat t-${g.threat}`}>{g.threat}</dd>
            </div>
          </dl>
          <div className="goi-stance">
            <span>Weisung der Foundation</span>
            <p>{g.stance}</p>
          </div>
        </aside>

        <div className="goi-main">
          {g.sections.map((s, i) => (
            <motion.section key={s.title} className="goi-section" {...rise(i + 1)}>
              <h3>{s.title}</h3>
              {s.body.map((p, j) => (
                <p key={j}>
                  <Redacted text={p} />
                </p>
              ))}
            </motion.section>
          ))}

          {g.ops && (
            <motion.section className="goi-section" {...rise(3)}>
              <h3>Bekannte Einsätze</h3>
              <ol className="goi-ops">
                {g.ops.map((o) => (
                  <li key={o.code}>
                    <span className="goi-op-code">{o.code}</span>
                    <strong>{o.place}</strong>
                    <span>{o.note}</span>
                  </li>
                ))}
              </ol>
            </motion.section>
          )}

          {g.items && (
            <motion.section className="goi-section" {...rise(3)}>
              <h3>Abgefangener Katalog</h3>
              <ul className="goi-lots">
                {g.items.map((it) => (
                  <li key={it.lot}>
                    <span className="goi-lot">{it.lot}</span>
                    <span className="goi-lot-name">
                      <strong>{it.name}</strong>
                      <em>{it.note}</em>
                    </span>
                    <span className="goi-price">{it.price}</span>
                  </li>
                ))}
              </ul>
              <p className="goi-disclaimer">Marshall, Carter and Dark Ltd. takes no responsibility for the misuse of this item.</p>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
