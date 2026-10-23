import { personById } from '../data/personnel';
import { THREADS } from '../data/threads';
import type { Go } from './routes';
import { threadState } from './session';

export default function Comms({ go }: { go: Go }) {
  return (
    <div className="page">
      <h2>Kommunikation</h2>
      <p className="dim">{THREADS.length} Kanäle · Ende-zu-Ende gesichert</p>
      <div className="rows">
        {THREADS.map((t) => {
          const contact = personById(t.contact);
          const log = threadState.get(t).log;
          const last = log[log.length - 1];
          return (
            <button key={t.id} className="row thread-row" onClick={() => go({ view: 'thread', id: t.id })}>
              <span className="avatar">{initials(contact?.name ?? '?')}</span>
              <span className="thread-text">
                <strong>{contact?.name ?? t.contact}</strong>
                <span className="dim small">{t.subject}</span>
                {last && <span className="dim small preview">{last.text}</span>}
              </span>
              {threadState.isNew(t.id) && <span className="status status-Offen">Neu</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function initials(name: string) {
  return name
    .replace(/^(Dr\.|Agentin|Agent)\s+/, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
