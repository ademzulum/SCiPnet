import type { Step } from './engine';
import { AGENT, STOLEN } from './creds';

// Purely cinematic. Every "program" and message here is made up.

// One line drawn as a framed panel by CSS (.uiu-banner), so the frame keeps
// its shape when the text wraps on narrow screens.
const BANNER = [
  'FEDERAL BUREAU OF INVESTIGATION',
  'UNUSUAL INCIDENTS UNIT // FELDTERMINAL WS-07',
  '',
  'GESCHÜTZTES SYSTEM — NUR FÜR BEFUGTE',
].join('\n');

export const BREACH_SCRIPT: Step[] = [
  // boot
  { t: 'line', text: 'UIU-OS 4.11 (C) FEDERAL BUREAU OF INVESTIGATION', cls: 'hi', delay: 300 },
  { t: 'line', text: '' },
  {
    t: 'lines',
    gap: 110,
    lines: ['SPEICHERTEST ......... OK', 'BEWEISARCHIV ......... EINGEBUNDEN', 'FELDVERBINDUNG ....... BEREIT'],
  },
  { t: 'wait', ms: 500 },
  { t: 'clear' },
  { t: 'line', text: BANNER, cls: 'hi uiu-banner', delay: 300 },
  { t: 'line', text: '' },
  { t: 'line', text: `AGENT: ${AGENT.toUpperCase()}     FALLAKTE: UIU-2026-0419`, cls: 'dim', delay: 600 },
  { t: 'line', text: '' },

  // the "operation"
  { t: 'line', text: 'HINWEIS: Auswahl mit den angezeigten Tasten. [ESC] überspringt.', cls: 'dim', delay: 300, touch: 'HINWEIS: Auswahl über die Schaltflächen unten.' },
  { t: 'line', text: '' },
  { t: 'cmd', text: 'öffne fallakte "DIE FOUNDATION"' },
  { t: 'line', text: '> Zielnetzwerk: SCiPnet', delay: 200 },
  { t: 'line', text: '> Status: MIT STANDARDMITTELN NICHT ERREICHBAR', cls: 'dim', delay: 500 },
  { t: 'line', text: '' },
  {
    t: 'choice',
    options: [
      {
        key: '1',
        label: 'Akte lesen',
        retry: true,
        steps: [
          {
            t: 'lines',
            cls: 'dim',
            gap: 120,
            lines: [
              '  Organisation: "Die Foundation". Zweck: unbekannt.',
              '  Standorte: mindestens 80. Personal: [REDACTED].',
              '  Notiz S/A Finch: "Sie verstecken etwas. Und sie sind gut darin."',
            ],
          },
        ],
      },
      { key: '2', label: 'Operation starten', steps: [] },
    ],
  },
  { t: 'line', text: '' },
  { t: 'cmd', text: 'starte ghostline' },
  { t: 'line', text: '> Trägerfrequenz suchen: [←] [→] abstimmen, bei vollem Signal [ENTER].', cls: 'dim', delay: 200, touch: '> Trägerfrequenz suchen: mit ◀ ▶ abstimmen, bei vollem Signal FIXIEREN.' },
  { t: 'tune', label: 'Phantom-Uplink' },
  { t: 'line', text: '> Trägersignal gefunden. Ursprung: [REDACTED]', cls: 'hi', delay: 500 },
  { t: 'progress', label: 'Chiffrierschicht I lösen', ms: 1600 },
  { t: 'progress', label: 'Chiffrierschicht II lösen', ms: 1900 },
  { t: 'hex', rows: 10 },
  { t: 'line', text: '' },

  // trouble
  { t: 'alert', on: true },
  { t: 'sound', name: 'memetic' },
  { t: 'line', text: '!! WARNUNG: MEMETISCHE GEGENMASSNAHME ERKANNT', cls: 'warn', delay: 400 },
  { t: 'line', text: '!! NICHT DIREKT AUF DEN BILDSCHIRM SEHEN', cls: 'warn', delay: 600 },
  {
    t: 'choice',
    options: [
      {
        key: '1',
        label: 'Anti-Memetik-Filter',
        steps: [
          { t: 'cmd', text: 'aktiviere filter --anti-memetisch' },
          { t: 'progress', label: 'Filtern', ms: 1500, cls: 'warn' },
        ],
      },
      {
        key: '2',
        label: 'Verbindung trennen',
        retry: true,
        steps: [
          { t: 'line', text: '> Trennen? Nach sechs Monaten Arbeit? Auf keinen Fall.', cls: 'warn', delay: 700 },
        ],
      },
    ],
  },
  { t: 'alert', on: false },
  { t: 'line', text: '> Filter hält. Kognition des Agenten normal.', cls: 'hi', delay: 500 },
  { t: 'line', text: '' },

  // payoff
  { t: 'cmd', text: 'rekonstruiere identität aus abgefangenem verkehr' },
  { t: 'scramble', label: '  KENNUNG  : ', value: STOLEN.user, ms: 1400, cls: 'hi' },
  { t: 'scramble', label: '  NAME     : ', value: STOLEN.name, ms: 1200, cls: 'hi' },
  { t: 'scramble', label: '  FREIGABE : ', value: STOLEN.clearance, ms: 900, cls: 'hi' },
  { t: 'scramble', label: '  SCHLÜSSEL: ', value: '•'.repeat(STOLEN.password.length), ms: 1100, cls: 'hi' },
  { t: 'line', text: '' },
  { t: 'line', text: '> Mit dieser Identität bei SCiPnet anmelden?', delay: 200 },
  {
    t: 'choice',
    options: [
      { key: 'j', label: 'Ja', steps: [] },
      {
        key: 'n',
        label: 'Nein',
        retry: true,
        steps: [{ t: 'line', text: '> Zögern ist keine Option, Agent.', cls: 'dim', delay: 500 }],
      },
    ],
  },
  { t: 'sound', name: 'uiuSuccess' },
  { t: 'line', text: '>>> GATEWAY OFFEN. VERBINDE MIT SCiPnet...', cls: 'hi', delay: 1400 },
];
