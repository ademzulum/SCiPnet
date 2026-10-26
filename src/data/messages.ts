// Notices on the overview ("Mitteilungen") and the Administrator's one-way
// channel to Dr. Maynard. Both live in the database like every entry
// (kinds 'notice' and 'message', see supabase/002_messages.sql).

export type Notice = {
  id: string;
  time: string; // shown as written, e.g. 'Heute 02:00' or '26.10.'
  level: 'info' | 'warn' | 'alert';
  title: string;
  text: string;
};

export type AdminMessage = {
  id: string;
  sent: string; // ISO time
  text: string;
};

export const NOTICES: Notice[] = []; // filled from the database at start, see src/data/store.ts
export const MESSAGES: AdminMessage[] = []; // filled from the database at start, see src/data/store.ts

// Which of the Administrator's messages this browser has opened, and which
// notices it has announced. Kept beyond the 15-minute session, so something
// sent while nobody was logged in is announced at the next login, like Lena's
// message at the first start.
function seen(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
  } catch {
    return [];
  }
}
function mark(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // storage unavailable: they are announced again next time
  }
}
export const unseenMessages = () => MESSAGES.filter((m) => !seen('scipnet.seenMessages').includes(m.id));
export const markMessagesSeen = () => mark('scipnet.seenMessages', MESSAGES.map((m) => m.id));
export const unseenNotices = () => NOTICES.filter((n) => !seen('scipnet.seenNotices').includes(n.id));
export const markNoticesSeen = () => mark('scipnet.seenNotices', NOTICES.map((n) => n.id));
