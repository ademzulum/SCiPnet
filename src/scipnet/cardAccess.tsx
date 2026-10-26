import { canRead, type Access } from '../data/access';
import type { Kind } from '../data/store';
import type { Account } from '../lib/creds';
import { Corrupt } from './Admin';
import { currentAccount } from './session';

// How a list card shows an entry's access: closed or above the reader's
// clearance -> warning stripes, closed ones titled [ZUGRIFF BESCHRÄNKT];
// corrupted -> titled [DATEN GELÖSCHT], scrambling like SCP-8000.
type Entry = { access?: Access; clearance?: string; classification?: string };

// A name or title as text anywhere outside the entry's own card (side rails,
// overview, links): closed or above the reader's clearance -> [GESPERRT],
// corrupted -> [DATEN GELÖSCHT].
export function masked(kind: Kind, e: Entry, real: string, a: Account = currentAccount()): string {
  const st = cardAccess(kind, e, a);
  return st.closed || st.blocked ? '[GESPERRT]' : st.corrupt ? '[DATEN GELÖSCHT]' : real;
}

export function cardAccess(kind: Kind, e: Entry, a: Account) {
  const closed = e.access?.mode === 'closed' || e.access?.mode === 'readers';
  const blocked = !canRead(kind, e, a);
  const corrupt = e.access?.mode === 'corrupt';
  const cls = `${closed || blocked ? ' locked restricted' : ''}${corrupt ? ' corrupted' : ''}`;
  // the title gives the entry away no more: scrambled like SCP-8000, or a plain notice
  const title = (t: string) =>
    corrupt ? <Corrupt text="[DATEN GELÖSCHT]" amount={0.15} every={300} /> : closed ? '[ZUGRIFF BESCHRÄNKT]' : t;
  // summary: replaced when the reader may not see it; plain text when scrambled
  const summary = (plain: string, shown: React.ReactNode) =>
    closed || blocked ? (
      'Inhalt gesperrt.'
    ) : corrupt ? (
      <Corrupt text={plain.replace(/\[\[|\]\]/g, '')} amount={0.1} every={260} />
    ) : (
      shown
    );
  return { closed, blocked, corrupt, cls, title, summary };
}
