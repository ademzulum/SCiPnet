import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { personById, type Person } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { threadForContact } from '../data/threads';
import type { Go } from './routes';
import Redacted from './Redacted';
import { ReportRow } from './ReportList';
import { biometric, psychAccess } from './session';
import Tabs from './Tabs';
import BiometricGate from './BiometricGate';
import Portrait from './Portrait';
import { play } from '../lib/sound';

const TABS = ['Akte', 'Werdegang', 'Psychologie', 'Vorfälle', 'Berichte'] as const;
type Tab = (typeof TABS)[number];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fmtDate = (d: string) => new Date(d).toLocaleDateString('de-DE');

export default function PersonnelFile({ id, go }: { id: string; go: Go }) {
  const p = personById(id);
  const [tab, setTab] = useState<Tab>('Akte');
  const [verified, setVerified] = useState(() => biometric.has(id));
  if (!p) return <p className="page">Akte nicht gefunden.</p>;
  if (!verified)
    return (
      <BiometricGate
        key={p.id}
        person={p}
        onCancel={() => go({ view: 'personnel' })}
        onVerified={() => {
          biometric.grant(p.id);
          setVerified(true);
        }}
      />
    );
  const thread = threadForContact(p.id);

  const fields: [string, string][] = [
    ['Kennung', p.id],
    ['Funktion', p.role],
    ['Abteilung', p.department],
    ['Freigabe', p.clearance],
    ['Status', p.status],
    ['Im Dienst seit', p.since],
  ];

  return (
    <div className="page">
      <button className="link back" onClick={() => go({ view: 'personnel' })}>
        ← Personalakten
      </button>

      <div className="dossier box">
        <Portrait person={p} />
        <div className="dossier-main">
          <div className="dossier-title">
            <h2>{p.name}</h2>
            <span className={`status status-${p.status}`}>{p.status}</span>
          </div>
          {p.quote && <p className="quote">„{p.quote}“</p>}
          <dl className="fields">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="actions">
            <button
              className="card action"
              disabled={!thread}
              onClick={() => thread && go({ view: 'thread', id: thread.id })}
            >
              {thread ? 'NACHRICHT SENDEN' : 'KEIN KANAL'}
            </button>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'Akte' && <FileTab p={p} />}
          {tab === 'Werdegang' && (
            <ol className="timeline">
              {p.timeline.map((e, i) => {
                const latest = i === p.timeline.length - 1;
                return (
                  <li
                    key={e.year + e.text}
                    className={latest ? 'latest' : ''}
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <span className="tl-year">{e.year}</span>
                    <span className="tl-node" />
                    <div className="tl-card">
                      {latest && <span className="tl-tag">Aktuell</span>}
                      <Redacted text={e.text} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {tab === 'Psychologie' && <PsychTab key={p.id} p={p} />}
          {tab === 'Vorfälle' && (
            <div className="incidents">
              {p.incidents.map((n) => (
                <div key={n} className={/^Keine/.test(n) ? 'incident none' : 'incident'}>
                  <Redacted text={n} />
                </div>
              ))}
            </div>
          )}
          {tab === 'Berichte' && <ReportsTab p={p} go={go} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FileTab({ p }: { p: Person }) {
  return (
    <div className="stack">
      <section className="box">
        <h3>Zusammenfassung</h3>
        <p>
          <Redacted text={p.summary} />
        </p>
      </section>
      <section className="box">
        <h3>Vermerke</h3>
        <ul className="notices">
          {p.notes.map((n) => (
            <li key={n}>
              <Redacted text={n} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PsychTab({ p }: { p: Person }) {
  const [phase, setPhase] = useState<'locked' | 'asking' | 'granted' | 'denied'>(() =>
    psychAccess.has(p.id) ? 'granted' : 'locked',
  );
  const request = async () => {
    setPhase('asking');
    await wait(1500);
    if (p.psych.access === 'granted') psychAccess.grant(p.id);
    else play('negative', 0.8);
    setPhase(p.psych.access);
  };

  if (phase === 'granted') {
    const { verdict, date, metrics = [], text } = p.psych;
    return (
      <div className="stack">
        <div className="box psych-head">
          <div>
            <div className="label">Gesamtbeurteilung</div>
            {verdict && <span className={`verdict verdict-${verdict.tone}`}>{verdict.label}</span>}
          </div>
          {date && (
            <div className="psych-date">
              <div className="label">Letzte Beurteilung</div>
              {fmtDate(date)}
            </div>
          )}
        </div>

        {metrics.length > 0 && (
          <div className="metrics">
            {metrics.map((m, i) => (
              <div key={m.label} className="box metric">
                <div className="metric-top">
                  <span className="label">{m.label}</span>
                  <span className="metric-value">{m.value}</span>
                </div>
                <div className="meter">
                  <motion.div
                    className={m.value < 40 ? 'meter-fill low' : 'meter-fill'}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="box">
          <h3>Beobachtungen</h3>
          <ol className="observations">
            {text.map((n, i) => (
              <li key={n}>
                <span className="obs-index">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <Redacted text={n} />
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  return (
    <div className={phase === 'denied' ? 'box locked-box denied' : 'box locked-box'}>
      <span className="lock-icon" aria-hidden>
        ⬢
      </span>
      <div>
        <div className="label">Psychologisches Profil</div>
        <p>{phase === 'denied' ? `Zugriff verweigert. Erforderlich: ${p.psych.required}.` : 'Diese Akte ist geschützt.'}</p>
      </div>
      {phase !== 'denied' && (
        <button className="card action" onClick={request} disabled={phase === 'asking'}>
          {phase === 'asking' ? <span className="dots">ANFRAGE LÄUFT</span> : 'ZUGRIFF ANFORDERN'}
        </button>
      )}
    </div>
  );
}

function ReportsTab({ p, go }: { p: Person; go: Go }) {
  const reports = REPORTS.filter((r) => r.author === p.id);
  if (!reports.length) return <p className="dim">Keine Feldberichte verfasst.</p>;
  return (
    <div className="rows box">
      {reports.map((r) => (
        <ReportRow key={r.id} report={r} go={go} />
      ))}
    </div>
  );
}
