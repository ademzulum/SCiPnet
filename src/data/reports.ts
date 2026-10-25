// Field reports. Text may contain [[...]] for redacted passages.
//
// Each report follows the same structure (sections are optional, empty ones
// are skipped): Ausgangslage, Verlauf (timeline), Maßnahmen, Bewertung.
// Images: put files into images/field_reports/ and give the file name in `src`;
// without `src` a placeholder frame with the caption is shown.

import type { EyeBar } from './photos';

export type Report = {
  id: string;
  title: string;
  date: string;
  author: string; // personnel id
  location: string;
  classification: 'Vertraulich' | 'Geheim' | 'Streng geheim';
  status: 'Offen' | 'Abgeschlossen';
  summary: string;
  situation: string[]; // Ausgangslage
  timeline?: { time: string; text: string }[]; // Verlauf
  measures?: string[]; // Maßnahmen (bullet list)
  assessment: string[]; // Bewertung und Empfehlung
  images?: { src?: string; caption: string; bars?: EyeBar[] }[]; // bars: censor bars over faces
  involved?: string[]; // personnel ids
};

export const REPORTS: Report[] = [
  {
    id: 'FB-80-2026-033',
    title: 'Valravn-Spuren bei Kiruna',
    date: '2026-10-18',
    author: 'P-80-0912',
    location: 'Waldgebiet südlich von [[Kiruna]], Schweden',
    classification: 'Geheim',
    status: 'Offen',
    summary: 'Delta-5 findet ein verlassenes Lager der Valravn Corporation. Hallström erkennt die Handschrift seiner alten Einheit.',
    situation: [
      'Satellitenbilder zeigten ein getarntes Lager in einem Waldgebiet bei Kiruna. Delta-5 wurde zur Aufklärung entsandt, Operator Hallström als Ortskundiger.',
    ],
    timeline: [
      { time: '02:10', text: 'Trupp erreicht das Gebiet zu Fuß. Keine Bewegung, keine Wärmesignaturen.' },
      { time: '02:45', text: 'Lager gefunden: Zelte, Feuerstellen, ein Funkmast. Seit etwa zwei Wochen verlassen.' },
      { time: '03:05', text: 'An einem Baum ein eingeritztes Rabenzeichen. Hallström identifiziert es als Markierung seiner [[ehemaligen Einheit]].' },
      { time: '03:30', text: 'Im Funkzelt Unterlagen zu [[Site-80 und eine Liste mit Namen von Delta-5]] sichergestellt.' },
    ],
    measures: [
      'Unterlagen an RAISA übergeben.',
      'Hallström bis zur Auswertung von weiteren Einsätzen in Skandinavien abgezogen.',
    ],
    assessment: [
      'Die Valravn Corporation beobachtet Delta-5, möglicherweise gezielt Hallström. Er hat den Fund selbst gemeldet und alles korrekt dokumentiert.',
      'Empfehlung: Aufsicht beibehalten, aber Vertrauen nicht weiter entziehen.',
    ],
    images: [
      {
        src: 'addendum.jpg',
        caption: 'Hallström und Truppführer am Lager, Nachtaufnahme',
        bars: [
          { top: 20.3, left: 42, width: 6, height: 3.5 },
          { top: 11.3, left: 56.3, width: 4.6, height: 3.2 },
        ],
      },
    ],
    involved: ['P-80-0912'],
  },
  {
    id: 'FB-80-2026-031',
    title: 'Externe Aufklärungsaktivität',
    date: '2026-10-22',
    author: 'P-80-0001',
    location: 'Site-80, Netzwerkgrenze',
    classification: 'Streng geheim',
    status: 'Offen',
    summary: 'Hinweise auf verdeckte Aufklärung durch eine staatliche Stelle.',
    situation: ['Seit Anfang Oktober registriert die Netzwerküberwachung vereinzelte Verbindungsversuche von außerhalb der Foundation-Infrastruktur.'],
    timeline: [
      { time: '23:58', text: 'Schwaches Signal an der Netzwerkgrenze registriert. Ursprung nicht eindeutig bestimmbar.' },
      { time: '00:04', text: 'Signal bricht ab. Muster ähnelt früheren Vorfällen.' },
      { time: '07:30', text: 'Auswertung durch RAISA: Mehrere Indizien deuten auf die [[Unusual Incidents Unit des FBI]].' },
    ],
    measures: ['RAISA informiert und Überwachung der Netzwerkgrenze verdoppelt.', 'Anmeldungen von Forschungspersonal werden zusätzlich protokolliert.'],
    assessment: ['Gezielte Aufklärung durch eine externe Stelle ist wahrscheinlich. Empfehlung: erhöhte Wachsamkeit bei Anmeldungen von Forschungspersonal.'],
    images: [{ caption: 'Signalverlauf an der Netzwerkgrenze, 23:58 Uhr' }],
    involved: ['P-80-0001', 'X-80-0003'],
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
    situation: ['Archivbestand 7 enthält ein Regal, das in keinem Verzeichnis geführt wird.'],
    timeline: [
      { time: '09:15', text: 'Archivarin Hofstetter meldet ein Regal ohne Verzeichniseintrag.' },
      { time: '09:40', text: 'Drei Mitarbeiter betrachten das Regal und verlieren nach etwa 40 Sekunden jede Erinnerung daran.' },
      { time: '14:00', text: 'Dr. Reyes untersucht das Regal mit antimemetischem Filter. Ergebnis: [[sieben Fächer, in jedem eine Personalakte von Site-80, darunter seine eigene]].' },
    ],
    measures: ['Archiv 7 bis auf Weiteres gesperrt.', 'Zutritt nur mit Filter und zweiter Begleitperson.'],
    assessment: ['Antimemetische Eigenschaft bestätigt. Weitere Untersuchung erforderlich.'],
    images: [{ caption: 'Archiv 7, Regal ohne Verzeichniseintrag' }, { caption: 'Filteraufnahme, Dr. Reyes' }],
    involved: ['P-80-1024', 'P-80-0588'],
  },
  {
    id: 'FB-80-2026-019',
    title: 'Lichtphänomene im Schwarzwald',
    date: '2026-06-03',
    author: 'P-80-0342',
    location: 'Schwarzwald, nahe [[Triberg]]',
    classification: 'Vertraulich',
    status: 'Abgeschlossen',
    summary: 'Wiederkehrende Lichter über einem Waldsee. Ursache geborgen und eingedämmt.',
    situation: ['Anwohner meldeten über drei Wochen hinweg blaue Lichter über einem Waldsee.'],
    timeline: [
      { time: '21:00', text: 'Einsatzteam erreicht den See. Lichter in regelmäßigen Abständen sichtbar.' },
      { time: '23:40', text: 'Bergungsteam findet am Seegrund ein metallisches Objekt mit gleichmäßigem Puls.' },
      { time: '03:10', text: 'Objekt geborgen und nach Site-80 überführt.' },
    ],
    measures: ['Zivile Zeugen erhielten Amnestika Klasse A.', 'Deckgeschichte: Untersuchung von Methangas am Seeufer.'],
    assessment: ['Objekt eingedämmt als SCP-8041. Fall abgeschlossen.'],
    images: [{ caption: 'Waldsee bei Nacht, Lichter über der Wasseroberfläche' }, { caption: 'Bergung des Objekts' }],
    involved: ['P-80-0342'],
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
    situation: ['Routinewartung der Stromversorgung in Sektor 14.'],
    timeline: [
      { time: '10:12', text: 'Stromversorgung von Zelle 14-B fällt für 11 Sekunden aus.' },
      { time: '10:13', text: 'Notstrom greift. Das Objekt zeigt keine Aktivität.' },
      { time: '11:30', text: 'Auswertung der Aufzeichnung zeigt jedoch [[eine zweite Gestalt in Zelle 14-B, die vor dem Ausfall nicht da war]].' },
    ],
    measures: ['Wartungsprotokolle angepasst.', 'Wartung nur noch mit zweitem, unabhängigem Stromkreis.'],
    assessment: ['Keine Verletzten. Ursache des Aufzeichnungsinhalts ungeklärt.'],
    images: [{ caption: 'Kamera 3, Zelle 14-B, 10:12 Uhr' }],
    involved: ['P-80-0117'],
  },
];

export const reportById = (id: string) => REPORTS.find((r) => r.id === id);
