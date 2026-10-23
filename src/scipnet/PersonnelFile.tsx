import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { personById, type Person } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { threadForContact } from '../data/threads';
import type { Go } from './routes';
import Redacted from './Redacted';
import { ReportRow } from './ReportList';
import { initials } from './Comms';
import { personNotes, psychAccess } from './session';

const TABS = ['Akte', 'Werdegang', 'Psychologie', 'Vorfälle', 'Berichte'] as const;
type Tab = (typeof TABS)[number];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PersonnelFile({ id, go }: { id: string; go: Go }) {
  const p = personById(id);
  const [tab, setTab] = useState<Tab>('Akte');
  if (!p) return <p className="page">Akte nicht gefunden.</p>;
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

      <div className="dossier">
        <Biometric key={p.id} name={p.name} />
        <div className="dossier-main">
          <h2>{p.name}</h2>
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

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'Akte' && <FileTab p={p} />}
          {tab === 'Werdegang' && (
            <ol className="timeline">
              {p.timeline.map((e) => (
                <li key={e.year + e.text}>
                  <span className="year">{e.year}</span>
                  <Redacted text={e.text} />
                </li>
              ))}
            </ol>
          )}
          {tab === 'Psychologie' && <PsychTab key={p.id} p={p} />}
          {tab === 'Vorfälle' && (
            <ul className="notices">
              {p.incidents.map((n) => (
                <li key={n}>
                  <Redacted text={n} />
                </li>
              ))}
            </ul>
          )}
          {tab === 'Berichte' && <ReportsTab p={p} go={go} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Biometric({ name }: { name: string }) {
  const [phase, setPhase] = useState<'idle' | 'scan' | 'done'>('idle');
  const scan = async () => {
    if (phase !== 'idle') return;
    setPhase('scan');
    await wait(1600);
    setPhase('done');
  };
  return (
    <button className={`photo photo-${phase}`} onClick={scan} title="Biometrie abrufen">
      {phase === 'idle' && <span>BIOMETRIE LADEN</span>}
      {phase === 'scan' && <span className="scanline" />}
      {phase === 'done' && (
        <>
          <span className="photo-initials">{initials(name)}</span>
          <span className="photo-ok">BESTÄTIGT</span>
        </>
      )}
    </button>
  );
}

function FileTab({ p }: { p: Person }) {
  const [notes, setNotes] = useState(() => personNotes.get(p.id));
  const [draft, setDraft] = useState('');
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    personNotes.add(p.id, text);
    setNotes(personNotes.get(p.id));
    setDraft('');
  };
  return (
    <>
      <section>
        <h3>Zusammenfassung</h3>
        <p>
          <Redacted text={p.summary} />
        </p>
      </section>
      <section>
        <h3>Vermerke</h3>
        <ul className="notices">
          {p.notes.map((n) => (
            <li key={n}>
              <Redacted text={n} />
            </li>
          ))}
          {notes.map((n, i) => (
            <li key={i} className="own-note">
              {n} <span className="dim small">· eigener Vermerk</span>
            </li>
          ))}
        </ul>
        <form
          className="note-form"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Vermerk hinzufügen…" maxLength={200} />
          <button className="card action" type="submit" disabled={!draft.trim()}>
            SPEICHERN
          </button>
        </form>
      </section>
    </>
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
    setPhase(p.psych.access);
  };

  if (phase === 'granted')
    return (
      <ul className="notices">
        {p.psych.text.map((n) => (
          <li key={n}>
            <Redacted text={n} />
          </li>
        ))}
      </ul>
    );

  return (
    <div className={phase === 'denied' ? 'locked-box denied' : 'locked-box'}>
      <p className="classified">PSYCHOLOGISCHES PROFIL · GESCHÜTZT</p>
      {phase === 'denied' ? (
        <p>ZUGRIFF VERWEIGERT. Erforderlich: {p.psych.required}.</p>
      ) : (
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
    <div className="rows">
      {reports.map((r) => (
        <ReportRow key={r.id} report={r} go={go} />
      ))}
    </div>
  );
}
