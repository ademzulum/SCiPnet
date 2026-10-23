// In-memory state that should survive page switches inside SCiPnet
// (cleared on reload).
import type { Msg, Thread } from '../data/threads';

export type ThreadState = { log: Msg[]; queue: Msg[]; node: string };

const threads = new Map<string, ThreadState>();
const notes = new Map<string, string[]>();
const unlocked = new Set<string>();

export const threadState = {
  get: (t: Thread): ThreadState =>
    threads.get(t.id) ?? { log: [...t.history], queue: [...t.nodes[t.start].msgs], node: t.start },
  set: (id: string, s: ThreadState) => threads.set(id, s),
  reset: (id: string) => threads.delete(id),
  isNew: (id: string) => !threads.has(id),
};

export const personNotes = {
  get: (id: string) => notes.get(id) ?? [],
  add: (id: string, text: string) => notes.set(id, [...(notes.get(id) ?? []), text]),
};

export const psychAccess = {
  has: (id: string) => unlocked.has(id),
  grant: (id: string) => unlocked.add(id),
};
