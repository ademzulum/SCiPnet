import { createContext, useContext } from 'react';
import { GOIS } from '../data/gois';
import type { Go, Route } from './routes';

// Navigation for text anywhere on the site: Shell provides it, and Redacted
// uses it to turn mentions of entries that have their own page into links.
export const Nav = createContext<{ go: Go; route: Route } | null>(null);

// Names a text may use for each Group of Interest, longest first so
// "Valravn Corporation" wins over "Valravn".
const NAMES: [string, string][] = GOIS.flatMap((g): [string, string][] => {
  const names = g.id === 'mcd' ? [g.name, 'Marshall, Carter and Dark', 'MC&D'] : [g.name, g.name.split(' ')[0]];
  return names.map((n) => [n, g.id]);
}).sort((a, b) => b[0].length - a[0].length);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERN = new RegExp(`(${NAMES.map(([n]) => esc(n)).join('|')})`, 'g');

// Splits plain text into strings and links to the GoI pages it mentions. On a
// group's own page its name stays plain text.
export function useEntityLinks() {
  const nav = useContext(Nav);
  return (text: string, key: string | number): React.ReactNode[] => {
    if (!nav) return [text];
    return text.split(PATTERN).map((part, i) => {
      const id = i % 2 ? NAMES.find(([n]) => n === part)?.[1] : undefined;
      if (!id || (nav.route.view === 'goi' && nav.route.id === id)) return part;
      return (
        <a
          key={`${key}-${i}`}
          className="entity-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            nav.go({ view: 'goi', id });
          }}
        >
          {part}
        </a>
      );
    });
  };
}
