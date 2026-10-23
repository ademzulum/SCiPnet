import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GREETING, INTENTS, SUGGESTIONS, UNKNOWN, type Answer, type Intent } from '../data/assistant';
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

type Reply = Answer & { action?: Intent['action'] };
type Msg = { from: 'me' | 'vera'; text: string; action?: Intent['action'] };

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

// Answers built from the site data: SCP numbers, report ids, people, time.
function fromData(q: string): Reply | null {
  for (const s of SCP) {
    if (q.includes(norm(s.id))) {
      if (s.locked) return { text: `${s.id} erfordert Freigabe ${s.locked.required}. Ich kann Ihnen dazu nichts sagen.` };
      return {
        text: `${s.id}, "${s.name}", Objektklasse ${s.objectClass}. ${s.summary}`,
        action: { label: `${s.id} öffnen`, route: { view: 'scp', id: s.id } },
      };
    }
  }
  for (const r of REPORTS) {
    if (q.includes(norm(r.id)))
      return {
        text: `${r.id}: ${r.title}. ${r.summary} Status: ${r.status}.`,
        action: { label: 'Bericht öffnen', route: { view: 'report', id: r.id } },
      };
  }
  for (const p of PERSONNEL) {
    const last = norm(p.name.split(' ').pop()!);
    if (q.includes(last) && !p.id.startsWith('X-'))
      return {
        text: `${p.name}, ${p.role}, ${p.department}. Freigabe ${p.clearance}, Status: ${p.status}.`,
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

export function respond(input: string): Reply {
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
  if (best) return { ...pick(best.answers), action: best.action };

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

export default function Assistant({ go }: { go: Go }) {
  const [log, setLog] = useState<Msg[]>([{ from: 'vera', text: GREETING.text }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (speak(GREETING.audio, () => setSpeaking(false))) setSpeaking(true);
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
        setLog((l) => [...l, { from: 'vera', text: reply.text, action: reply.action }]);
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
      <div className="box vera-hero">
        <div className={`vera-orb${speaking ? ' speaking' : thinking ? ' thinking' : ''}`} aria-hidden>
          <span className="vera-ring r1" />
          <span className="vera-ring r2" />
          <span className="vera-core" />
        </div>
        <div>
          <div className="label">KI-Assistent · Site-80</div>
          <h2>VERA</h2>
          <p className="dim">Virtuelle Einsatz- und Recherche-Assistenz</p>
        </div>
        <span className="vera-state">
          <span className="live-dot" /> {speaking ? 'SPRICHT' : thinking ? 'ANALYSIERT' : 'BEREIT'}
        </span>
      </div>

      <div className="box chat-window vera-chat">
        <div className="chat" ref={logRef}>
          <AnimatePresence initial={false}>
            {log.map((m, i) => (
              <motion.div
                key={i}
                className={m.from === 'me' ? 'msg me' : 'msg vera-msg'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {m.text}
                {m.action && (
                  <button className="vera-action" onClick={() => open(m.action!.route)}>
                    {m.action.label} →
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {thinking && (
            <div className="msg typing-bubble" aria-label="VERA analysiert">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="composer">
          <div className="vera-suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)} disabled={thinking}>
                {s}
              </button>
            ))}
          </div>
          <form
            className="vera-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Anfrage an VERA eingeben…"
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
