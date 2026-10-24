// SCP archive entries for Site-80. Text may contain [[...]] for redacted passages.

export type ObjectClass = 'Safe' | 'Euclid' | 'Keter' | 'Thaumiel' | 'Neutralisiert';

export type ScpObject = {
  id: string;
  name: string;
  objectClass: ObjectClass;
  clearance: string;
  locked?: { required: string; corrupt?: boolean; realName?: string }; // beyond the reader's clearance until the signal puzzle is solved
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
          'Test nach [[Vorfall 80-041-Δ (Verlust einer Messsonde)]] abgebrochen.',
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
      'Auf einer dieser Seiten fand sich nachträglich der Satz: [[„Ihr habt mich gelesen. Jetzt lese ich euch.“]].',
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
    locked: { required: 'Stufe 4', realName: 'Der Totenfunk' },
    summary: 'Ein Funkturm, der ein Signal sendet, das nur Verstorbene empfangen.',
    containment: [
      'Das Gelände um SCP-8066 ist als Sperrgebiet "Funkstation 80-Nord" ausgewiesen.',
      'Empfangsgeräte im Umkreis von 2 km sind auf Frequenz 66,6 MHz zu sperren.',
    ],
    description: [
      'SCP-8066 ist ein stillgelegter Sendemast aus den 1950er Jahren ohne Stromanschluss.',
      'Er sendet dennoch dauerhaft ein schwaches Signal mit einer sich wiederholenden Zahlenfolge.',
      'Die Folge entspricht den Sterbedaten von Personen, die im Umkreis gelebt haben, Tage bevor diese eintreten.',
    ],
    addenda: [
      {
        title: 'Notiz der Standortdirektion',
        body: ['Die Liste wird nicht mehr ausgewertet. Wer sie liest, findet irgendwann einen bekannten Namen.'],
      },
    ],
  },
  {
    id: 'SCP-8000',
    name: '[DATEN GELÖSCHT]',
    objectClass: 'Thaumiel',
    clearance: 'Stufe 5',
    locked: { required: 'Stufe 5', corrupt: true, realName: 'Raum Null' },
    summary: 'Das Fundament von Site-80.',
    containment: [
      'SCP-8000 kann und soll nicht eingedämmt werden. Site-80 wurde um das Objekt herum gebaut.',
    ],
    description: [
      'SCP-8000 ist ein Raum unter dem tiefsten Geschoss von Site-80, der in keinem Bauplan verzeichnet ist.',
      'Solange der Raum unbetreten bleibt, bleiben alle Eindämmungen am Standort stabil.',
      'Der Administrator ist die einzige bekannte Person, die ihn betreten hat.',
    ],
    addenda: [
      {
        title: 'Vermerk des Administrators',
        body: ['"Manche Türen sichern wir nicht, um etwas drinnen zu halten. Sondern damit niemand vergisst, warum es sie gibt."'],
      },
    ],
  },
];

export const scpById = (id: string) => SCP.find((s) => s.id === id);
export const scpForReport = (reportId: string) => SCP.find((s) => s.reports?.includes(reportId));
