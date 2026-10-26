import { AnimatePresence, motion } from 'motion/react';
import { DISRUPTION, RISK, type Addendum, type ScpObject } from '../data/scp';
import Redacted from './Redacted';
import { mtfById } from '../data/mtf';
import { MtfInsignia } from './Departments';
import type { Go } from './routes';

// The file header after the wiki's Anomaly Classification System bar: containment
// and secondary class with their icons on the left, disruption and risk class on
// the right with the octagon emblem of all four, subclass and status underneath.
// Icons: images/acs (SCP Wiki, CC BY-SA 3.0, see LICENSE.txt there).

const ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('../../images/acs/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>).map(
    ([path, svg]) => [
      path.match(/([a-z]+)\.svg$/)![1],
      // drop the Illustrator header; the black parts take the page's ink colour
      svg.slice(svg.indexOf('<svg')).replace(/#010101/gi, 'var(--acs-ink)'),
    ],
  ),
);
const ICON_FOR: Record<string, string> = { neutralisiert: 'neutralized' };

export function AcsIcon({ name, className = '' }: { name: string; className?: string }) {
  const key = ICON_FOR[name.toLowerCase()] ?? name.toLowerCase();
  const svg = ICONS[key] ?? ICONS.esoteric;
  return <span className={`acs-ico ${className}`} aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />;
}

// Warning sign for notes and banners, drawn inside its box so the stroke is never clipped.
export function WarnIcon({ shape = 'triangle' }: { shape?: 'triangle' | 'octagon' }) {
  const oct = shape === 'octagon';
  return (
    <svg className={`warn-icon ${shape}`} viewBox="0 0 24 24" aria-hidden>
      {oct ? <polygon points="8,2 16,2 22,8 22,16 16,22 8,22 2,16 2,8" /> : <path d="M12 3 L22 20 H2 Z" />}
      <line x1="12" y1={oct ? 7 : 9.5} x2="12" y2={oct ? 13.5 : 14.5} />
      <circle cx="12" cy={oct ? 17 : 17.3} r="0.6" />
    </svg>
  );
}

// Clearance levels and class meanings after the Classification Committee memo
// (scp-wiki.wikidot.com/classification-committee-memo).
const CLEARANCE = [
  { name: 'Uneingeschränkt', info: 'Für alle Mitarbeitenden einsehbar.' },
  { name: 'Eingeschränkt', info: 'Ab Freigabe Stufe 2.' },
  { name: 'Vertraulich', info: 'Ab Freigabe Stufe 3.' },
  { name: 'Geheim', info: 'Ab Freigabe Stufe 4.' },
  { name: 'Streng geheim', info: 'Gesperrt ohne ausdrückliche Genehmigung des O5-Rats.' },
];
const INFO: Record<string, string> = {
  Safe: 'Statische Klasse. Zuverlässig und vollständig eindämmbar.',
  Euclid: 'Statische Klasse. Verhalten nicht vollständig vorhersagbar.',
  Keter: 'Statische Klasse. Eindämmung aufwendig und störanfällig.',
  Neutralisiert: 'Statische Klasse. Nicht mehr anomal.',
  Esoteric: 'Sonderfall. Eindämmung über die statischen Klassen hinaus, siehe Sekundärklasse.',
  Thaumiel: 'Wird von der Foundation zur Eindämmung anderer Anomalien eingesetzt.',
  Nachrichtlich: 'Wirkt über übertragene Information.',
  Dark: 'Kaum Potenzial, die Allgemeinheit zu stören.',
  Vlam: 'Geringes Potenzial, Störung meist örtlich begrenzt.',
  Keneq: 'Mittleres Potenzial, Störung auf Region oder Stadt begrenzt.',
  Ekhi: 'Hohes Potenzial, Störung weitreichend bis landesweit.',
  Amida: 'Weltweite Störung, globale Bedrohung der Normalität.',
  Notice: 'Geringes Risiko. Kaum spürbare Wirkung, selten Schaden.',
  Caution: 'Mäßiges Risiko. Spürbare Wirkung, möglicher Schaden.',
  Warning: 'Hohes Risiko. Akute Wirkung bis hin zu schwerem Schaden.',
  Danger: 'Sehr hohes Risiko. Schaden für Anwesende unvermeidlich.',
  Critical: 'Extremes Risiko. Lebensbedrohlich und nicht abwendbar.',
};

