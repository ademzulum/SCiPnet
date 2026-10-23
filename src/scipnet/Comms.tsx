import { personById } from '../data/personnel';
import { THREADS } from '../data/threads';
import type { Go } from './routes';
import { threadState } from './session';

export function initials(name: string) {
  return name
    .replace(/^(Dr\.|Agentin|Agent)\s+/, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Decorative waveform; bar heights are fixed so it doesn't jitter on re-render.
const WAVE = Array.from({ length: 28 }, (_, i) => 20 + Math.abs(Math.sin(i * 1.7)) * 70);

export default function Comms({ go }: { go: Go }) {
  const unread = THREADS.filter((t) => threadState.isNew(t.id)).length;

  return (
    <div className="page">
      <div className="box comms-hero">
        <div>
          <div className="label">Kommunikationszentrale · Site-80</div>
          <h2>Kommunikation</h2>
          <p className="dim">Interne Kanäle, gesichert und protokolliert.</p>
        </div>
        <div className="wave" aria-hidden>
          {WAVE.map((h, i) => (
            <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>

      <div className="comms-grid">
        <section className="box">
          <div className="box-head">
            <h3>Kanäle</h3>
            <span className="dim small">{unread} ungelesen</span>
          </div>
          <div className="thread-list">
            {THREADS.map((t) => {
              const contact = personById(t.contact);
              const log = threadState.get(t).log;
              const last = log[log.length - 1];
              const isNew = threadState.isNew(t.id);
              return (
                <button
                  key={t.id}
                  className={isNew ? 'thread-card unread' : 'thread-card'}
                  onClick={() => go({ view: 'thread', id: t.id })}
                >
                  <span className="avatar">
                    {initials(contact?.name ?? '?')}
                    <span className={`presence presence-${contact?.status ?? 'Aktiv'}`} />
                  </span>
                  <span className="thread-text">
                    <span className="thread-top">
                      <strong>{contact?.name ?? t.contact}</strong>
                      {last?.time && <span className="dim small">{last.time}</span>}
                    </span>
                    <span className="small thread-subject">{t.subject}</span>
                    {last && (
                      <span className="dim small preview">
                        {last.from === 'me' ? 'Sie: ' : ''}
                        {last.text}
                      </span>
                    )}
                  </span>
                  {isNew && <span className="unread-dot" aria-label="Ungelesen" />}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="stack">
          <div className="box">
            <h3>Kanalstatus</h3>
            <dl className="status-list">
              <div>
                <dt>Verbindung</dt>
                <dd>
                  <span className="live-dot" /> Stabil
                </dd>
              </div>
              <div>
                <dt>Verschlüsselung</dt>
                <dd>Foundation-Standard</dd>
              </div>
              <div>
                <dt>Aktive Kanäle</dt>
                <dd>{THREADS.length}</dd>
              </div>
              <div>
                <dt>Protokollierung</dt>
                <dd>Aktiv</dd>
              </div>
            </dl>
          </div>
          <div className="box hint">
            <div className="label">Hinweis</div>
            Nachrichten werden nach 30 Tagen archiviert. Vertrauliche Inhalte nur über gesicherte Kanäle.
          </div>
        </aside>
      </div>
    </div>
  );
}
