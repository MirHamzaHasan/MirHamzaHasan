// Builds the hand-drawn SVGs: hero, profile card, focus panels, stack, buttons, CTA.
// Run once after changing copy. The activity skyline has its own script.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, F, glyphPath, ground, layout, n, outline, skyGradient, svg, text, widthOf, wrap } from './lib.mjs';

const pct = (v) => `${n(v)}%`;

/* ---------- Hero: one line through games, markets and AI ---------- */
function hero() {
  const W = 1200;
  const H = 590;
  const dur = 15;
  const start = 1.3; // the loop waits for the name to land
  const travelFrom = 3;
  const travelTo = 66;

  // The runner's path, as points with a spin value for the jumps.
  const pts = [{ x: 56, y: 450, r: 0 }];
  let spin = 0;
  const runTo = (x, y) => pts.push({ x, y, r: spin });
  const jumpTo = (x2, y2, apex) => {
    const { x: x1, y: y1 } = pts[pts.length - 1];
    const cy = 2 * apex - (y1 + y2) / 2;
    for (let i = 1; i <= 14; i++) {
      const t = i / 14;
      pts.push({
        x: x1 + (x2 - x1) * t,
        y: (1 - t) ** 2 * y1 + 2 * t * (1 - t) * cy + t ** 2 * y2,
        r: spin + t * 180,
      });
    }
    spin += 180;
  };

  runTo(170, 450);
  jumpTo(232, 408, 352);
  runTo(322, 408);
  jumpTo(386, 450, 362);
  runTo(470, 450);

  const closes = [434, 446, 412, 392, 416, 374, 352, 372, 338, 318, 338, 306, 296];
  const candleX = closes.map((_, i) => 490 + i * 28);
  closes.forEach((y, i) => runTo(candleX[i], y));
  const input = { x: 884, y: 300 };
  runTo(input.x, input.y);

  let length = 0;
  pts.forEach((p, i) => {
    if (i) length += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    p.l = length;
  });
  const toPct = (l) => travelFrom + (travelTo - travelFrom) * (l / length);
  const pctAtX = (x) => toPct(pts.find((p) => p.x >= x).l);
  const d = 'M' + pts.map((p) => `${n(p.x)} ${n(p.y)}`).join('L');

  let css = '';
  let id = 0;
  // A tiny per-element keyframe: dark until the runner arrives, then on.
  const switchOn = (at, from = 'opacity:0', to = 'opacity:1', rise = 1.6) => {
    const name = `k${id++}`;
    css += `@keyframes ${name}{0%,${pct(at)}{${from}}${pct(at + rise)},100%{${to}}}`;
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
      lit += `<rect style="${switchOn(at)}" x="${col}" y="${y}" width="${w}" height="5" fill="${C.sand}"/>`;
    }
  }

  // Coins hang at the top of each jump and vanish when collected.
  for (const [x, y] of [[201, 344], [354, 356], [430, 416]]) {
    const at = pctAtX(x);
    const name = `k${id++}`;
    css += `@keyframes ${name}{0%,${pct(at)}{transform:scale(1);opacity:1}${pct(at + 1.2)}{transform:scale(2);opacity:0}100%{transform:scale(2);opacity:0}}`;
    ghost += `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${C.dusk}" stroke-width="2"/>`;
    lit += `<g class="motion-only" style="animation:${name} ${dur}s linear ${start}s infinite both;transform-box:fill-box;transform-origin:center"><circle cx="${x}" cy="${y}" r="9" fill="${C.sand}"/><rect x="${x - 2}" y="${y - 5}" width="4" height="10" rx="1" fill="${C.amber}"/></g>`;
  }

  // Candles grow as the price line reaches them.
  closes.forEach((close, i) => {
    const open = i ? closes[i - 1] : 450;
    const x = candleX[i];
    const up = close < open;
    const top = Math.min(open, close);
    const h = Math.max(Math.abs(open - close), 4);
    const color = up ? C.sand : C.ember;
    const wick = `<rect x="${x - 1}" y="${top - 12}" width="2" height="${h + 24}"`;
    const body = `<rect x="${x - 8}" y="${top}" width="16" height="${h}" rx="2"`;
    ghost += `${wick} fill="${C.dusk}"/>${body} fill="${C.dusk}"/>`;
    lit += `<g style="${switchOn(pctAtX(x))}">${wick} fill="${color}"/>${body} fill="${color}"/></g>`;
  });

  // The network fires layer by layer after the runner is absorbed.
  const layers = [
    [input],
    [{ x: 974, y: 300 }, { x: 974, y: 385 }, { x: 974, y: 470 }],
    [{ x: 1062, y: 300 }, { x: 1062, y: 385 }, { x: 1062, y: 470 }],
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
          lit += `<path style="${style}" d="${edge}" pathLength="1" stroke-dasharray="1 1" fill="none" stroke="url(#heatLine)" stroke-width="2.5"/>`;
        }
      }
    }
    const last = li === layers.length - 1;
    for (const p of layer) {
      const r = last ? 17 : 11;
      ghost += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${C.night}" stroke="${C.dusk}" stroke-width="2"/>`;
      lit += `<circle style="${switchOn(fireAt[li] + (li ? 4 : 0), 'opacity:0', 'opacity:1', 1)}" cx="${p.x}" cy="${p.y}" r="${r}" fill="${last ? C.ember : C.amber}"/>`;
    }
  });
  const out = layers[3][0];
  const ringAt = fireAt[3] + 4;
  css += `@keyframes ring{0%,${pct(ringAt)}{transform:scale(.6);opacity:0}${pct(ringAt + 1)}{opacity:.9}${pct(ringAt + 12)},100%{transform:scale(3);opacity:0}}`;
  lit += `<circle class="motion-only" style="animation:ring ${dur}s ease-out ${start}s infinite both;transform-box:fill-box;transform-origin:center" cx="${out.x}" cy="${out.y}" r="18" fill="none" stroke="${C.sand}" stroke-width="2.5"/>`;

  // Travel keyframes: runner, the bright line, and the band of heat in the name.
  const frames = (fn) => pts.map((p) => `${pct(toPct(p.l))}{${fn(p)}}`).join('');
  const hold = (first, last) => `0%{${first}}${pct(travelTo)},100%{${last}}`;
  const end = pts[pts.length - 1];
  css += `@keyframes line{${hold('stroke-dashoffset:1', 'stroke-dashoffset:0')}${pct(travelFrom)}{stroke-dashoffset:1}}`;
  const runner = (p) => `transform:translate(${n(p.x)}px,${n(p.y)}px) rotate(${n(p.r)}deg)`;
  css += `@keyframes runner{0%{${runner(pts[0])};opacity:0}${frames((p) => `${runner(p)};opacity:1`)}${pct(travelTo + 0.4)},100%{${runner(end)};opacity:0}}`;
  css += `@keyframes heat{0%{transform:translateX(-340px)}${frames((p) => `transform:translateX(${n(p.x - 170)}px)`)}${pct(travelTo + 8)},100%{transform:translateX(1240px)}}`;
  css += `@keyframes world{0%,92%{opacity:1}99%,100%{opacity:0}}`;
  css += `@keyframes land{from{transform:translateY(46px);opacity:0}to{transform:none;opacity:1}}`;
  css += `@keyframes fade{from{opacity:0}to{opacity:1}}`;
  css += `.lit{animation:world ${dur}s linear ${start}s infinite both}`;
  css += `.line{animation:line ${dur}s linear ${start}s infinite both}`;
  css += `.runner{opacity:0;animation:runner ${dur}s linear ${start}s infinite both}`;
  css += `.band{opacity:1;animation:heat ${dur}s linear ${start}s infinite both}`;
  css += `.tag{animation:fade 1s ease-out .75s both}`;
  css += `.ltr{animation:land .75s cubic-bezier(.16,1,.3,1) both}`;

  // The name fills the width, letter by letter.
  const label = 'MIR HAMZA HASAN';
  const size = 1088 / (widthOf(label, F.display, 100) / 100);
  const baseline = 186;
  const set = layout(label, F.display, size);
  let letters = '';
  let i = 0;
  for (const { g, x, char } of set.glyphs) {
    if (char === ' ') continue;
    const path = glyphPath(g, 56 + x, baseline, size);
    letters += `<path class="ltr" style="animation-delay:${n(i * 0.045)}s" fill="${C.mist}" d="${path}"/>`;
    i++;
  }
  const nameD = outline(label, { font: F.display, size, x: 56, y: baseline });

  const zone = (str, x, at) =>
    text(str, { font: F.medium, size: 30, x, y: 552, fill: C.haze }) +
    `<g class="lit"><g style="${switchOn(at)}">${text(str, { font: F.medium, size: 30, x, y: 552, fill: C.sand })}</g></g>`;

  const defs =
    skyGradient('sky', '#3C1A44') +
    `<radialGradient id="dusk"><stop offset="0" stop-color="${C.ember}" stop-opacity=".22"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="halo"><stop offset="0" stop-color="${C.amber}" stop-opacity=".75"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="heatLine" gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="1144" y2="0"><stop offset="0" stop-color="${C.ember}"/><stop offset=".55" stop-color="${C.amber}"/><stop offset="1" stop-color="${C.sand}"/></linearGradient>` +
    `<linearGradient id="heatBand"><stop offset="0" stop-color="${C.ember}" stop-opacity="0"/><stop offset=".3" stop-color="${C.ember}"/><stop offset=".5" stop-color="${C.sand}"/><stop offset=".7" stop-color="${C.amber}"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="nameClip"><path d="${nameD}"/></clipPath>` +
    `<clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>`;

  svg('hero', {
    w: W,
    h: H,
    title:
      'Mir Hamza Hasan. I build AI-powered products that feel alive. A single animated line jumps across game platforms, climbs a market chart and fires an AI network.',
    css,
    defs,
    body:
      ground(W, H) +
      `<g clip-path="url(#frame)"><ellipse cx="${W / 2}" cy="${H}" rx="${W * 0.7}" ry="260" fill="url(#dusk)"/>` +
      letters +
      `<g class="motion-only" clip-path="url(#nameClip)"><rect class="band" x="0" y="0" width="340" height="220" fill="url(#heatBand)"/></g>` +
      text('I build AI-powered products that feel alive.', {
        font: F.body,
        size: 37,
        x: 58,
        y: 244,
        cls: 'tag',
        fill: C.mist,
      }) +
      ghost +
      `<path d="${d}" fill="none" stroke="${C.dusk}" stroke-width="3" stroke-linejoin="round"/>` +
      `<g class="lit">${lit}<path class="line" d="${d}" pathLength="1" stroke-dasharray="1 1" fill="none" stroke="url(#heatLine)" stroke-width="4" stroke-linejoin="round"/></g>` +
      `<g class="runner motion-only"><circle r="30" fill="url(#halo)"/><rect x="-9" y="-9" width="18" height="18" rx="3" fill="${C.mist}"/></g>` +
      zone('Games', 56, pctAtX(60)) +
      zone('Markets', 490, pctAtX(490)) +
      zone('AI systems', 884, travelTo) +
      `</g>`,
  });
}

