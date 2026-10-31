// Pixel art drawn as character grids, plus the isometric block used across the profile.
import { C } from './lib.mjs';

const PALETTE = {
  R: C.ember,
  A: C.amber,
  S: C.sand,
  M: C.mist,
  H: C.haze,
  D: C.dusk,
  K: '#1B0F2C',
};

// One rect per horizontal run, so a sprite stays small on disk.
export function pixels(grid, scale, ox = 0, oy = 0) {
  let out = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (PALETTE[ch]) {
        out += `<rect x="${ox + x * scale}" y="${oy + y * scale}" width="${(end - x) * scale}" height="${scale}" fill="${PALETTE[ch]}"/>`;
      }
      x = end;
    }
  });
  return `<g shape-rendering="crispEdges">${out}</g>`;
}

const HEAD = [
  '....RRRR....',
  '...RRRRRR...',
  '...RRRRRRR..',
  '...RSSKSKS..',
  '...RSSSSSS..',
  '....SSSSS...',
  '...AAAAAA...',
  '..AMMMMMMA..',
];

const body = (...rows) => [...HEAD, ...rows];

export const HERO = {
  idle: body('..SMMMMMMS..', '....MMMM....', '...HH..HH...', '...HH..HH...', '...RR..RR...'),
  run1: body('..SMMMMMMS..', '....MMMM....', '...HH..HH...', '..HH....HHR.', '..RR........'),
  run2: body('...MMMMMMS..', '...SMMMM....', '....HHHH....', '....HH.H....', '....RR.RR...'),
  jump: body('S.MMMMMM.S..', '....MMMM....', '...HHHHH....', '..HH...HHR..', '..RR........'),
};

export const COIN = ['..SSSS..', '.SAAAAS.', 'SAASSAAS', 'SAASSAAS', 'SAASSAAS', 'SAASSAAS', '.SAAAAS.', '..SSSS..'];
export const HEART = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];
export const SLIME = [
  '...AAAA...',
  '..AAAAAA..',
  '.AAKAAKAA.',
  '.AAKAAKAA.',
  'AAAAAAAAAA',
  'AAAAAAAAAA',
  'AAAAAAAAAA',
  '.A.AA.AA.A',
];
export const TROPHY = ['SSSSSSSS', 'SAASSAAS', 'SAASSAAS', '.SAAAAS.', '..SAAS..', '...SS...', '...SS...', '..SSSS..'];

// Two legs frames swapping in place. Feet rest on the group's origin.
export const heroSize = (scale) => ({ w: 12 * scale, h: 13 * scale });

export function heroRun(scale) {
  const { w, h } = heroSize(scale);
  return (
    `<g class="f1">${pixels(HERO.run1, scale, -w / 2, -h)}</g>` +
    `<g class="f2" opacity="0">${pixels(HERO.run2, scale, -w / 2, -h)}</g>`
  );
}

export const heroJump = (scale) => {
  const { w, h } = heroSize(scale);
  return pixels(HERO.jump, scale, -w / 2, -h);
};

export const heroIdle = (scale) => {
  const { w, h } = heroSize(scale);
  return pixels(HERO.idle, scale, -w / 2, -h);
};

export const SPRITE_CSS =
  `.f1{animation:f1 .28s steps(1) infinite}.f2{animation:f2 .28s steps(1) infinite}` +
  `@keyframes f1{0%{opacity:1}50%,100%{opacity:0}}@keyframes f2{0%{opacity:0}50%,100%{opacity:1}}` +
  `.spin{transform-box:fill-box;transform-origin:center;animation:spin .8s steps(1) infinite}` +
  `@keyframes spin{0%,100%{transform:none}25%{transform:scaleX(.55)}50%{transform:scaleX(.12)}75%{transform:scaleX(.55)}}`;

// An isometric block. (cx, top) is the back corner of the top face, and its
// middle sits at top + a / 2.
export function cube(cx, top, a, h, { lit = true, wire = false } = {}) {
  const t = `${cx},${top} ${cx + a},${top + a / 2} ${cx},${top + a} ${cx - a},${top + a / 2}`;
  const l = `${cx - a},${top + a / 2} ${cx},${top + a} ${cx},${top + a + h} ${cx - a},${top + a / 2 + h}`;
  const r = `${cx + a},${top + a / 2} ${cx},${top + a} ${cx},${top + a + h} ${cx + a},${top + a / 2 + h}`;
  if (wire) {
    return `<g fill="none" stroke="${C.dusk}" stroke-width="2" stroke-dasharray="6 5" stroke-linejoin="round"><polygon points="${t}"/><polygon points="${l}"/><polygon points="${r}"/></g>`;
  }
  const colors = lit ? [C.sand, C.amber, C.ember] : [C.dusk, C.plum, '#321C49'];
  const inset = a * 0.45;
  const seal = `${cx},${top + a / 2 - inset / 2} ${cx + inset},${top + a / 2} ${cx},${top + a / 2 + inset / 2} ${cx - inset},${top + a / 2}`;
  return (
    `<polygon points="${l}" fill="${colors[1]}"/><polygon points="${r}" fill="${colors[2]}"/><polygon points="${t}" fill="${colors[0]}"/>` +
    `<polygon points="${seal}" fill="${lit ? C.amber : C.plum}"/>`
  );
}
