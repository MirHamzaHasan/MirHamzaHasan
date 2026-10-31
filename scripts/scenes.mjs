// The story pieces: hero, player card, the game level and the block chain.
// `calm` marks fades, glows and line draws, which keep running under Reduce Motion.
import { C, F, glyphPath, ground, layout, n, outline, skyGradient, svg, text, widthOf } from './lib.mjs';
import { COIN, HEART, SLIME, SPRITE_CSS, TROPHY, cube, heroIdle, heroJump, heroRun, pixels } from './sprites.mjs';

const pct = (v) => `${n(v)}%`;

// Small repeatable random numbers, so rebuilds don't redraw the scenery.
const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/* ---------- Hero: one hero runs through games, the chain and AI ---------- */
export function hero() {
  const W = 1200;
  const H = 590;
  const dur = 16;
  const start = 1.3; // the loop waits for the name to land
  const travelFrom = 3;
  const travelTo = 68;

  const pts = [{ x: 56, y: 450, air: false }];
  const runTo = (x, y) => pts.push({ x, y, air: false });
  const jumpTo = (x2, y2, apex) => {
    const { x: x1, y: y1 } = pts[pts.length - 1];
    const cy = 2 * apex - (y1 + y2) / 2;
    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      pts.push({
        x: x1 + (x2 - x1) * t,
        y: (1 - t) ** 2 * y1 + 2 * t * (1 - t) * cy + t ** 2 * y2,
        air: i < 12,
      });
    }
  };

  runTo(170, 450);
  jumpTo(232, 408, 352);
  runTo(322, 408);
  jumpTo(386, 450, 362);
  runTo(470, 450);

  // The chain climbs as a staircase, and landing on a block mines it.
  const blocks = [
    { x: 530, y: 428 },
    { x: 608, y: 398 },
    { x: 686, y: 368 },
    { x: 764, y: 338 },
    { x: 842, y: 308 },
  ];
  for (const b of blocks) jumpTo(b.x, b.y + 14, b.y - 44);
  const input = { x: 910, y: 322 };
  runTo(input.x, input.y);

  let length = 0;
  pts.forEach((p, i) => {
    if (i) length += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    p.l = length;
  });
  const toPct = (l) => travelFrom + (travelTo - travelFrom) * (l / length);
  const pctAtX = (x) => toPct(pts.find((p) => p.x >= x).l);
  const d = 'M' + pts.map((p) => `${n(p.x)} ${n(p.y)}`).join('L');

  let css = SPRITE_CSS;
  let id = 0;
  const switchOn = (at, from = 'opacity:0', to = 'opacity:1', rise = 1.4) => {
    const name = `k${id++}`;
    css += `@keyframes ${name}{0%,${pct(at)}{${from}}${pct(at + rise)},100%{${to}}}`;
    return `animation:${name} ${dur}s linear ${start}s infinite both`;
  };
  // Shown only between two moments, for score digits.
  const between = (from, to) => {
    const name = `k${id++}`;
    const rows = [];
    if (from > 0) rows.push(`0%,${pct(from)}{opacity:0}`);
    rows.push(`${pct(from + 0.1)},${pct(to)}{opacity:1}`);
    if (to < 100) rows.push(`${pct(to + 0.1)},100%{opacity:0}`);
    css += `@keyframes ${name}{${rows.join('')}}`;
    return `animation:${name} ${dur}s linear ${start}s infinite both`;
  };

  // Platforms
  const platforms = [
    [56, 170, 450],
    [232, 322, 408],
    [386, 470, 450],
  ];
  let ghost = '';
  let lit = '';
  const blockBottom = 500;
  for (const [a, b, y] of platforms) {
    ghost += `<rect x="${a}" y="${y}" width="${b - a}" height="${blockBottom - y}" fill="${C.plum}"/>`;
    for (let col = a; col < b; col += 28) {
      const w = Math.min(28, b - col) - 2;
      for (let row = y + 4; row < blockBottom; row += 24) {
        ghost += `<rect x="${col}" y="${row}" width="${w}" height="20" fill="${C.dusk}" opacity=".5"/>`;
      }
      const at = pctAtX(Math.max(col, a + 1));
      lit += `<rect class="calm" style="${switchOn(at)}" x="${col}" y="${y}" width="${w}" height="6" fill="${C.sand}"/>`;
    }
  }

  // Spinning coins hang at the top of each jump.
  const coins = [[201, 340], [354, 350], [430, 414]];
  const coinTimes = coins.map(([x]) => pctAtX(x));
  coins.forEach(([x, y], i) => {
    const at = coinTimes[i];
    const name = `k${id++}`;
    css += `@keyframes ${name}{0%,${pct(at)}{transform:scale(1);opacity:1}${pct(at + 1.2)},100%{transform:scale(2);opacity:0}}`;
    lit += `<g class="motion-only" style="animation:${name} ${dur}s linear ${start}s infinite both;transform-box:fill-box;transform-origin:center"><g class="spin">${pixels(COIN, 3, x - 12, y - 12)}</g></g>`;
  });

  // Blocks and the links between them.
  const blockTimes = blocks.map((b) => pctAtX(b.x));
  const A = 30;
  const CUBE_H = 22;
  blocks.forEach((b, i) => {
    const top = b.y - A / 2 + 14;
    const at = blockTimes[i];
    if (i) {
      const p = blocks[i - 1];
      const link = `M${p.x + A} ${p.y + 22}L${b.x - A} ${b.y + 22}`;
      ghost += `<path d="${link}" stroke="${C.dusk}" stroke-width="5" stroke-dasharray="7 3"/>`;
      lit += `<path class="calm" style="${switchOn(at)}" d="${link}" stroke="${C.sand}" stroke-width="5" stroke-dasharray="7 3"/>`;
    }
    ghost += cube(b.x, top, A, CUBE_H, { lit: false });
    const glow = `<g class="calm" style="${switchOn(at, 'opacity:0', 'opacity:1', 0.8)}">${cube(b.x, top, A, CUBE_H)}</g>`;
    lit += glow;
    // A little "+1" floats up from each block as it's mined.
    const name = `k${id++}`;
    css += `@keyframes ${name}{0%,${pct(at)}{transform:none;opacity:0}${pct(at + 0.4)}{opacity:1}${pct(at + 5)},100%{transform:translateY(-44px);opacity:0}}`;
    lit += `<g class="motion-only" style="animation:${name} ${dur}s ease-out ${start}s infinite both">${text('+1', { font: F.pixel, size: 16, x: b.x, y: top - 42, anchor: 'middle', fill: C.sand })}</g>`;
  });

  // The network fires layer by layer after the hero reaches it.
  const layers = [
    [input],
    [{ x: 990, y: 300 }, { x: 990, y: 385 }, { x: 990, y: 470 }],
    [{ x: 1070, y: 300 }, { x: 1070, y: 385 }, { x: 1070, y: 470 }],
    [{ x: 1144, y: 385 }],
  ];
  const fireAt = [travelTo, travelTo + 4, travelTo + 8, travelTo + 12];
  layers.forEach((layer, li) => {
    if (li < layers.length - 1) {
      for (const a of layer) {
        for (const b of layers[li + 1]) {
          const mid = (a.x + b.x) / 2;
          const edge = `M${a.x} ${a.y}C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`;
          ghost += `<path d="${edge}" fill="none" stroke="${C.dusk}" stroke-width="2"/>`;
          const style = switchOn(fireAt[li], 'stroke-dashoffset:1', 'stroke-dashoffset:0', 4);
          lit += `<path class="calm" style="${style}" d="${edge}" pathLength="1" stroke-dasharray="1 1" fill="none" stroke="url(#heatLine)" stroke-width="2.5"/>`;
        }
      }
    }
    const last = li === layers.length - 1;
    for (const p of layer) {
      const r = last ? 17 : 11;
      ghost += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${C.night}" stroke="${C.dusk}" stroke-width="2"/>`;
      lit += `<circle class="calm" style="${switchOn(fireAt[li] + (li ? 4 : 0), 'opacity:0', 'opacity:1', 1)}" cx="${p.x}" cy="${p.y}" r="${r}" fill="${last ? C.ember : C.amber}"/>`;
    }
  });
  const out = layers[3][0];
  const ringAt = fireAt[3] + 4;
  css += `@keyframes ring{0%,${pct(ringAt)}{transform:scale(.6);opacity:0}${pct(ringAt + 1)}{opacity:.9}${pct(ringAt + 11)},100%{transform:scale(3);opacity:0}}`;
  lit += `<circle class="motion-only" style="animation:ring ${dur}s ease-out ${start}s infinite both;transform-box:fill-box;transform-origin:center" cx="${out.x}" cy="${out.y}" r="18" fill="none" stroke="${C.sand}" stroke-width="2.5"/>`;

  // Scoreboard: every coin and block ticks a pixel digit up.
  const counter = (label, x, times) => {
    const y = 244;
    const size = 18;
    let o = text(label, { font: F.pixel, size, x, y, fill: C.haze });
    const dx = x + (label.length + 1) * size;
    times.forEach((_, count) => {
      const glyph = (value, from, to) => {
        const finalValue = value === times.length;
        return `<g class="calm" opacity="${finalValue ? 1 : 0}" style="${between(from, to)}">${text(String(value), { font: F.pixel, size, x: dx, y, fill: C.sand })}</g>`;
      };
      if (count === 0) o += glyph(0, 0, times[0]);
      o += glyph(count + 1, times[count], count + 1 < times.length ? times[count + 1] : 100);
    });
    return o;
  };

  // Travel keyframes: the hero, the bright line, and the band of heat in the name.
  const frames = (fn) => pts.map((p) => `${pct(toPct(p.l))}{${fn(p)}}`).join('');
  const end = pts[pts.length - 1];
  css += `@keyframes line{0%,${pct(travelFrom)}{stroke-dashoffset:1}${pct(travelTo)},100%{stroke-dashoffset:0}}`;
  const place = (p) => `transform:translate(${n(p.x)}px,${n(p.y)}px)`;
  css += `@keyframes runner{0%{${place(pts[0])};opacity:0}${frames((p) => `${place(p)};opacity:1`)}${pct(travelTo + 0.4)},100%{${place(end)};opacity:0}}`;
  css += `@keyframes legs{0%{opacity:1}${frames((p) => `opacity:${p.air ? 0 : 1}`)}100%{opacity:1}}`;
  css += `@keyframes air{0%{opacity:0}${frames((p) => `opacity:${p.air ? 1 : 0}`)}100%{opacity:0}}`;
  css += `@keyframes heat{0%{transform:translateX(-340px)}${frames((p) => `transform:translateX(${n(p.x - 170)}px)`)}${pct(travelTo + 8)},100%{transform:translateX(1240px)}}`;
  css += `@keyframes world{0%,92%{opacity:1}99%,100%{opacity:0}}`;
  css += `@keyframes land{from{transform:translateY(46px);opacity:0}to{transform:none;opacity:1}}`;
  css += `@keyframes fade{from{opacity:0}to{opacity:1}}`;
  css += `.lit{animation:world ${dur}s linear ${start}s infinite both}`;
  css += `.line{animation:line ${dur}s linear ${start}s infinite both}`;
  css += `.runner{opacity:0;animation:runner ${dur}s linear ${start}s infinite both}`;
  css += `.legs{animation:legs ${dur}s linear ${start}s infinite both}`;
  css += `.air{opacity:0;animation:air ${dur}s linear ${start}s infinite both}`;
  css += `.band{animation:heat ${dur}s linear ${start}s infinite both}`;
  css += `.tag{animation:fade 1s ease-out .75s both}`;
  css += `.ltr{animation:land .75s cubic-bezier(.16,1,.3,1) both}`;

  const label = 'MIR HAMZA HASAN';
  const size = 1088 / (widthOf(label, F.display, 100) / 100);
  const baseline = 186;
  const set = layout(label, F.display, size);
  let letters = '';
  let i = 0;
  for (const { g, x, char } of set.glyphs) {
    if (char === ' ') continue;
    letters += `<path class="ltr" style="animation-delay:${n(i * 0.045)}s" fill="${C.mist}" d="${glyphPath(g, 56 + x, baseline, size)}"/>`;
    i++;
  }
  const nameD = outline(label, { font: F.display, size, x: 56, y: baseline });

  const zone = (str, x, at) =>
    text(str, { font: F.medium, size: 30, x, y: 552, fill: C.haze }) +
    `<g class="lit calm"><g class="calm" style="${switchOn(at)}">${text(str, { font: F.medium, size: 30, x, y: 552, fill: C.sand })}</g></g>`;

  const defs =
    skyGradient('sky', '#3C1A44') +
    `<radialGradient id="dusk"><stop offset="0" stop-color="${C.ember}" stop-opacity=".22"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="heatLine" gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="1144" y2="0"><stop offset="0" stop-color="${C.ember}"/><stop offset=".55" stop-color="${C.amber}"/><stop offset="1" stop-color="${C.sand}"/></linearGradient>` +
    `<linearGradient id="heatBand"><stop offset="0" stop-color="${C.ember}" stop-opacity="0"/><stop offset=".3" stop-color="${C.ember}"/><stop offset=".5" stop-color="${C.sand}"/><stop offset=".7" stop-color="${C.amber}"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="nameClip"><path d="${nameD}"/></clipPath>` +
    `<clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>`;

  // Built before svg() is called, because the counters and zones add keyframes to css.
  const body =
      ground(W, H) +
      `<g clip-path="url(#frame)"><ellipse cx="${W / 2}" cy="${H}" rx="${W * 0.7}" ry="260" fill="url(#dusk)"/>` +
      letters +
      `<g class="motion-only" clip-path="url(#nameClip)"><rect class="band" width="340" height="220" fill="url(#heatBand)"/></g>` +
      text('I build AI-powered products that feel alive.', { font: F.body, size: 37, x: 58, y: 244, cls: 'tag', fill: C.mist }) +
      counter('COINS', 806, coinTimes) +
      counter('BLOCKS', 980, blockTimes) +
      ghost +
      `<path d="${d}" fill="none" stroke="${C.dusk}" stroke-width="2" stroke-linejoin="round" opacity=".6"/>` +
      `<g class="lit calm">${lit}<path class="line calm" d="${d}" pathLength="1" stroke-dasharray="1 1" fill="none" stroke="url(#heatLine)" stroke-width="3" stroke-linejoin="round"/></g>` +
      `<g class="runner motion-only"><g class="legs">${heroRun(3)}</g><g class="air">${heroJump(3)}</g></g>` +
      zone('Games', 56, pctAtX(60)) +
      zone('Web3', 500, blockTimes[0]) +
      zone('AI systems', 884, travelTo) +
      `</g>`;

  svg('hero', {
    w: W,
    h: H,
    title:
      'Mir Hamza Hasan. I build AI-powered products that feel alive. A pixel-art hero collects coins across game platforms, mines a chain of blocks and fires an AI network.',
    css,
    defs,
    body,
  });
}

