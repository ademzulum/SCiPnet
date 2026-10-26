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
