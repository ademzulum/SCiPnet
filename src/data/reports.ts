// Field reports. Text may contain [[...]] for redacted passages.
//
// Each report follows the same structure (sections are optional, empty ones
// are skipped): Ausgangslage, Verlauf (timeline), Maßnahmen, Bewertung.
// Images: put files into images/field_reports/ and give the file name in `src`;
// without `src` a placeholder frame with the caption is shown.

import type { Access } from './access';

export type Report = {
  id: string;
  title: string;
  date: string;
  author: string; // personnel id
  location: string;
  classification: 'Uneingeschränkt' | 'Eingeschränkt' | 'Vertraulich' | 'Geheim' | 'Streng geheim'; // shown as clearance level 1-5
  status: 'Offen' | 'Abgeschlossen';
  summary: string;
  situation: string[]; // Ausgangslage
  timeline?: { time: string; text: string }[]; // Verlauf
  measures?: string[]; // Maßnahmen (bullet list)
  assessment: string[]; // Bewertung und Empfehlung
  images?: { src?: string; caption: string }[]; // SVGs may hold "censor" elements, see photos.ts
  involved?: string[]; // personnel ids
  template?: ReportTemplate; // the kind of report, see TEMPLATES
  facts?: { label: string; value?: string }[]; // key data shown at the top, e.g. Testobjekt, Einheit
  sections?: { title: string; body: string[] }[]; // further sections after the Ausgangslage
  units?: string[]; // Mobile Task Force ids
  objects?: string[]; // SCP ids, besides the SCPs that list this report
  access?: Access; // see data/access.ts
};

