// Converts the site's pictures to PNG materials for the Garry's Mod addon
// (SCiPnet PDA/scipnet/materials/scipnet/), since GMod can't draw SVG or WebP.
// Masks (logo, dock icons) are rendered white so the addon can tint them.
// Run after adding or changing a picture: node scripts/gmod-assets.mjs
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const OUT = join(ROOT, '../SCiPnet PDA/scipnet/materials/scipnet');

const svgPng = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: false } }).render().asPng();

async function write(dir, name, png, size) {
  mkdirSync(join(OUT, dir), { recursive: true });
  const img = sharp(png).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png();
  await img.toFile(join(OUT, dir, name + '.png'));
}

async function folder(src, dir, size, edit = (s) => s) {
  for (const f of readdirSync(join(ROOT, src))) {
    const ext = extname(f).toLowerCase();
    const name = basename(f, extname(f));
    const file = join(ROOT, src, f);
    if (ext === '.svg') await write(dir, name, svgPng(edit(readFileSync(file, 'utf8')), size * 2), size);
    else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) await write(dir, name, readFileSync(file), size);
  }
}

// ACS icons in their own colours, ink as on the site (--acs-ink)
const ink = (s) => s.replace(/#010101|#000000\b|#000\b/gi, '#0d0f12');
await folder('images/archive/acs', 'acs', 128, ink);
await folder('images/archive/acs/secondary', 'acs', 128, ink);
await folder('images/archive/mtf', 'mtf', 256);
await folder('images/archive/group_of_interest', 'goi', 256);
// portraits cut to the frame's 5:6 like object-fit: cover
mkdirSync(join(OUT, 'people'), { recursive: true });
for (const f of readdirSync(join(ROOT, 'images/personell_pictures'))) {
  const ext = extname(f).toLowerCase();
  const file = join(ROOT, 'images/personell_pictures', f);
  let src;
  if (ext === '.svg') src = svgPng(readFileSync(file, 'utf8'), 600);
  else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) src = readFileSync(file);
  else continue;
  await sharp(src).resize(250, 300, { fit: 'cover', position: 'centre' }).png().toFile(join(OUT, 'people', basename(f, extname(f)) + '.png'));
  // grayscale(1) contrast(1.1): shown until the pointer is on the file
  mkdirSync(join(OUT, 'people_grey'), { recursive: true });
  await sharp(src).resize(250, 300, { fit: 'cover', position: 'centre' }).grayscale().linear(1.1, -12.8).png().toFile(join(OUT, 'people_grey', basename(f, extname(f)) + '.png'));
}
// placeholder portrait (Portrait.tsx): head and shoulders, fading downwards
mkdirSync(join(OUT, 'ui'), { recursive: true });
await sharp(svgPng(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0.12"/></linearGradient></defs><circle cx="50" cy="44" r="20" fill="url(#g)"/><path d="M12 120 C 14 86, 32 72, 50 72 C 68 72, 86 86, 88 120 Z" fill="url(#g)"/></svg>`, 500)).resize(500, 600).png().toFile(join(OUT, 'ui', 'silhouette.png'));
// white masks
const white = (s) => s.replace(/#000\b|#000000\b|black/gi, '#fff').replace(/<svg /, '<svg fill="#fff" ');

// MTF insignias as white silhouettes (the faint turning insignia behind a unit's head)
for (const f of readdirSync(join(ROOT, 'images/archive/mtf')).filter((f) => f.endsWith('.png'))) {
  const { data, info } = await sharp(join(ROOT, 'images/archive/mtf', f)).resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = data[i + 2] = 255;
  mkdirSync(join(OUT, 'mtf_mask'), { recursive: true });
  await sharp(data, { raw: info }).png().toFile(join(OUT, 'mtf_mask', f));
}
// SCiPnet emblem as in src/components/ScpLogo.tsx: white details cut out, the rest white
const emblem = readFileSync(join(ROOT, 'images/scipnet_terminal/scipnet_logo.svg'), 'utf8')
  .replace(/<metadata>[\s\S]*?<\/metadata>/, '')
  .replace(/fill:\s*#fff/i, 'fill: transparent')
  .replace(/<svg([^>]*)>/, '<svg$1><style>*{fill:#fff}.cls-1{fill:transparent!important}</style>');
await write('ui', 'scipnet_logo', svgPng(emblem, 512), 256);
await write('ui', 'scp_logo', svgPng(white(readFileSync(join(ROOT, 'images/scipnet_terminal/scp_logo.svg'), 'utf8')), 4096), 2048);

// dock and header icons: stroked paths on a 24×24 grid, as in Shell.tsx
const ICONS = {
  overview: 'M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z',
  personnel: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14.5c1.8.8 3 2.6 3 5',
  reports: 'M6 3h9l4 4v14H6z M15 3v4h4 M9 11h7 M9 15h7 M9 19h4',
  archive: 'M3 4h18v4H3z M5 8v12h14V8 M10 12h4',
  logout: 'M14 4h5v16h-5 M10 8l-4 4 4 4 M6 12h10',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l4 4',
  back: 'M15 5l-7 7 7 7',
  arrow: 'M9 5l7 7-7 7',
  lock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  warn: 'M12 3 L22 20 H2 Z M12 9.5v5 M12 17.3v.1',
  chevron: 'M6 9l6 6 6-6',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2c3.4 3.5 3.4 16.5 0 20 M12 2c-3.4 3.5-3.4 16.5 0 20',
};
for (const [name, d] of Object.entries(ICONS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  await write('ui', name, svgPng(svg, 256), 128);
}
// screen effects from styles.css: the CRT glow, the vignette, scanlines and a soft shadow
const tex = (name, size, body) =>
  write('ui', name, svgPng(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">${body}</svg>`, size), size);
await tex('glow', 256, '<defs><radialGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100" height="100" fill="url(#g)"/>');
await tex('vignette', 256, '<defs><radialGradient id="g" r="0.71"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></radialGradient></defs><rect width="100" height="100" fill="url(#g)"/>');
mkdirSync(join(OUT, 'ui'), { recursive: true });
// 4 px tall tile: transparent 0-2 px, then the dark line (repeating-linear-gradient 0 2px / 3px)
const line = Buffer.alloc(4 * 4 * 4);
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) line[(y * 4 + x) * 4 + 3] = y >= 2 ? (y === 2 ? 38 : 77) : 0;
await sharp(line, { raw: { width: 4, height: 4, channels: 4 } }).png().toFile(join(OUT, 'ui', 'scanline.png'));
// smooth shapes: GMod's own rounded boxes and polygons have no anti-aliasing
await tex('circle', 256, '<circle cx="50" cy="50" r="50" fill="#fff"/>');
await tex('ring_thin', 512, '<circle cx="50" cy="50" r="49.6" fill="none" stroke="#fff" stroke-width="0.6"/>');
await tex('ring', 128, '<circle cx="50" cy="50" r="46.5" fill="none" stroke="#fff" stroke-width="7"/>');
// pips: skewX(-15deg) squares, filled and outlined
await tex('pip_on', 64, '<polygon points="27,0 100,0 73,100 0,100" fill="#fff"/>');
await tex('pip_off', 64, '<polygon points="30,6 93,6 70,94 7,94" fill="none" stroke="#fff" stroke-width="12"/>');
// the emblem's arrow (shaft and head) on its own square, centred on the shaft, pointing up
await write('ui', 'acs_arrow', svgPng('<svg xmlns="http://www.w3.org/2000/svg" viewBox="24 -12 52 52"><path d="M50 38V-8 M45 -3L50 -10L55 -3" fill="none" stroke="#fff" stroke-width="2"/></svg>', 512), 256);
console.log('materials written to', OUT);

// Brain scan (PsychScan.tsx): the line art and one white mask per lobe on one
// canvas (the brain plus the padding of the grid), and a coarse map of which
// lobe is where, for clicks (lua/scipnet/cl_brainmap.lua).
{
  const svg = readFileSync(join(ROOT, 'images/scipnet_terminal/brain_2d_scan_with_regions.svg'), 'utf8');
  const path = (id) => svg.match(new RegExp(`id="${id}"[^>]*? d="([^"]+)"`))[1];
  const [, , W, H] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const PAD = 36 * (W / 511);
  const box = `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`;
  const ids = ['frontallappen', 'partietallappen', 'okzipitallappen', 'temporallappen', 'kleinhirn'];
  const px = 1024;
  const one = (d) => svgPng(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"><path d="${d}" fill="#fff"/></svg>`, px);
  mkdirSync(join(OUT, 'brain'), { recursive: true });
  // square textures (GMod likes powers of two); drawn with the aspect ratio below
  const sq = (png, name) => sharp(png).resize(1024, 1024, { fit: 'fill' }).png().toFile(join(OUT, 'brain', name + '.png'));
  await sq(one(path('gehirn')), 'art');
  const GW = 96, GH = Math.round(96 * (H + 2 * PAD) / (W + 2 * PAD));
  const grid = new Array(GW * GH).fill(0);
  for (const [i, id] of ids.entries()) {
    const png = one(path(id));
    await sq(png, id);
    const { data, info } = await sharp(png).resize(GW, GH, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let k = 0; k < GW * GH; k++) if (data[k * info.channels + 3] > 100) grid[k] = i + 1;
  }
  const rows = [];
  for (let y = 0; y < GH; y++) rows.push('\t"' + grid.slice(y * GW, y * GW + GW).join('') + '",');
  writeFileSync(join(ROOT, '../SCiPnet PDA/scipnet/lua/scipnet/cl_brainmap.lua'),
    `-- Generated by scripts/gmod-assets.mjs from brain_2d_scan_with_regions.svg:\n-- which lobe (1-5, 0 none) lies in each cell of a ${GW} x ${GH} grid over the scan.\nSCIPNET.BrainMap = {\n\tw = ${GW}, h = ${GH}, aspect = ${((H + 2 * PAD) / (W + 2 * PAD)).toFixed(4)},\n${rows.join('\n')}\n}\n`);
}
console.log('brain written');