/* ---------- Player card ---------- */
function profile() {
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
  const H = top + rows.length * rowH - 14;
  let body = '';
  rows.forEach(([key, value], i) => {
    const y = top + i * rowH;
    if (i) body += `<rect x="40" y="${y - 44}" width="${W - 80}" height="2" fill="${C.dusk}" opacity=".6"/>`;
    body += text(key, { font: F.body, size: 28, x: 40, y, fill: C.haze });
    body += text(value, { font: F.medium, size: 30, x: 170, y, fill: C.mist });
  });

  // The energy meter never settles, like the row it sits next to.
  let meter = '';
  for (let i = 0; i < 7; i++) {
    meter += `<rect class="m" style="animation-delay:${n(-i * 0.37)}s;animation-duration:${n(0.9 + ((i * 7) % 5) * 0.17)}s" x="${W - 40 - (7 - i) * 11}" y="${top + 5 * rowH - 26}" width="7" height="28" rx="1" fill="${i > 4 ? C.ember : i > 2 ? C.amber : C.sand}"/>`;
  }

  // Clear space under the card keeps the text off it when it stacks on phones.
  svg('profile', {
    w: W,
    h: H + 32,
    title:
      'Player profile. Name: Mir Hamza Hasan. Base: Dubai, UAE. Class: builder and engineer. Mode: ship fast, learn faster. Focus: AI, games and Web3. Energy: happy game-dev chaos.',
    css: `.m{transform-box:fill-box;transform-origin:50% 100%;animation:m 1s ease-in-out infinite alternate}@keyframes m{from{transform:scaleY(.25)}to{transform:scaleY(1)}}.s{animation:s 6s ease-in-out infinite}@keyframes s{0%{transform:translateX(-260px)}45%,100%{transform:translateX(${W + 260}px)}}`,
    defs:
      skyGradient('sky') +
      `<linearGradient id="sheen"><stop offset="0" stop-color="${C.ember}" stop-opacity="0"/><stop offset=".5" stop-color="${C.sand}"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>`,
    body:
      ground(W, H) +
      `<g clip-path="url(#frame)">` +
      text('Player profile', { font: F.display, size: 54, x: 40, y: 76, fill: C.sand }) +
      `<rect class="s motion-only" x="0" y="0" width="240" height="4" fill="url(#sheen)"/>` +
      body +
      meter +
      `</g>`,
  });
}

