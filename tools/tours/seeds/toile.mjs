// ~/Developer/crystalprism.io/tools/tours/seeds/toile.mjs
// Seeds a throwaway demo DB for toile with INVENTED rows only, so the signed-in
// home (the cutting table) reads lived-in: three designs whose dolls wear demo
// fabric, six swatches, eight inspiration tiles, and two feedback threads from
// the demo owner so the feedback panel and /feedback are not empty states.
//
// Every image is drawn here as SVG and rasterised by Chromium: no real photo and
// nothing from an inspiration folder, because the result lands on a public site.
// Without R2 env the app serves `/uploads/<key>` from public/uploads, so the
// files go to UPLOADS_DIR (the app's public/uploads) under demo/, each with the
// `<key minus extension>_t.webp` thumbnail lib/thumb.ts#thumbKeyFor expects.
//
//   DATABASE_URL=file:./demo.db UPLOADS_DIR=<app>/public/uploads node seeds/toile.mjs
//
// Writes ONLY to the file: URL in DATABASE_URL and to UPLOADS_DIR/demo.
import { createClient } from '@libsql/client';
import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const uploads = process.env.UPLOADS_DIR;
if (!uploads) throw new Error('UPLOADS_DIR must point at the app\'s public/uploads');
const db = createClient({ url });

// Must equal ADMIN_EMAIL on the server and the session's sub/email in the tour:
// listMyFeedback filters on `user.id || user.email`, and the tour mints sub = this.
const OWNER = 'demo@crystalprism.io';
const now = Date.now();
const day = 86_400_000;
const sec = (ms) => Math.floor(ms / 1000);
// designs.library_version: the value every row in a current toile DB carries.
const LIBRARY_VERSION = 1;

// ---- synthetic artwork --------------------------------------------------------
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const sq = (body) => svg(400, 400, body);

