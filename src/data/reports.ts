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

// Report templates: what a report of that kind documents. Picking one in the
// editor adds its key data and sections (empty, to fill in or remove).
export type ReportTemplate = 'feld' | 'test' | 'mtf' | 'vorfall' | 'allgemein';
export const TEMPLATES: Record<ReportTemplate, { label: string; info: string; facts: string[]; sections: string[] }> = {
  feld: {
    label: 'Feldbericht',
    info: 'Außeneinsatz, Ermittlung oder Beobachtung vor Ort.',
    facts: ['Auftrag', 'Einsatzteam', 'Dauer'],
    sections: [],
  },
  test: {
    label: 'Testprotokoll',
    info: 'Kontrollierter Versuch mit einem Objekt.',
    facts: ['Testobjekt', 'Testleitung', 'Proband', 'Testbedingungen', 'Ergebnis'],
    sections: ['Versuchsaufbau', 'Durchführung', 'Beobachtungen'],
  },
  mtf: {
    label: 'Einsatzbericht Mobile Task Force',
    info: 'Einsatz einer Mobile Task Force, von der Alarmierung bis zur Nachbereitung.',
    facts: ['Einsatzleitung', 'Einsatzbeginn', 'Einsatzende', 'Verluste', 'Eindämmung wiederhergestellt'],
    sections: ['Lagebild', 'Nachbereitung'],
  },
  vorfall: {
    label: 'Vorfallbericht',
    info: 'Eindämmungsbruch, Unfall oder Sicherheitsvorfall.',
    facts: ['Vorfallart', 'Betroffener Bereich', 'Verletzte', 'Todesfälle', 'Sachschaden'],
    sections: ['Hergang', 'Ursache'],
  },
  allgemein: {
    label: 'Allgemeiner Bericht',
    info: 'Alles, was dokumentiert werden muss und in keine andere Vorlage passt.',
    facts: [],
    sections: [],
  },
};

export const REPORTS: Report[] = []; // filled from the database at start, see src/data/store.ts

export const reportById = (id: string) => REPORTS.find((r) => r.id === id);
