// Mobile Task Forces on file at Site-80. Missions after the SCP Wiki's task force
// list (scp-wiki.wikidot.com/task-forces); insignias in images/archive/mtf (CC BY-SA 3.0).

import type { Access } from './access';
export type MtfStatus = 'Einsatzbereit' | 'Im Einsatz' | 'Bereitschaft' | 'Klassifiziert';

export type Mtf = {
  id: string; // route id, e.g. 'epsilon-11'
  code: string; // 'Epsilon-11'
  nickname: string; // the unit's name, kept in English as on file
  motto: string; // the unit's guiding principle, one short line
  insignia: string; // file name in images/archive/mtf, or the URL of an uploaded picture
  status: MtfStatus;
  base: string;
  strength: string;
  lead: string;
  mission: string[];
  specialty: string[];
  readiness: number; // percent, shown as a gauge
  log: { date: string; text: string; tone?: 'ok' | 'warn' | 'bad' }[]; // recent deployments
  access?: Access; // see data/access.ts
};

export const MTFS: Mtf[] = []; // filled from the database at start, see src/data/store.ts

export const mtfById = (id: string) => MTFS.find((m) => m.id === id);
