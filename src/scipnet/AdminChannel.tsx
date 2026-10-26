import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MESSAGES } from '../data/messages';
import { deleteEntry, saveEntry, useEntriesVersion } from '../data/store';
import type { Go } from './routes';
import { useAccount } from './session';
import { Corrupt } from './Admin';
import { askConfirm, setLeaveGuard } from './Confirm';
import Redacted from './Redacted';

// The Administrator's one-way channel to Dr. Maynard: heavily distorted and
// antimemetic like the files that fade (text blurs unless held with the
// pointer). Nobody can answer; only the Administrator writes and deletes.

const when = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function AdminChannel({ go }: { go: Go }) {
  useEntriesVersion();
  const editor = useAccount().editor;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // an unsent message counts as an unsaved change
  const draft = useRef('');
  draft.current = text.trim();
  useEffect(() => {
    setLeaveGuard(() => !!draft.current);
    return () => setLeaveGuard(null);
  }, []);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [MESSAGES.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    const ok = await askConfirm({ title: 'Nachricht senden?', text: 'Die Nachricht wird an Dr. Maynard übermittelt und lässt sich danach nur noch löschen.', yes: 'SENDEN' });
    if (!ok) return;
    setBusy(true);
    const sent = new Date().toISOString();
    const err = await saveEntry('message', { id: `M-${Date.now()}`, sent, text: t });
    setBusy(false);
    if (err) return setError(err);
    setError(null);
    setText('');
  };
  const remove = async (id: string) => {
    const ok = await askConfirm({ title: 'Nachricht löschen?', text: 'Die Nachricht wird endgültig aus dem Kanal entfernt.', yes: 'LÖSCHEN', danger: true });
    if (ok) setError(await deleteEntry('message', id));
  };

  return (
    <div className="page thread admin-channel">
      <button className="link back" onClick={() => go({ view: 'comms' })}>
        ← Kommunikation
      </button>
      <div className="box chat-window antimemetic">
        <div className="thread-head">
          <span className="avatar ghost">
            <Corrupt text="??" amount={0.6} every={180} />
          </span>
          <div className="thread-head-text">
            <strong>
              <Corrupt text="Der Administrator" amount={0.12} every={200} />
            </strong>
            <div className="dim small">
              <Corrupt text="Ursprung unbekannt · Kanal einseitig" amount={0.08} every={320} />
            </div>
          </div>
          <span className="secure-tag">ANTIMEMETISCH</span>
        </div>

        <div className="box amnestic-note">Antimemetischer Kanal. Text verblasst, sobald Sie wegsehen. Mit dem Mauszeiger festhalten.</div>

        <div className="chat" ref={logRef}>
          <div className="chat-day">
            <Corrupt text="Signal empfangen" amount={0.1} every={260} />
          </div>
          <AnimatePresence initial={false}>
            {MESSAGES.map((m) => (
              <motion.div key={m.id} className="msg admin-msg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <span className="fade-text">
                  <Redacted text={m.text} />
                </span>
                <span className="msg-time">
                  {when(m.sent)}
                  {editor && (
                    <button className="link msg-del" onClick={() => remove(m.id)}>
                      Löschen
                    </button>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {!MESSAGES.length && <div className="chat-day">Keine Nachrichten.</div>}
        </div>

        <div className="composer">
          {editor ? (
            <form
              className="admin-compose"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                className="search"
                rows={2}
                placeholder="Nachricht an Dr. Maynard…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <button className="card action" disabled={busy || !text.trim()}>
                {busy ? 'SENDET…' : 'SENDEN'}
              </button>
            </form>
          ) : (
            <div className="composer-state">
              <div className="label">Antwort nicht möglich</div>
              <div className="dim small">Dieser Kanal überträgt nur in eine Richtung.</div>
            </div>
          )}
          {error && <p className="ed-error small">{error}</p>}
        </div>
      </div>
    </div>
  );
}
