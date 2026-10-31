// Draws the last year of contributions as a skyline at dusk: one tower per week.
// Runs daily in .github/workflows/activity.yml. Needs GITHUB_TOKEN or GH_TOKEN.
import { execSync } from 'node:child_process';
import { C, F, ground, n, skyGradient, svg, text } from './lib.mjs';

const login = 'MirHamzaHasan';
const token =
  process.env.GITHUB_TOKEN || process.env.GH_TOKEN || execSync('gh auth token').toString().trim();

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': login },
  body: JSON.stringify({
    query: `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
      totalContributions weeks{firstDay contributionDays{date contributionCount}}}}}}`,
    variables: { login },
  }),
});
const json = await res.json();
const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar) throw new Error(`GitHub returned no calendar: ${JSON.stringify(json)}`);

const weeks = calendar.weeks.map((w) => ({
  first: w.firstDay,
  total: w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0),
}));
const days = calendar.weeks.flatMap((w) => w.contributionDays);
const busiest = Math.max(...weeks.map((w) => w.total));

let longest = 0;
let run = 0;
for (const d of days) {
  run = d.contributionCount ? run + 1 : 0;
  longest = Math.max(longest, run);
}

// Height uses a square root so one huge week doesn't flatten the rest of the year.
const W = 1200;
const H = 480;
const horizon = 392;
const left = 56;
const span = W - left * 2;
const step = span / weeks.length;
const barW = n(step * 0.76);
const dur = 18;

const heightOf = (v) => (v === 0 ? 4 : 10 + Math.sqrt(v / busiest) * 238);

let towers = '';
let water = '';
let css = '';
weeks.forEach((w, i) => {
  const h = n(heightOf(w.total));
  const x = n(left + i * step);
  const delay = n(i * 0.03);
  const style = `style="animation-delay:${delay}s"`;
  towers += `<rect class="t" ${style} x="${x}" y="${n(horizon - h)}" width="${barW}" height="${h}" fill="url(#tower)"/>`;
  water += `<rect class="r" ${style} x="${x}" y="${horizon + 2}" width="${barW}" height="${n(Math.min(h * 0.26, 48))}" fill="url(#water)"/>`;
});

// Aviation beacons blink on the tallest tower and on the current week.
const peak = weeks.findIndex((w) => w.total === busiest);
const beacon = (i, delay) => {
  const cx = n(left + i * step + barW / 2);
  const cy = n(horizon - heightOf(weeks[i].total) - 9);
  return `<g class="top" style="animation-delay:${n(i * 0.03)}s"><circle class="b motion-only" style="animation-delay:${delay}s" cx="${cx}" cy="${cy}" r="11" fill="url(#beacon)"/><circle cx="${cx}" cy="${cy}" r="3" fill="${C.sand}"/></g>`;
};

let months = '';
let lastMonth = -1;
weeks.forEach((w, i) => {
  const date = new Date(`${w.first}T00:00:00Z`);
  const month = date.getUTCMonth();
  if (month !== lastMonth && date.getUTCDate() <= 7 && i < weeks.length - 1) {
    months += text(date.toLocaleString('en', { month: 'short', timeZone: 'UTC' }), {
      font: F.body,
      size: 22,
      x: left + i * step,
      y: H - 22,
      fill: C.haze,
    });
    lastMonth = month;
  }
});

const stats = [
  [calendar.totalContributions.toLocaleString('en'), 'contributions in a year'],
  [String(busiest), 'in the busiest week'],
  [String(longest), 'day longest streak'],
];
let statsSvg = '';
stats.forEach(([value, label], i) => {
  const x = left + i * 300;
  statsSvg += text(value, { font: F.display, size: 62, x, y: 92, fill: C.sand });
  statsSvg += text(label, { font: F.body, size: 23, x, y: 124, fill: C.haze });
});

css += `.t,.r{transform-box:fill-box;animation:rise ${dur}s cubic-bezier(.2,.8,.2,1) infinite both}
.t{transform-origin:50% 100%}.r{transform-origin:50% 0}
@keyframes rise{0%{transform:scaleY(0)}9%,90%{transform:scaleY(1)}100%{transform:scaleY(0)}}
.top{animation:top ${dur}s linear infinite both}
@keyframes top{0%,7%{opacity:0}9%,89%{opacity:1}90%,100%{opacity:0}}
.b{animation:blink 2.4s steps(1) infinite}
@keyframes blink{0%,100%{opacity:1}45%{opacity:0}}
.g{animation:glow 9s ease-in-out infinite alternate}
@keyframes glow{from{opacity:.65}to{opacity:1}}`;

const defs =
  skyGradient('sky', '#401A42') +
  `<linearGradient id="tower" gradientUnits="userSpaceOnUse" x1="0" y1="${horizon - 248}" x2="0" y2="${horizon}"><stop offset="0" stop-color="${C.sand}"/><stop offset=".4" stop-color="${C.amber}"/><stop offset="1" stop-color="${C.ember}"/></linearGradient>` +
  `<linearGradient id="water" gradientUnits="userSpaceOnUse" x1="0" y1="${horizon}" x2="0" y2="${horizon + 48}"><stop offset="0" stop-color="${C.ember}" stop-opacity=".5"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></linearGradient>` +
  `<radialGradient id="dusk" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C.ember}" stop-opacity=".42"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="beacon"><stop offset="0" stop-color="${C.sand}"/><stop offset=".3" stop-color="${C.ember}" stop-opacity=".7"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>` +
  `<clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>`;

svg('activity', {
  w: W,
  h: H,
  title: `${calendar.totalContributions} GitHub contributions in the last year, drawn as a skyline with one tower per week. The busiest week had ${busiest} contributions and the longest streak was ${longest} days.`,
  css,
  defs,
  body:
    ground(W, H) +
    `<g clip-path="url(#frame)"><ellipse class="g" cx="${W / 2}" cy="${horizon}" rx="${W * 0.72}" ry="170" fill="url(#dusk)"/>` +
    statsSvg +
    towers +
    `<rect x="0" y="${horizon}" width="${W}" height="2" fill="${C.ember}" opacity=".7"/>` +
    water +
    beacon(peak, 0) +
    beacon(weeks.length - 1, 0.8) +
    months +
    `</g>`,
});