/* ---------- Four panels, each a small machine that runs ---------- */
function focus() {
  const W = 1200;
  const gap = 20;
  const pw = (W - gap) / 2;
  const ph = 400;
  const H = ph * 2 + gap;
  const artH = 236;
  let defs = skyGradient('sky') + `<clipPath id="art"><rect width="${pw}" height="${artH}"/></clipPath>`;
  defs += `<linearGradient id="edgeL"><stop offset="0" stop-color="#1B0F2C"/><stop offset="1" stop-color="#1B0F2C" stop-opacity="0"/></linearGradient><linearGradient id="edgeR"><stop offset="0" stop-color="#1B0F2C" stop-opacity="0"/><stop offset="1" stop-color="#1B0F2C"/></linearGradient>`;

  // AI tools: an agent sends work out to its tools and each one lights on arrival.
  const agent = () => {
    const cx = pw / 2;
    const cy = 124;
    const sats = [[-205, -42], [-120, 74], [0, -88], [120, 74], [205, -42], [0, 92]].slice(0, 5);
    let o = '';
    const cycle = 7.5;
    sats.forEach(([dx, dy], i) => {
      const delay = n(i * (cycle / sats.length));
      o += `<line x1="${cx}" y1="${cy}" x2="${cx + dx}" y2="${cy + dy}" stroke="${C.dusk}" stroke-width="2"/>`;
      o += `<circle cx="${cx + dx}" cy="${cy + dy}" r="17" fill="${C.plum}" stroke="${C.dusk}" stroke-width="2"/>`;
      o += `<circle class="aiOn" style="animation-delay:${delay}s" cx="${cx + dx}" cy="${cy + dy}" r="17" fill="${C.amber}"/>`;
      o += `<circle class="aiP motion-only" style="animation-delay:${delay}s;--x:${dx}px;--y:${dy}px" cx="${cx}" cy="${cy}" r="6" fill="${C.sand}"/>`;
    });
    o += `<circle class="aiHub" cx="${cx}" cy="${cy}" r="30" fill="${C.ember}"/>`;
    o += `<path fill="${C.mist}" d="M${cx} ${cy - 15}l4 11 11 4-11 4-4 11-4-11-11-4 11-4z"/>`;
    return o;
  };

  // Game tech: procedural terrain rebuilding itself in whole tiles.
  const terrain = () => {
    defs += `<pattern id="tile" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${C.dusk}"/></pattern>`;
    let o = '';
    const cols = Math.ceil(pw / 24);
    for (let i = 0; i < cols; i++) {
      const a = Math.round(2.6 + 1.9 * Math.sin(i * 0.55) + Math.sin(i * 1.7));
      const b = Math.round(2.6 + 1.9 * Math.sin(i * 0.3 + 2) + Math.sin(i * 1.1 + 1));
      o += `<g class="col" style="--a:${a * 24}px;--b:${b * 24}px;transform:translateY(${a * 24}px);animation-delay:${n(i * 0.05)}s"><rect x="${i * 24}" y="80" width="22" height="22" fill="${C.sand}"/><rect x="${i * 24}" y="104" width="24" height="240" fill="url(#tile)"/></g>`;
    }
    return o;
  };

  // Trading: a live tape of candles that loops without a seam.
  const tape = () => {
    const step = 30;
    const count = 20;
    const period = step * count;
    const price = (i) =>
      122 - 46 * Math.sin((i / count) * Math.PI * 2) - 24 * Math.sin((i / count) * Math.PI * 6 + 1);
    let candles = '';
    let line = '';
    for (let i = 0; i < count * 2 + 1; i++) {
      const open = price(i - 1);
      const close = price(i);
      const up = close < open;
      const x = i * step;
      const top = Math.min(open, close);
      const h = Math.max(Math.abs(close - open), 4);
      const color = up ? C.sand : C.ember;
      candles += `<rect x="${x - 1}" y="${n(top - 11)}" width="2" height="${n(h + 22)}" fill="${color}"/><rect x="${x - 8}" y="${n(top)}" width="16" height="${n(h)}" rx="2" fill="${color}"/>`;
      line += `${i ? 'L' : 'M'}${x} ${n(close)}`;
    }
    return (
      `<g class="tape" style="--p:-${period}px"><path d="${line}" fill="none" stroke="${C.amber}" stroke-width="2.5" opacity=".55"/>${candles}</g>` +
      `<rect width="70" height="${artH}" fill="url(#edgeL)"/><rect x="${pw - 70}" width="70" height="${artH}" fill="url(#edgeR)"/>`
    );
  };

  // Backend: jobs leave a queue, pass through workers and land in a database.
  const pipeline = () => {
    const lanes = [58, 118, 178];
    const from = 118;
    const to = 472;
    let o = '';
    lanes.forEach((y, i) => {
      o += `<rect x="${from}" y="${y - 1}" width="${to - from}" height="2" fill="${C.dusk}"/>`;
      for (let j = 0; j < 3; j++) {
        const delay = n(j * 1.6 + i * 0.53);
        o += `<rect class="job motion-only" style="animation-delay:${delay}s" x="${from - 7}" y="${y - 7}" width="14" height="14" rx="3"/>`;
      }
      o += `<rect x="256" y="${y - 22}" width="78" height="44" rx="8" fill="${C.plum}" stroke="${C.dusk}" stroke-width="2"/>`;
      o += `<rect class="wk" style="animation-delay:${n(i * 0.53)}s" x="256" y="${y - 22}" width="78" height="44" rx="8" fill="${C.ember}"/>`;
    });
    for (let i = 0; i < 4; i++) {
      o += `<rect x="58" y="${48 + i * 36}" width="60" height="28" rx="5" fill="${i ? C.dusk : C.amber}"/>`;
    }
    o += `<path d="M472 56a42 15 0 0 1 84 0v124a42 15 0 0 1-84 0z" fill="${C.plum}" stroke="${C.dusk}" stroke-width="2"/><ellipse cx="514" cy="56" rx="42" ry="15" fill="${C.sand}"/><path d="M472 98a42 15 0 0 0 84 0M472 140a42 15 0 0 0 84 0" fill="none" stroke="${C.dusk}" stroke-width="2"/>`;
    return o;
  };

  const panels = [
    ['AI tools', 'Developer tools, agents, automation, prompt systems.', agent],
    ['Game tech', 'Unity tools, procedural systems, mobile games.', terrain],
    ['Trading systems', 'Realtime data, signals, automation, dashboards.', tape],
    ['Backend infra', 'APIs, workers, queues, databases, cloud systems.', pipeline],
  ];
  let body = '';
  panels.forEach(([title, copy, art], i) => {
    const x = (i % 2) * (pw + gap);
    const y = Math.floor(i / 2) * (ph + gap);
    defs += `<clipPath id="p${i}"><rect width="${pw}" height="${ph}" rx="24"/></clipPath>`;
    body += `<g transform="translate(${x} ${y})"><g clip-path="url(#p${i})"><rect width="${pw}" height="${ph}" fill="#1B0F2C"/><g clip-path="url(#art)">${art()}</g><rect y="${artH}" width="${pw}" height="${ph - artH}" fill="${C.plum}"/>`;
    body += text(title, { font: F.display, size: 54, x: 36, y: artH + 64, fill: C.sand });
    wrap(copy, F.body, 29, pw - 72).forEach((line, li) => {
      body += text(line, { font: F.body, size: 29, x: 36, y: artH + 106 + li * 36, fill: C.mist });
    });
    body += `</g></g>`;
  });

  svg('focus', {
    w: W,
    h: H,
    title:
      'What I am building. AI tools: developer tools, agents, automation, prompt systems. Game tech: Unity tools, procedural systems, mobile games. Trading systems: realtime data, signals, automation, dashboards. Backend infra: APIs, workers, queues, databases, cloud systems.',
    css: `.aiP{opacity:0;animation:aiP 7.5s ease-in-out infinite both}@keyframes aiP{0%{transform:none;opacity:1}12%{transform:translate(var(--x),var(--y));opacity:1}13%,100%{transform:translate(var(--x),var(--y));opacity:0}}
.aiOn{animation:aiOn 7.5s linear infinite both}@keyframes aiOn{0%,11%{opacity:.12}14%,30%{opacity:1}55%,100%{opacity:.12}}
.aiHub{transform-box:fill-box;transform-origin:center;animation:aiHub 1.5s ease-in-out infinite alternate}@keyframes aiHub{from{transform:scale(.94)}to{transform:scale(1.06)}}
.col{animation:terrain 7s steps(1) infinite both}@keyframes terrain{0%,100%{transform:translateY(var(--a))}50%{transform:translateY(var(--b))}}
.tape{animation:tape 16s linear infinite}@keyframes tape{to{transform:translateX(var(--p))}}
.job{opacity:0;animation:job 4.8s linear infinite both}@keyframes job{0%{transform:none;fill:${C.amber};opacity:0}4%{opacity:1}42%{fill:${C.amber}}50%{fill:${C.sand}}96%{opacity:1}100%{transform:translateX(354px);fill:${C.sand};opacity:0}}
.wk{opacity:.12;animation:wk 1.6s ease-in-out infinite both}@keyframes wk{0%,100%{opacity:.12}45%{opacity:.8}}`,
    defs,
    body,
  });
}

