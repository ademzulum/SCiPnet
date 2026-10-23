// Personnel files. Text may contain [[...]] for redacted passages.

export type Person = {
  id: string;
  name: string;
  role: string;
  department: string;
  clearance: string;
  status: 'Aktiv' | 'Beurlaubt' | 'Vermisst' | 'Beobachtung';
  since: string;
  summary: string;
  notes: string[];
};

export const PERSONNEL: Person[] = [
  {
    id: 'P-80-0001',
    name: 'Dr. Ilse Brandt',
    role: 'Standortdirektorin',
    department: 'Standortleitung',
    clearance: 'Stufe 4',
    status: 'Aktiv',
    since: '2009',
    summary:
      'Leitet Site-80 seit der Neustrukturierung von 2014. Verantwortlich für sämtliche Eindämmungs- und Forschungsprotokolle am Standort.',
    notes: [
      'Hat die Zusammenarbeit mit [[Dienststelle entfernt]] im Jahr 2019 persönlich beendet.',
      'Zugriff auf O5-Korrespondenz über gesicherten Kanal.',
    ],
  },
  {
    id: 'P-80-0117',
    name: 'Dr. Duncan Maynard',
    role: 'Leitender Forscher',
    department: 'Anomalienforschung / RAISA-Verbindung',
    clearance: 'RAISA',
    status: 'Aktiv',
    since: '2016',
    summary:
      'Verbindungsoffizier zwischen der Forschungsabteilung und RAISA. Verwaltet die Aktenführung zu Feldeinsätzen in Mitteleuropa.',
    notes: [
      'Letzte Anmeldung von ungewöhnlichem Endpunkt. Sicherheitsprüfung angeordnet.',
      'Ausbildung: Promotion in Informationswissenschaft, [[Universität geschwärzt]].',
    ],
  },
  {
    id: 'P-80-0342',
    name: 'Agentin Mara Kessler',
    role: 'Einsatzleiterin',
    department: 'Sicherheitsdienst / Feldeinsätze',
    clearance: 'Stufe 3',
    status: 'Aktiv',
    since: '2018',
    summary: 'Leitet die Bergungsteams im süddeutschen Raum. Über 40 erfolgreiche Bergungen ohne zivile Zwischenfälle.',
    notes: ['Ausgezeichnet nach Vorfall [[Akte 80-17]].'],
  },
  {
    id: 'P-80-0588',
    name: 'Dr. Tomas Reyes',
    role: 'Forscher',
    department: 'Memetik und Kognitionsgefahren',
    clearance: 'Stufe 3',
    status: 'Beurlaubt',
    since: '2020',
    summary: 'Spezialist für antimemetische Filter. Derzeit beurlaubt bis zum Abschluss einer kognitiven Beurteilung.',
    notes: ['Beurlaubung angeordnet nach Feldbericht FB-80-2026-028.', 'Wiedereingliederung geplant: [[Datum entfernt]].'],
  },
  {
    id: 'P-80-1024',
    name: 'Lena Hofstetter',
    role: 'Archivarin',
    department: 'Archiv und Dokumentation',
    clearance: 'Stufe 2',
    status: 'Aktiv',
    since: '2022',
    summary: 'Pflegt die physischen Archive von Site-80 und digitalisiert ältere Fallakten.',
    notes: ['Meldete wiederholt fehlende Seiten in Archivbestand 7.'],
  },
  {
    id: 'X-80-0003',
    name: 'Corvus Finch',
    role: 'Externe Person von Interesse',
    department: 'FBI / Unusual Incidents Unit',
    clearance: 'Keine',
    status: 'Beobachtung',
    since: '2026',
    summary: 'Special Agent der UIU. Zeigt anhaltendes Interesse an Foundation-Aktivitäten im Zuständigkeitsbereich von Site-80.',
    notes: ['Überwachung durch RAISA angeordnet.', 'Kontaktaufnahme nur mit Genehmigung der Standortdirektion.'],
  },
];

export const personById = (id: string) => PERSONNEL.find((p) => p.id === id);
