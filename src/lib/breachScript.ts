import type { Step } from './engine';
import { AGENT, STOLEN } from './creds';

// Purely cinematic. Every "program" and message here is made up.

const box = (rows: string[]) => {
  const w = 52;
  return [
    '╔' + '═'.repeat(w) + '╗',
    ...rows.map((r) => '║   ' + r.padEnd(w - 3) + '║'),
    '╚' + '═'.repeat(w) + '╝',
  ];
};

const BANNER = box([
  'FEDERAL BUREAU OF INVESTIGATION',
  'UNUSUAL INCIDENTS UNIT  //  FELDTERMINAL WS-07',
  '',
  'GESCHÜTZTES SYSTEM — NUR FÜR BEFUGTE',
]);

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
  { t: 'lines', lines: BANNER, cls: 'hi', gap: 50 },
  { t: 'line', text: '' },
  { t: 'line', text: `AGENT: ${AGENT.toUpperCase()}     FALLAKTE: UIU-2026-0419`, cls: 'dim', delay: 600 },
  { t: 'line', text: '' },

  // the "operation"
  { t: 'cmd', text: 'öffne fallakte "DIE FOUNDATION"' },
  { t: 'line', text: '> Zielnetzwerk: SCiPnet', delay: 200 },
  { t: 'line', text: '> Status: MIT STANDARDMITTELN NICHT ERREICHBAR', cls: 'dim', delay: 500 },
  { t: 'cmd', text: 'starte ghostline' },
  { t: 'progress', label: 'Phantom-Uplink abstimmen', ms: 2200 },
  { t: 'line', text: '> Schwaches Trägersignal gefunden. Ursprung: [REDACTED]', cls: 'hi', delay: 500 },
  { t: 'progress', label: 'Chiffrierschicht I lösen', ms: 1600 },
  { t: 'progress', label: 'Chiffrierschicht II lösen', ms: 1900 },
  { t: 'hex', rows: 10 },
  { t: 'line', text: '' },

  // trouble
  { t: 'alert', on: true },
  { t: 'line', text: '!! WARNUNG: MEMETISCHE GEGENMASSNAHME ERKANNT', cls: 'warn', delay: 400 },
  { t: 'line', text: '!! NICHT DIREKT AUF DEN BILDSCHIRM SEHEN', cls: 'warn', delay: 900 },
  { t: 'cmd', text: 'aktiviere filter --anti-memetisch', speed: 0.5 },
  { t: 'progress', label: 'Filtern', ms: 1500, cls: 'warn' },
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
  { t: 'line', text: '>>> GATEWAY OFFEN. VERBINDE MIT SCiPnet...', cls: 'hi', delay: 1400 },
];
