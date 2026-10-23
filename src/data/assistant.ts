// S.C.I.P.A. (SCiPNet Intelligent Processing Assistant), the SCiPnet assistant. Purely scripted: what the user types is matched
// against keywords; the best-matching intent answers. Nothing matched -> a
// random line from UNKNOWN.
//
// Voice lines: put audio files into sounds/assistant/ and reference them by
// file name in `audio` (e.g. audio: 'greeting.mp3'). Without `audio` the
// answer is text only.
//
// Keywords are matched case-insensitively and without umlauts (ä -> a, ß -> ss),
// as whole words or phrases. More matching keywords = stronger match.

import type { Route } from '../scipnet/routes';

export type Answer = { text: string; audio?: string };

export type Intent = {
  id: string;
  keywords: string[];
  answers: Answer[]; // one is picked at random
  action?: { label: string; route: Route }; // optional button under the answer
};

export const GREETING: Answer = {
  text: 'S.C.I.P.A. online. SCiPNet Intelligent Processing Assistant, Site-80. Wie kann ich helfen?',
  // audio: 'greeting.mp3',
};

// "I don't know" pool, used when nothing matches.
export const UNKNOWN: Answer[] = [
  { text: 'Dazu liegen mir keine Informationen vor.' },
  { text: 'Das weiß ich nicht. Bitte formulieren Sie die Anfrage anders.' },
  { text: 'Anfrage nicht erkannt. Versuchen Sie es mit einem Stichwort wie "Feldberichte" oder "SCP-8041".' },
];

export const SUGGESTIONS = ['Wer bist du?', 'Zeige Feldberichte', 'Was ist SCP-8041?', 'Wer ist Dr. Brandt?', 'Wie spät ist es?'];

export const INTENTS: Intent[] = [
  {
    id: 'hello',
    keywords: ['hallo', 'hi', 'hey', 'guten tag', 'guten morgen', 'moin', 'servus'],
    answers: [{ text: 'Guten Tag, Dr. Maynard. Was kann ich für Sie tun?' }],
  },
  {
    id: 'who',
    keywords: ['wer bist du', 'was bist du', 'scipa', 's c i p a', 'dein name', 'wie heisst du'],
    answers: [
      {
        text: 'Ich bin S.C.I.P.A., der SCiPNet Intelligent Processing Assistant von Site-80. Ich durchsuche Akten, Berichte und das Archiv für Sie.',
      },
    ],
  },
  {
    id: 'help',
    keywords: ['hilfe', 'was kannst du', 'befehle', 'funktionen', 'help'],
    answers: [
      {
        text: 'Fragen Sie mich nach einer SCP-Nummer, einem Feldbericht (z. B. FB-80-2026-019), einer Person oder einem Bereich wie Personalakten, Feldberichte, Kommunikation oder Archiv.',
      },
    ],
  },
  {
    id: 'thanks',
    keywords: ['danke', 'vielen dank', 'merci', 'thx'],
    answers: [{ text: 'Gern geschehen.' }, { text: 'Jederzeit, Dr. Maynard.' }],
  },
  {
    id: 'reports',
    keywords: ['feldbericht', 'feldberichte', 'berichte', 'bericht', 'einsatz'],
    answers: [{ text: 'Es liegen vier Feldberichte vor, zwei davon sind offen.' }],
    action: { label: 'Feldberichte öffnen', route: { view: 'reports' } },
  },
  {
    id: 'personnel',
    keywords: ['personal', 'personalakten', 'mitarbeiter', 'akten', 'personen'],
    answers: [{ text: 'Die Personalakten von Site-80 sind biometrisch gesichert. Ich öffne die Übersicht.' }],
    action: { label: 'Personalakten öffnen', route: { view: 'personnel' } },
  },
  {
    id: 'archive',
    keywords: ['archiv', 'scp archiv', 'anomalien', 'objekte'],
    answers: [{ text: 'Im SCP-Archiv von Site-80 sind sechs Einträge verzeichnet, zwei davon sind für Ihre Freigabe gesperrt.' }],
    action: { label: 'SCP-Archiv öffnen', route: { view: 'archive' } },
  },
  {
    id: 'comms',
    keywords: ['nachricht', 'nachrichten', 'kommunikation', 'chat', 'kanal'],
    answers: [{ text: 'Sie haben ungelesene Nachrichten in der Kommunikationszentrale.' }],
    action: { label: 'Kommunikation öffnen', route: { view: 'comms' } },
  },
  {
    id: 'administrator',
    keywords: ['administrator', 'gruender', 'o5', 'rat'],
    answers: [
      { text: 'Zu dieser Anfrage darf ich keine Auskunft geben.' },
      { text: 'Diese Information existiert nicht. Bitte stellen Sie die Anfrage nicht erneut.' },
    ],
  },
  {
    id: 'finch',
    keywords: ['finch', 'corvus', 'fbi', 'uiu'],
    answers: [{ text: 'Corvus Finch ist eine externe Person von Interesse. RAISA hat eine Überwachung angeordnet.' }],
    action: { label: 'Akte öffnen', route: { view: 'person', id: 'X-80-0003' } },
  },
  {
    id: 'site',
    keywords: ['site 80', 'standort', 'status', 'lage'],
    answers: [{ text: 'Standortstatus: NORMAL. Archiv 7 bleibt gesperrt. Keine aktiven Eindämmungsbrüche.' }],
  },
  {
    id: 'joke',
    keywords: ['witz', 'lustig', 'joke'],
    answers: [{ text: 'SCP-8002 ruft vor jedem Erdbeben. Leider auch vor jedem Meeting.' }],
  },
];
