// Personnel photos, resolved in the browser only: personnel.ts is also loaded
// by the api/ functions, which run as plain Node and can't import images.
const FILES = import.meta.glob<string>('../../images/personell_pictures/*.png', { eager: true, import: 'default' });

export const photoUrl = (name?: string) =>
  name ? FILES[`../../images/personell_pictures/${name}.png`] : undefined;