// The emblem: an octagon with the four icons in a diamond (containment on top,
// risk right, secondary below, disruption left), split by arrows that point
// out to the corners.
function Emblem({ cls, sec, dis, risk }: { cls: string; sec?: string; dis: string; risk: string }) {
  const arrow = (r: number) => (
    <g key={r} transform={`rotate(${r} 50 50)`}>
      <line x1="50" y1="38" x2="50" y2="-8" />
      <path d="M45 -3 L50 -10 L55 -3" />
    </g>
  );
  return (
    <div className="acs-emblem" aria-hidden>
      <svg viewBox="0 0 100 100">
        <polygon className="acs-oct" points="30,1 70,1 99,30 99,70 70,99 30,99 1,70 1,30" />
        <polygon className="acs-oct-in" points="32,6 68,6 94,32 94,68 68,94 32,94 6,68 6,32" />
      </svg>
      <span className={`top class-${cls}`}>
        <AcsIcon name={cls} />
      </span>
      <span className={`right risk-${risk}`}>
        <AcsIcon name={risk} />
      </span>
      <span className={`bottom ${sec ? 'sec' : 'empty'}`}>{sec && <AcsIcon name={sec} />}</span>
      <span className={`left dis-${dis}`}>
        <AcsIcon name={dis} />
      </span>
      <svg viewBox="0 0 100 100" className="acs-arrows-layer">
        <g className="acs-arrows">{[45, 135, 225, 315].map(arrow)}</g>
      </svg>
    </div>
  );
}

export function AcsBar({ s, go }: { s: ScpObject; go: Go }) {
  const mtf = s.mtf ? mtfById(s.mtf) : undefined;
  const level = Math.min(5, Number(s.clearance.match(/\d/)?.[0] ?? 1));
  const cls = s.acs.containment ?? s.objectClass;
  const sec = s.acs.secondary;
  const dis = DISRUPTION.indexOf(s.acs.disruption) + 1;
  const risk = RISK.indexOf(s.acs.risk) + 1;
  const clear = CLEARANCE[level - 1];
  return (
    <section className="acs">
      <div className={`acs-head lvl-${level}`}>
        <div className="acs-id">
          <span className="label">Item #</span>
          <strong>{s.id}</strong>
        </div>
        <div className="acs-clear" title={clear.info}>
          <span className="acs-lvl-badge">
            <small>Level</small>
            {level}
          </span>
          <span className="acs-clear-text">
            <strong>{clear.name}</strong>
            <span className="acs-level-bars" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < level ? 'on' : ''} style={{ animationDelay: `${0.25 + i * 0.07}s` }} />
              ))}
            </span>
            <small>{clear.info}</small>
          </span>
        </div>
      </div>
      <div className="acs-grid">
        <div className={`acs-contain class-${cls}`}>
          <div className="acs-texts">
            <span className="label">Eindämmungsklasse:</span>
            <strong title={INFO[cls]}>{cls}</strong>
            {INFO[cls] && <small>{INFO[cls]}</small>}
            {sec && (
              <>
                <span className="label">Sekundärklasse:</span>
                <strong title={INFO[sec]}>{sec}</strong>
                {INFO[sec] && <small>{INFO[sec]}</small>}
              </>
            )}
          </div>
          {/* with a secondary class the pill slides open like a switch to show it */}
          <span className={`acs-pill${sec ? ' two' : ''}`}>
            <AcsIcon name={cls} />
            {sec && <AcsIcon name={sec} className="sec" />}
          </span>
        </div>

        <div className="acs-right">
          <div className="acs-rows">
            <div className={`acs-row dis-${s.acs.disruption}`}>
              <div className="acs-texts">
                <span className="label">Störungsklasse:</span>
                <strong>{s.acs.disruption}</strong>
                <small>{INFO[s.acs.disruption]}</small>
              </div>
              <span className="acs-badge">
                <b>{dis}</b>
                <AcsIcon name={s.acs.disruption} />
              </span>
            </div>
            <div className={`acs-row risk-${s.acs.risk}`}>
              <div className="acs-texts">
                <span className="label">Risikoklasse:</span>
                <strong>{s.acs.risk}</strong>
                <small>{INFO[s.acs.risk]}</small>
              </div>
              <span className="acs-badge">
                <b>{risk}</b>
                <AcsIcon name={s.acs.risk} />
              </span>
            </div>
          </div>
          <Emblem cls={cls} sec={sec} dis={s.acs.disruption} risk={s.acs.risk} />
        </div>

        <div className={`acs-foot${s.acs.subclass ? '' : ' empty'}`}>
          <span className="label">Subklasse:</span>
          <strong>{s.acs.subclass ?? '—'}</strong>
        </div>
        <div className={`acs-foot risk-${s.acs.risk}`}>
          <span className="label">Status:</span>
          <strong>{s.acs.status}</strong>
        </div>

        {mtf && (
          <button className="acs-mtf" onClick={() => go({ view: 'mtf', id: mtf.id })}>
            <MtfInsignia m={mtf} size={46} />
            <span className="acs-texts">
              <span className="label">Zugewiesene Einsatzkraft:</span>
              <strong>
                MTF {mtf.code} <span className="acs-mtf-nick">„{mtf.nickname}“</span>
              </strong>
            </span>
            <span className="acs-mtf-status">{mtf.status}</span>
            <span className="acs-mtf-go">Einheit öffnen →</span>
          </button>
        )}
      </div>
    </section>
  );
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const KIND: Record<Addendum['kind'], string> = {
  recovery: 'Bergungsprotokoll',
  test: 'Testprotokoll',
  interview: 'Transkript',
  incident: 'Vorfallbericht',
  note: 'Notiz',
};

