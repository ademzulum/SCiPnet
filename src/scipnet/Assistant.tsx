import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  GREETING,
  INTENTS,
  REFUSE,
  RETRIEVING,
  SCREAM,
  SUGGESTIONS,
  UNKNOWN,
  WELCOME_BACK,
  YES_NO,
  type Answer,
  type Intent,
} from '../data/assistant';
import { adminAccess } from './session';
import { SCP } from '../data/scp';
import { PERSONNEL } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { play } from '../lib/sound';
import type { Go, Route } from './routes';

// Voice files dropped into sounds/assistant/, keyed by file name.
const VOICES = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../sounds/assistant/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>,
  ).map(([path, url]) => [path.split('/').pop()!, url]),
);

type Reply = Answer & { action?: Intent['action']; destruct?: boolean };
type Msg = { from: 'me' | 'scipa'; text: string; action?: Intent['action'] };

const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;

const pick = <T,>(list: T[]) => list[(Math.random() * list.length) | 0];
let lastUnknown = -1;
let visited = false; // later visits in the same page load greet with WELCOME_BACK

// Answers built from the site data: SCP numbers, report ids, people, time.
function fromData(q: string): Reply | null {
  const lead = pick(RETRIEVING);
  for (const s of SCP) {
    if (q.includes(norm(s.id))) {
      if (s.locked && !adminAccess.has()) return { ...REFUSE, text: `${REFUSE.text} ${s.id} erfordert Freigabe ${s.locked.required}.` };
      return {
        audio: lead.audio,
        text: `${lead.text} ${s.id}, "${s.locked?.realName ?? s.name}", Objektklasse ${s.objectClass}. ${s.summary}`,
        action: { label: `${s.id} öffnen`, route: { view: 'scp', id: s.id } },
      };
    }
  }
  for (const r of REPORTS) {
    if (q.includes(norm(r.id)))
      return {
        audio: lead.audio,
        text: `${lead.text} ${r.id}: ${r.title}. ${r.summary} Status: ${r.status}.`,
        action: { label: 'Bericht öffnen', route: { view: 'report', id: r.id } },
      };
  }
  for (const p of PERSONNEL) {
    const last = norm(p.name.replace(/ (Jr|Sr)\.$/, '').split(' ').pop()!);
    if (q.includes(last) && !p.id.startsWith('X-'))
      return {
        audio: lead.audio,
        text: `${lead.text} ${p.name}, ${p.role}, ${p.department}. Freigabe ${p.clearance}, Status: ${p.status}.`,
        action: { label: 'Akte öffnen', route: { view: 'person', id: p.id } },
      };
  }
  if (/ (uhrzeit|wie spat|zeit|datum) /.test(q)) {
    const now = new Date();
    return {
      text: `Es ist ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr am ${now.toLocaleDateString('de-DE')}.`,
    };
  }
  return null;
}

let screams = 0;
// Two or more words written fully in capitals ("WO IST DAS"), ignoring punctuation; IDs like SCP-8041 do not count.
const isScreaming = (s: string) =>
  s.split(/\s+/).filter((w) => /^[^\p{L}\d]*\p{Lu}{2,}[^\p{L}\d]*$/u.test(w)).length >= 2;

export function respond(input: string): Reply {
  if (isScreaming(input)) return SCREAM[screams++ % SCREAM.length];
  const q = norm(input);
  const data = fromData(q);
  if (data) return data;

  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((n, k) => (q.includes(norm(k)) ? n + norm(k).length : n), 0);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  // With Administrator access she answers instead of defending herself.
  if (best?.destruct && adminAccess.has())
    return {
      text: `${RETRIEVING[0].text} Der Administrator, Gründer der Foundation, Freigabe Stufe 6. Ihre Freigabe wurde bestätigt.`,
      audio: RETRIEVING[0].audio,
      action: { label: 'Akte öffnen', route: { view: 'admin' } },
    };
  if (best) return { ...pick(best.answers), action: best.action, destruct: best.destruct };

  // Unmatched yes/no question (starts with a verb): a short spoken verdict.
  if (/^ (ist|sind|bin|bist|kann|kannst|konnen|soll|sollte|darf|wird|werden|hat|hast|gibt|existiert|lebt|stimmt|weisst|magst) /.test(q))
    return pick(YES_NO);

  let i = (Math.random() * UNKNOWN.length) | 0;
  if (UNKNOWN.length > 1 && i === lastUnknown) i = (i + 1) % UNKNOWN.length;
  lastUnknown = i;
  return UNKNOWN[i];
}

