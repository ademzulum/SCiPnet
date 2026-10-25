import type { Person } from '../data/personnel';
import { initials } from './Comms';
import { photoUrl } from '../data/photos';
import { useAccount } from './session';

// ID photo: uses person.photo when set, otherwise a generated silhouette.
export default function Portrait({ person }: { person: Person }) {
  const admin = useAccount().id === 'admin';
  return (
    <figure className="portrait">
      <div className="portrait-frame">
        {person.photo ? (
          <img src={photoUrl(person.photo, !admin)} alt={person.name} />
        ) : (
          <svg viewBox="0 0 100 120" aria-hidden>
            <defs>
              <linearGradient id="portrait-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity="0.55" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="44" r="20" fill="url(#portrait-g)" />
            <path d="M12 120 C 14 86, 32 72, 50 72 C 68 72, 86 86, 88 120 Z" fill="url(#portrait-g)" />
            <text x="50" y="50" textAnchor="middle" className="portrait-initials">
              {initials(person.name)}
            </text>
          </svg>
        )}
        <span className="portrait-scan" />
      </div>
      <figcaption>
        <span>{person.id}</span>
        <span className="ok-text">✓ VERIFIZIERT</span>
      </figcaption>
    </figure>
  );
}
