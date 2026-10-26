// Personnel files. Text may contain [[...]] for redacted passages.

import type { Access } from './access';

export type Person = {
  id: string;
  name: string;
  role: string;
  department: string;
  clearance: string;
  status: 'Aktiv' | 'Beurlaubt' | 'Vermisst' | 'Beobachtung';
  since: string;
  photo?: string; // file name in images/personell_pictures/ (no extension); a generated portrait is shown otherwise
  quote?: string;
  summary: string;
  notes: string[];
  timeline: { year: string; text: string }[];
  // Psych profile behind an access request; 'denied' shows `required`.
  psych: {
    access: 'granted' | 'denied';
    required?: string;
    verdict?: { label: string; tone: 'ok' | 'warn' | 'bad' };
    date?: string;
    metrics?: { label: string; value: number }[]; // 0-100
    text: string[];
  };
  incidents: string[];
  access?: Access; // see data/access.ts
};

export const PERSONNEL: Person[] = []; // filled from the database at start, see src/data/store.ts

// Not listed with the staff; reachable through the O5-13 card once the signal
// puzzle is solved.
export const O5_PERSON: Person = {
  id: 'O5-13',
  name: 'O5-13',
  role: 'Mitglied des O5-Rats',
  department: 'O5-Rat',
  clearance: 'Stufe 5',
  status: 'Aktiv',
  since: '[unbekannt]',
  quote: 'Dreizehn Stimmen, eine Entscheidung.',
  summary:
    'Eines von dreizehn Mitgliedern des O5-Rats. Identität und Aufenthaltsort sind klassifiziert. Das Konto ist für Einsicht freigegeben, nicht für Änderungen am Archiv.',
  notes: [
    'Anfragen an O5-13 laufen über das Büro des O5-Rats.',
    'Zugriff auf SCiPnet nur lesend; Änderungen am Archiv bleiben dem Administrator vorbehalten.',
  ],
  timeline: [
    { year: '[unbekannt]', text: 'Berufung in den O5-Rat.' },
    { year: '2014', text: 'Zustimmung zur Ernennung von Dr. Ilse Brandt als Standortdirektorin von Site-80.' },
    { year: '2026', text: 'Signalpfad zu diesem Konto von außen durchgestellt.' },
  ],
  psych: {
    access: 'granted',
    verdict: { label: 'Nicht bewertbar', tone: 'warn' },
    metrics: [
      { label: 'Belastbarkeit', value: 96 },
      { label: 'Kooperation', value: 41 },
      { label: 'Vorhersagbarkeit', value: 14 },
    ],
    text: ['Bewertungen von Mitgliedern des O5-Rats werden nicht archiviert.'],
  },
  incidents: ['Keine Vermerke.'],
};

// Not listed with the staff; shown once the real Administrator account is logged in.
export const ADMIN_PERSON: Person = {
  id: 'A-00-0000',
  name: 'Der Administrator',
  role: 'Gründer der Foundation',
  department: 'O5-Rat / Verwaltung',
  clearance: 'Stufe 6',
  status: 'Aktiv',
  since: '[unbekannt]',
  quote: 'Wir sichern, damit die Welt es nicht muss.',
  summary:
    'Gründer der SCP Foundation. Identität, Alter und Aufenthaltsort sind selbst dem O5-Rat nur teilweise bekannt. Kommuniziert ausschließlich über gesicherte Kanäle.',
  notes: [
    'Alle Anfragen an den Administrator laufen über das Büro des O5-Rats.',
    'Hat Site-80 bei ihrer Gründung persönlich besucht. Der Besuch ist nicht protokolliert.',
  ],
  timeline: [
    { year: '[unbekannt]', text: 'Gründung der Foundation.' },
    { year: '[unbekannt]', text: 'Einsetzung des O5-Rats.' },
    { year: '2014', text: 'Bestätigung von Dr. Ilse Brandt als Standortdirektorin von Site-80.' },
    { year: '2026', text: 'Gewährt Einblick in diese Akte.' },
  ],
  psych: {
    access: 'granted',
    verdict: { label: 'Nicht bewertbar', tone: 'warn' },
    metrics: [
      { label: 'Belastbarkeit', value: 100 },
      { label: 'Kooperation', value: 50 },
      { label: 'Vorhersagbarkeit', value: 8 },
    ],
    text: ['Eine psychologische Bewertung wurde nie durchgeführt. Alle Versuche wurden freundlich abgelehnt.'],
  },
  incidents: ['Keine Vermerke.'],
};

export const personById = (id: string) =>
  [O5_PERSON, ADMIN_PERSON].find((p) => p.id === id) ?? PERSONNEL.find((p) => p.id === id);
