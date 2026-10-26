// Progress inside SCiPnet: chats, psych access, biometric scans, comms login.
// Kept with the 15-minute login (survives reloads) and reset on logout.
import type { Msg, Thread } from '../data/threads';
import { useSyncExternalStore } from 'react';
import { savedSession } from '../lib/persist';
import { ACCOUNTS, type Account } from '../lib/creds';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type ThreadState = { log: Msg[]; queue: Msg[]; node: string };

type Stored = {
  threads: [string, ThreadState][];
  unlocked: string[];
  verified: string[];
  comms: boolean;
  admin?: boolean; // brute-force game won (O5-13)
  account?: Account;
};
const stored = savedSession.state() as Stored | undefined;

const threads = new Map<string, ThreadState>(stored?.threads ?? []);
const unlocked = new Set<string>(stored?.unlocked ?? []);
const verified = new Set<string>(stored?.verified ?? []);
let commsAuthed = stored?.comms ?? false;
let o5Unlocked = stored?.admin ?? false;
let account: Account = stored?.account ?? 'maynard';
// The Administrator is a real Supabase session with the admin role; it is
// checked on every load and never taken from storage.
let adminSession = false;
if (account === 'admin') account = 'maynard';

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
    admin: o5Unlocked,
    account,
  } satisfies Stored);
}

// Forget all progress (logout / session expiry).
export function resetSessionState() {
  threads.clear();
  unlocked.clear();
  verified.clear();
  commsAuthed = false;
  o5Unlocked = false;
  account = 'maynard';
  if (adminSession) void supabase?.auth.signOut();
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

// O5-13 access (after winning the minigame) and the active account.
export const o5Access = {
  has: () => o5Unlocked,
  grant: () => {
    o5Unlocked = true;
    save();
    emit();
  },
};

const isAdmin = (s: Session | null) => s?.user.app_metadata.role === 'admin';
supabase?.auth.getSession().then(({ data }) => setAdmin(isAdmin(data.session)));
supabase?.auth.onAuthStateChange((_e, s) => setAdmin(isAdmin(s)));
function setAdmin(on: boolean) {
  const was = adminSession;
  adminSession = on;
  if (!on && account === 'admin') account = 'maynard';
  if (on && !was) account = 'admin'; // a fresh login switches to the account
  save();
  emit();
}

// Real login with the Supabase account. Returns an error text or null.
export async function adminLogin(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Keine Verbindung zur Datenbank.';
  // a name without @ stands for <name>@scipnet.local, see supabase/004_usernames.sql
  if (!email.includes('@')) email = `${email.toLowerCase()}@scipnet.local`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return 'Kennung oder Passwort falsch.';
  if (!isAdmin(data.session)) {
    await supabase.auth.signOut();
    return 'Dieses Konto hat keine Administratorrechte.';
  }
  return null;
}

export const adminLogout = () => supabase?.auth.signOut();

// Restricted content (locked SCPs, psych profiles) is open to O5-13 and the Administrator.
export const cleared = () => o5Unlocked || adminSession;

export const currentAccount = () => account;

export function switchAccount(a: Account) {
  if (a === 'o5' && !o5Unlocked) return;
  if (a === 'admin' && !adminSession) return;
  account = a;
  save();
  emit();
}

export const useO5Unlocked = () => useSyncExternalStore(subscribe, () => o5Unlocked);
export const useAdminSession = () => useSyncExternalStore(subscribe, () => adminSession);
export const useCleared = () => useSyncExternalStore(subscribe, cleared);

// elevated: lifts redactions and censoring (O5-13 and Administrator);
// editor: may create, edit and delete entries (Administrator only).
export function useAccount() {
  const a = useSyncExternalStore(subscribe, () => account);
  return { id: a, ...ACCOUNTS[a], elevated: a !== 'maynard', editor: a === 'admin' };
}
