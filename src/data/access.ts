// Who may open an entry.
//
// Clearance: every entry has a level 1-5 (SCP: its clearance, report: its
// classification, personnel and task forces: an optional access level). The
// reader's level comes from the account: Maynard (RAISA) 4, O5-13 5, the
// Administrator 6. This check is the site's own, for the story.
//
// mode 'corrupt': the entry is a memetic trap; opening it throws the reader out.
// mode 'closed' / 'readers': enforced by the database (supabase/003_access.sql),
// such entries never reach a browser that may not see them.
import type { Account } from '../lib/creds';
import type { Kind } from './store';

export type Access = {
  mode?: 'corrupt' | 'closed' | 'readers';
  level?: number | string; // 1-5 (the editor stores it as text), personnel and task forces only
  readers?: string[]; // account ids for 'readers'
};

export const READER_LEVEL: Record<Account, number> = { maynard: 4, o5: 5, admin: 6 };
export const READER_LABEL: Record<Account, string> = { maynard: 'RAISA · Level 4', o5: 'Stufe 5 · Level 5', admin: 'Stufe 6 · Level 6' };

export const REPORT_LEVEL: Record<string, number> = { Uneingeschränkt: 1, Eingeschränkt: 2, Vertraulich: 3, Geheim: 4, 'Streng geheim': 5 };

// "Stufe 3" -> 3, RAISA counts as 4
export const levelOf = (c?: string) => (!c ? 0 : c === 'RAISA' ? 4 : Number(c.match(/\d/)?.[0] ?? 0));

type Entry = { access?: Access; clearance?: string; classification?: string };
export function requiredLevel(kind: Kind, e: Entry): number {
  if (kind === 'scp') return Math.max(levelOf(e.clearance), Number(e.access?.level ?? 0));
  if (kind === 'report') return Math.max(REPORT_LEVEL[e.classification ?? ''] ?? 0, Number(e.access?.level ?? 0));
  return Number(e.access?.level ?? 0);
}

export const canRead = (kind: Kind, e: Entry, a: Account) => requiredLevel(kind, e) <= READER_LEVEL[a];