// Report templates, after the document kinds of the SCP wiki (test logs,
// incident reports, recovery, exploration and interview logs). Each says what
// it is for, and lists its key data and sections with a hint on what to
// write. Picking one in the editor adds them (empty, to fill in or remove);
// `std` gives the standard fields (summary, timeline, ...) a fitting hint.
export type ReportTemplate = 'test' | 'vorfall' | 'bergung' | 'mtf' | 'erkundung' | 'befragung' | 'feld' | 'allgemein';
type Part = [name: string, hint: string];
export type TemplateSpec = {
  label: string;
  use: string; // what the template is for, one sentence
  example: string; // a typical title
  facts: Part[];
  sections: Part[];
  std?: Partial<Record<'title' | 'location' | 'summary' | 'situation' | 'timeline' | 'measures' | 'assessment' | 'involved', string>>;
};
export const TEMPLATES: Record<ReportTemplate, TemplateSpec> = {
  test: {
    label: 'Testprotokoll',
    use: 'Ein genehmigter, kontrollierter Versuch mit einem Objekt. Ein Bericht je Test.',
    example: 'Test 8050-07: Reaktion auf akustische Reize',
    facts: [
      ['Genehmigt durch', 'Wer den Test freigegeben hat, z. B. Standortdirektion'],
      ['Schutzmaßnahmen', 'z. B. Sichtschutz, Amnestika bereit, MTF in Bereitschaft'],
    ],
    sections: [
      ['Zielsetzung', 'Welche Frage soll der Test beantworten? Welche Hypothese wird geprüft?'],
      ['Versuchsaufbau', 'Raum, Ausrüstung, Position von Objekt und Proband, Messgeräte.'],
      ['Durchführung', 'Was genau wurde getan, in welcher Reihenfolge?'],
      ['Ergebnis', 'Was ist passiert? Sachlich, ohne Deutung.'],
      ['Anmerkungen der Testleitung', 'Deutung, offene Fragen, Vorschläge für Folgetests.'],
    ],
    std: {
      location: 'Testkammer, z. B. Testkammer 3, Sektor B',
      summary: 'Ein bis zwei Sätze: was getestet wurde und das Ergebnis.',
      timeline: 'Optional: Zeitstempel des Testablaufs, z. B. „14:02 · Proband betritt die Kammer“.',
      assessment: 'Folgen für die Eindämmung: Muss das Sonderprotokoll angepasst werden? Weitere Tests?',
      involved: 'Testleitung, Proband, Assistenz und Sicherheitspersonal.',
    },
  },
  vorfall: {
    label: 'Vorfallbericht',
    use: 'Ein Eindämmungsbruch, Unfall, Sicherheits- oder Personalvorfall, der aufgearbeitet werden muss.',
    example: 'Vorfall 8050-1: Eindämmungsbruch in Sektor B',
    facts: [
      ['Vorfallart', 'z. B. Eindämmungsbruch, Unfall, Fehlverhalten, Datenleck'],
      ['Verletzte', 'Anzahl, ggf. Kennungen'],
      ['Todesfälle', 'Anzahl, ggf. Kennungen'],
      ['Sachschaden', 'Was ist beschädigt oder verloren?'],
      ['Eindämmungsstatus', 'z. B. wiederhergestellt um 03:40, teilweise, nicht wiederhergestellt'],
    ],
    sections: [
      ['Hergang', 'Was geschah, von den ersten Anzeichen bis zum Ende des Vorfalls?'],
      ['Reaktion', 'Wer hat wie reagiert? Alarmierung, Abriegelung, Einsatzkräfte.'],
      ['Ursachenanalyse', 'Warum kam es dazu? Technisches, menschliches oder anomales Versagen.'],
      ['Folgen', 'Auswirkungen auf Personal, Standort und Eindämmung.'],
    ],
    std: {
      summary: 'Ein bis zwei Sätze: was passiert ist, Schaden und Stand der Eindämmung.',
      situation: 'Lage vor dem Vorfall: Zustand des Objekts, laufende Arbeiten, Besetzung.',
      timeline: 'Empfohlen: der Ablauf mit Uhrzeit, z. B. „02:14 · Alarm in Zelle 12“.',
      measures: 'Sofortmaßnahmen und Änderungen am Sonderprotokoll, je Absatz eine.',
      assessment: 'Lehren aus dem Vorfall und Empfehlungen, um eine Wiederholung zu verhindern.',
    },
  },
  bergung: {
    label: 'Bergungsprotokoll',
    use: 'Die Entdeckung und Sicherstellung eines neuen Objekts, bis zur Übergabe in die Eindämmung.',
    example: 'Bergung von SCP-8050 in Kiel',
    facts: [
      ['Entdeckt durch', 'Wie die Foundation aufmerksam wurde, z. B. Polizeifunk, Meldung eines Agenten'],
      ['Zivile Zeugen', 'Anzahl und Umgang, z. B. 4, Amnestika Klasse A verabreicht'],
      ['Tarngeschichte', 'Was der Öffentlichkeit erzählt wurde, z. B. Gasleck'],
      ['Übergabe an', 'Standort und Zelle, in die das Objekt gebracht wurde'],
    ],
    sections: [
      ['Entdeckung', 'Wie und wann das Objekt aufgefallen ist.'],
      ['Bergung', 'Ablauf der Sicherstellung, Schwierigkeiten, Verhalten des Objekts.'],
      ['Erstsicherung', 'Vorläufige Eindämmung bis zur Übergabe.'],
      ['Nachbereitung', 'Zeugen, Tarngeschichte, Spurenbeseitigung.'],
    ],
    std: {
      location: 'Fundort des Objekts',
      involved: 'Bergungsteam (Agenten); eine Mobile Task Force unter Beteiligte Mobile Task Forces.',
      summary: 'Ein bis zwei Sätze: welches Objekt wo geborgen wurde und mit welchen Verlusten.',
      timeline: 'Optional: Ablauf der Bergung mit Uhrzeit.',
      assessment: 'Vorschlag für Objektklasse und vorläufige Eindämmungsmaßnahmen.',
    },
  },
  mtf: {
    label: 'Einsatzbericht Mobile Task Force',
    use: 'Ein Einsatz einer Mobile Task Force, von der Alarmierung bis zur Nachbereitung.',
    example: 'Operation NACHTFALTER: Rückführung von SCP-8050',
    facts: [
      ['Operation', 'Deckname des Einsatzes, z. B. NACHTFALTER'],
      ['Einsatzleitung', 'Name oder Rufzeichen, z. B. Eta-11-Führer „Heron“'],
      ['Auftrag', 'Kurz: was erreicht werden sollte'],
      ['Einsatzbeginn', 'Datum und Uhrzeit'],
      ['Einsatzende', 'Datum und Uhrzeit'],
      ['Gegnerische Kräfte', 'z. B. Chaos Insurgency, keine'],
      ['Verluste', 'Eigene Verluste, verletzt und gefallen'],
      ['Ergebnis', 'z. B. Auftrag erfüllt, teilweise erfüllt, abgebrochen'],
    ],
    sections: [
      ['Lagebild', 'Was war vor dem Einsatz bekannt? Bedrohung, Gelände, Aufklärung.'],
      ['Einsatzplan', 'Wie sollte der Auftrag erreicht werden? Kräfte, Ausrüstung, Phasen.'],
      ['Durchführung', 'Wie verlief der Einsatz tatsächlich? Abweichungen vom Plan.'],
      ['Nachbereitung', 'Verwundete, Ausrüstung, Amnestika, Übergabe von Gefangenen oder Objekten.'],
    ],
    std: {
      location: 'Einsatzgebiet',
      summary: 'Ein bis zwei Sätze: Auftrag, Ergebnis und Verluste.',
      timeline: 'Empfohlen: Funkprotokoll oder Ablauf mit Uhrzeit, z. B. „04:12 · Zugriff“.',
      assessment: 'Bewertung des Einsatzes und Empfehlungen für künftige Einsätze.',
      involved: 'Nicht zur Einheit gehöriges Personal, z. B. Forschende vor Ort.',
    },
  },
  erkundung: {
    label: 'Erkundungsprotokoll',
    use: 'Die Erkundung eines anomalen Ortes oder Raumes durch ein Team oder eine Drohne.',
    example: 'Erkundung 8050-III: unterer Korridor',
    facts: [
      ['Ausrüstung', 'z. B. Helmkamera, Seil, Funk, Geigerzähler'],
      ['Dauer', 'Von Eintritt bis Rückkehr oder Kontaktverlust'],
      ['Ergebnis', 'z. B. zurückgekehrt, Kontakt verloren'],
    ],
    sections: [
      ['Missionsziel', 'Was sollte die Erkundung herausfinden?'],
      ['Geborgenes Material', 'Proben, Aufnahmen und Gegenstände, die zurückgebracht wurden.'],
      ['Befund', 'Was über den Ort jetzt bekannt ist.'],
    ],
    std: {
      location: 'Zugang zum erkundeten Ort',
      involved: 'Das Erkundungsteam.',
      summary: 'Ein bis zwei Sätze: wohin das Team kam und was es fand.',
      timeline: 'Wichtigster Teil: das Funkprotokoll mit Zeitstempel, je Meldung eine Zeile.',
      assessment: 'Gefahren, weitere Erkundungen ja oder nein, Änderungen an der Eindämmung.',
    },
  },
  befragung: {
    label: 'Befragungsprotokoll',
    use: 'Ein Gespräch mit einem Zeugen, einem Mitarbeiter oder einem sprechenden Objekt.',
    example: 'Befragung von D-80312 nach Test 8050-07',
    facts: [
      ['Anlass', 'Warum befragt wurde, z. B. nach Test 8050-07'],
      ['Aufzeichnung', 'z. B. Audio, Video, Mitschrift'],
    ],
    sections: [
      ['Vorbemerkung', 'Zustand der befragten Person, Umstände des Gesprächs.'],
      ['Protokoll', 'Das Gespräch, je Absatz eine Aussage: „Dr. Kessler: Frage“. Handlungen in <spitzen Klammern>.'],
      ['Nachbemerkung', 'Was nach dem Gespräch geschah, Einschätzung der Aussagen.'],
    ],
    std: {
      location: 'Ort des Gesprächs, z. B. Befragungsraum 2',
      involved: 'Die befragte Person und wer das Gespräch geführt hat. Ein befragtes Objekt unter Betroffene Objekte.',
      summary: 'Ein bis zwei Sätze: wer befragt wurde und was dabei herauskam.',
      assessment: 'Glaubwürdigkeit der Aussagen und was daraus folgt.',
    },
  },
  feld: {
    label: 'Feldbericht',
    use: 'Ermittlung, Beobachtung oder verdeckter Einsatz außerhalb des Standorts.',
    example: 'Beobachtung: Häufung von Vermisstenfällen in Flensburg',
    facts: [
      ['Auftrag', 'Kurz: was ermittelt oder beobachtet werden sollte'],
      ['Zeitraum', 'Von wann bis wann vor Ort'],
      ['Tarnidentität', 'Unter welcher Identität aufgetreten wurde, z. B. Versicherungsprüfer'],
      ['Kontaktpersonen', 'Zivile Quellen und Ansprechpartner'],
    ],
    sections: [
      ['Hintergrund', 'Was hat den Einsatz ausgelöst?'],
      ['Beobachtungen', 'Was vor Ort festgestellt wurde, so sachlich wie möglich.'],
      ['Befunde', 'Was daraus folgt: anomal oder nicht, betroffene Objekte, Gruppen.'],
    ],
    std: {
      summary: 'Ein bis zwei Sätze: wo ermittelt wurde und mit welchem Ergebnis.',
      involved: 'Das Einsatzteam: Agenten oder Feldteam.',
      assessment: 'Weiteres Vorgehen: Einsatz beenden, beobachten, MTF anfordern?',
    },
  },
  allgemein: {
    label: 'Allgemeiner Bericht',
    use: 'Alles andere, das dokumentiert werden muss: Memos, Nachträge, Anweisungen. Keine Vorgaben.',
    example: 'Memo: Neue Zugangsregeln für Sektor B',
    facts: [],
    sections: [],
  },
};
// The hint for a key-data label or section title from any template.
export const factHint = (label?: string) => Object.values(TEMPLATES).flatMap((t) => t.facts).find(([n]) => n === label)?.[1];
export const sectionHint = (title?: string) => Object.values(TEMPLATES).flatMap((t) => t.sections).find(([n]) => n === title)?.[1];

export const REPORTS: Report[] = []; // filled from the database at start, see src/data/store.ts

export const reportById = (id: string) => REPORTS.find((r) => r.id === id);
