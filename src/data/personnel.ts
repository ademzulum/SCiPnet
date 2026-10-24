import corvusFinch from '../../images/personell_pictures/corvus_finch.png';
import duncanMaynard from '../../images/personell_pictures/duncan_maynard.png';
// Personnel files. Text may contain [[...]] for redacted passages.

export type Person = {
  id: string;
  name: string;
  role: string;
  department: string;
  clearance: string;
  status: 'Aktiv' | 'Beurlaubt' | 'Vermisst' | 'Beobachtung';
  since: string;
  photo?: string; // optional image URL; a generated portrait is shown otherwise
  eyeBar?: boolean; // black censor bar over the eyes of the photo
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
    quote: 'Vertrauen ist ein Eindämmungsfehler, der noch nicht passiert ist.',
    summary:
      'Leitet Site-80 seit der Neustrukturierung von 2014. Verantwortlich für sämtliche Eindämmungs- und Forschungsprotokolle am Standort.',
    notes: [
      'Hat die Zusammenarbeit mit [[der Global Occult Coalition]] im Jahr 2019 persönlich beendet.',
      'Zugriff auf O5-Korrespondenz über gesicherten Kanal.',
    ],
    timeline: [
      { year: '2009', text: 'Eintritt als Forscherin, Site-[[19]].' },
      { year: '2012', text: 'Beförderung zur Abteilungsleiterin Eindämmungstechnik.' },
      { year: '2014', text: 'Ernennung zur Standortdirektorin von Site-80.' },
      { year: '2019', text: 'Leitung der internen Untersuchung [[zum Verschwinden von Seite 4, Akte 80-117]].' },
    ],
    psych: {
      access: 'denied',
      required: 'Stufe 4',
      // readable once the signal puzzle is solved
      verdict: { label: 'Einsatzfähig', tone: 'ok' },
      date: '2026-08-30',
      metrics: [
        { label: 'Belastbarkeit', value: 96 },
        { label: 'Kooperation', value: 61 },
        { label: 'Kognitive Integrität', value: 93 },
      ],
      text: [
        'Außergewöhnlich kontrolliert. Trifft Entscheidungen ohne erkennbares Zögern.',
        'Vertraut niemandem vollständig, am wenigsten sich selbst.',
        'Führt ein privates Tagebuch, dessen Existenz sie bestreitet.',
      ],
    },
    incidents: ['Keine disziplinarischen Vermerke.'],
  },
  {
    id: 'P-80-0117',
    name: 'Dr. Duncan Maynard',
    photo: duncanMaynard,
    role: 'Leitender Forscher',
    department: 'Anomalienforschung / RAISA-Verbindung',
    clearance: 'RAISA',
    status: 'Aktiv',
    since: '2016',
    quote: 'Jede Akte erzählt eine Geschichte. Meistens die falsche.',
    summary:
      'Verbindungsoffizier zwischen der Forschungsabteilung und RAISA. Verwaltet die Aktenführung zu Feldeinsätzen in Mitteleuropa.',
    notes: [
      'Letzte Anmeldung von ungewöhnlichem Endpunkt. Sicherheitsprüfung angeordnet.',
      'Ausbildung: Promotion in Informationswissenschaft, [[Universität Heidelberg]].',
    ],
    timeline: [
      { year: '2016', text: 'Rekrutierung nach Kontakt mit einem anomalen Dokument.' },
      { year: '2018', text: 'Versetzung zu RAISA, Außenstelle Site-80.' },
      { year: '2023', text: 'Leitender Forscher. Verantwortlich für Feldakten Mitteleuropa.' },
      { year: '2026', text: 'Sicherheitsprüfung wegen auffälliger Anmeldung eingeleitet.' },
    ],
    psych: {
      access: 'granted',
      verdict: { label: 'Einsatzfähig', tone: 'ok' },
      date: '2026-04-11',
      metrics: [{ label: 'Belastbarkeit', value: 78 }, { label: 'Kooperation', value: 64 }, { label: 'Kognitive Integrität', value: 91 }],
      text: [
        'Ruhig, methodisch, neigt zu übermäßiger Dokumentation.',
        'Zeigt geringe Toleranz gegenüber unvollständigen Akten.',
        'Empfehlung: keine Einschränkungen. [[Nachtrag RAISA: Kontakte zur UIU sind unverzüglich zu melden]].',
      ],
    },
    incidents: ['2021: Verspätete Abgabe eines Berichts. Ermahnung.'],
  },
  {
    id: 'P-80-0342',
    name: 'Agentin Mara Kessler',
    role: 'Einsatzleiterin',
    department: 'Sicherheitsdienst / Feldeinsätze',
    clearance: 'Stufe 3',
    status: 'Aktiv',
    since: '2018',
    quote: 'Rein, raus, keiner merkt was.',
    summary: 'Leitet die Bergungsteams im süddeutschen Raum. Über 40 erfolgreiche Bergungen ohne zivile Zwischenfälle.',
    notes: ['Ausgezeichnet nach Vorfall [[80-17, Eindämmungsbruch in Sektor 9]].'],
    timeline: [
      { year: '2014', text: 'Dienst bei der Bundespolizei, GSG [[9]].' },
      { year: '2018', text: 'Rekrutierung durch die Foundation.' },
      { year: '2021', text: 'Einsatzleiterin der Bergungsteams Süd.' },
      { year: '2026', text: 'Bergung im Schwarzwald (FB-80-2026-019).' },
    ],
    psych: {
      access: 'granted',
      verdict: { label: 'Einsatzfähig', tone: 'ok' },
      date: '2026-02-02',
      metrics: [{ label: 'Belastbarkeit', value: 94 }, { label: 'Kooperation', value: 58 }, { label: 'Kognitive Integrität', value: 88 }],
      text: [
        'Hohe Stressresistenz. Entscheidet schnell und konsequent.',
        'Tendenz, Risiken für das eigene Team zu unterschätzen.',
      ],
    },
    incidents: ['2022: Eigenmächtiger Zugriff ohne Freigabe. Erfolgreich, aber gerügt.'],
  },
  {
    id: 'P-80-0588',
    name: 'Dr. Tomas Reyes',
    role: 'Forscher',
    department: 'Memetik und Kognitionsgefahren',
    clearance: 'Stufe 3',
    status: 'Beurlaubt',
    since: '2020',
    quote: 'Man kann nicht vergessen, was man nie gesehen hat. Oder?',
    summary: 'Spezialist für antimemetische Filter. Derzeit beurlaubt bis zum Abschluss einer kognitiven Beurteilung.',
    notes: ['Beurlaubung angeordnet nach Feldbericht FB-80-2026-028.', 'Wiedereingliederung geplant: [[03.11.2026]].'],
    timeline: [
      { year: '2020', text: 'Eintritt in die Abteilung Memetik.' },
      { year: '2024', text: 'Entwicklung eines tragbaren antimemetischen Filters.' },
      { year: '2026', text: 'Untersuchung von Archiv 7. Danach beurlaubt.' },
    ],
    psych: {
      access: 'granted',
      verdict: { label: 'Eingeschränkt', tone: 'bad' },
      date: '2026-09-20',
      metrics: [{ label: 'Belastbarkeit', value: 41 }, { label: 'Kooperation', value: 72 }, { label: 'Kognitive Integrität', value: 23 }],
      text: [
        'Seit Archiv 7: wiederholte Fragen nach Personen, die nicht existieren.',
        'Schreibt Notizen an sich selbst, die er später nicht erkennt.',
        'Beurteilung: [[antimemetische Kontamination durch SCP-8007, Rückkehr in den Dienst nicht empfohlen]].',
      ],
    },
    incidents: ['2026: Unerlaubtes Mitnehmen eines Filterprototyps nach Hause.'],
  },
  {
    id: 'P-80-1024',
    name: 'Lena Hofstetter',
    role: 'Archivarin',
    department: 'Archiv und Dokumentation',
    clearance: 'Stufe 2',
    status: 'Aktiv',
    since: '2022',
    quote: 'Wenn es nicht im Verzeichnis steht, existiert es nicht. Hoffentlich.',
    summary: 'Pflegt die physischen Archive von Site-80 und digitalisiert ältere Fallakten.',
    notes: ['Meldete wiederholt fehlende Seiten in Archivbestand 7.'],
    timeline: [
      { year: '2022', text: 'Eintritt als Archivassistentin.' },
      { year: '2024', text: 'Leitung der Digitalisierung der Altakten.' },
      { year: '2026', text: 'Meldung zu Archiv 7 (FB-80-2026-028).' },
    ],
    psych: {
      access: 'granted',
      verdict: { label: 'Einsatzfähig', tone: 'ok' },
      date: '2026-01-15',
      metrics: [{ label: 'Belastbarkeit', value: 70 }, { label: 'Kooperation', value: 86 }, { label: 'Kognitive Integrität', value: 82 }],
      text: ['Gewissenhaft und neugierig. Neugier wurde als Risiko vermerkt.'],
    },
    incidents: ['Keine disziplinarischen Vermerke.'],
  },
  {
    id: 'P-80-0731',
    name: 'Dr. Timothy Quebec Jr.',
    role: 'Wissenschaftler, Xenobiologie',
    department: 'Forschung und Entwicklung',
    clearance: 'Stufe 3',
    status: 'Aktiv',
    since: '2021',
    quote: 'In Lagos habe ich Schlimmeres gesehen als SCP-8041. Den Verkehr, zum Beispiel.',
    summary:
      'Stammt aus Lagos, Nigeria. Promovierte in Kapstadt über Anomalien in Mikroorganismen. Gilt als humorvollster Mitarbeiter von Site-80, nach eigener Aussage auch als bestaussehender.',
    notes: [
      'Hat dreimal beantragt, die Kaffeemaschine als SCP einzustufen.',
      'Andauernder Konflikt mit Archivarin L. Hofstetter wegen "eines ausgeliehenen Kugelschreibers" (2023).',
    ],
    timeline: [
      { year: '2021', text: 'Eintritt in die Forschungsabteilung von Site-80.' },
      { year: '2023', text: 'Der Kugelschreiber-Vorfall. Beide Parteien verweigern eine Aussage.' },
      { year: '2025', text: 'Leitung der Probenanalyse zu SCP-8041.' },
    ],
    psych: {
      access: 'granted',
      verdict: { label: 'Einsatzfähig', tone: 'ok' },
      date: '2026-06-02',
      metrics: [{ label: 'Belastbarkeit', value: 88 }, { label: 'Kooperation', value: 79 }, { label: 'Humor', value: 99 }],
      text: [
        'Nutzt Humor zur Stressbewältigung. Wirksam.',
        'Erwähnte Archivarin Hofstetter in 11 von 12 Sitzungen ungefragt.',
      ],
    },
    incidents: ['2024: Verwarnung wegen eines Furzkissens im Besprechungsraum der Standortdirektion.'],
  },
  {
    id: 'X-80-0003',
    name: 'Corvus Finch',
    photo: corvusFinch,
    eyeBar: true,
    role: 'Externe Person von Interesse',
    department: 'FBI / Unusual Incidents Unit',
    clearance: 'Keine',
    status: 'Beobachtung',
    since: '2026',
    summary: 'Special Agent der UIU. Zeigt anhaltendes Interesse an Foundation-Aktivitäten im Zuständigkeitsbereich von Site-80.',
    notes: ['Überwachung durch RAISA angeordnet.', 'Kontaktaufnahme nur mit Genehmigung der Standortdirektion.'],
    timeline: [
      { year: '2019', text: 'Versetzung zur Unusual Incidents Unit.' },
      { year: '2025', text: 'Erstmals in Foundation-Berichten erwähnt.' },
      { year: '2026', text: 'Eröffnung der Fallakte "DIE FOUNDATION" durch die UIU.' },
    ],
    psych: {
      access: 'granted',
      verdict: { label: 'Risiko', tone: 'warn' },
      date: '2026-10-01',
      metrics: [{ label: 'Hartnäckigkeit', value: 97 }, { label: 'Kooperation', value: 12 }, { label: 'Bedrohungsgrad', value: 74 }],
      text: [
        'RAISA-Einschätzung: hartnäckig, einfallsreich, schwer abzuschrecken.',
        'Wahrscheinlichkeit eines Zugriffsversuchs auf SCiPnet: hoch.',
      ],
    },
    incidents: ['Keine Foundation-Vermerke.'],
  },
];

// Not listed with the staff; reachable through the Administrator card once
// the signal puzzle is solved.
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
  id === ADMIN_PERSON.id ? ADMIN_PERSON : PERSONNEL.find((p) => p.id === id);
