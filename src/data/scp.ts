// SCP archive entries for Site-80. Text may contain [[...]] for redacted passages.

export type ObjectClass = 'Safe' | 'Euclid' | 'Keter' | 'Thaumiel' | 'Neutralisiert';

export type ScpObject = {
  id: string;
  name: string;
  objectClass: ObjectClass;
  clearance: string;
  locked?: { required: string; corrupt?: boolean }; // beyond the reader's clearance
  antimemetic?: boolean; // description fades unless looked at
  summary: string;
  containment: string[];
  description: string[];
  addenda: { title: string; body: string[] }[];
  reports?: string[]; // field report ids
};

export const SCP: ScpObject[] = [
  {
    id: 'SCP-8041',
    name: 'Der Seegrund-Puls',
    objectClass: 'Euclid',
    clearance: 'Stufe 2',
    summary: 'Metallischer Körper, der in regelmäßigen Abständen blaues Licht aussendet.',
    containment: [
      'SCP-8041 wird in einem abgedunkelten Wasserbecken (4 × 4 × 3 m) in Sektor 9 von Site-80 gelagert.',
      'Die Wassertemperatur ist konstant bei 6 °C zu halten. Abweichungen verkürzen das Pulsintervall.',
      'Personal darf das Becken nur paarweise und mit Schutzbrille Klasse B betreten.',
    ],
    description: [
      'SCP-8041 ist ein glatter, ovaler Körper aus einer unbekannten Legierung, etwa 1,4 m lang.',
      'Alle 41 Minuten sendet das Objekt einen Lichtpuls aus, der bis zu 300 m weit sichtbar ist.',
      'Personen, die einen Puls direkt beobachten, berichten anschließend von einem Gefühl, "gerufen" zu werden.',
    ],
    addenda: [
      {
        title: 'Bergungsprotokoll 80-041-A',
        body: [
          'Geborgen am 03.06.2026 aus einem Waldsee im Schwarzwald durch Bergungsteam Süd.',
          'Zivile Zeugen erhielten Amnestika Klasse A. Keine Verletzten.',
        ],
      },
      {
        title: 'Testprotokoll 80-041-T3',
        body: [
          'Wassertemperatur auf 12 °C erhöht. Pulsintervall sank auf 19 Minuten.',
          'Test nach [[Vorfall geschwärzt]] abgebrochen.',
        ],
      },
    ],
    reports: ['FB-80-2026-019'],
  },
  {
    id: 'SCP-8007',
    name: 'Das ungelistete Regal',
    objectClass: 'Keter',
    clearance: 'Stufe 3',
    antimemetic: true,
    summary: 'Ein Archivregal, an das sich niemand erinnern kann.',
    containment: [
      'Archiv 7 ist bis auf Weiteres gesperrt. Zutritt nur mit aktivem antimemetischem Filter.',
      'Alle Erkenntnisse über SCP-8007 sind sofort schriftlich festzuhalten.',
      'Wenn Sie diesen Absatz bereits zum zweiten Mal lesen, melden Sie sich bei der Abteilung Memetik.',
    ],
    description: [
      'SCP-8007 ist ein Stahlregal mit sieben Fächern in Archiv 7 von Site-80.',
      'Personen, die SCP-8007 betrachten, verlieren nach etwa 40 Sekunden jede Erinnerung daran.',
      'Der Inhalt der Fächer ist unbekannt. Drei Versuche, ihn zu dokumentieren, ergaben leere Seiten.',
      'Auf einer dieser Seiten fand sich nachträglich der Satz: [[REDACTED]].',
    ],
    addenda: [
      {
        title: 'Interview mit Archivarin L. Hofstetter',
        body: [
          'Hofstetter: "Ich weiß, dass ich dort war. Ich habe es aufgeschrieben."',
          'Interviewer: "Was steht in Ihren Notizen?"',
          'Hofstetter: "Dass ich nicht hätte hingehen sollen."',
        ],
      },
    ],
    reports: ['FB-80-2026-028'],
  },
  {
    id: 'SCP-8019',
    name: 'Der stille Gast',
    objectClass: 'Euclid',
    clearance: 'Stufe 2',
    summary: 'Eine Gestalt, die nur auf Kameraaufnahmen von Zelle 14-B sichtbar ist.',
    containment: [
      'Zelle 14-B ist dauerhaft mit vier unabhängigen Kameras zu überwachen.',
      'Die Stromversorgung der Zelle muss redundant ausgelegt sein.',
    ],
    description: [
      'SCP-8019 erscheint ausschließlich auf Videoaufnahmen als sitzende, menschenähnliche Gestalt.',
      'Bei direkter Beobachtung ist die Zelle leer. Gewicht und Temperatur bleiben unverändert.',
      'Während eines Stromausfalls stand SCP-8019 zum ersten Mal auf.',
    ],
    addenda: [
      {
        title: 'Vorfall 80-019-1',
        body: ['Stromausfall von 11 Sekunden während Wartung. Siehe Feldbericht FB-80-2026-011.'],
      },
    ],
    reports: ['FB-80-2026-011'],
  },
  {
    id: 'SCP-8002',
    name: 'Kuckucksuhr ohne Zeiger',
    objectClass: 'Safe',
    clearance: 'Stufe 1',
    summary: 'Eine Kuckucksuhr, deren Kuckuck jeweils kurz vor einem Erdbeben ruft.',
    containment: ['SCP-8002 hängt im Büro der Standortdirektion. Batterien sind nicht nötig.'],
    description: [
      'SCP-8002 ist eine handgeschnitzte Kuckucksuhr ohne Zeiger, vermutlich aus dem 19. Jahrhundert.',
      'Der Kuckuck ruft zwischen 30 und 90 Sekunden vor einem Erdbeben der Stärke 3 oder höher, weltweit.',
    ],
    addenda: [
      {
        title: 'Notiz der Standortdirektorin',
        body: ['"Sie ist laut. Sie ist zuverlässig. Sie bleibt."'],
      },
    ],
  },
  {
    id: 'SCP-8066',
    name: '[ZUGRIFF BESCHRÄNKT]',
    objectClass: 'Keter',
    clearance: 'Stufe 4',
    locked: { required: 'Stufe 4' },
    summary: '',
    containment: [],
    description: [],
    addenda: [],
  },
  {
    id: 'SCP-8000',
    name: '[DATEN GELÖSCHT]',
    objectClass: 'Thaumiel',
    clearance: 'Stufe 5',
    locked: { required: 'Stufe 5', corrupt: true },
    summary: '',
    containment: [],
    description: [],
    addenda: [],
  },
];

export const scpById = (id: string) => SCP.find((s) => s.id === id);
export const scpForReport = (reportId: string) => SCP.find((s) => s.reports?.includes(reportId));
