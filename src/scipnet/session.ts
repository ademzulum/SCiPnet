// Progress inside SCiPnet: chats, psych access, biometric scans, comms login.
// Kept with the 15-minute login (survives reloads) and reset on logout.
import type { Msg, Thread } from '../data/threads';
import { useSyncExternalStore } from 'react';
import { savedSession } from '../lib/persist';
import { ACCOUNTS, type Account } from '../lib/creds';

export type ThreadState = { log: Msg[]; queue: Msg[]; node: string };

type Stored = {
  threads: [string, ThreadState][];
  unlocked: string[];
  verified: string[];
  comms: boolean;
  admin?: boolean; // brute-force game won
  account?: Account;
};
const stored = savedSession.state() as Stored | undefined;

const threads = new Map<string, ThreadState>(stored?.threads ?? []);
const unlocked = new Set<string>(stored?.unlocked ?? []);
const verified = new Set<string>(stored?.verified ?? []);
let commsAuthed = stored?.comms ?? false;
let adminUnlocked = stored?.admin ?? false;
let account: Account = stored?.account ?? 'maynard';

// React subscribers for the admin/account state.
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function save() {
  savedSession.setState({
    threads: [...threads],
    unlocked: [...unlocked],
    verified: [...verified],
    comms: commsAuthed,
    admin: adminUnlocked,
    account,
  } satisfies Stored);
}

// Forget all progress (logout / session expiry).
export function resetSessionState() {
  threads.clear();
  unlocked.clear();
  verified.clear();
  commsAuthed = false;
  adminUnlocked = false;
  account = 'maynard';
  emit();
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

// Administrator access (after winning the minigame) and the active account.
export const adminAccess = {
  has: () => adminUnlocked,
  grant: () => {
    adminUnlocked = true;
    save();
    emit();
  },
};

export const currentAccount = () => account;

export function switchAccount(a: Account) {
  if (a === 'admin' && !adminUnlocked) return;
  account = a;
  save();
  emit();
}

export function useAdminUnlocked() {
  return useSyncExternalStore(subscribe, () => adminUnlocked);
}

export function useAccount() {
  const a = useSyncExternalStore(subscribe, () => account);
  return { id: a, ...ACCOUNTS[a] };
}
