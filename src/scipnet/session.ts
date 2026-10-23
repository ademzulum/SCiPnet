// In-memory state that should survive page switches inside SCiPnet
// (cleared on reload).
import type { Msg, Thread } from '../data/threads';

export type ThreadState = { log: Msg[]; queue: Msg[]; node: string };

const threads = new Map<string, ThreadState>();
const unlocked = new Set<string>();
const verified = new Set<string>();
let commsAuthed = false;

export const threadState = {
  get: (t: Thread): ThreadState =>
    threads.get(t.id) ?? { log: [...t.history], queue: [...t.nodes[t.start].msgs], node: t.start },
  set: (id: string, s: ThreadState) => threads.set(id, s),
  reset: (id: string) => threads.delete(id),
  isNew: (id: string) => !threads.has(id),
};

export const psychAccess = {
  has: (id: string) => unlocked.has(id),
  grant: (id: string) => unlocked.add(id),
};

// Biometric check passed for a personnel file.
export const biometric = {
  has: (id: string) => verified.has(id),
  grant: (id: string) => verified.add(id),
};

export const commsAuth = {
  has: () => commsAuthed,
  grant: () => {
    commsAuthed = true;
  },
};