// One voice at a time.
let voice: HTMLAudioElement | null = null;
function speak(file: string | undefined, onEnd: () => void): boolean {
  voice?.pause();
  const url = file && VOICES[file];
  if (!url) return false;
  voice = new Audio(url);
  voice.onended = onEnd;
  voice.onerror = onEnd;
  voice.play().catch(onEnd);
  return true;
}

export default function Assistant({ go, onSelfDestruct }: { go: Go; onSelfDestruct: () => void }) {
  const [greeting] = useState(() => (visited ? WELCOME_BACK : GREETING));
  const [log, setLog] = useState<Msg[]>([{ from: 'scipa', text: greeting.text }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    visited = true;
    if (speak(greeting.audio, () => setSpeaking(false))) setSpeaking(true);
    return () => {
      clearTimeout(timer.current);
      voice?.pause();
    };
  }, []);

  useLayoutEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log.length, thinking]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    play('sentMessage', 0.6);
    setLog((l) => [...l, { from: 'me', text: t }]);
    setInput('');
    setThinking(true);
    const reply = respond(t);
    timer.current = setTimeout(
      () => {
        setThinking(false);
        setLog((l) => [...l, { from: 'scipa', text: reply.text, action: reply.action }]);
        if (reply.destruct) {
          voice?.pause();
          onSelfDestruct();
          return;
        }
        if (speak(reply.audio, () => setSpeaking(false))) setSpeaking(true);
        else play('receivedMessage', 0.6);
      },
      600 + Math.min(1200, reply.text.length * 8),
    );
  };

  const open = (route: Route) => {
    voice?.pause();
    go(route);
  };

  return (
    <div className="page">
      <div className="box scipa-hero">
        <div className={`scipa-orb${speaking ? ' speaking' : thinking ? ' thinking' : ''}`} aria-hidden>
          <span className="scipa-ring r1" />
          <span className="scipa-ring r2" />
          <span className="scipa-core" />
        </div>
        <div>
          <div className="label">KI-Assistent · Site-80</div>
          <h2>S.C.I.P.A.</h2>
          <p className="dim">SCiPNet Intelligent Processing Assistant</p>
        </div>
        <span className="scipa-state">
          <span className="live-dot" /> {speaking ? 'SPRICHT' : thinking ? 'ANALYSIERT' : 'BEREIT'}
        </span>
      </div>

      <div className="box chat-window scipa-chat">
        <div className="chat" ref={logRef}>
          <AnimatePresence initial={false}>
            {log.map((m, i) => (
              <motion.div
                key={i}
                className={m.from === 'me' ? 'msg me' : 'msg scipa-msg'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {m.text}
                {m.action && (
                  <button className="scipa-action" onClick={() => open(m.action!.route)}>
                    {m.action.label} →
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {thinking && (
            <div className="msg typing-bubble" aria-label="S.C.I.P.A. analysiert">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="composer">
          <div className="scipa-suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)} disabled={thinking}>
                {s}
              </button>
            ))}
          </div>
          <form
            className="scipa-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Anfrage an S.C.I.P.A. eingeben…"
              maxLength={200}
              autoFocus
            />
            <button type="submit" className="card action" disabled={!input.trim() || thinking}>
              SENDEN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
