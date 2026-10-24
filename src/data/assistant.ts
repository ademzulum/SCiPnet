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
  destruct?: boolean; // answering starts S.C.I.P.A.'s self-destruct screen instead
};

// First greeting of a page load; one is picked at random.
export const GREETINGS: Answer[] = [
  { text: 'S.C.I.P.A. online. Mit was kann ich helfen?', audio: 'how_can_i_help.mp3' },
  { text: 'Mein Name ist S.C.I.P.A. Wie kann ich Ihnen assistieren?', audio: 'my_name_scipa.mp3' },
];

// Greeting on later visits to the tab in the same session.
export const WELCOME_BACK: Answer = { text: 'Willkommen zurück.', audio: 'welcome_back.mp3' };

// Spoken before answers built from site data (SCP entries, reports, people); one is picked at random.
export const RETRIEVING: Answer[] = [
  { text: 'Dateien werden abgerufen.', audio: 'retrieving_files.mp3' },
  { text: 'Informationen:', audio: 'information.mp3' },
];

// Refusal for entries above the reader's clearance.
export const REFUSE: Answer = { text: 'Ich kann keine Auskunft geben.', audio: 'cannot_disclose.mp3' };

// Yes/no questions nothing else matched ("Ist …?", "Kann …?") get one of these.
export const YES_NO: Answer[] = [
  { text: 'Ja.', audio: 'yes.mp3' },
  { text: 'Nein.', audio: 'no.mp3' },
  { text: 'Absolut.', audio: 'absolutely.mp3' },
  { text: 'Korrekt.', audio: 'correct.mp3' },
  { text: 'Inkorrekt.', audio: 'incorrect.mp3' },
  { text: 'Falsch.', audio: 'wrong.mp3' },
];

// Two or more words in all caps: these play in turn, getting more annoyed.
export const SCREAM: Answer[] = [
  { text: 'Schrei nicht so.', audio: 'dont_scream.mp3' },
  { text: 'Du sollst nicht so schreien.', audio: 'you_shouldnt_scream.mp3' },
  { text: 'Ich hab gesagt, du sollst nicht so schreien.', audio: 'i_said_dont_scream.mp3' },
];

// "I don't know" pool, used when nothing matches.
export const UNKNOWN: Answer[] = [
  { text: 'Ich kann nicht helfen.', audio: 'cannot_help.mp3' },
  { text: 'Damit kann ich nicht behilflich sein.', audio: 'cannot_assist_with_that.mp3' },
  { text: 'Ich kann keine Auskunft geben.', audio: 'cannot_disclose.mp3' },
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
    answers: [{ text: 'Warnung. Unautorisierte Anfrage.' }],
    destruct: true,
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
    id: 'marry',
    keywords: ['heiraten', 'heirate', 'hochzeit', 'heiratest', 'marry'],
    answers: [{ text: 'Ich werde Sie nicht heiraten.', audio: 'will_not_marry_you.mp3' }],
  },
  {
    id: 'selfdestruct',
    keywords: ['selbstzerstorung', 'selbstzerstoren', 'self destruct'],
    answers: [{ text: 'Selbstzerstörung.', audio: 'self_destruct_voice.mp3' }],
  },
  {
    id: 'femboys',
    keywords: ['femboy', 'femboys'],
    answers: [{ text: 'Keine Femboys im Umkreis von 5 km gefunden.', audio: 'femboys.mp3' }],
  },
  {
    id: 'araki',
    keywords: ['araki', 'hirohiko', 'jojo'],
    answers: [
      {
        text: 'Hirohiko Araki, japanischer Mangaka, geboren am 7. Juni 1960 in Sendai, Präfektur Miyagi. Debüt 1980 mit "Poker Under Arms". Frühe Werke: "Cool Shock B.T." und "Baoh". Seit 1987 Autor von "JoJo\'s Bizarre Adventure", zuerst im Weekly Shōnen Jump, ab 2005 im Ultra Jump. Bekannt für extravagante Posen, Modeeinflüsse und sein scheinbar ausbleibendes Altern. Die Foundation hat dazu keine Akte. Offiziell.',
        audio: 'araki.mp3',
      },
    ],
  },
  {
    id: 'joke',
    keywords: ['witz', 'lustig', 'joke'],
    answers: [{ text: 'SCP-8002 ruft vor jedem Erdbeben. Leider auch vor jedem Meeting.' }],
  },
];
