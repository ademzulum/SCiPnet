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
import { useAdminUnlocked } from './session';

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

// the three fact tiles under the MTF header: label, line icon, value
const FACTS: [string, string, (m: Mtf) => string][] = [
  ['Stationierung', 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z M12 7.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z', (m) => m.base],
  ['Stärke', 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14.5c1.8.8 3 2.6 3 5', (m) => m.strength],
  ['Führung', 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z', (m) => m.lead],
];

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
          <p className="dim">Mobile Task Forces (MTF) mit Zuständigkeit für Site-80.</p>
        </div>
      </div>
      <h3 className="hub-section">Mobile Task Forces</h3>
      <div className="mtf-grid">
        {MTFS.map((m, i) => (
          <button key={m.id} style={rise(i)} className={`box mtf-card rise st-${stKey(m)}`} onClick={() => go({ view: 'mtf', id: m.id })}>
            <MtfInsignia m={m} size={64} />
            <span className="mtf-card-text">
              <span className="dim small">MTF {m.code}</span>
              <strong>„{m.nickname}“</strong>
              <span className="mtf-status small">{m.status}</span>
            </span>
          </button>
        ))}
      </div>
      <h3 className="hub-section">Weitere Abteilungen</h3>
      <div className="mtf-grid">
        {later.map((l, i) => (
          <div key={l} style={rise(i + MTFS.length)} className="box mtf-card rise locked">
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
      <article className={`mtf-file st-${stKey(m)}`}>
        <header className="box mtf-hero">
          {/* the insignia again, huge and faint, behind the header */}
          <span className="mtf-hero-bg" style={{ '--img': `url(${m.insignia})` } as React.CSSProperties} aria-hidden />
          <div className="mtf-seal">
            <span className="mtf-seal-ring" aria-hidden />
            <span className="mtf-seal-ring r2" aria-hidden />
            <MtfInsignia m={m} size={120} />
          </div>
          <div className="mtf-hero-text">
            <div className="label">Mobile Task Force · Akte Site-80</div>
            <h2>
              MTF <span>{m.code}</span>
            </h2>
            <p className="mtf-nick">„{m.nickname}“</p>
            <span className="mtf-status big">
              <i /> {m.status}
            </span>
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
        </header>

        <div className="mtf-facts">
          {FACTS.map(([k, icon, get], i) => (
            <div key={k} className="box mtf-fact rise" style={rise(i)}>
              <span className="mtf-fact-icon" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d={icon} />
                </svg>
              </span>
              <span className="mtf-fact-text">
                <span className="label">{k}</span>
                <strong>
                  <Redacted text={get(m)} />
                </strong>
              </span>
              <span className="mtf-fact-idx" aria-hidden>
                0{i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="mtf-cols">
          <section className="box doc-section rise" style={rise(3)}>
            <h3>Auftrag</h3>
            {m.mission.map((p, i) => (
              <p key={i}>
                <Redacted text={p} />
              </p>
            ))}
            <div className="mtf-tags">
              {m.specialty.map((t) => (
                <span key={t} className="mtf-tag">
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section className="box doc-section rise" style={rise(4)}>
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
        </div>

        <section className="box doc-section rise" style={rise(5)}>
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
      <span className="goi-threat-bars" aria-hidden>
        {LEVELS.map((l, i) => (
          <i key={l} className={i < n ? 'on' : ''} />
        ))}
      </span>
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
