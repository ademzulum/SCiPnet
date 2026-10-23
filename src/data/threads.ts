// Scripted message threads. Each node's messages play in order; then the
// reader picks a choice, which posts `reply` (or the label) and jumps to `next`.
// A node without choices ends the conversation.

export type Msg = { from: 'me' | string; text: string; time?: string };
export type Choice = { label: string; reply?: string; next: string };
export type Node = { msgs: Msg[]; choices?: Choice[] };

export type Thread = {
  id: string;
  contact: string; // personnel id
  subject: string;
  history: Msg[]; // already read before this session
  start: string;
  nodes: Record<string, Node>;
};

const H = 'P-80-1024';

export const THREADS: Thread[] = [
  {
    id: 'hofstetter',
    contact: H,
    subject: 'Fehlende Seite, Archiv 7',
    history: [{ from: H, text: 'Guten Morgen! Die Digitalisierung von Regal 3 ist fertig.', time: '21.10. 08:15' }],
    start: 'a',
    nodes: {
      a: {
        msgs: [
          { from: H, text: 'Kurze Frage: In Akte 80-117 fehlt Seite 4.' },
          { from: H, text: 'Haben Sie die vielleicht ausgeliehen?' },
        ],
        choices: [
          { label: 'Nein, nicht bei mir.', reply: 'Nein, die habe ich nicht.', next: 'search' },
          { label: 'Ich schaue nach.', reply: 'Ich schaue in meinem Büro nach.', next: 'found' },
        ],
      },
      search: {
        msgs: [{ from: H, text: 'Seltsam. Dann suche ich im Lesesaal weiter.' }],
        choices: [{ label: 'Viel Erfolg.', reply: 'Viel Erfolg! Melden Sie sich.', next: 'end' }],
      },
      found: {
        msgs: [
          { from: H, text: 'Danke!' },
          { from: H, text: 'Oh, warten Sie. Sie lag hinter dem Regal. Hat sich erledigt.' },
        ],
      },
      end: { msgs: [{ from: H, text: 'Mache ich. Danke!' }] },
    },
  },
];

export const threadById = (id: string) => THREADS.find((t) => t.id === id);
export const threadForContact = (personId: string) => THREADS.find((t) => t.contact === personId);