/* ---------- Player card ---------- */
export function profile() {
  const W = 680;
  const rows = [
    ['Name', 'Mir Hamza Hasan'],
    ['Base', 'Dubai, UAE'],
    ['Class', 'Builder and engineer'],
    ['Mode', 'Ship fast. Learn faster.'],
    ['Focus', 'AI × Games × Web3'],
    ['Energy', 'Happy game-dev chaos'],
  ];
  const top = 150;
  const rowH = 64;
  const shift = 26; // room for the hearts under the title
  const H = top + shift + rows.length * rowH - 14;
  let body = '';
  rows.forEach(([key, value], i) => {
    const y = top + i * rowH;
    if (i) body += `<rect x="40" y="${y - 44}" width="${W - 80}" height="2" fill="${C.dusk}" opacity=".6"/>`;
    body += text(key, { font: F.body, size: 28, x: 40, y, fill: C.haze });
    body += text(value, { font: F.medium, size: 30, x: 170, y, fill: C.mist });
  });

  let meter = '';
  for (let i = 0; i < 7; i++) {
    meter += `<rect class="m calm" style="animation-delay:${n(-i * 0.37)}s;animation-duration:${n(0.9 + ((i * 7) % 5) * 0.17)}s" x="${W - 40 - (7 - i) * 11}" y="${top + 5 * rowH - 26}" width="7" height="28" rx="1" fill="${i > 4 ? C.ember : i > 2 ? C.amber : C.sand}"/>`;
  }

  const hearts = [0, 1, 2]
    .map((i) => `<g class="beat calm" style="animation-delay:${i * 0.18}s">${pixels(HEART, 4, 40 + i * 38, 86)}</g>`)
    .join('');

  svg('profile', {
    w: W,
    h: H + 32,
    title:
      'Player profile. Name: Mir Hamza Hasan. Base: Dubai, UAE. Class: builder and engineer. Mode: ship fast, learn faster. Focus: AI, games and Web3. Energy: happy game-dev chaos.',
    css: `.m{transform-box:fill-box;transform-origin:50% 100%;animation:m 1s ease-in-out infinite alternate}@keyframes m{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
.beat{animation:beat 1.8s steps(1) infinite}@keyframes beat{0%,100%{opacity:1}55%{opacity:.35}}
.bob{animation:bob .9s steps(2) infinite alternate}@keyframes bob{from{transform:translate(590px,102px)}to{transform:translate(590px,96px)}}`,
    defs: skyGradient('sky') + `<clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>`,
    body:
      ground(W, H) +
      `<g clip-path="url(#frame)">` +
      text('PLAYER 1', { font: F.pixel, size: 32, x: 40, y: 66, fill: C.sand }) +
      hearts +
      `<g class="bob" transform="translate(590 102)">${heroIdle(6)}</g>` +
      `<g transform="translate(0 ${shift})">${body}${meter}</g>` +
      `</g>`,
  });
}

