import { MTFS, mtfById, type Mtf } from '../data/mtf';
import { GOIS, goiById, type Goi } from '../data/gois';
import { SCP } from '../data/scp';
import type { Go } from './routes';
import Redacted from './Redacted';
import ScpLogo from '../components/ScpLogo';
import scpMark from '../../images/scipnet_terminal/scp_logo.svg';
import { ClassBadge } from './Archive';
import mcdLogo from '../../images/archive/group_of_interest/mcd_logo.svg';
import mcdMark from '../../images/archive/group_of_interest/mcd_logomark.svg';
import valravnLogo from '../../images/archive/group_of_interest/valravn_logo.svg';
import valravnMark from '../../images/archive/group_of_interest/valravn_logomark.svg';
import Pips from './Pips';
import { useAdminUnlocked } from './session';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FILTER_CARD } from './filterAnim';

// The archive hub and what hangs off it: SCP objects, Foundation departments
// (for now the Mobile Task Forces) and Groups of Interest, so the dock keeps one
// "Archiv" entry for all of them.

// Cards come in with a CSS animation on `translate` (styles.css .rise), so the
// hover lift on `transform` never fights it.
const rise = (i: number) => ({ '--i': i }) as React.CSSProperties;

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

const GLOBE = (
  <svg viewBox="0 0 24 24" className="hub-goi-icon" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20 M12 2c3.4 3.5 3.4 16.5 0 20 M12 2c-3.4 3.5-3.4 16.5 0 20" />
  </svg>
);

