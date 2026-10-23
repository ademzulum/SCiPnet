// Progress inside SCiPnet: chats, psych access, biometric scans, comms login.
// Kept with the 15-minute login (survives reloads) and reset on logout.
import type { Msg, Thread } from '../data/threads';
import { savedSession } from '../lib/persist';

export type ThreadState = { log: Msg[]; queue: Msg[]; node: string };

type Stored = { threads: [string, ThreadState][]; unlocked: string[]; verified: string[]; comms: boolean };
const stored = savedSession.state() as Stored | undefined;

const threads = new Map<string, ThreadState>(stored?.threads ?? []);
const unlocked = new Set<string>(stored?.unlocked ?? []);
const verified = new Set<string>(stored?.verified ?? []);
let commsAuthed = stored?.comms ?? false;

function save() {
  savedSession.setState({
    threads: [...threads],
    unlocked: [...unlocked],
    verified: [...verified],
    comms: commsAuthed,
  } satisfies Stored);
}

// Forget all progress (logout / session expiry).
export function resetSessionState() {
  threads.clear();
  unlocked.clear();
  verified.clear();
  commsAuthed = false;
}

export const threadState = {
  get: (t: Thread): ThreadState =>
    threads.get(t.id) ?? { log: [...t.history], queue: [...t.nodes[t.start].msgs], node: t.start },
  set: (id: string, s: ThreadState) => {
    threads.set(id, s);
    save();
  },
  reset: (id: string) => {
    threads.delete(id);
    save();
  },
  isNew: (id: string) => !threads.has(id),
};

export const psychAccess = {
  has: (id: string) => unlocked.has(id),
  grant: (id: string) => {
    unlocked.add(id);
    save();
  },
};

// Biometric check passed for a personnel file.
export const biometric = {
  has: (id: string) => verified.has(id),
  grant: (id: string) => {
    verified.add(id);
    save();
  },
};

export const commsAuth = {
  has: () => commsAuthed,
  grant: () => {
    commsAuthed = true;
    save();
  },
};
