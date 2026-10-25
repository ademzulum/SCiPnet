// Personnel photos and report images, resolved in the browser only:
// personnel.ts and reports.ts are also loaded by the api/ functions, which run
// as plain Node and can't import images.
//
// Censoring: put a second file next to the original with "_censored" before
// the extension (e.g. corvus_finch_censored.webp). Everyone but the
// Administrator sees that one; without it the original is shown.
const PEOPLE = import.meta.glob<string>('../../images/personell_pictures/*.{png,jpg,webp}', { eager: true, import: 'default' });
const REPORTS = import.meta.glob<string>('../../images/field_reports/*', { eager: true, import: 'default' });

const find = (files: Record<string, string>, dir: string, base: string) =>
  ['webp', 'png', 'jpg'].map((ext) => files[`${dir}${base}.${ext}`]).find(Boolean);

const pick = (files: Record<string, string>, dir: string, file: string | undefined, censored: boolean) => {
  if (!file) return undefined;
  const base = file.replace(/\.\w+$/, '');
  return (censored && find(files, dir, `${base}_censored`)) || files[`${dir}${file}`] || find(files, dir, base);
};

// name without extension, e.g. 'corvus_finch'
export const photoUrl = (name: string | undefined, censored: boolean) =>
  pick(PEOPLE, '../../images/personell_pictures/', name, censored);
// file name with extension, e.g. 'addendum.jpg'
export const reportImageUrl = (file: string | undefined, censored: boolean) =>
  pick(REPORTS, '../../images/field_reports/', file, censored);