export function ArchiveHub({ go }: { go: Go }) {
  const parts = [
    { key: 'scps', label: 'SCP-Objekte', sub: 'Anomaliendatenbank mit Eindämmungsakten.', n: SCP.length, to: { view: 'scps' } as const, icon: <span className="hub-scp-mark" style={{ '--img': `url("${scpMark}")` } as React.CSSProperties} /> },
    { key: 'departments', label: 'Abteilungen', sub: 'Interne Stellen der Foundation. Mobile Task Forces.', n: MTFS.length, to: { view: 'departments' } as const, icon: <MtfInsignia m={MTFS[1]} size={52} /> },
    { key: 'gois', label: 'Interessengruppen', sub: 'Organisationen außerhalb der Foundation mit Bezug zum Anomalen.', n: GOIS.length, to: { view: 'gois' } as const, icon: GLOBE },
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
          <button key={p.key} style={rise(i)} className={`box hub-card rise hub-${p.key}`} onClick={() => go(p.to)}>
            <span className="hub-icon">{p.icon}</span>
            <span className="hub-n">{p.n}</span>
            <strong>{p.label}</strong>
            <span className="dim small">{p.sub}</span>
            <span className="hub-go">Öffnen →</span>
          </button>
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

const stKey = (m: Mtf) => m.status.replace(' ', '-');

const STATUS_FILTERS = ['Alle', 'Einsatzbereit', 'Im Einsatz', 'Bereitschaft', 'Klassifiziert'] as const;

// The Mobile Task Force list, built like the SCP list: one card per unit with
// its insignia, status pill and readiness, a mission line and a footer with
// its specialties. Filterable by status.
export function Departments({ go }: { go: Go }) {
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('Alle');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const items = MTFS.filter(
    (m) => (filter === 'Alle' || m.status === filter) && (!q || [m.code, m.nickname, ...m.specialty].some((s) => s.toLowerCase().includes(q))),
  );
  // further departments come later; shown so the structure is clear
  const later = ['O5-Rat', 'RAISA', 'Ethikkomitee', 'Abteilung Memetik'];
  return (
    <div className="page page-top">
      {back(go, { view: 'archive' }, 'Archiv')}
      <div className="box archive-hero">
        <div>
          <div className="label">Foundation intern · Site-80</div>
          <h2>Mobile Task Forces</h2>
          <p className="dim">
            {MTFS.length} Einheiten · {MTFS.filter((m) => m.status === 'Im Einsatz').length} im Einsatz
          </p>
        </div>
        <MtfInsignia m={MTFS[1]} size={60} />
      </div>

      <div className="archive-tools">
        <input className="search" placeholder="Einheit oder Name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips">
          {STATUS_FILTERS.map((f) => (
            <button key={f} className={filter === f ? 'chip active' : 'chip'} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="report-grid filter-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((m) => (
            <motion.button
              key={m.id}
              {...FILTER_CARD}
              className={`report-card scp-card2 mtf-card2 st-${stKey(m)}`}
              onClick={() => go({ view: 'mtf', id: m.id })}
            >
              <span className="scp-card2-top">
                <span className="mtf-card2-seal">
                  <MtfInsignia m={m} size={34} />
                </span>
                <span className="scp-card2-id">
                  <strong>MTF {m.code}</strong>
                  <span className={`state-pill mtf-pill st-${stKey(m)}`}>{m.status}</span>
                </span>
                <span className="mtf-ready" title="Bereitschaft" style={{ '--lvl': 'var(--s)' } as React.CSSProperties}>
                  <Pips n={Math.round(m.readiness / 20)} of={5} />
                  {m.readiness}%
                </span>
              </span>
              <strong className="report-card-title">„{m.nickname}“</strong>
              <span className="dim report-card-summary">
                <Redacted text={m.mission[0]} />
              </span>
              <span className="scp-card2-foot">
                {m.specialty.slice(0, 2).map((t) => (
                  <span key={t} className="card2-chip">
                    {t}
                  </span>
                ))}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      {!items.length && <p className="dim">Keine Einheit gefunden.</p>}

      <h3 className="hub-section">Weitere Abteilungen</h3>
      <div className="mtf-later">
        {later.map((l) => (
          <span key={l} className="card2-chip">
            {l} · kein Eintrag freigegeben
          </span>
        ))}
      </div>
    </div>
  );
}

// A unit's classification bar, built on the SCP file's ACS bar: header with
// the designation and status, a status panel with the insignia, rows for
// assigned objects and strength, the readiness gauge where the octagon sits, and
// the station and command below.
function MtfBar({ m }: { m: Mtf }) {
  const objects = SCP.filter((s) => s.mtf === m.id);
  return (
    <section className={`acs mtf-acs st-${stKey(m)}`}>
      <div className="acs-head mtf-acs-head">
        {/* the insignia, large, faint and slowly turning, behind the empty middle of the head */}
        <span className="mtf-hero-bg" style={{ '--img': `url(${m.insignia})` } as React.CSSProperties} aria-hidden />
        <div className="acs-id">
          <span className="label">Einheit #</span>
          <strong>MTF {m.code}</strong>
          <span className="acs-name">„{m.nickname}“</span>
        </div>
        <span className={`state-pill mtf-pill st-${stKey(m)}`}>{m.status}</span>
      </div>
      <div className="acs-grid">
        <div className="acs-contain">
          <div className="acs-texts">
            <span className="label">Bezeichnung:</span>
            <strong>„{m.nickname}“</strong>
            <small>{m.specialty.join(' · ')}</small>
            <span className="label">Status:</span>
            <strong>{m.status}</strong>
            <small>{STATUS_INFO[m.status]}</small>
          </div>
          <span className="acs-pill mtf-acs-pill">
            <MtfInsignia m={m} size={56} />
          </span>
        </div>

        <div className="acs-right">
          <div className="acs-rows">
            <div className="acs-row">
              <div className="acs-texts">
                <span className="label">Zugewiesene Objekte:</span>
                <strong>{objects.length ? objects.map((s) => s.id).join(', ') : 'Keine'}</strong>
                <small>{objects.length ? 'an Site-80 in Verwahrung' : 'derzeit ohne Zuweisung an Site-80'}</small>
              </div>
            </div>
            <div className="acs-row">
              <div className="acs-texts">
                <span className="label">Stärke:</span>
                <strong>
                  <Redacted text={m.strength} />
                </strong>
                <small>{m.log.length} Einträge im Einsatzprotokoll</small>
              </div>
            </div>
          </div>
          <div className="mtf-gauge" style={{ '--v': m.readiness } as React.CSSProperties}>
            <svg viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="42" className="mtf-gauge-track" />
              <circle cx="50" cy="50" r="42" className="mtf-gauge-fill" pathLength={100} style={{ strokeDashoffset: 100 - m.readiness }} />
            </svg>
            <span>
              <strong>{m.readiness}%</strong>
              <small>Bereitschaft</small>
            </span>
          </div>
        </div>

        <div className="acs-foot">
          <span className="label">Stationierung:</span>
          <strong>
            <Redacted text={m.base} />
          </strong>
        </div>
        <div className="acs-foot">
          <span className="label">Führung:</span>
          <strong>
            <Redacted text={m.lead} />
          </strong>
        </div>
      </div>
    </section>
  );
}

const STATUS_INFO: Record<Mtf['status'], string> = {
  Einsatzbereit: 'Vollständig verfügbar, kann sofort verlegt werden.',
  'Im Einsatz': 'Derzeit in einem laufenden Einsatz gebunden.',
  Bereitschaft: 'In Reserve, verlegbar binnen Stunden.',
  Klassifiziert: 'Status nur mit Freigabe Stufe 5 einsehbar.',
};

// A unit's file, laid out like an SCP file: title header, classification bar,
// then the document sections.
export function MtfView({ id, go }: { id: string; go: Go }) {
  const m = mtfById(id);
  const solved = useAdminUnlocked();
  if (!m) return <p className="page">Eintrag nicht gefunden.</p>;
  const objects = SCP.filter((s) => s.mtf === m.id);
  return (
    <div className="page">
      {back(go, { view: 'departments' }, 'Mobile Task Forces')}
      <article className={`scp-doc mtf-doc st-${stKey(m)}`}>
        <MtfBar m={m} />

        <section className="box doc-section">
          <h3>Auftrag</h3>
          {m.mission.map((p, i) => (
            <p key={i}>
              <Redacted text={p} />
            </p>
          ))}
          <div className="mtf-tags">
            {m.specialty.map((t) => (
              <span key={t} className="card2-chip">
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="box doc-section">
          <h3>Einsatzprotokoll</h3>
          <ol className="mtf-log">
            {m.log.map((l, i) => (
              <li key={i} className={l.tone ? `t-${l.tone}` : ''}>
                <time>{l.date}</time>
                <span>
                  <Redacted text={l.text} />
                </span>
              </li>
            ))}
          </ol>
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
          <button key={g.id} style={rise(i)} className={`goi-card rise goi-${g.theme}`} onClick={() => go({ view: 'goi', id: g.id })}>
            {/* banner in the group's own look, its mark large and faint behind */}
            <span className="goi-card-banner">
              <span className="goi-card-bg" aria-hidden>
                <GoiMark theme={g.theme} logo />
              </span>
              <GoiMark theme={g.theme} />
              <span className="goi-card-title">
                <span className="goi-kicker">Group of Interest</span>
                <strong>{g.name}</strong>
                <em>“{g.tagline}”</em>
              </span>
            </span>
            <span className="goi-card-body">
              <span className="small">{g.short}</span>
              <span className="goi-card-facts">
                {g.facts.slice(0, 2).map(([k, v]) => (
                  <span key={k}>
                    <span className="label">{k}</span>
                    {v}
                  </span>
                ))}
              </span>
              <span className="goi-card-foot">
                <Threat g={g} />
                <span className="goi-card-go">Akte öffnen →</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Each group's own mark and full logo (images/archive/group_of_interest), drawn
// as a mask so they take the group's accent colour in both modes.
const GOI_ART = {
  valravn: { mark: valravnMark, logo: valravnLogo },
  mcd: { mark: mcdMark, logo: mcdLogo },
};
function GoiMark({ theme, logo }: { theme: Goi['theme']; logo?: boolean }) {
  const art = GOI_ART[theme];
  return (
    <span
      className={logo ? 'goi-mark goi-logo' : 'goi-mark'}
      style={{ '--img': `url("${logo ? art.logo : art.mark}")` } as React.CSSProperties}
      aria-hidden
    />
  );
}

const LEVELS: Goi['threat'][] = ['Niedrig', 'Mittel', 'Hoch'];
function Threat({ g }: { g: Goi }) {
  const n = LEVELS.indexOf(g.threat) + 1;
  return (
    <span className={`goi-threat t-${g.threat}`}>
      <Pips n={n} of={LEVELS.length} />
      Bedrohung: {g.threat}
    </span>
  );
}

// A Group of Interest file. Every group shares one frame (cover, figures,
// numbered sections, side cards); the theme class brings the group's look.
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
export function GoiView({ id, go }: { id: string; go: Go }) {
  const g = goiById(id);
  if (!g) return <p className="page">Eintrag nicht gefunden.</p>;
  const num = (i: number) => (g.theme === 'mcd' ? ROMAN[i] : String(i + 1).padStart(2, '0'));
  const sections = [
    ...g.sections.map((s) => ({ title: s.title, node: s.body.map((p, j) => <p key={j}><Redacted text={p} /></p>) })),
    {
      title: g.intercept.title,
      node: (
        <figure className="gf-intercept">
          <figcaption>{g.intercept.source}</figcaption>
          {g.intercept.lines.map(([who, line], i) => (
            <p key={i} style={{ '--d': `${0.5 + i * 0.3}s` } as React.CSSProperties}>
              {who && <b>{who}</b>}
              <span>
                <Redacted text={line} />
              </span>
            </p>
          ))}
        </figure>
      ),
    },
    ...(g.ops
      ? [
          {
            title: 'Bekannte Einsätze',
            node: (
              <ol className="gf-ops">
                {g.ops.map((o) => (
                  <li key={o.code}>
                    <span className="gf-op-code">{o.code}</span>
                    <strong>{o.place}</strong>
                    <span>{o.note}</span>
                  </li>
                ))}
              </ol>
            ),
          },
        ]
      : []),
    ...(g.items
      ? [
          {
            title: 'Abgefangener Katalog',
            node: (
              <>
                <ul className="gf-lots">
                  {g.items.map((it) => (
                    <li key={it.lot}>
                      <span className="gf-lot">{it.lot}</span>
                      <strong>{it.name}</strong>
                      <em>{it.note}</em>
                      <span className="gf-price">{it.price}</span>
                    </li>
                  ))}
                </ul>
                <div className="gf-disclaimer">Marshall, Carter and Dark Ltd. takes no responsibility for the misuse of this item.</div>
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={`page gf goi-${g.theme}`}>
      {back(go, { view: 'gois' }, 'Interessengruppen')}

      <header className="gf-cover rise" style={rise(0)}>
        <span className="gf-cover-bg" aria-hidden>
          <GoiMark theme={g.theme} logo />
        </span>
        <div className="gf-cover-main">
          <GoiMark theme={g.theme} />
          <div>
            <div className="gf-kicker">Group of Interest · Akte Site-80</div>
            <h2>{g.name}</h2>
            <p className="gf-tagline">“{g.tagline}”</p>
          </div>
        </div>
        <div className="gf-cover-side">
          <span className="gf-status">{g.theme === 'mcd' ? 'Abgefangen' : 'Beobachtet'}</span>
          <Threat g={g} />
        </div>
      </header>

      <div className="gf-stats">
        {g.stats.map(([k, v, note], i) => (
          <div key={k} className="rise" style={rise(i + 1)}>
            <span>{k}</span>
            <strong>{v}</strong>
            {note && <small>{note}</small>}
          </div>
        ))}
      </div>

      <div className="gf-grid">
        <div className="gf-main">
          {sections.map((s, i) => (
            <section key={s.title} className="gf-sec rise" style={rise(i + 3)}>
              <header>
                <span className="gf-num">{num(i)}</span>
                <h3>{s.title}</h3>
              </header>
              {s.node}
            </section>
          ))}
        </div>

        <aside className="gf-side">
          <section className="gf-card rise" style={rise(3)}>
            <h4>Steckbrief</h4>
            <dl>
              {g.facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="gf-card gf-stance rise" style={rise(4)}>
            <h4>Weisung der Foundation</h4>
            <p>{g.stance}</p>
          </section>
          <section className="gf-card rise" style={rise(5)}>
            <h4>Begegnungen mit der Foundation</h4>
            <ol className="gf-encounters">
              {g.encounters.map((e) => (
                <li key={e.date} className={`t-${e.tone}`}>
                  <time>{e.date}</time>
                  <p>{e.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
