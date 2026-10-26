import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  GREETINGS,
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
import { cleared, currentAccount } from './session';
import { SCP } from '../data/scp';
import { PERSONNEL } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { play } from '../lib/sound';
import type { Go, Route } from './routes';
import { AcsIcon } from './Acs';
import { ALL_CLASSES } from '../data/acsClasses';

// class colour by icon name, for containment and secondary classes
const ICON_COLOR = Object.fromEntries(ALL_CLASSES.map((c) => [c.icon, c.color]));

// colour class per ACS icon in S.C.I.P.A.'s class chips
const ICON_CLASS: Record<string, string> = {
  safe: 'class-Safe', euclid: 'class-Euclid', keter: 'class-Keter', esoteric: 'class-Esoteric', thaumiel: 'sec-Thaumiel', nachrichtlich: 'sec-Nachrichtlich',
  dark: 'dis-Dark', vlam: 'dis-Vlam', keneq: 'dis-Keneq', ekhi: 'dis-Ekhi', amida: 'dis-Amida',
  notice: 'risk-Notice', caution: 'risk-Caution', warning: 'risk-Warning', danger: 'risk-Danger', critical: 'risk-Critical',
};
import type { Api as Notices } from './Notifications';

// Voice files dropped into sounds/assistant/, keyed by file name.
const VOICES = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../sounds/assistant/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>,
  ).map(([path, url]) => [path.split('/').pop()!, url]),
);

type Reply = Answer & { action?: Intent['action']; destruct?: boolean; ai?: boolean }; // ai: ask the model, this reply is the fallback
type Msg = { from: 'me' | 'scipa'; text: string; action?: Intent['action']; legend?: Answer['legend'] };

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
// Recorded lines the model's answers can reuse (matched by their opening sentence).
const SPOKEN: Answer[] = [...YES_NO, ...UNKNOWN, REFUSE, ...RETRIEVING, WELCOME_BACK, { text: 'Ich werde Sie nicht heiraten.', audio: 'will_not_marry_you.mp3' }];
let visited = false; // later visits in the same page load greet with WELCOME_BACK

