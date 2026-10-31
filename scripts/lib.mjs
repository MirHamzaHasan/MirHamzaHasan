// Shared tokens and helpers for the profile's SVGs.
// GitHub shows SVGs through <img>, which blocks web fonts and scripts, so all
// text becomes vector outlines and all motion is plain CSS inside the file.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const assetsDir = join(root, 'assets');
mkdirSync(assetsDir, { recursive: true });

export const C = {
  night: '#170C26',
  plum: '#26143A',
  dusk: '#452A5C',
  ember: '#FF4B3E',
  amber: '#FF9A2E',
  sand: '#FFD98E',
  mist: '#F5ECF8',
  haze: '#B3A1C7',
};

function load(path) {
  const buf = readFileSync(join(root, 'node_modules/@fontsource', path));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

export const F = {
  display: load('big-shoulders-display/files/big-shoulders-display-latin-800-normal.woff'),
  body: load('hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff'),
  medium: load('hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff'),
};

const n = (v) => +v.toFixed(2);
export { n };

// opentype's own serializer can emit data that browsers stop parsing partway
// through a word, so paths are written out here in plain absolute commands.
export function glyphPath(glyph, x, y, size) {
  return glyph
    .getPath(x, y, size)
    .commands.map((c) => {
      const p = (v) => +v.toFixed(1);
      if (c.type === 'M' || c.type === 'L') return `${c.type}${p(c.x)} ${p(c.y)}`;
      if (c.type === 'Q') return `Q${p(c.x1)} ${p(c.y1)} ${p(c.x)} ${p(c.y)}`;
      if (c.type === 'C') return `C${p(c.x1)} ${p(c.y1)} ${p(c.x2)} ${p(c.y2)} ${p(c.x)} ${p(c.y)}`;
      return 'Z';
    })
    .join('');
}

// Pen position of every glyph, with kerning and tracking applied.
export function layout(str, font, size, track = 0) {
  const scale = size / font.unitsPerEm;
  const glyphs = [...str].map((ch) => font.charToGlyph(ch));
  let x = 0;
  const out = glyphs.map((g, i) => {
    const at = x;
    const next = glyphs[i + 1];
    x += g.advanceWidth * scale + track;
    if (next) x += font.getKerningValue(g, next) * scale;
    return { g, x: at, char: [...str][i] };
  });
  return { glyphs: out, width: x - track };
}

export const widthOf = (str, font, size, track = 0) => layout(str, font, size, track).width;

export function outline(str, { font = F.body, size, x = 0, y = 0, anchor = 'start', track = 0 }) {
  const { glyphs, width } = layout(str, font, size, track);
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return glyphs.map(({ g, x: gx }) => glyphPath(g, left + gx, y, size)).join('');
}

export function text(str, opts) {
  const { fill = C.mist, cls, opacity } = opts;
  const attrs = [`fill="${fill}"`, cls && `class="${cls}"`, opacity != null && `opacity="${opacity}"`]
    .filter(Boolean)
    .join(' ');
  return `<path ${attrs} d="${outline(str, opts)}"/>`;
}

// Greedy word wrap, returning one string per line.
export function wrap(str, font, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && widthOf(attempt, font, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = attempt;
  }
  if (line) lines.push(line);
  return lines;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Every file holds still for people who ask for reduced motion. Base styles are
// always the finished frame, so stopping the animations leaves a complete image.
export function svg(name, { w, h, title, css = '', defs = '', body }) {
  const out =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">` +
    `<title>${esc(title)}</title>` +
    `<style>${css}@media (prefers-reduced-motion:reduce){*{animation:none!important}.motion-only{display:none}}</style>` +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>\n`;
  writeFileSync(join(assetsDir, `${name}.svg`), out);
  console.log(`${name}.svg  ${(out.length / 1024).toFixed(1)} KB`);
}

export const ground = (w, h, r = 24, fill = 'url(#sky)') =>
  `<rect width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

export const skyGradient = (id = 'sky', bottom = '#34163F') =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}"/><stop offset=".6" stop-color="${C.plum}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
