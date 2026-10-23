import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { personById } from '../data/personnel';
import { threadById, type Choice, type Thread } from '../data/threads';
import type { Go } from './routes';
import { threadState, type ThreadState } from './session';
import { initials } from './Comms';
import Redacted from './Redacted';

const clock = () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

export default function ThreadView({ id, go }: { id: string; go: Go }) {
  const t = threadById(id);
  if (!t) return <p className="page">Kanal nicht gefunden.</p>;
  return <Conversation key={id} t={t} go={go} />;
}

function Conversation({ t, go }: { t: Thread; go: Go }) {
  const [st, setSt] = useState<ThreadState>(() => threadState.get(t));
  const logRef = useRef<HTMLDivElement>(null);
  const contact = personById(t.contact);

  useEffect(() => {
    threadState.set(t.id, st);
  }, [t.id, st]);

  // Play queued messages one at a time; contact messages "type" first.
  useEffect(() => {
    const next = st.queue[0];
    if (!next) return;
    const delay = next.from === 'me' ? 250 : Math.min(2400, 500 + next.text.length * 22);
    const timer = setTimeout(
      () => setSt((s) => ({ ...s, log: [...s.log, { ...s.queue[0], time: clock() }], queue: s.queue.slice(1) })),
      delay,
    );
    return () => clearTimeout(timer);
  }, [st.queue]);

  useLayoutEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [st.log.length, st.queue.length]);

  const typing = st.queue.length > 0 && st.queue[0].from !== 'me';
  const node = t.nodes[st.node];
  const choices = st.queue.length ? undefined : node.choices;
  const ended = !st.queue.length && !node.choices;

  const choose = (c: Choice) =>
    setSt((s) => ({
      log: [...s.log, { from: 'me', text: c.reply ?? c.label, time: clock() }],
      queue: [...t.nodes[c.next].msgs],
      node: c.next,
    }));

  const reset = () => {
    threadState.reset(t.id);
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
                className={m.from === 'me' ? 'msg me' : 'msg'}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
              >
                <Redacted text={m.text} />
                {m.time && <span className="msg-time">{m.time}</span>}
              </motion.div>
            ))}
          </AnimatePresence>
          {typing && (
            <div className="msg typing-bubble" aria-label={`${contact?.name ?? 'Kontakt'} schreibt`}>
              <span />
              <span />
              <span />
            </div>
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
