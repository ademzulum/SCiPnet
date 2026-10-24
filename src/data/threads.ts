// Scripted message threads. Each node's messages play in order; then the
// reader picks a choice, which posts `reply` (or the label) and jumps to `next`.
// A node without choices ends the conversation.

// voice: a recording under sounds/communications/, e.g. 'timothy_quebec/guten_tag_maynard.mp3';
// the message then shows as a voice message with `text` as its transcript.
export type Msg = { from: 'me' | string; text: string; time?: string; voice?: string };
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
          {
            from: Q,
            voice: 'timothy_quebec/guten_tag_maynard.mp3',
            text: 'Guten Tag Maynard, du altes Haus. Weißt du, ich verstehe echt nicht, warum Frau Hofstetter hier noch arbeitet, die macht doch eh nichts… Achso, ich hab vergessen, was ich eigentlich sagen wollte.',
          },
          {
            from: Q,
            voice: 'timothy_quebec/jetzt_weiss_ichs_wieder.mp3',
            text: 'Jetzt weiß ich wieder, was ich sagen wollte: Diese verdammte Frau hat meinen Joghurt aufgegessen. Da war sogar extra mein Name draufgeschrieben. Wie kann man nur so räudig sein?',
          },
          {
            from: Q,
            voice: 'timothy_quebec/lena_die_kleine.mp3',
            text: 'Achso, dich interessiert bestimmt auch, wie es mit den SCP-Proben aussieht. Keine der Proben ist brauchbar, genau so wie Lena, die kleine Schlam–',
          },
          {
            from: Q,
            voice: 'timothy_quebec/und_jetzt_schrei_nicht_so.mp3',
            text: 'Sorry für die vielen Sprachnachrichten, ich schaue nebenbei eine Serie, deswegen habe ich keine Lust zu schreiben. Gib mir Bescheid, wenn du dich entschieden hast, was du gegen Hofstetter unternimmst.',
          },
        ],
        choices: [
          { label: 'Ich rede mit ihr.', reply: 'Ich rede mit Hofstetter. Wegen des Joghurts.', next: 'rant' },
          { label: 'Gar nichts.', reply: 'Ich unternehme gar nichts, Timothy.', next: 'defend' },
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
