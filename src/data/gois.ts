// Groups of Interest on file at Site-80. Each one opens in its own themed page
// (styles.css, .goi-<theme>). Backgrounds after the SCP Wiki hubs.

export type Goi = {
  id: string;
  theme: 'valravn' | 'mcd';
  name: string;
  short: string; // card line
  tagline: string; // the group's own words
  threat: 'Niedrig' | 'Mittel' | 'Hoch';
  stance: string; // how the Foundation deals with them
  facts: [string, string][];
  sections: { title: string; body: string[] }[];
  items?: { lot: string; name: string; note: string; price: string }[]; // MC&D catalogue
  ops?: { code: string; place: string; note: string }[]; // Valravn deployments
  stats: [label: string, value: string, note?: string][]; // strip of key figures under the header; note is a small line under the value
  intercept: { title: string; source: string; lines: [string, string][] }; // radio log or letter: [speaker or label, line]
  encounters: { date: string; text: string; tone: 'ok' | 'warn' | 'bad' }[]; // contacts with the Foundation
};

export const GOIS: Goi[] = []; // filled from the database at start, see src/data/store.ts

export const goiById = (id: string) => GOIS.find((g) => g.id === id);
