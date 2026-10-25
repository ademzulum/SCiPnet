// Personnel photos and report images, resolved in the browser only:
// personnel.ts and reports.ts are also loaded by the api/ functions, which run
// as plain Node and can't import images.
//
// Censoring: export the picture as an SVG with the black bars as elements
// whose id starts with "censor" (censor, censor2, ...). The Administrator sees
// the picture without them. An SVG is preferred over a png/jpg of the same name.
//
// Personnel photos are served from thumbs/ (made by scripts/thumbs.py), a few
// dozen KB each instead of several MB; run that script after adding a photo.
const PEOPLE = import.meta.glob<string>('../../images/personell_pictures/thumbs/*.{svg,png,jpg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const REPORTS = import.meta.glob<string>('../../images/field_reports/*.{svg,png,jpg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const pick = (files: Record<string, string>, dir: string, file?: string) => {
  if (!file) return undefined;
  const base = file.replace(/\.\w+$/, '');
  return ['svg', 'png', 'jpg', 'webp'].map((ext) => files[`${dir}${base}.${ext}`]).find(Boolean);
};

// name with or without extension, e.g. 'corvus_finch' or 'addendum.jpg'
export const photoUrl = (name?: string) => pick(PEOPLE, '../../images/personell_pictures/thumbs/', name);
export const reportImageUrl = (file?: string) => pick(REPORTS, '../../images/field_reports/', file);
