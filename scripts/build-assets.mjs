// Builds the hand-drawn SVGs: scenes, focus panels, stack, buttons, CTA.
// Run once after changing copy. The activity skyline has its own script.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, F, ground, n, skyGradient, svg, text, widthOf, wrap } from './lib.mjs';
import { chain, gameLevel, hero, profile } from './scenes.mjs';
import { SPRITE_CSS, heroRun } from './sprites.mjs';

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
      o += `<circle class="aiOn calm" style="animation-delay:${delay}s" cx="${cx + dx}" cy="${cy + dy}" r="17" fill="${C.amber}"/>`;
      o += `<circle class="aiP motion-only" style="animation-delay:${delay}s;--x:${dx}px;--y:${dy}px" cx="${cx}" cy="${cy}" r="6" fill="${C.sand}"/>`;
    });
    o += `<circle class="aiHub calm" cx="${cx}" cy="${cy}" r="30" fill="${C.ember}"/>`;
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
      o += `<rect class="wk calm" style="animation-delay:${n(i * 0.53)}s" x="256" y="${y - 22}" width="78" height="44" rx="8" fill="${C.ember}"/>`;
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
    css: `${SPRITE_CSS}.l{animation:l 6s cubic-bezier(.5,0,.3,1) infinite both}@keyframes l{0%{stroke-dashoffset:1}55%,100%{stroke-dashoffset:0}}
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
      `<path class="l calm" d="M56 ${lineY}H${btnX}" pathLength="1" stroke-dasharray="1 1" stroke="url(#h)" stroke-width="4"/>` +
      `<g class="r motion-only"><g transform="translate(0 ${lineY})">${heroRun(3)}</g></g>` +
      `<g class="pop"><rect x="${btnX}" y="${lineY - 34}" width="${btnW}" height="68" rx="16" fill="url(#g)"/>` +
      text(label, { font: F.medium, size: 29, x: btnX + btnW / 2, y: lineY + 10, anchor: 'middle', fill: C.night }) +
      `</g>`,
  });
}

hero();
profile();
gameLevel();
chain();
focus();
await stack();
buttons();
cta();
