import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { personById, type Person } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { threadForContact } from '../data/threads';
import type { Go } from './routes';
import Redacted from './Redacted';
import { classKey } from './ReportList';
import { initials } from './Comms';
import { adminAccess, biometric, psychAccess, useAccount } from './session';
import { ClearancePips } from './PersonnelList';
import BiometricGate from './BiometricGate';
import Portrait from './Portrait';
import { BrainScan, Eeg, Vitals } from './PsychScan';
import { play } from '../lib/sound';

const TABS = ['Akte', 'Werdegang', 'Psychologie', 'Vorfälle', 'Berichte'] as const;
type Tab = (typeof TABS)[number];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Bars from the character codes of the id, so every file has its own code.
const barcode = (id: string) =>
  [...id].map((c, i) => (c.charCodeAt(0) + i) % 3 ? '▌' : '▍').join('');
const fmtDate = (d: string) => new Date(d).toLocaleDateString('de-DE');

export default function PersonnelFile({ id, go }: { id: string; go: Go }) {
  const p = personById(id);
  const [tab, setTab] = useState<Tab>('Akte');
  const [, setPsychTick] = useState(0); // re-render the section cards once the profile opens
  const account = useAccount();
  const admin = account.id === 'admin';
  const [opened] = useState(() => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
  const [verified, setVerified] = useState(() => biometric.has(id));
  if (!p) return <p className="page">Akte nicht gefunden.</p>;
  // the Administrator's clearance overrides the biometric check
  if (!verified && !admin)
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

  const years = /^\d{4}$/.test(p.since) ? new Date().getFullYear() - Number(p.since) : '—';
  const incidents = p.incidents.filter((n) => !/^Keine/.test(n)).length;
  const reports = REPORTS.filter((r) => r.author === p.id || r.involved?.includes(p.id)).length;
  const psychOpen = admin || psychAccess.has(p.id);
  // one card per section: what it holds at a glance, click to open it
  const nav: { tab: Tab; value: string | number; sub: string; warn?: boolean }[] = [
    { tab: 'Akte', value: p.notes.length, sub: 'Vermerke' },
    { tab: 'Werdegang', value: p.timeline.length, sub: `Stationen · ${years} Dienstjahre` },
    {
      tab: 'Psychologie',
      // a missing assessment shows as N/A so the card never cuts the word off
      value: psychOpen ? (!p.psych.verdict || /^Nicht bewert/i.test(p.psych.verdict.label) ? 'N/A' : p.psych.verdict.label) : 'Gesperrt',
      sub: psychOpen ? 'Gesamtbeurteilung' : `Freigabe ${p.psych.required ?? 'erforderlich'}`,
      warn: !psychOpen,
    },
    { tab: 'Vorfälle', value: incidents, sub: incidents === 1 ? 'Vorfall' : 'Vorfälle', warn: incidents > 0 },
    { tab: 'Berichte', value: reports, sub: 'Feldberichte' },
  ];

  return (
    <div className="page page-top">
      <button className="link back" onClick={() => go({ view: 'personnel' })}>
        ← Personalakten
      </button>

      <div className={`dossier-sheet box st-${p.status}`}>
        <div className="dossier-strip">
          <span>PERSONALAKTE · SITE-80</span>
          <span className="barcode" aria-hidden>
            {barcode(p.id)}
          </span>
          <span>
            ABGERUFEN: {account.name.toUpperCase()} · {opened}
          </span>
        </div>
        <div className="dossier">
          <Portrait person={p} />
          <div className="dossier-main">
            <div className="label">{p.department}</div>
            <div className="dossier-title">
              <h2>{p.name}</h2>
              <span className={`status status-${p.status}`}>{p.status}</span>
            </div>
            {p.quote && <p className="quote">„{p.quote}“</p>}
            <dl className="fields">
              {fields.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {v}
                    {k === 'Freigabe' && <ClearancePips c={v} />}
                  </dd>
                </div>
              ))}
            </dl>
            {admin && <p className="declass-hint small">◉ Freigabe Stufe 6 · Geschwärzte Passagen anklicken, um sie aufzuheben.</p>}
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
      </div>

      <nav className="file-nav" role="tablist" aria-label="Abschnitte der Akte">
        {nav.map((n, i) => (
          <button
            key={n.tab}
            role="tab"
            aria-selected={tab === n.tab}
            className={tab === n.tab ? 'fnav active' : 'fnav'}
            onClick={() => setTab(n.tab)}
          >
            {tab === n.tab && <motion.span layoutId="fnav-active" className="fnav-bar" transition={{ duration: 0.25 }} />}
            <span className="fnav-top">
              <span className="fnav-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="fnav-name">{n.tab}</span>
            </span>
            {/* long words (e.g. "Unter Beobachtung") get a smaller size and may wrap, never "…" */}
            <span className={`fnav-value${n.warn ? ' warn-text' : ''}${String(n.value).length > 11 ? ' long' : ''}`}>{n.value}</span>
            <span className="fnav-sub">{n.sub}</span>
          </button>
        ))}
      </nav>

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
            <section className="box file-panel">
              <div className="box-head">
                <h3>Werdegang</h3>
                <span className="dim small">
                  {p.timeline[0]?.year}–{p.timeline[p.timeline.length - 1]?.year} · {p.timeline.length} Stationen
                </span>
              </div>
              <ol className="career">
                {p.timeline.map((e, i) => {
                  const latest = i === p.timeline.length - 1;
                  return (
                    <li key={e.year + e.text} className={latest ? 'latest' : ''} style={{ animationDelay: `${i * 60}ms` }}>
                      <span className="career-node" />
                      {/* an unknown year ("[unbekannt]") shows as ???? so it fits the column */}
                      {/^\d{4}$/.test(e.year) ? (
                        <span className="career-year">{e.year}</span>
                      ) : (
                        <span className="career-year unknown" title={e.year}>
                          ????
                        </span>
                      )}
                      <span className="career-text">
                        {latest && <span className="tl-tag">Aktuell</span>}
                        <Redacted text={e.text} />
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
          {tab === 'Psychologie' && <PsychTab key={p.id} p={p} onGranted={() => setPsychTick((n) => n + 1)} />}
          {tab === 'Vorfälle' && (
            <section className="box file-panel">
              <div className="box-head">
                <h3>Vorfälle</h3>
                <span className="dim small">Disziplinarakte · {p.id}</span>
              </div>
              <div className="inc-list">
                {p.incidents.map((n, i) =>
                  /^Keine/.test(n) ? (
                    <div key={n} className="inc none">
                      <span className="inc-icon" aria-hidden>
                        ✓
                      </span>
                      <span className="inc-body">
                        <span className="label">Ohne Befund</span>
                        <Redacted text={n} />
                      </span>
                    </div>
                  ) : (
                    <div key={n} className="inc">
                      <span className="inc-icon" aria-hidden>
                        !
                      </span>
                      <span className="inc-body">
                        <span className="label">
                          VF-{p.id.slice(-4)}-{String(i + 1).padStart(2, '0')}
                        </span>
                        <Redacted text={n} />
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}
          {tab === 'Berichte' && <ReportsTab p={p} go={go} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FileTab({ p }: { p: Person }) {
  return (
    <div className="file-split">
      <section className="box file-panel">
        <div className="box-head">
          <h3>Zusammenfassung</h3>
          <span className="dim small">{p.id}</span>
        </div>
        <p className="file-lead">
          <Redacted text={p.summary} />
        </p>
      </section>
      <section className="box file-panel">
        <div className="box-head">
          <h3>Vermerke</h3>
          <span className="dim small">{p.notes.length} {p.notes.length === 1 ? 'Eintrag' : 'Einträge'}</span>
        </div>
        <div className="inc-list">
          {p.notes.map((n, i) => (
            <div key={n} className="inc note">
              <span className="inc-icon" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="inc-body">
                <Redacted text={n} />
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PsychTab({ p, onGranted }: { p: Person; onGranted: () => void }) {
  const [phase, setPhase] = useState<'locked' | 'asking' | 'opening' | 'granted' | 'denied'>(() =>
    psychAccess.has(p.id) ? 'granted' : 'locked',
  );
  const request = async () => {
    setPhase('asking');
    await wait(1500);
    // the solved signal puzzle opens every profile
    const access = adminAccess.has() ? 'granted' : p.psych.access;
    if (access === 'granted') {
      // the lock springs open and turns green before the profile shows
      psychAccess.grant(p.id);
      play('uiSuccess', 0.7);
      setPhase('opening');
      await wait(1100);
      setPhase('granted');
      onGranted();
    } else {
      play('negative', 0.8);
      setPhase('denied');
    }
  };

  if (phase === 'granted') {
    const { verdict, date, metrics = [], text } = p.psych;
    const avg = metrics.length ? Math.round(metrics.reduce((n, m) => n + m.value, 0) / metrics.length) : null;
    return (
      <div className="stack">
        <div className="psych-top">
          <section className={`box file-panel psych-verdict tone-${verdict?.tone ?? 'ok'}`}>
            <div className="box-head">
              <h3>Gesamtbeurteilung</h3>
              {date && <span className="dim small">Stand {fmtDate(date)}</span>}
            </div>
            {verdict && <span className={`verdict verdict-${verdict.tone}`}>{verdict.label}</span>}
            <div className="psych-facts">
              <span>
                <span className="label">Index</span>
                <strong>{avg ?? '–'}</strong>
              </span>
              <span>
                <span className="label">Kennwerte</span>
                <strong>{metrics.length}</strong>
              </span>
              <span>
                <span className="label">Befunde</span>
                <strong>{text.length}</strong>
              </span>
            </div>
          </section>

          {metrics.length > 0 && (
            <section className="box file-panel">
              <div className="box-head">
                <h3>Kennwerte</h3>
                <span className="dim small">0–100</span>
              </div>
              <div className="psych-metrics">
                {metrics.map((m, i) => (
                  <div key={m.label} className="pm-row">
                    <span className="pm-label">{m.label}</span>
                    <div className="meter">
                      <motion.div
                        className={m.value < 40 ? 'meter-fill low' : 'meter-fill'}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.value}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                    <span className={m.value < 40 ? 'pm-value low' : 'pm-value'}>{m.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="psych-scans">
          <BrainScan p={p} />
          <div className="psych-side">
            <Eeg tone={verdict?.tone} />
            <Vitals tone={verdict?.tone} />
          </div>
        </div>

        <section className="box file-panel">
          <div className="box-head">
            <h3>Beobachtungen</h3>
            <span className="dim small">{text.length} {text.length === 1 ? 'Eintrag' : 'Einträge'}</span>
          </div>
          <div className="inc-list">
            {text.map((n, i) => (
              <div key={n} className="inc note">
                <span className="inc-icon" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="inc-body">
                  <Redacted text={n} />
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const denied = phase === 'denied';
  const opening = phase === 'opening';
  return (
    <section className={`box psych-lock${denied ? ' denied' : ''}${opening ? ' opening' : ''}`}>
      <span className="psych-lock-icon" aria-hidden>
        <svg viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path className="shackle" d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <div className="label">Psychologisches Profil · {p.id}</div>
      <h3>{denied ? 'Zugriff verweigert' : opening ? 'Zugriff gewährt' : 'Geschützte Akte'}</h3>
      <p className="dim">
        {denied
          ? `Ihre Freigabe reicht nicht aus. Erforderlich: ${p.psych.required}.`
          : opening
            ? 'Profil wird entschlüsselt …'
            : 'Beurteilung, Kennwerte, Neuralscan und EEG sind nur auf Anfrage einsehbar.'}
      </p>
      {!denied && !opening && (
        <button className="card action" onClick={request} disabled={phase === 'asking'}>
          {phase === 'asking' ? <span className="dots">ANFRAGE LÄUFT</span> : 'ZUGRIFF ANFORDERN'}
        </button>
      )}
    </section>
  );
}

function ReportsTab({ p, go }: { p: Person; go: Go }) {
  const reports = REPORTS.filter((r) => r.author === p.id || r.involved?.includes(p.id));
  return (
    <section className="box file-panel">
      <div className="box-head">
        <h3>Feldberichte</h3>
        <span className="dim small">verfasst oder beteiligt · {reports.length}</span>
      </div>
      {reports.length ? (
        <div className="notice-list">
          {reports.map((r) => {
            const author = personById(r.author);
            return (
              <button
                key={r.id}
                className={`notice ov-card ov-report cl-${classKey(r.classification)}`}
                onClick={() => go({ view: 'report', id: r.id })}
              >
                <span className="notice-top">
                  <span className="notice-level">
                    {r.classification} · {r.author === p.id ? 'Verfasser' : 'Beteiligt'}
                  </span>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </span>
                <strong>{r.title}</strong>
                <span className="dim ov-summary">{r.summary}</span>
                <span className="ov-foot">
                  <span className="avatar sm">{initials(author?.name ?? '?')}</span>
                  <span className="dim small">
                    {r.id} · {fmtDate(r.date)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="dim">Keine Feldberichte auf Akte.</p>
      )}
    </section>
  );
}
