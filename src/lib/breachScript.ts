import type { Step } from './engine';
import { STOLEN } from './creds';

// Purely cinematic. Every "program" and message here is made up.

const BANNER = [
  '╔════════════════════════════════════════════════════╗',
  '║   FEDERAL BUREAU OF INVESTIGATION                  ║',
  '║   UNUSUAL INCIDENTS UNIT  //  FIELD TERMINAL WS-07 ║',
  '║                                                    ║',
  '║   RESTRICTED SYSTEM — AUTHORIZED PERSONNEL ONLY    ║',
  '╚════════════════════════════════════════════════════╝',
];

export const BREACH_SCRIPT: Step[] = [
  // boot
  { t: 'line', text: 'UIU-OS 4.11 (C) FEDERAL BUREAU OF INVESTIGATION', cls: 'hi', delay: 300 },
  { t: 'line', text: '' },
  {
    t: 'lines',
    gap: 110,
    lines: ['MEMORY CHECK ......... OK', 'EVIDENCE VAULT ....... MOUNTED', 'FIELD LINK ........... STANDBY'],
  },
  { t: 'wait', ms: 500 },
  { t: 'clear' },
  { t: 'lines', lines: BANNER, cls: 'hi', gap: 50 },
  { t: 'line', text: '' },
  { t: 'line', text: 'AGENT: S/A RAMIREZ          CASE FILE: UIU-2026-0419', cls: 'dim', delay: 600 },
  { t: 'line', text: '' },

  // the "operation"
  { t: 'cmd', text: 'open casefile "THE FOUNDATION"' },
  { t: 'line', text: '> Subject network designation: SCiPnet', delay: 200 },
  { t: 'line', text: '> Status: UNREACHABLE BY STANDARD MEANS', cls: 'dim', delay: 500 },
  { t: 'cmd', text: 'run ghostline' },
  { t: 'progress', label: 'Tuning phantom uplink', ms: 2200 },
  { t: 'line', text: '> Faint carrier signal found. Origin: [REDACTED]', cls: 'hi', delay: 500 },
  { t: 'progress', label: 'Peeling cipher layer I', ms: 1600 },
  { t: 'progress', label: 'Peeling cipher layer II', ms: 1900 },
  { t: 'hex', rows: 10 },
  { t: 'line', text: '' },

  // trouble
  { t: 'alert', on: true },
  { t: 'line', text: '!! WARNING: MEMETIC COUNTERMEASURE DETECTED', cls: 'warn', delay: 400 },
  { t: 'line', text: '!! DO NOT LOOK DIRECTLY AT THE SCREEN', cls: 'warn', delay: 900 },
  { t: 'cmd', text: 'engage filter --anti-memetic', speed: 0.5 },
  { t: 'progress', label: 'Filtering', ms: 1500, cls: 'warn' },
  { t: 'alert', on: false },
  { t: 'line', text: '> Filter holding. Agent cognition nominal.', cls: 'hi', delay: 500 },
  { t: 'line', text: '' },

  // payoff
  { t: 'cmd', text: 'recover identity from intercepted traffic' },
  { t: 'scramble', label: '  USER   : ', value: STOLEN.user, ms: 1400, cls: 'hi' },
  { t: 'scramble', label: '  NAME   : ', value: STOLEN.name, ms: 1200, cls: 'hi' },
  { t: 'scramble', label: '  LEVEL  : ', value: `CLEARANCE ${STOLEN.clearance}`, ms: 900, cls: 'hi' },
  { t: 'scramble', label: '  KEY    : ', value: '•'.repeat(STOLEN.password.length), ms: 1100, cls: 'hi' },
  { t: 'line', text: '' },
  { t: 'line', text: '>>> GATEWAY OPEN. CONNECTING TO SCiPnet...', cls: 'hi', delay: 1400 },
];