// Answers built from the site data: SCP numbers, report ids, people, time.
function fromData(q: string): Reply | null {
  const lead = pick(RETRIEVING);
  for (const s of SCP) {
    if (q.includes(norm(s.id))) {
      if (s.locked && !cleared()) return { ...REFUSE, text: `${REFUSE.text} ${s.id} erfordert Freigabe ${s.locked.required}.` };
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
  // With O5-13 or Administrator access she answers instead of defending herself.
  if (best?.destruct && cleared())
    return {
      text: `${RETRIEVING[0].text} Der Administrator, Gründer der Foundation, Freigabe Stufe 6. Ihre Freigabe wurde bestätigt.`,
      audio: RETRIEVING[0].audio,
      action: { label: 'Akte öffnen', route: { view: 'admin' } },
    };
  // O5-13 and the Administrator need no biometric scan.
  if (best?.id === 'personnel' && currentAccount() !== 'maynard')
    return {
      text: `${RETRIEVING[0].text} ${PERSONNEL.length + 2} Personalakten, ${currentAccount() === 'admin' ? 'Administrator' : 'O5-13'}. Die biometrische Prüfung entfällt für Ihre Freigabe, sämtliche Schwärzungen lassen sich aufheben.`,
      audio: RETRIEVING[0].audio,
      action: best.action,
    };
  if (best) return { ...pick(best.answers), action: best.action, destruct: best.destruct };

  // Nothing scripted matched: the model answers (see ask()); the lines below
  // are only used if that fails.
  // Unmatched yes/no question (starts with a verb): a short spoken verdict.
  if (/^ (ist|sind|bin|bist|kann|kannst|konnen|soll|sollte|darf|wird|werden|hat|hast|gibt|existiert|lebt|stimmt|weisst|magst) /.test(q))
    return { ...pick(YES_NO), ai: true };

  let i = (Math.random() * UNKNOWN.length) | 0;
  if (UNKNOWN.length > 1 && i === lastUnknown) i = (i + 1) % UNKNOWN.length;
  lastUnknown = i;
  return { ...UNKNOWN[i], ai: true };
}

// Free-form answer from the model behind /api/scipa. Resolves to null when the
// function is unavailable (local dev without `vercel dev`, rate limit, errors).
async function ask(message: string, history: Msg[], notes: Notices): Promise<string | null> {
  try {
    const res = await fetch('/api/scipa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-8).map(({ from, text }) => ({ from, text })),
        unlocked: cleared(),
        account: currentAccount(),
        notices: notes.items.slice(0, 10).map(({ id, level, title, text, time, read }) => ({ id, level, title, text, time, read })),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    return data.text || null;
  } catch {
    return null;
  }
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

// Speech-to-text through the browser's Web Speech API (Chrome, Edge, Safari;
// not Firefox). German recognition; interim results stream into the input,
// which the user then sends as usual. Chrome processes the audio on Google's
// servers.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
const SpeechRecognition: (new () => Recognition) | undefined =
  (window as unknown as Record<string, new () => Recognition>).SpeechRecognition ??
  (window as unknown as Record<string, new () => Recognition>).webkitSpeechRecognition;

function useDictation(setText: (t: string) => void) {
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => () => rec.current?.stop(), []);

  const toggleMic = () => {
    if (!SpeechRecognition) return;
    if (rec.current) {
      rec.current.stop();
      return;
    }
    const r = new SpeechRecognition();
    r.lang = 'de-DE';
    r.interimResults = true;
    r.continuous = true;
    let base = '';
    setText('');
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) base += t;
        else interim += t;
      }
      setText((base + interim).trim());
    };
    r.onend = r.onerror = () => {
      rec.current = null;
      setListening(false);
    };
    rec.current = r;
    r.start();
    setListening(true);
  };

  return { canListen: !!SpeechRecognition, listening, toggleMic };
}

// The model can end an answer with [[OPEN:#id]], [[READ:#id]], [[READ_ALL]]
// or [[CLEAR]] to act on the notifications, and add [[VOICE:name]] to have the
// matching voice line from sounds/assistant/ spoken. Strip them from the text, apply the
// read/clear ones right away and turn OPEN into the usual action button.
function applyCommands(text: string, notes: Notices): Reply {
  let action: Intent['action'];
  const clean = text
    .replace(/\[\[VOICE:[a-z_]+\]\]/g, '') // the voice is picked from the text itself, below
    .replace(/\[\[(OPEN|READ):#?(\d+)\]\]|\[\[(READ_ALL|CLEAR)\]\]/g, (_, cmd: string, id: string, all: string) => {
      const n = id ? notes.items.find((x) => x.id === Number(id)) : undefined;
      if (cmd === 'READ' && n) notes.markRead(n.id);
      if (cmd === 'OPEN' && n) {
        notes.markRead(n.id);
        if (n.route) action = { label: `${n.title} öffnen`, route: n.route };
      }
      if (all === 'READ_ALL') notes.markAll();
      if (all === 'CLEAR') notes.clear();
      return '';
    })
    .replace(/\[\[[^\]]*\]\]/g, '') // anything malformed
    .trim();
  const final = clean || 'Sehr wohl.';
  // Speak a recorded line when the answer opens with exactly its sentence.
  const first = norm(final.split(/(?<=[.:!?])\s/)[0]);
  const audio = SPOKEN.find((a) => norm(a.text) === first)?.audio;
  return { text: final, action, audio };
}

