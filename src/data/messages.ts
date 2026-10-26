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

// Which of the Administrator's messages this browser has opened. Kept beyond
// the 15-minute session, so a message sent while nobody was logged in is
// announced at the next login, like Lena's at the first start.
const SEEN = 'scipnet.seenMessages';
function seen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN) ?? '[]') as string[];
  } catch {
    return [];
  }
}
export const unseenMessages = () => {
  const s = seen();
  return MESSAGES.filter((m) => !s.includes(m.id));
};
export function markMessagesSeen() {
  try {
    localStorage.setItem(SEEN, JSON.stringify(MESSAGES.map((m) => m.id)));
  } catch {
    // storage unavailable: the messages are announced again next time
  }
}
