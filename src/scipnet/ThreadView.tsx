import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { personById } from '../data/personnel';
import { threadById, type Choice, type Msg, type Thread } from '../data/threads';
import type { Go } from './routes';
import { threadState, type ThreadState } from './session';
import { initials } from './Comms';
import Redacted from './Redacted';
import { play } from '../lib/sound';

// Voice messages: recordings in sounds/communications/<contact>/, keyed by that relative path.
const VOICES = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../sounds/communications/**/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>,
  ).map(([path, url]) => [path.split('/communications/')[1], url]),
);
let playing: HTMLAudioElement | null = null; // one voice message at a time

const clock = () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

export default function ThreadView({ id, go }: { id: string; go: Go }) {
  const t = threadById(id);
  if (!t) return <p className="page">Kanal nicht gefunden.</p>;
  return <Conversation key={id} t={t} go={go} />;
}

function Conversation({ t, go }: { t: Thread; go: Go }) {
  const [st, setSt] = useState<ThreadState>(() => threadState.get(t));
  const logRef = useRef<HTMLDivElement>(null);
  const seen = useRef(st.log.length); // messages before this index were already there on open
  const contact = personById(t.contact);

  useEffect(() => {
    threadState.set(t.id, st);
  }, [t.id, st]);

  // Play queued messages one at a time; contact messages "type" first.
  useEffect(() => {
    const next = st.queue[0];
    if (!next) return;
    const delay = next.from === 'me' ? 250 : next.voice ? 1800 : Math.min(2400, 500 + next.text.length * 22);
    const timer = setTimeout(() => {
      play(next.from === 'me' ? 'sentMessage' : 'receivedMessage', 0.7);
      setSt((s) => ({ ...s, log: [...s.log, { ...s.queue[0], time: clock() }], queue: s.queue.slice(1) }));
    }, delay);
    return () => clearTimeout(timer);
  }, [st.queue]);

  useLayoutEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [st.log.length, st.queue.length]);

  const typing = st.queue.length > 0 && st.queue[0].from !== 'me';
  const recording = typing && !!st.queue[0].voice;
  const node = t.nodes[st.node];
  const choices = st.queue.length ? undefined : node.choices;
  const ended = !st.queue.length && !node.choices;

  const choose = (c: Choice) => {
    play('sentMessage', 0.7);
    setSt((s) => ({
      log: [...s.log, { from: 'me', text: c.reply ?? c.label, time: clock() }],
      queue: [...t.nodes[c.next].msgs],
      node: c.next,
    }));
  };

  const reset = () => {
    playing?.pause();
    threadState.reset(t.id);
    seen.current = 0;
    setSt(threadState.get(t));
  };

  // Number keys pick a reply.
  useEffect(() => {
    if (!choices?.length) return;
    const onKey = (e: KeyboardEvent) => {
      const c = choices[Number(e.key) - 1];
      if (c) choose(c);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="page thread">
      <button className="link back" onClick={() => go({ view: 'comms' })}>
        ← Kommunikation
      </button>
      <div className="box chat-window">
        <div className="thread-head">
          <span className="avatar">
            {initials(contact?.name ?? '?')}
            <span className={`presence presence-${contact?.status ?? 'Aktiv'}`} />
          </span>
          <div className="thread-head-text">
            {contact ? (
              <button className="link" onClick={() => go({ view: 'person', id: contact.id })}>
                {contact.name}
              </button>
            ) : (
              t.contact
            )}
            <div className="dim small">
              {contact?.role} · {t.subject}
            </div>
          </div>
          <span className="secure-tag">GESICHERT</span>
        </div>

        <div className="chat" ref={logRef}>
          <div className="chat-day">Kanal geöffnet</div>
          <AnimatePresence initial={false}>
            {st.log.map((m, i) => (
              <motion.div
                key={i}
                className={m.from === 'me' ? 'msg me' : m.voice ? 'msg voice-msg' : 'msg'}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
              >
                {m.voice ? <VoiceMessage m={m} fresh={i >= seen.current} /> : <Redacted text={m.text} />}
                {m.time && <span className="msg-time">{m.time}</span>}
              </motion.div>
            ))}
          </AnimatePresence>
          {recording ? (
            <div className="msg recording-bubble" aria-label={`${contact?.name ?? 'Kontakt'} nimmt eine Sprachnachricht auf`}>
              <span className="rec-dot" /> nimmt Sprachnachricht auf…
            </div>
          ) : (
            typing && (
              <div className="msg typing-bubble" aria-label={`${contact?.name ?? 'Kontakt'} schreibt`}>
                <span />
                <span />
                <span />
              </div>
            )
          )}
          {ended && <div className="chat-day">Verbindung beendet</div>}
        </div>

        <div className="composer">
          {choices?.length ? (
            <>
              <div className="label">Antwort wählen</div>
              <div className="choices">
                {choices.map((c, i) => (
                  <motion.button
                    key={c.label}
                    className="choice"
                    data-sound="none"
                    onClick={() => choose(c)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <span className="choice-key">{i + 1}</span>
                    {c.label}
                  </motion.button>
                ))}
              </div>
            </>
          ) : ended ? (
            <button className="link small" onClick={reset}>
              Verlauf zurücksetzen
            </button>
          ) : (
            <div className="dim small">Warte auf Antwort…</div>
          )}
        </div>
      </div>
    </div>
  );
}

const BARS = 36;
const fmtSec = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

// Player bubble with a waveform drawn from the file name (stable per message)
// and the transcript underneath, which "types" itself when the message is new.
function VoiceMessage({ m, fresh }: { m: Msg; fresh: boolean }) {
  const url = VOICES[m.voice!];
  const audio = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [pos, setPos] = useState(0);
  const [len, setLen] = useState(0);
  const [shown, setShown] = useState(fresh ? 0 : m.text.length);

  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.preload = 'metadata';
    a.onloadedmetadata = () => setLen(a.duration);
    a.ontimeupdate = () => setPos(a.currentTime);
    a.onplay = () => setOn(true);
    a.onpause = () => setOn(false);
    a.onended = () => {
      setOn(false);
      setPos(0);
    };
    audio.current = a;
    return () => a.pause();
  }, [url]);

  // transcript appears after a short "Transkribiere…" pause
  useEffect(() => {
    if (shown >= m.text.length) return;
    const timer = setTimeout(() => setShown((n) => Math.min(m.text.length, n + 2)), shown === 0 ? 700 : 18);
    return () => clearTimeout(timer);
  }, [shown, m.text.length]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (!a.paused) return a.pause();
    if (playing && playing !== a) playing.pause();
    playing = a;
    void a.play().catch(() => {});
  };
  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const a = audio.current;
    if (!a || !len) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * len;
    setPos(a.currentTime);
  };

  const seed = [...(m.voice ?? '')].reduce((n, c) => n * 31 + c.charCodeAt(0), 7);
  const progress = len ? pos / len : 0;

  return (
    <>
      <div className={on ? 'voice playing' : 'voice'}>
        <button className="voice-play" data-sound="none" onClick={toggle} disabled={!url} aria-label={on ? 'Pause' : 'Abspielen'}>
          {on ? (
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          )}
        </button>
        <div className="voice-wave" onClick={seek} role="presentation">
          {Array.from({ length: BARS }, (_, i) => {
            const h = 25 + (Math.abs(Math.sin(seed * 0.001 + i * 1.7) * 61 + Math.sin(i * 0.6) * 14) % 75);
            return <span key={i} className={i / BARS < progress ? 'on' : ''} style={{ height: `${h}%` }} />;
          })}
        </div>
        <span className="voice-time">{fmtSec(on || pos ? pos : len)}</span>
      </div>
      <div className="voice-transcript">
        <span className="label">{shown < m.text.length && shown === 0 ? 'Transkribiere…' : 'Transkript'}</span>
        <Redacted text={m.text.slice(0, shown)} />
        {shown < m.text.length && shown > 0 && <span className="caret" />}
      </div>
    </>
  );
}