// One body line: <...> is a stage direction, "Name: text" a speaker line in a transcript.
function Line({ text, transcript }: { text: string; transcript: boolean }) {
  const stage = text.match(/^<(.*)>$/);
  if (stage)
    return (
      <p className="fade-text add-stage">
        <em>&lt;{stage[1]}&gt;</em>
      </p>
    );
  const say = transcript && text.match(/^([^:]{1,30}):\s(.*)$/);
  if (say)
    return (
      <p className="fade-text add-say">
        <strong>{say[1]}:</strong> <Redacted text={say[2]} />
      </p>
    );
  return (
    <p className="fade-text">
      <Redacted text={text} />
    </p>
  );
}

export function AddendumBox({ a, n, id, open, toggle }: { a: Addendum; n: number; id: string; open: boolean; toggle: () => void }) {
  const num = `${id.replace('SCP-', '')}/${ROMAN[n] ?? n + 1}`;
  const transcript = a.kind === 'interview';
  return (
    <div className={`box addendum kind-${a.kind}${open ? ' open' : ''}`}>
      <button className="addendum-head" onClick={toggle} aria-expanded={open}>
        <span>
          <span className="label">
            Addendum {num} · {KIND[a.kind]}
          </span>
          {a.title}
        </span>
        <span className="addendum-arrow">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="addendum-body">
              {a.meta && (
                <dl className="add-meta">
                  {a.meta.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}:</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {transcript ? (
                <div className="add-transcript">
                  <div className="add-frame">« Beginn Transkript »</div>
                  {a.body.map((p, j) => (
                    <Line key={j} text={p} transcript />
                  ))}
                  <div className="add-frame">« Ende Transkript »</div>
                </div>
              ) : a.kind === 'note' ? (
                <blockquote className="add-note">
                  {a.body.map((p, j) => (
                    <Line key={j} text={p} transcript={false} />
                  ))}
                  {a.sign && <footer>— {a.sign}</footer>}
                </blockquote>
              ) : (
                a.body.map((p, j) => <Line key={j} text={p} transcript={false} />)
              )}
              <div className="add-end">Ende Addendum {num}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
