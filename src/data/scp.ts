// SCP archive entries for Site-80. Text may contain [[...]] for redacted passages.

import type { Access } from './access';
// Containment classes (ACS): Thaumiel is a secondary class, see acs.secondary.
export type ObjectClass = 'Safe' | 'Euclid' | 'Keter' | 'Esoteric' | 'Pending' | 'Explained' | 'Neutralisiert';

export type Disruption = 'Dark' | 'Vlam' | 'Keneq' | 'Ekhi' | 'Amida';
export type Risk = 'Notice' | 'Caution' | 'Warning' | 'Danger' | 'Critical';
export const DISRUPTION: Disruption[] = ['Dark', 'Vlam', 'Keneq', 'Ekhi', 'Amida'];
export const RISK: Risk[] = ['Notice', 'Caution', 'Warning', 'Danger', 'Critical'];

// Body lines of a transcript read "Name: text"; a line in <...> is a stage direction.
export type Addendum = {
  kind: 'recovery' | 'test' | 'interview' | 'incident' | 'note';
  title: string;
  meta?: [string, string][]; // labelled header rows: date, lead, ...
  body: string[];
  sign?: string; // sign-off under a note
};

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
  // Anomaly Classification System: the bar at the top of each file
  acs: {
    containment?: string; // shown instead of objectClass, e.g. Esoteric for a Thaumiel secondary
    secondary?: string;
    disruption: Disruption;
    risk: Risk;
    status: string;
    subclass?: string;
  };
  warning?: string; // warning banner above the file
  mtf?: string | string[]; // assigned Mobile Task Force(s) (data/mtf.ts ids)
  addenda: Addendum[];
  reports?: string[]; // field report ids
  access?: Access; // see data/access.ts
};

export const SCP: ScpObject[] = []; // filled from the database at start, see src/data/store.ts

// assigned task forces as a list (older entries hold a single id)
export const mtfIds = (s: ScpObject): string[] => (Array.isArray(s.mtf) ? s.mtf : s.mtf ? [s.mtf] : []);

export const scpById = (id: string) => SCP.find((s) => s.id === id);
export const scpForReport = (reportId: string) => SCP.find((s) => s.reports?.includes(reportId));
