import { AnimatePresence, motion } from 'motion/react';
import { DISRUPTION, RISK, type Addendum, type ScpObject } from '../data/scp';
import Redacted from './Redacted';

// The file header after the wiki's Anomaly Classification System: item number
// and clearance on the left, the four classes in the middle, and the octagon
// on the right (containment class around the rim, disruption on the left half,
// risk on the right half). Subclass and status sit in a strip underneath.

const CLEARANCE = ['Uneingeschränkt', 'Eingeschränkt', 'Vertraulich', 'Geheim', 'Streng geheim', 'Kosmisch streng geheim'];
const CLASS_GLYPH: Record<string, string> = {
  Safe: '■',
  Euclid: '◉',
  Keter: '▲',
  Thaumiel: '✦',
  Esoteric: '✦',
  Neutralisiert: '✕',
};

function Pips({ n, of = 5 }: { n: number; of?: number }) {
  return (
    <span className="acs-pips" aria-hidden>
      {Array.from({ length: of }, (_, i) => (
        <i key={i} className={i < n ? 'on' : ''} />
      ))}
    </span>
  );
}

function Octagon({ cls, disruption, risk }: { cls: string; disruption: string; risk: string }) {
  // regular octagon in a 100 box
  const pts = '30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30';
  return (
    <svg className="acs-octagon" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <clipPath id="acs-oct">
          <polygon points={pts} />
        </clipPath>
      </defs>
      <g clipPath="url(#acs-oct)">
        <rect x="0" y="0" width="50" height="100" className={`acs-fill dis-${disruption}`} />
        <rect x="50" y="0" width="50" height="100" className={`acs-fill risk-${risk}`} />
      </g>
      <polygon points={pts} className={`acs-rim class-${cls}`} />
      <line x1="50" y1="6" x2="50" y2="94" className="acs-split" />
      <circle cx="50" cy="50" r="22" className={`acs-core class-${cls}`} />
      <text x="50" y="51" className={`acs-glyph class-${cls}`}>
        {CLASS_GLYPH[cls] ?? '?'}
      </text>
    </svg>
  );
}

export function AcsBar({ s }: { s: ScpObject }) {
  const level = Number(s.clearance.match(/\d/)?.[0] ?? 1);
  const cls = s.acs.containment ?? s.objectClass;
  const dis = DISRUPTION.indexOf(s.acs.disruption) + 1;
  const risk = RISK.indexOf(s.acs.risk) + 1;
  return (
    <section className="acs box">
      <div className="acs-main">
        <div className={`acs-item lvl-${level}`}>
          <span className="label">Item #</span>
          <strong className="acs-num">{s.id}</strong>
          <span className="acs-level">
            <span className="acs-level-bars" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <i key={i} className={i < level ? 'on' : ''} />
              ))}
            </span>
            Level {level} · {CLEARANCE[level - 1]}
          </span>
        </div>
        <div className="acs-classes">
          <div className={`acs-cell class-${cls}`}>
            <span className="label">Eindämmungsklasse</span>
            <strong>
              <span className="acs-icon">{CLASS_GLYPH[cls] ?? '?'}</span>
              {cls}
            </strong>
          </div>
          <div className={`acs-cell${s.acs.secondary ? ` class-${s.acs.secondary}` : ' none'}`}>
            <span className="label">Sekundärklasse</span>
            <strong>
              {s.acs.secondary && <span className="acs-icon">{CLASS_GLYPH[s.acs.secondary] ?? '◆'}</span>}
              {s.acs.secondary ?? 'Keine'}
            </strong>
          </div>
          <div className={`acs-cell dis-${s.acs.disruption}`}>
            <span className="label">Störungsklasse</span>
            <strong>
              <span className="acs-num-icon">{dis}</span>
              {s.acs.disruption}
            </strong>
            <Pips n={dis} />
          </div>
          <div className={`acs-cell risk-${s.acs.risk}`}>
            <span className="label">Risikoklasse</span>
            <strong>
              <span className="acs-num-icon">{risk}</span>
              {s.acs.risk}
            </strong>
            <Pips n={risk} />
          </div>
        </div>
        <Octagon cls={cls} disruption={s.acs.disruption} risk={s.acs.risk} />
      </div>
      <div className="acs-strip">
        {s.acs.subclass && (
          <span>
            <span className="label">Subklasse</span> {s.acs.subclass}
          </span>
        )}
        <span>
          <span className="label">Status</span> {s.acs.status}
        </span>
        <span>
          <span className="label">Standort</span> Site-80
        </span>
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