/* ---------- Stack: real icons with a wave passing over them ---------- */
async function skillIcon(icon) {
  const res = await fetch(`https://skillicons.dev/icons?i=${icon}`);
  const raw = await res.text();
  if (!res.ok || raw.includes('undefined')) throw new Error(`no skill icon for ${icon}`);
  return raw;
}

// skillicons has no Expo icon, so this draws one on the same dark plate.
function expoIcon() {
  const file = join(dirname(fileURLToPath(import.meta.url)), '../node_modules/simple-icons/icons/expo.svg');
  const d = readFileSync(file, 'utf8').match(/ d="([^"]+)"/)[1];
  return `<svg viewBox="0 0 256 256"><rect width="256" height="256" rx="60" fill="#242938"/><g transform="translate(48 48) scale(6.667)"><path fill="#fff" d="${d}"/></g></svg>`;
}

async function stack() {
  const rows = [
    ['Languages', ['rust', 'ts', 'js', 'python', 'cs', 'solidity']],
    ['Frontend, mobile\nand apps', ['react', 'nextjs', 'redux', 'electron', 'tauri', 'expo', 'vite']],
    ['Backend, data\nand infra', ['nodejs', 'fastapi', 'redis', 'postgres', 'mongodb', 'mysql', 'docker', 'kubernetes', 'nginx']],
    ['Cloud, tools\nand game dev', ['aws', 'gcp', 'cloudflare', 'firebase', 'vercel', 'githubactions', 'unity', 'blender']],
  ];
  const W = 1200;
  const pad = 40;
  const labelW = 250;
  const size = 86;
  const step = 98;
  const rowH = 122;
  const H = pad * 2 + rows.length * rowH - (rowH - size);

  let body = ground(W, H);
  let defs = skyGradient('sky');
  for (const [ri, [label, icons]] of rows.entries()) {
    const y = pad + ri * rowH;
    const lines = label.split('\n');
    lines.forEach((line, li) => {
      const baseY = y + size / 2 + 10 + (li - (lines.length - 1) / 2) * 34;
      body += text(line, { font: F.medium, size: 28, x: pad, y: baseY, fill: C.mist });
    });
    for (const [ci, icon] of icons.entries()) {
      const raw = icon === 'expo' ? expoIcon() : await skillIcon(icon);
      // Each icon gets its own id namespace so gradients don't collide.
      const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      const scoped = inner
        .replace(/\bid="([^"]+)"/g, `id="${icon}-$1"`)
        .replace(/url\(#([^)]+)\)/g, `url(#${icon}-$1)`)
        .replace(/(xlink:)?href="#([^"]+)"/g, `href="#${icon}-$2"`);
      const box = raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 256 256';
      const x = pad + labelW + ci * step;
      body += `<g class="i" style="animation-delay:${n((ci + ri * 1.5) * 0.09)}s"><svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${box}">${scoped}</svg></g>`;
    }
  }

  svg('stack', {
    w: W,
    h: H,
    title: `My stack. ${rows.map(([label, icons]) => `${label.replace('\n', ' ')}: ${icons.join(', ')}`).join('. ')}.`,
    css: `.i{animation:i 8s cubic-bezier(.3,0,.2,1) infinite}@keyframes i{0%,9%,100%{transform:none}4%{transform:translateY(-10px)}}`,
    defs,
    body,
  });
}

