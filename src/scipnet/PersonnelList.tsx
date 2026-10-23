import { PERSONNEL } from '../data/personnel';
import type { Go } from './routes';
import { Corrupt } from './Admin';

export default function PersonnelList({ go }: { go: Go }) {
  return (
    <div className="page">
      <h2>Personalakten</h2>
      <p className="dim">{PERSONNEL.length + 1} Einträge · Site-80</p>
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
        <button className="card person admin-card" onClick={() => go({ view: 'admin' })}>
          <span className="dim small">
            <Corrupt text="A-00-0000" amount={0.2} every={400} />
          </span>
          <strong>
            <Corrupt text="Der Administrator" amount={0.06} every={250} />
          </strong>
          <span>[DATEN BESCHÄDIGT]</span>
          <span className="row-meta">
            <span className="badge">
              <Corrupt text="??????" amount={0.5} every={300} />
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