const SWATCH_ART = {
  gingham: sq(`<defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
    <rect width="40" height="40" fill="#fbf4ec"/><rect width="20" height="40" fill="#d8434f" opacity=".55"/>
    <rect width="40" height="20" fill="#d8434f" opacity=".55"/></pattern></defs><rect width="400" height="400" fill="url(#g)"/>`),
  polka: sq(`<defs><pattern id="p" width="50" height="50" patternUnits="userSpaceOnUse">
    <rect width="50" height="50" fill="#1f3460"/><circle cx="12" cy="12" r="6" fill="#f6eedd"/><circle cx="37" cy="37" r="6" fill="#f6eedd"/></pattern></defs>
    <rect width="400" height="400" fill="url(#p)"/>`),
  breton: sq(`<defs><pattern id="s" width="400" height="36" patternUnits="userSpaceOnUse">
    <rect width="400" height="36" fill="#fdfaf3"/><rect y="0" width="400" height="13" fill="#2c5aa0"/></pattern></defs>
    <rect width="400" height="400" fill="url(#s)"/>`),
  roses: sq(`<defs><pattern id="r" width="100" height="100" patternUnits="userSpaceOnUse">
    <rect width="100" height="100" fill="#fbeee6"/>
    ${[[28, 30], [78, 78]].map(([x, y]) => `<g transform="translate(${x} ${y})">
      <path d="M-14 6 q-10 10 -2 18 q6 -6 2 -18z" fill="#6f9c6a"/><path d="M14 4 q14 4 12 16 q-10 -2 -12 -16z" fill="#6f9c6a"/>
      ${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="9" ry="13" cy="-8" fill="#e7899b" transform="rotate(${a})"/>`).join('')}
      <circle r="8" fill="#c94f6d"/><circle r="3.5" fill="#f3c1a8"/></g>`).join('')}</pattern></defs>
    <rect width="400" height="400" fill="url(#r)"/>`),
  ditsy: sq(`<defs><pattern id="d" width="60" height="60" patternUnits="userSpaceOnUse">
    <rect width="60" height="60" fill="#bfe3d0"/>
    ${[[14, 16, '#ffffff'], [44, 42, '#f4c95d']].map(([x, y, c]) => `<g transform="translate(${x} ${y})">
      ${[0, 90, 180, 270].map((a) => `<circle cy="-5" r="4.5" fill="${c}" transform="rotate(${a})"/>`).join('')}
      <circle r="2.5" fill="#e2725b"/></g>`).join('')}</pattern></defs>
    <rect width="400" height="400" fill="url(#d)"/>`),
  plaid: sq(`<defs><pattern id="t" width="80" height="80" patternUnits="userSpaceOnUse">
    <rect width="80" height="80" fill="#e9b03e"/><rect x="30" width="20" height="80" fill="#9c3d2e" opacity=".55"/>
    <rect y="30" width="80" height="20" fill="#9c3d2e" opacity=".55"/><rect x="8" width="3" height="80" fill="#2f4a3a" opacity=".7"/>
    <rect y="8" width="80" height="3" fill="#2f4a3a" opacity=".7"/></pattern></defs>
    <rect width="400" height="400" fill="url(#t)"/>`),
};

const tall = (body) => svg(400, 500, body);
const INSPIRATION_ART = [
  tall(`<defs><linearGradient id="a" x2="0" y2="1"><stop offset="0" stop-color="#f7a072"/><stop offset="1" stop-color="#c65b7c"/></linearGradient></defs>
    <rect width="400" height="500" fill="url(#a)"/><circle cx="200" cy="300" r="110" fill="#ffe3a3"/><rect y="340" width="400" height="160" fill="#5b3a6e" opacity=".8"/>`),
  tall(`<rect width="400" height="500" fill="#f6efe4"/>${[0, 1, 2, 3, 4, 5].map((i) =>
    `<path d="M0 ${80 + i * 70} ${Array.from({ length: 8 }, (_, k) => `q25 -40 50 0`).join(' ')}" fill="none" stroke="${['#e2725b', '#2c5aa0', '#6f9c6a'][i % 3]}" stroke-width="14"/>`).join('')}`),
  tall(`<rect width="400" height="500" fill="#2f4a3a"/>${[0, 1, 2].map((i) =>
    `<path d="M${40 + i * 120} 500 v-${200 + i * 60} a50 50 0 0 1 100 0 v${200 + i * 60}z" fill="${['#e9b03e', '#e7899b', '#bfe3d0'][i]}"/>`).join('')}`),
  tall(`<defs><radialGradient id="b"><stop offset="0" stop-color="#fff2c7"/><stop offset="1" stop-color="#f2a7b8"/></radialGradient></defs>
    <rect width="400" height="500" fill="url(#b)"/>${[150, 115, 80, 45].map((r, i) =>
    `<circle cx="200" cy="250" r="${r}" fill="none" stroke="${['#c94f6d', '#e2725b', '#e9b03e', '#6f9c6a'][i]}" stroke-width="12"/>`).join('')}`),
  tall(`<rect width="400" height="500" fill="#1f3460"/>${Array.from({ length: 40 }, (_, i) =>
    `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 500}" r="${6 + (i % 5) * 3}" fill="${['#f4c95d', '#e7899b', '#bfe3d0', '#ffffff'][i % 4]}"/>`).join('')}`),
  tall(`<rect width="400" height="500" fill="#fbeee6"/><rect x="0" y="0" width="200" height="260" fill="#e2725b"/>
    <rect x="200" y="0" width="200" height="160" fill="#f4c95d"/><rect x="200" y="160" width="200" height="340" fill="#2c5aa0"/>
    <rect x="0" y="260" width="200" height="240" fill="#bfe3d0"/><circle cx="200" cy="260" r="70" fill="#fbeee6"/>`),
  tall(`<rect width="400" height="500" fill="#f6efe4"/><g transform="rotate(12 200 250)">${Array.from({ length: 64 }, (_, i) =>
    (i + Math.floor(i / 8)) % 2 ? `<rect x="${-80 + (i % 8) * 70}" y="${-60 + Math.floor(i / 8) * 80}" width="70" height="80" fill="#6f9c6a"/>` : '').join('')}</g>`),
  tall(`<defs><linearGradient id="c" x1="0" x2="1"><stop offset="0" stop-color="#bfe3d0"/><stop offset="1" stop-color="#2c5aa0"/></linearGradient></defs>
    <rect width="400" height="500" fill="url(#c)"/>${[0, 1, 2, 3, 4].map((i) =>
    `<path d="M0 ${500 - i * 34} ${Array.from({ length: 10 }, () => 'a20 20 0 0 1 40 0').join(' ')} V500 H0z" fill="#fdfaf3" opacity="${0.25 + i * 0.12}"/>`).join('')}`),
];

const SWATCHES = [
  // id, art, name, status, price, amount, fibre, fabric_type, age (days)
  ['demo-sw-gingham', 'gingham', 'Cherry gingham', 'own', 1400, 3, 'cotton', 'woven', 1],
  ['demo-sw-polka', 'polka', 'Navy pin dot', 'own', 1650, 2, 'viscose', 'woven', 3],
  ['demo-sw-breton', 'breton', 'Breton stripe jersey', 'own', 1900, 1.5, 'cotton', 'knit', 5],
  ['demo-sw-roses', 'roses', 'Tea rose lawn', 'want', 2200, 2.5, 'cotton', 'woven', 7],
  ['demo-sw-ditsy', 'ditsy', 'Mint ditsy floral', 'want', 1200, 2, 'cotton', 'woven', 9],
  ['demo-sw-plaid', 'plaid', 'Marigold plaid wool', 'own', 2800, 1.75, 'wool', 'woven', 12],
].map(([id, art, name, status, price, amount, fibre, fabricType, age]) => ({
  id, art, name, status, price, amount, fibre, fabricType, at: sec(now - age * day), key: `demo/swatch-${art}.png`,
}));

const INSPIRATIONS = INSPIRATION_ART.map((art, i) => ({
  id: `demo-insp-${i + 1}`, art, key: `demo/inspiration-${i + 1}.png`, at: sec(now - (i * 2 + 1) * day),
  note: `Synthetic demo inspiration ${i + 1}: shapes drawn in SVG.`,
}));

await mkdir(path.join(uploads, 'demo'), { recursive: true });
const browser = await chromium.launch();
try {
  for (const { art, key } of [...SWATCHES.map((s) => ({ art: SWATCH_ART[s.art], key: s.key })), ...INSPIRATIONS]) {
    const [, w, h] = art.match(/width="(\d+)" height="(\d+)"/);
    const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 2 });
    await page.setContent(`<style>html,body{margin:0}svg{display:block}</style>${art}`, { waitUntil: 'load' });
    const out = path.join(uploads, key);
    await page.screenshot({ path: out });
    await page.close();
    // Matches lib/thumb.ts: THUMB_WIDTH 640, WebP, quality 75.
    await run('cwebp', ['-quiet', '-q', '75', '-resize', '640', '0', out, '-o', out.replace(/\.[^./]+$/, '') + '_t.webp']);
  }
} finally {
  await browser.close();
}

// ---- designs ------------------------------------------------------------------
const layer = (id, garment, parts, dials, fabrics) => ({ id, garment, parts, dials, fabrics });
const DESIGNS = [
  {
    id: 'demo-design-picnic', title: 'Picnic dress', status: 'designed', age: 0.05,
    layers: [layer('demo-l-picnic', 'dress',
      { neckline: 'sweetheart', waist: 'natural', bodice: 'fitted', skirt: 'circle', sleeve: 'puff' },
      { 'neckline.depth': 0.45, 'neckline.width': 0.45, 'bodice.ease': 0.3, 'skirt.length': 0.45, 'skirt.flare': 0.6 },
      { bodice: 'demo-sw-gingham', skirt: 'demo-sw-gingham', sleeves: 'demo-sw-gingham' })],
  },
  {
    id: 'demo-design-garden', title: 'Garden party set', status: 'idea', age: 2,
    layers: [
      layer('demo-l-garden-skirt', 'skirt', { waistband: 'waistband', skirt: 'gathered' },
        { 'waistband.width': 0.4, 'skirt.length': 0.5, 'skirt.flare': 0.5 }, { waistband: 'demo-sw-roses', skirt: 'demo-sw-roses' }),
      layer('demo-l-garden-top', 'top', { neckline: 'square', hem: 'straight', bodice: 'fitted', sleeve: 'short' },
        { 'hem.length': 0.5, 'bodice.ease': 0.3, 'sleeve.length': 0.5 }, { bodice: 'demo-sw-ditsy', sleeves: 'demo-sw-ditsy' }),
    ],
  },
  {
    id: 'demo-design-seaside', title: 'Seaside jacket', status: 'idea', age: 4,
    layers: [
      layer('demo-l-seaside-trousers', 'trousers', { waistband: 'waistband', hem: 'plain', leg: 'straight-leg' },
        { 'waistband.width': 0.4, 'leg.length': 0.6, 'leg.width': 0.35 }, { waistband: 'demo-sw-polka', legs: 'demo-sw-polka' }),
      layer('demo-l-seaside-jacket', 'jacket', { closure: 'single-breasted', collar: 'collarless', body: 'boxy', sleeve: 'long' },
        { 'closure.buttons': 0.5, 'body.length': 0.6, 'body.ease': 0.4, 'collar.depth': 0.3 }, { body: 'demo-sw-breton', sleeves: 'demo-sw-breton' }),
    ],
  },
];

await db.batch([
  'DELETE FROM feedback_messages', 'DELETE FROM feedback', 'DELETE FROM design_pins', 'DELETE FROM designs',
  'DELETE FROM swatches', 'DELETE FROM inspirations',
  ...SWATCHES.map((s) => ({
    sql: `INSERT INTO swatches (id, photo_key, status, name, price_cents, amount, amount_unit, fibre, fabric_type, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'm', ?, ?, ?, ?)`,
    args: [s.id, s.key, s.status, s.name, s.price, s.amount, s.fibre, s.fabricType, 'Synthetic demo swatch: pattern drawn in SVG.', s.at],
  })),
  ...INSPIRATIONS.map((r) => ({
    sql: `INSERT INTO inspirations (id, photo_key, note, created_at) VALUES (?, ?, ?, ?)`,
    args: [r.id, r.key, r.note, r.at],
  })),
  ...DESIGNS.map((d) => ({
    sql: `INSERT INTO designs (id, title, status, notes, library_version, layers, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [d.id, d.title, d.status, 'Synthetic demo design.', LIBRARY_VERSION, JSON.stringify(d.layers),
      sec(now - (d.age + 3) * day), sec(now - d.age * day)],
  })),
  ...[
    ['demo-fb-1', 'idea', 'Could the doll hold a little tape measure? It would make the figure feel like a sewing room.', 'in-progress', 3,
      [['admin', 'Lovely idea, sketching it for the studio step.', 2]]],
    ['demo-fb-2', 'bug', 'The checklist ticks went grey for a moment after adding a swatch.', 'addressed', 6,
      [['admin', 'Fixed, the tick now lands straight away.', 5]]],
  // feedback.message IS the opening message; feedback_messages holds only the
  // replies after it, or the thread renders the opener twice.
  ].flatMap(([id, type, message, status, ago, msgs]) => [
    {
      sql: `INSERT INTO feedback (id, user_id, user_email, type, message, page_url, status, notify, updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, '/', ?, 1, ?, ?)`,
      args: [id, OWNER, OWNER, type, message, status, now - (ago - 1) * day, now - ago * day],
    },
    ...msgs.map(([author, body, a], i) => ({
      sql: `INSERT INTO feedback_messages (id, feedback_id, author, channel, body, email_status, created_at)
            VALUES (?, ?, ?, 'web', ?, ?, ?)`,
      args: [`${id}-m${i}`, id, author, body, author === 'admin' ? 'skipped' : null, now - a * day],
    })),
  ]),
], 'write');

const { rows } = await db.execute(
  `SELECT (SELECT count(*) FROM swatches) s, (SELECT count(*) FROM inspirations) i, (SELECT count(*) FROM designs) d,
          (SELECT count(*) FROM feedback) f, (SELECT count(*) FROM feedback_messages) m`,
);
const r = rows[0];
const want = { s: SWATCHES.length, i: INSPIRATIONS.length, d: DESIGNS.length, f: 2, m: 2 };
if (Object.entries(want).some(([k, v]) => Number(r[k]) !== v)) throw new Error(`seed counts wrong: ${JSON.stringify(r)}`);
console.log(`seeded toile demo: ${r.d} designs, ${r.s} swatches, ${r.i} inspirations, ${r.f} feedback threads, ${r.m} messages`);