/* ---------- Game dev: a level that scrolls forever ---------- */
export function gameLevel() {
  const W = 1200;
  const H = 440;
  const groundY = 360;
  const dur = 10; // one full lap of the level
  const speed = W / dur;
  const heroX = 300;
  const rand = seeded(7);

  // Stars
  let stars = '';
  for (let i = 0; i < 34; i++) {
    const size = rand() > 0.75 ? 4 : 3;
    stars += `<rect class="tw calm" style="animation-delay:${n(-rand() * 4)}s" x="${Math.floor(rand() * W)}" y="${Math.floor(rand() * 210)}" width="${size}" height="${size}" fill="${C.mist}"/>`;
  }

  // A striped pixel sun low over the city.
  let sun = '';
  const sunR = 112;
  const sunX = 860;
  const sunY = 250;
  for (let y = -sunR; y < sunR; y += 8) {
    if (y > 16 && Math.floor((y - 16) / 24) % 2 === 1) continue;
    const half = Math.round(Math.sqrt(sunR ** 2 - (y + 4) ** 2) / 8) * 8;
    const t = (y + sunR) / (2 * sunR);
    sun += `<rect x="${sunX - half}" y="${sunY + y}" width="${half * 2}" height="8" fill="${t < 0.35 ? C.sand : t < 0.65 ? C.amber : C.ember}"/>`;
  }

  // Far layer: Dubai in silhouette, with a Burj Khalifa stepping up to a needle.
  let city = '';
  for (let x = 0; x < W; ) {
    const w = 28 + Math.floor(rand() * 5) * 8;
    const h = 60 + Math.floor(rand() * 11) * 12;
    if (x > 520 && x < 680) {
      x += w;
      continue;
    }
    city += `<rect x="${x}" y="${groundY - h}" width="${w}" height="${h}" fill="#2B1740"/>`;
    for (let wy = groundY - h + 10; wy < groundY - 10; wy += 16) {
      for (let wx = x + 6; wx < x + w - 6; wx += 12) {
        if (rand() > 0.72) city += `<rect x="${wx}" y="${wy}" width="4" height="6" fill="${C.amber}" opacity=".75"/>`;
      }
    }
    x += w + 8 + Math.floor(rand() * 3) * 8;
  }
  [[64, 84], [48, 76], [36, 70], [24, 62], [14, 48], [6, 40]].reduce((bottom, [w, h]) => {
    city += `<rect x="${600 - w / 2}" y="${bottom - h}" width="${w}" height="${h}" fill="#2B1740"/>`;
    return bottom - h;
  }, groundY);

  // Mid layer: dunes.
  let dunes = '';
  for (let x = 0; x < W; x += 16) {
    const h = 28 + Math.round((22 * Math.sin((x / W) * Math.PI * 6) + 12 * Math.sin((x / W) * Math.PI * 14)) / 8) * 8;
    dunes += `<rect x="${x}" y="${groundY - h}" width="16" height="${h}" fill="${C.dusk}"/>`;
  }

  // Ground, repeating every tile.
  let groundTiles = '';
  for (let x = 0; x < W; x += 48) {
    groundTiles += `<rect x="${x}" y="${groundY}" width="48" height="10" fill="${C.sand}"/><rect x="${x}" y="${groundY + 10}" width="24" height="6" fill="${C.amber}"/><rect x="${x + 24}" y="${groundY + 10}" width="24" height="6" fill="${C.ember}"/>`;
    for (let row = 0; row < 3; row++) {
      const off = row % 2 ? 24 : 0;
      groundTiles += `<rect x="${x + off}" y="${groundY + 20 + row * 22}" width="44" height="18" fill="${C.dusk}"/>`;
    }
  }

  // Things to jump over or collect. Each reaches the hero at a known moment.
  const slimes = [540, 1120];
  const coinRow = [
    [846, 162],
    [876, 176],
    [906, 176],
    [936, 162],
  ];
  const reach = (x) => (x - heroX) / speed;
  const jumps = [
    { c: reach(slimes[0]), w: 0.8, h: 110 },
    { c: reach(891), w: 1.15, h: 150 },
    { c: reach(slimes[1]), w: 0.8, h: 110 },
  ];

  const slimeSvg = (x) =>
    `<g class="sq" style="transform-origin:${x + 20}px ${groundY}px">${pixels(SLIME, 4, x, groundY - 32)}</g>`;
  const itemsFixed = slimes.map(slimeSvg).join('');

  // Coins in the first lap vanish when collected; the second lap is what scrolls in next.
  let css = SPRITE_CSS;
  let collected = '';
  let upcoming = '';
  coinRow.forEach(([x, up], i) => {
    const at = (reach(x) / dur) * 100;
    css += `@keyframes c${i}{0%,${pct(at)}{opacity:1;transform:none}${pct(at + 2.5)},100%{opacity:0;transform:translateY(-34px)}}`;
    const coin = (ox) => `<g class="spin">${pixels(COIN, 3, ox - 12, groundY - up - 12)}</g>`;
    collected += `<g style="animation:c${i} ${dur}s linear infinite both">${coin(x)}</g>`;
    upcoming += coin(x + W);
  });

  // Hero's jump path and pose, sampled from the same clock as the scrolling ground.
  const samples = [];
  const pose = [];
  for (const { c, w, h } of jumps) {
    const t0 = c - w / 2;
    samples.push(`${pct((t0 / dur) * 100)}{transform:translate(${heroX}px,${groundY}px)}`);
    for (let i = 1; i <= 8; i++) {
      const u = i / 8;
      const y = groundY - 4 * h * u * (1 - u);
      samples.push(`${pct(((t0 + w * u) / dur) * 100)}{transform:translate(${heroX}px,${n(y)}px)}`);
    }
    pose.push([(t0 / dur) * 100, ((t0 + w) / dur) * 100]);
  }
  css += `@keyframes hop{0%,100%{transform:translate(${heroX}px,${groundY}px)}${samples.join('')}}`;
  const air = pose.map(([a, b]) => `${pct(a - 0.1)}{opacity:0}${pct(a)},${pct(b)}{opacity:1}${pct(b + 0.1)}{opacity:0}`).join('');
  const legs = pose.map(([a, b]) => `${pct(a - 0.1)}{opacity:1}${pct(a)},${pct(b)}{opacity:0}${pct(b + 0.1)}{opacity:1}`).join('');
  css += `@keyframes gair{0%,100%{opacity:0}${air}}@keyframes glegs{0%,100%{opacity:1}${legs}}`;

  // HUD coin count ticks with the coins above.
  let digits = '';
  coinRow.forEach(([x], i) => {
    const from = i === 0 ? 0 : (reach(coinRow[i - 1][0]) / dur) * 100;
    const to = (reach(x) / dur) * 100;
    css += `@keyframes d${i}{${from > 0 ? `0%,${pct(from)}{opacity:0}` : ''}${pct(from + 0.1)},${pct(to)}{opacity:1}${pct(to + 0.1)},100%{opacity:0}}`;
    digits += `<g class="calm" opacity="0" style="animation:d${i} ${dur}s linear infinite both">${text(`x${i}`, { font: F.pixel, size: 22, x: 1086, y: 52, fill: C.sand })}</g>`;
  });
  const lastAt = (reach(coinRow[coinRow.length - 1][0]) / dur) * 100;
  css += `@keyframes dLast{0%,${pct(lastAt)}{opacity:0}${pct(lastAt + 0.1)},100%{opacity:1}}`;
  digits += `<g class="calm" style="animation:dLast ${dur}s linear infinite both">${text(`x${coinRow.length}`, { font: F.pixel, size: 22, x: 1086, y: 52, fill: C.sand })}</g>`;

  const toastW = 430;
  const toastX = W - toastW - 32;
  const toast =
    `<g class="toast"><rect x="${toastX}" y="76" width="${toastW}" height="84" rx="10" fill="${C.night}" stroke="${C.amber}" stroke-width="3"/>` +
    pixels(TROPHY, 5, toastX + 18, 98) +
    text('ACHIEVEMENT', { font: F.pixel, size: 15, x: toastX + 80, y: 108, fill: C.amber }) +
    text('Millions of installs', { font: F.medium, size: 29, x: toastX + 80, y: 144, fill: C.mist }) +
    `</g>`;

  svg('game', {
    w: W,
    h: H,
    title:
      'Game dev. Unity tools, procedural systems and mobile games with millions of installs. A pixel-art hero runs through an endless level past a Dubai skyline, jumping slimes and collecting coins.',
    css:
      css +
      `.tw{animation:tw 3.4s steps(3) infinite alternate}@keyframes tw{from{opacity:.15}to{opacity:1}}
.far{animation:lap ${dur * 6}s linear infinite}.mid{animation:lap ${dur * 2.5}s linear infinite}.near{animation:lap ${dur}s linear infinite}
@keyframes lap{to{transform:translateX(-${W}px)}}
.hop{transform:translate(${heroX}px,${groundY}px);animation:hop ${dur}s linear infinite}
.legs{animation:glegs ${dur}s steps(1) infinite}.air{opacity:0;animation:gair ${dur}s steps(1) infinite}
.sq{animation:sq .6s steps(2) infinite alternate}@keyframes sq{to{transform:scale(1.12,.8)}}
.toast{animation:toast ${dur}s cubic-bezier(.2,.9,.2,1) infinite both}@keyframes toast{0%,14%{transform:translateX(480px)}20%,62%{transform:none}68%,100%{transform:translateX(480px)}}
.beat{animation:beat 1.6s steps(1) infinite}@keyframes beat{0%,100%{opacity:1}60%{opacity:.4}}`,
    defs:
      `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}"/><stop offset=".55" stop-color="#3A1848"/><stop offset=".85" stop-color="#8A2A45"/></linearGradient>` +
      `<g id="city">${city}</g><g id="dunes">${dunes}</g><g id="tiles">${groundTiles}</g><g id="items">${itemsFixed}</g>` +
      `<clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>`,
    body:
      `<g clip-path="url(#frame)" >` +
      `<rect width="${W}" height="${H}" fill="url(#sky)"/>` +
      stars +
      `<g shape-rendering="crispEdges">${sun}</g>` +
      `<g class="far" shape-rendering="crispEdges"><use href="#city"/><use href="#city" x="${W}"/></g>` +
      `<g class="mid" shape-rendering="crispEdges"><use href="#dunes"/><use href="#dunes" x="${W}"/></g>` +
      `<g class="near"><g shape-rendering="crispEdges"><use href="#tiles"/><use href="#tiles" x="${W}"/></g><use href="#items"/><use href="#items" x="${W}"/>${collected}${upcoming}</g>` +
      `<g class="hop"><g class="legs">${heroRun(5)}</g><g class="air">${heroJump(5)}</g></g>` +
      text('GAME DEV', { font: F.pixel, size: 34, x: 36, y: 66, fill: C.sand }) +
      text('Unity tools, procedural systems, mobile games.', { font: F.medium, size: 29, x: 36, y: 110, fill: C.mist }) +
      [0, 1, 2].map((i) => `<g class="beat calm" style="animation-delay:${i * 0.2}s">${pixels(HEART, 4, 908 + i * 36, 30)}</g>`).join('') +
      pixels(COIN, 3, 1052, 30) +
      digits +
      toast +
      `</g>`,
  });
}

