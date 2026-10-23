import { PERSONNEL } from '../data/personnel';
import type { Go } from './routes';

export default function PersonnelList({ go }: { go: Go }) {
  return (
    <div className="page">
      <h2>Personalakten</h2>
      <p className="dim">{PERSONNEL.length} Einträge · Site-80</p>
      <div className="grid">
        {PERSONNEL.map((p) => (
          <button key={p.id} className="card person" onClick={() => go({ view: 'person', id: p.id })}>
            <span className="dim small">{p.id}</span>
            <strong>{p.name}</strong>
            <span>{p.role}</span>
            <span className="row-meta">
              <span className="badge">{p.clearance}</span>
              <span className={`status status-${p.status}`}>{p.status}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
