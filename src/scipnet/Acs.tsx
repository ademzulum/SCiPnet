import { AnimatePresence, motion } from 'motion/react';
import { DISRUPTION, RISK, type Addendum, type ScpObject } from '../data/scp';
import Redacted from './Redacted';

// The file header after the wiki's Anomaly Classification System bar: containment
// and secondary class with their icons on the left, disruption and risk class on
// the right with the diamond of all four, subclass and status underneath.
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

const CLEARANCE = ['Uneingeschränkt', 'Eingeschränkt', 'Vertraulich', 'Geheim', 'Streng geheim', 'Kosmisch streng geheim'];

export function AcsBar({ s }: { s: ScpObject }) {
  const level = Number(s.clearance.match(/\d/)?.[0] ?? 1);
  const cls = s.acs.containment ?? s.objectClass;
  const sec = s.acs.secondary;
  const dis = DISRUPTION.indexOf(s.acs.disruption) + 1;
  const risk = RISK.indexOf(s.acs.risk) + 1;
  return (
    <section className="acs">
      <div className={`acs-head lvl-${level}`}>
        <span>
          <span className="label">Item #</span> <strong>{s.id}</strong>
        </span>
        <span className="acs-level">
          <span className="acs-level-bars" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} className={i < level ? 'on' : ''} style={{ animationDelay: `${0.2 + i * 0.06}s` }} />
            ))}
          </span>
          Level {level} · {CLEARANCE[level - 1]}
        </span>
      </div>
      <div className="acs-grid">
        <div className={`acs-contain class-${cls}`}>
          <div className="acs-texts">
            <span className="label">Eindämmungsklasse:</span>
            <strong>{cls}</strong>
            {sec && (
              <>
                <span className="label">Sekundärklasse:</span>
                <strong>{sec}</strong>
              </>
            )}
          </div>
          <span className="acs-pill">
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
              </div>
              <span className="acs-badge">
                <b>{risk}</b>
                <AcsIcon name={s.acs.risk} />
              </span>
            </div>
          </div>
          {/* the diamond: containment on top, risk right, disruption left, secondary below */}
          <div className="acs-diamond" aria-hidden>
            <span className={`class-${cls}`}>
              <AcsIcon name={cls} />
            </span>
            <span className={`risk-${s.acs.risk}`}>
              <AcsIcon name={s.acs.risk} />
            </span>
            <span className={`dis-${s.acs.disruption}`}>
              <AcsIcon name={s.acs.disruption} />
            </span>
            <span className={sec ? 'sec' : 'empty'}>{sec && <AcsIcon name={sec} />}</span>
          </div>
        </div>

        <div className={`acs-foot${s.acs.subclass ? '' : ' empty'}`}>
          <span className="label">Subklasse:</span>
          <strong>{s.acs.subclass ?? '—'}</strong>
        </div>
        <div className={`acs-foot risk-${s.acs.risk}`}>
          <span className="label">Status:</span>
          <strong>{s.acs.status}</strong>
        </div>
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