/* ---------- Link buttons ---------- */
function buttons() {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '../node_modules/simple-icons');
  const brand = (name) =>
    readFileSync(join(dir, 'icons', `${name}.svg`), 'utf8').match(/ d="([^"]+)"/)[1];
  const globe = `<g fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4.4" ry="10"/><path d="M2 12h20"/></g>`;
  const mail = `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2" y="4.5" width="20" height="15" rx="2.5"/><path d="M3 7l9 6.5L21 7"/></g>`;
  const linkedin = `<path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`;
  const glyph = (name) => `<path fill="currentColor" d="${brand(name)}"/>`;

  const items = [
    ['book-a-call', 'Book a call', glyph('calendly'), true],
    ['website', 'Website', globe],
    ['linkedin', 'LinkedIn', linkedin],
    ['x', 'X', glyph('x')],
    ['email', 'Email', mail],
  ];
  items.forEach(([file, label, icon, primary], i) => {
    const h = 60;
    const tw = widthOf(label, F.medium, 25);
    const w = Math.ceil(tw + 86);
    const fg = primary ? C.night : C.mist;
    svg(`btn-${file}`, {
      w,
      h,
      title: label,
      css: `.s{animation:s 7s ease-in-out ${n(i * 0.3)}s infinite}@keyframes s{0%{transform:translateX(-90px)}18%,100%{transform:translateX(${w + 30}px)}}`,
      defs:
        `<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${C.ember}"/><stop offset="1" stop-color="${C.amber}"/></linearGradient>` +
        `<linearGradient id="sheen"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${primary ? 0.55 : 0.2}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
        `<clipPath id="c"><rect width="${w}" height="${h}" rx="14"/></clipPath>`,
      body:
        `<rect width="${w}" height="${h}" rx="14" fill="${primary ? 'url(#g)' : C.plum}"/>` +
        `<g clip-path="url(#c)"><rect class="s motion-only" x="0" y="0" width="70" height="${h}" fill="url(#sheen)"/></g>` +
        `<g transform="translate(22 18)" color="${fg}"><svg width="24" height="24" viewBox="0 0 24 24">${icon}</svg></g>` +
        text(label, { font: F.medium, size: 25, x: 60, y: 39, fill: fg }),
    });
  });
}

/* ---------- Closing call to action ---------- */
function cta() {
  const W = 1200;
  const H = 356;
  const lines = wrap('Open to AI, backend, Web3, game tech and automation projects.', F.display, 76, 1020);
  let head = '';
  lines.forEach((line, i) => {
    head += text(line, { font: F.display, size: 76, x: 56, y: 96 + i * 76, fill: C.mist });
  });
  const lineY = 288;
  const label = 'Book an intro call';
  const btnW = Math.ceil(widthOf(label, F.medium, 29)) + 64;
  const btnX = W - 56 - btnW;
  const copy = "Let's build something fun, useful, and scalable.";

  svg('cta', {
    w: W,
    h: H,
    title: `Open to AI, backend, Web3, game tech and automation projects. ${copy} Book an intro call.`,
    css: `.l{animation:l 6s cubic-bezier(.5,0,.3,1) infinite both}@keyframes l{0%{stroke-dashoffset:1}55%,100%{stroke-dashoffset:0}}
.r{opacity:0;animation:r 6s cubic-bezier(.5,0,.3,1) infinite both}@keyframes r{0%{transform:translateX(56px);opacity:1}55%{transform:translateX(${btnX}px);opacity:1}57%,100%{transform:translateX(${btnX}px);opacity:0}}
.pop{transform-box:fill-box;transform-origin:center;animation:p 6s ease-out infinite both}@keyframes p{0%,54%{transform:none}60%{transform:scale(1.05)}68%,100%{transform:none}}`,
    defs:
      skyGradient('sky', '#401A42') +
      `<linearGradient id="h" gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="${btnX}" y2="0"><stop offset="0" stop-color="${C.ember}"/><stop offset="1" stop-color="${C.amber}"/></linearGradient>` +
      `<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${C.ember}"/><stop offset="1" stop-color="${C.amber}"/></linearGradient>`,
    body:
      ground(W, H) +
      head +
      text(copy, { font: F.body, size: 29, x: 56, y: 96 + lines.length * 76 - 18, fill: C.haze }) +
      `<path d="M56 ${lineY}H${btnX}" stroke="${C.dusk}" stroke-width="3"/>` +
      `<path class="l" d="M56 ${lineY}H${btnX}" pathLength="1" stroke-dasharray="1 1" stroke="url(#h)" stroke-width="4"/>` +
      `<g class="r motion-only"><rect x="-8" y="${lineY - 8}" width="16" height="16" rx="3" fill="${C.mist}"/></g>` +
      `<g class="pop"><rect x="${btnX}" y="${lineY - 34}" width="${btnW}" height="68" rx="16" fill="url(#g)"/>` +
      text(label, { font: F.medium, size: 29, x: btnX + btnW / 2, y: lineY + 10, anchor: 'middle', fill: C.night }) +
      `</g>`,
  });
}

hero();
profile();
focus();
await stack();
buttons();
cta();
