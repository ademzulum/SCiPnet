// Personnel photos and report images, resolved in the browser only:
// personnel.ts and reports.ts are also loaded by the api/ functions, which run
// as plain Node and can't import images.
import type { CSSProperties } from 'react';

const PEOPLE = import.meta.glob<string>('../../images/personell_pictures/*.png', { eager: true, import: 'default' });
const REPORTS = import.meta.glob<string>('../../images/field_reports/*', { eager: true, import: 'default' });

export const photoUrl = (name?: string) =>
  name ? PEOPLE[`../../images/personell_pictures/${name}.png`] : undefined;
export const reportImageUrl = (file?: string) =>
  file ? REPORTS[`../../images/field_reports/${file}`] : undefined;

// Black censor bar over someone's eyes, in % of the cropped image.
export type EyeBar = { top: number; left: number; width: number; height?: number };
export const barStyle = (b: EyeBar): CSSProperties => ({
  top: `${b.top}%`,
  left: `${b.left}%`,
  width: `${b.width}%`,
  ...(b.height ? { height: `${b.height}%` } : {}),
});
