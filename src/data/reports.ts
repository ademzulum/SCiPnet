// Field reports. Text may contain [[...]] for redacted passages.
//
// Each report follows the same structure (sections are optional, empty ones
// are skipped): Ausgangslage, Verlauf (timeline), Maßnahmen, Bewertung.
// Images: put files into images/field_reports/ and give the file name in `src`;
// without `src` a placeholder frame with the caption is shown.


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
};

export const REPORTS: Report[] = []; // filled from the database at start, see src/data/store.ts

export const reportById = (id: string) => REPORTS.find((r) => r.id === id);
