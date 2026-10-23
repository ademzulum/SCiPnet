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
const Q = 'P-80-0731';

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
  {
    id: 'quebec',
    contact: Q,
    subject: 'Dringend!!! (nicht wirklich)',
    history: [
      { from: Q, text: 'Maynard! Wer hat schon wieder meinen Joghurt aus dem Kühlschrank in Labor 2 gegessen?', time: '20.10. 16:42' },
      { from: Q, text: 'Ich habe einen Verdacht. Er beginnt mit H und endet mit ofstetter.', time: '20.10. 16:43' },
    ],
    start: 'a',
    nodes: {
      a: {
        msgs: [
          { from: Q, text: 'Guten Morgen, Doktor! Ich habe großartige Neuigkeiten.' },
          { from: Q, text: 'Die Proben von SCP-8041 sind stabil. Im Gegensatz zu meiner Geduld mit Hofstetter.' },
        ],
        choices: [
          { label: 'Was ist passiert?', reply: 'Was hat sie diesmal getan?', next: 'rant' },
          { label: 'Zu den Proben.', reply: 'Erzählen Sie mir lieber von den Proben.', next: 'samples' },
          { label: 'Ein Witz bitte.', reply: 'Ich brauche einen Witz, Timothy.', next: 'joke' },
        ],
      },
      rant: {
        msgs: [
          { from: Q, text: 'Sie hat meinen Bericht zurückgeschickt. Wegen EINES Kommafehlers.' },
          { from: Q, text: 'Mit rotem Stift. Doktor, sie besitzt einen eigenen roten Stift. Nur dafür.' },
          { from: Q, text: 'Meine Großmutter in Lagos hat mir beigebracht, jedem zu verzeihen. Sie kannte Hofstetter nicht.' },
        ],
        choices: [
          { label: 'Sie meint es nicht böse.', reply: 'Sie meint es bestimmt nicht böse.', next: 'defend' },
          { label: 'Der Kugelschreiber?', reply: 'Geht es immer noch um den Kugelschreiber?', next: 'pen' },
        ],
      },
      defend: {
        msgs: [
          { from: Q, text: 'Das sagen alle. Auch über SCP-8002. Und das ruft vor Erdbeben an.' },
          { from: Q, text: 'Ich behalte sie im Auge. Mit beiden Augen. Und einer Kamera.' },
        ],
      },
      pen: {
        msgs: [
          { from: Q, text: 'Es war ein GUTER Kugelschreiber, Doktor. Aus Kapstadt. Mit Gravur.' },
          { from: Q, text: 'Sie sagt, sie hat ihn "archiviert". Wer archiviert einen Kugelschreiber?!' },
          { from: Q, text: 'Ich habe einen Antrag auf Herausgabe gestellt. Formular 27-B. In dreifacher Ausführung.' },
        ],
        choices: [{ label: 'Viel Glück.', reply: 'Viel Glück damit.', next: 'luck' }],
      },
      luck: { msgs: [{ from: Q, text: 'Glück brauche ich nicht. Ich habe Bürokratie. Und Rachegelüste. Kleine. Professionelle.' }] },
      samples: {
        msgs: [
          { from: Q, text: 'Langweilig, aber gut: keine Mutation, keine Ausbrüche, keine Tentakel.' },
          { from: Q, text: 'Ich bin fast enttäuscht. Ich hatte mir schon einen Namen für die Tentakel ausgedacht.' },
        ],
        choices: [{ label: 'Welchen Namen?', reply: 'Welchen Namen denn?', next: 'name' }],
      },
      name: { msgs: [{ from: Q, text: 'Lena. Aus keinem bestimmten Grund. 😇' }] },
      joke: {
        msgs: [
          { from: Q, text: 'Warum hat SCP-173 keine Freunde?' },
          { from: Q, text: 'Weil niemand wegschauen will, um ihn kennenzulernen.' },
          { from: Q, text: 'Hofstetter hat übrigens auch nicht gelacht. Das beweist, dass er gut ist.' },
        ],
      },
    },
  },
];

export const threadById = (id: string) => THREADS.find((t) => t.id === id);
export const threadForContact = (personId: string) => THREADS.find((t) => t.contact === personId);