/* ---------- Blockchain: transactions become a block, and the chain moves on ---------- */
export function chain() {
  const W = 1200;
  const H = 390;
  const step = 3.2; // seconds per block
  const dist = 190;
  const S = 1010; // where the next block forms
  const a = 60;
  const h = 58;
  const top = 148;
  const midY = top + a / 2 + h / 2 + 4;
  const labelY = top + a + h + 44;
  const hashes = ['0x7f3a…c91e', '0x09bd…41fa', '0xe2c8…7d03', '0x5a16…be72'];
  const scramble = ['0x4c1e…a07b', '0xd93f…12c6', '0x28ab…f5e9'];
  const mono = { font: F.mono, size: 22, anchor: 'middle' };

  const link = (x) => {
    const from = x + a + 2;
    const to = x + dist - a - 2;
    const count = 3;
    const gap = (to - from) / count;
    let o = '';
    for (let i = 0; i < count; i++) {
      const cx = from + gap * (i + 0.5);
      o += `<ellipse cx="${n(cx)}" cy="${midY}" rx="${n(gap / 2 + 5)}" ry="${i % 2 ? 3 : 9}" fill="none" stroke="${i % 2 ? C.sand : C.haze}" stroke-width="4"/>`;
    }
    return o;
  };

  // The sealed chain. Hashes repeat every four blocks so the loop has no seam.
  let row = '';
  let links = '';
  for (let j = -6; j <= 4; j++) {
    const x = S + j * dist;
    row += cube(x, top, a, h);
    links += link(x);
    row += text(hashes[((j % 4) + 4) % 4], { ...mono, x, y: labelY, fill: C.haze });
  }

  // Transactions fly from the mempool into the forming block.
  let css = '';
  let txs = '';
  const rand = seeded(11);
  for (let i = 0; i < 9; i++) {
    const from = 5 + i * 5;
    const to = from + 15;
    const x0 = n(rand() * 190 - 50);
    const y0 = n(-70 - rand() * 30);
    css += `@keyframes tx${i}{0%,${from}%{transform:translate(${x0}px,${y0}px);opacity:0}${from + 2}%{opacity:1}${to}%{transform:none;opacity:1}${to + 1}%,100%{transform:none;opacity:0}}`;
    txs += `<rect class="motion-only" style="animation:tx${i} ${step}s ease-in infinite both" x="${S - 6}" y="${top + a / 2 - 6}" width="12" height="12" rx="2" fill="${i % 3 ? C.amber : C.mist}"/>`;
  }

  // Hash guesses flicker while mining, then the real hash settles.
  const guess = scramble
    .map((str, i) => {
      const from = 6 + i * 18;
      const to = from + 18;
      css += `@keyframes g${i}{0%,${from}%{opacity:0}${from + 0.1}%,${to}%{opacity:1}${to + 0.1}%,100%{opacity:0}}`;
      return `<g class="calm" opacity="0" style="animation:g${i} ${step}s linear infinite both">${text(str, { ...mono, x: S, y: labelY, fill: C.ember })}</g>`;
    })
    .join('');
  const settled = hashes
    .map((str, i) => {
      const from = i * 25 + 15;
      const to = (i + 1) * 25;
      const end = to >= 100 ? '' : `${to + 0.05}%,100%{opacity:0}`;
      css += `@keyframes s${i}{0%,${from}%{opacity:0}${from + 0.1}%,${to}%{opacity:1}${end}}`;
      return `<g class="calm" opacity="${i === 0 ? 1 : 0}" style="animation:s${i} ${step * 4}s linear infinite both">${text(str, { ...mono, x: S, y: labelY, fill: C.haze })}</g>`;
    })
    .join('');

  const moves = [0, 1, 2, 3]
    .map((i) => {
      const base = i * 25;
      return `${base + 20}%{transform:translateX(${-i * dist}px)}${base + 25}%{transform:translateX(${-(i + 1) * dist}px)}`;
    })
    .join('');

  svg('chain', {
    w: W,
    h: H,
    title:
      'Blockchain. Solana and EVM smart contracts, and realtime systems around them. Transactions fly from the mempool into a new block, its hash is mined, the block seals and the chain moves along.',
    css:
      css +
      `.chain{animation:chain ${step * 4}s cubic-bezier(.6,0,.2,1) infinite}@keyframes chain{0%{transform:none}${moves}}
.mv{animation:mv ${step}s cubic-bezier(.6,0,.2,1) infinite}@keyframes mv{0%,80%{transform:none}100%{transform:translateX(-${dist}px)}}
.fill{animation:fill ${step}s steps(6) infinite both}@keyframes fill{0%,6%{opacity:0}60%,100%{opacity:1}}
.lk{animation:lk ${step}s linear infinite both}@keyframes lk{0%,60%{opacity:0}66%,100%{opacity:1}}
.seal{animation:seal ${step}s linear infinite both}@keyframes seal{0%,60%{opacity:0}63%,76%{opacity:1}80%,100%{opacity:0}}
.ring{transform-box:fill-box;transform-origin:center;opacity:0;animation:ring ${step}s ease-out infinite both}@keyframes ring{0%,60%{transform:scale(.7);opacity:0}62%{opacity:1}80%,100%{transform:scale(1.7);opacity:0}}
.glow{animation:glow 3.2s ease-in-out infinite alternate}@keyframes glow{from{opacity:.5}to{opacity:1}}`,
    defs:
      `<clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>` +
      `<clipPath id="sealed"><rect x="-200" y="0" width="${S - 76 + 200}" height="${H}"/></clipPath>` +
      `<clipPath id="joined"><rect x="-200" y="0" width="${S - dist + a + 1 + 200}" height="${H}"/></clipPath>` +
      `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}"/><stop offset="1" stop-color="#2F1642"/></linearGradient>` +
      `<radialGradient id="halo"><stop offset="0" stop-color="${C.ember}" stop-opacity=".34"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>`,
    body:
      `<g clip-path="url(#frame)"><rect width="${W}" height="${H}" fill="url(#sky)"/>` +
      `<ellipse class="glow calm" cx="${S}" cy="${midY}" rx="280" ry="170" fill="url(#halo)"/>` +
      text('BLOCKCHAIN', { font: F.pixel, size: 34, x: 36, y: 66, fill: C.sand }) +
      text('Solana and EVM smart contracts.', { font: F.medium, size: 29, x: 36, y: 110, fill: C.mist }) +
      text('mempool', { font: F.mono, size: 22, x: S + 60, y: 48, anchor: 'middle', fill: C.haze }) +
      cube(S, top, a, h, { wire: true }) +
      `<g clip-path="url(#joined)"><g class="chain">${links}</g></g>` +
      `<g clip-path="url(#sealed)"><g class="chain">${row}</g></g>` +
      `<g class="mv">` +
      `<g class="fill calm">${cube(S, top, a, h)}</g>` +
      `<g class="lk calm">${link(S - dist)}</g>` +
      guess +
      settled +
      `</g>` +
      `<polygon class="ring motion-only" points="${S},${top} ${S + a},${top + a / 2} ${S},${top + a} ${S - a},${top + a / 2}" fill="none" stroke="${C.sand}" stroke-width="3"/>` +
      `<g class="seal calm" opacity="0">${text('SEALED', { font: F.pixel, size: 18, x: S, y: top - 16, anchor: 'middle', fill: C.sand })}</g>` +
      txs +
      `</g>`,
  });
}