export default function Assistant({ go, onSelfDestruct, notes, ask: question }: { go: Go; onSelfDestruct: () => void; notes: Notices; ask?: string }) {
  const [greeting] = useState(() => (visited ? WELCOME_BACK : pick(GREETINGS)));
  const [log, setLog] = useState<Msg[]>([{ from: 'scipa', text: greeting.text }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const { canListen, listening, toggleMic } = useDictation(setInput);

  // The input grows with its text up to three lines (two line breaks); only
  // past that does it scroll.
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const max = Math.ceil(line * 3 + pad + border);
    el.style.height = 'auto';
    const full = el.scrollHeight + border;
    el.style.height = `${Math.min(full, max)}px`;
    el.style.overflowY = full > max ? 'auto' : 'hidden';
  }, [input]);
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

  // a question handed over from the side rail is asked once on arrival
  const asked = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!question || asked.current === question) return;
    const t = setTimeout(() => {
      asked.current = question;
      send(question);
    }, 500);
    return () => clearTimeout(t);
  }, [question]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    if (listening) toggleMic();
    play('sentMessage', 0.6);
    setLog((l) => [...l, { from: 'me', text: t }]);
    setInput('');
    setThinking(true);
    const scripted = respond(t);
    const started = Date.now();
    const answer = scripted.ai
      ? ask(t, log, notesRef.current).then((text) => (text ? applyCommands(text, notesRef.current) : scripted))
      : Promise.resolve(scripted);
    void answer.then((reply) => {
      // keep a short "thinking" pause even when the answer is instant
      const wait = Math.max(0, 600 + Math.min(1200, reply.text.length * 8) - (Date.now() - started));
      timer.current = setTimeout(() => {
        setThinking(false);
        setLog((l) => [...l, { from: 'scipa', text: reply.text, action: reply.action, legend: reply.legend }]);
        if (reply.destruct) {
          voice?.pause();
          onSelfDestruct();
          return;
        }
        if (speak(reply.audio, () => setSpeaking(false))) setSpeaking(true);
        else play('receivedMessage', 0.6);
      }, wait);
    });
  };

  // Urgent notifications that arrive while the chat is open get a short remark.
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const seen = useRef(notes.toast?.id ?? 0);
  useEffect(() => {
    const n = notes.toast;
    if (!n || n.id <= seen.current) return;
    seen.current = n.id;
    if (n.level !== 'warn' && n.level !== 'alert') return;
    const lead = n.level === 'alert' ? 'Doktor, das sollten Sie sehen' : 'Eine neue Meldung, Doktor';
    setLog((l) => [
      ...l,
      { from: 'scipa', text: `${lead}: ${n.title}. ${n.text}`, action: n.route ? { label: `${n.title} öffnen`, route: n.route } : undefined },
    ]);
  }, [notes.toast]);

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
          <div className="label">Site-80 · Analyse-Einheit</div>
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
                {m.legend && (
                  <ul className="scipa-legend">
                    {m.legend.map(([icon, name, meaning]) => (
                      <li
                        key={name}
                        className={icon[0] === '#' ? `acs scipa-text lvl-${icon.slice(1)}` : `acs ${ICON_CLASS[icon] ?? ''}`}
                        style={!ICON_CLASS[icon] && ICON_COLOR[icon] ? ({ '--c': ICON_COLOR[icon] } as React.CSSProperties) : undefined}
                      >
                        {icon[0] === '#' ? <span className="scipa-badge">{icon.slice(1)}</span> : <AcsIcon name={icon} />}
                        <strong>{name}</strong>
                        <span>{meaning}</span>
                      </li>
                    ))}
                  </ul>
                )}
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
            <textarea
              ref={field}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter starts a new line
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={listening ? 'Ich höre zu…' : 'Anfrage eingeben…'}
              maxLength={500}
              autoFocus
            />
            {canListen && (
              <button
                type="button"
                className={`scipa-mic${listening ? ' on' : ''}`}
                onClick={toggleMic}
                disabled={thinking}
                title={listening ? 'Aufnahme beenden' : 'Spracheingabe'}
                aria-label={listening ? 'Aufnahme beenden' : 'Spracheingabe'}
                aria-pressed={listening}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5.5 11a6.5 6.5 0 0 0 13 0 M12 17.5V21 M8.5 21h7" />
                </svg>
              </button>
            )}
            <button type="submit" className="card action scipa-send" aria-label="Senden" disabled={!input.trim() || thinking}>
              SENDEN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
