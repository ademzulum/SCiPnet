import { canRead, type Access } from '../data/access';
import type { Kind } from '../data/store';
import type { Account } from '../lib/creds';
import { Corrupt } from './Admin';

// How a list card shows an entry's access: closed or above the reader's
// clearance -> warning stripes and [ZUGRIFF BESCHRÄNKT]; corrupted -> the
// title and summary keep scrambling, like SCP-8000.
type Entry = { access?: Access; clearance?: string; classification?: string };

export function cardAccess(kind: Kind, e: Entry, a: Account) {
  const closed = e.access?.mode === 'closed' || e.access?.mode === 'readers';
  const blocked = !canRead(kind, e, a);
  const corrupt = e.access?.mode === 'corrupt';
  const cls = `${closed || blocked ? ' locked restricted' : ''}${corrupt ? ' corrupted' : ''}`;
  const title = (t: string) => (corrupt ? <Corrupt text={t} amount={0.15} every={300} /> : t);
  // summary: replaced when the reader may not see it; plain text when scrambled
  const summary = (plain: string, shown: React.ReactNode) =>
    closed ? (
      <span className="restricted-tag">[ZUGRIFF BESCHRÄNKT]</span>
    ) : blocked ? (
      'Inhalt gesperrt.'
    ) : corrupt ? (
      <Corrupt text={plain.replace(/\[\[|\]\]/g, '')} amount={0.1} every={260} />
    ) : (
      shown
    );
  return { closed, blocked, corrupt, cls, title, summary };
}
