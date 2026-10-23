// Field reports. Text may contain [[...]] for redacted passages.

export type Report = {
  id: string;
  title: string;
  date: string;
  author: string; // personnel id
  location: string;
  classification: 'Vertraulich' | 'Geheim' | 'Streng geheim';
  status: 'Offen' | 'Abgeschlossen';
  summary: string;
  body: string[];
};

export const REPORTS: Report[] = [
  {
    id: 'FB-80-2026-031',
    title: 'Externe Aufklärungsaktivität',
    date: '2026-10-22',
    author: 'P-80-0001',
    location: 'Site-80, Netzwerkgrenze',
    classification: 'Streng geheim',
    status: 'Offen',
    summary: 'Hinweise auf verdeckte Aufklärung durch eine staatliche Stelle.',
    body: [
      'Um 23:58 Uhr wurde ein schwaches Signal an der Netzwerkgrenze registriert. Ursprung nicht eindeutig bestimmbar.',
      'Mehrere Indizien deuten auf die [[Behörde geschwärzt]]. RAISA wurde informiert.',
      'Empfehlung: erhöhte Wachsamkeit bei Anmeldungen von Forschungspersonal.',
    ],
  },
  {
    id: 'FB-80-2026-028',
    title: 'Gedächtnislücken im Archivpersonal',
    date: '2026-09-14',
    author: 'P-80-1024',
    location: 'Site-80, Archiv 7',
    classification: 'Geheim',
    status: 'Offen',
    summary: 'Drei Mitarbeiter können sich nicht an den Inhalt eines bestimmten Regals erinnern.',
    body: [
      'Archivbestand 7 enthält ein Regal, das in keinem Verzeichnis geführt wird.',
      'Mitarbeiter, die das Regal betrachten, verlieren nach etwa 40 Sekunden jede Erinnerung daran.',
      'Dr. Reyes führte eine Untersuchung mit antimemetischem Filter durch. Ergebnis: [[REDACTED]].',
    ],
  },
  {
    id: 'FB-80-2026-019',
    title: 'Lichtphänomene im Schwarzwald',
    date: '2026-06-03',
    author: 'P-80-0342',
    location: 'Schwarzwald, nahe [[Ortschaft entfernt]]',
    classification: 'Vertraulich',
    status: 'Abgeschlossen',
    summary: 'Wiederkehrende Lichter über einem Waldsee. Ursache geborgen und eingedämmt.',
    body: [
      'Anwohner meldeten über drei Wochen hinweg blaue Lichter über einem Waldsee.',
      'Das Bergungsteam fand am Seegrund ein metallisches Objekt mit gleichmäßigem Puls.',
      'Objekt nach Site-80 überführt. Zivile Zeugen erhielten Amnestika Klasse A.',
    ],
  },
  {
    id: 'FB-80-2026-011',
    title: 'Zwischenfall in Eindämmungszelle 14-B',
    date: '2026-03-21',
    author: 'P-80-0117',
    location: 'Site-80, Sektor 14',
    classification: 'Geheim',
    status: 'Abgeschlossen',
    summary: 'Kurzzeitiger Ausfall der Eindämmung während Routinewartung.',
    body: [
      'Während einer Wartung fiel die Stromversorgung von Zelle 14-B für 11 Sekunden aus.',
      'Das Objekt zeigte in dieser Zeit keine Aktivität. Die Aufzeichnung zeigt jedoch [[Inhalt entfernt]].',
      'Wartungsprotokolle wurden angepasst. Keine Verletzten.',
    ],
  },
];

export const reportById = (id: string) => REPORTS.find((r) => r.id === id);
