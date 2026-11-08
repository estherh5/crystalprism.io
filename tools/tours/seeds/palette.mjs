// Seeds a throwaway demo board for Palette with INVENTED pictures.
//
// SAFETY: Esther's real board is ~1,100 private inspiration pictures, and
// palette's .env.local holds the PRODUCTION Turso token and R2 keys. This script
// hard-refuses anything but a local file: URL, and every picture below is an
// abstract drawing generated here with sharp (gradients, stripes, dots, color
// blocks), never a photograph and never anything from her folder or album.
//
// Pictures go in through the app's OWN pipeline: POST /api/ingest on the running
// demo server, so each one gets the real six-chip OKLab palette, names and swatch
// rows, and the server writes the files to <copy>/public/uploads (no R2 env set).
// So the server must already be running (see the palette block in README.md).
// Saved palettes and collections are then written straight to the DB from the
// chips the app extracted.
//
//   DATABASE_URL=file:/abs/demo.db PALETTE_APP_DIR=/abs/copy APP_PORT=3488 node seeds/palette.mjs

import { createClient } from '@libsql/client';
import { createRequire } from 'node:module';
import { createCipheriv, randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const appDir = process.env.PALETTE_APP_DIR;
if (!appDir) throw new Error('PALETTE_APP_DIR must name the palette copy the demo server runs from');
const port = Number(process.env.APP_PORT ?? 3488);
const sharp = createRequire(path.join(appDir, 'package.json'))('sharp');
const db = createClient({ url });

const EMAIL = 'demo@crystalprism.io';
const now = Date.now();
const DAY = 86_400_000;

await db.execute({ sql: 'insert or ignore into users (email, name, created_at) values (?, ?, ?)', args: [EMAIL, 'Demo', now - 60 * DAY] });
const token = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '');
await db.execute({ sql: 'insert or replace into ingest_tokens (owner_email, token, created_at) values (?, ?, ?)', args: [EMAIL, token, now] });
// The setup checklist's last step is "an OpenAI key exists". An invented key, encrypted the way
// lib/crypto.ts#encryptSecret does under the demo server's own USER_API_KEY_ENCRYPTION_KEY, marks it
// done so the wall opens on pictures, not on the panel. Mix is never run in the tour, and the tour
// aborts every request that leaves localhost.
const encKey = Buffer.from(process.env.USER_API_KEY_ENCRYPTION_KEY ?? '', 'base64');
if (encKey.length !== 32) throw new Error('USER_API_KEY_ENCRYPTION_KEY must be the demo server\'s 32-byte base64 key');
const iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', encKey, iv);
const ct = Buffer.concat([cipher.update('sk-demo-not-a-real-key-0000', 'utf8'), cipher.final()]);
const ciphertext = [iv, cipher.getAuthTag(), ct].map((b) => b.toString('base64')).join('.');
await db.execute({ sql: 'insert or replace into image_api_keys (email, ciphertext, hint, updated_at) values (?, ?, ?, ?)', args: [EMAIL, ciphertext, '0000', Math.floor(now / 1000)] });

// [kind, w, h, colors]
const P = [
  ['blocks', 800, 1000, ['#E8359B', '#F7C6D9', '#FBE9E1', '#7A1F4B']],
  ['radial', 800, 800, ['#F2A541', '#F6D365', '#D9480F', '#3A1C0B']],
  ['stripes', 800, 1100, ['#2E9C9A', '#A7E1D8', '#F3E9D2', '#0B3C49']],
  ['dots', 800, 600, ['#4A7BD0', '#BFD4F6', '#F9F6EF', '#1B2A4A']],
  ['linear', 800, 1200, ['#8F6CD0', '#E5B8F4', '#FCE4EC', '#2D1B4E']],
  ['arches', 800, 1000, ['#6DBE7A', '#DDEFC9', '#F7E7B4', '#2F5233']],
  ['blocks', 800, 800, ['#D64545', '#F2D45C', '#F3E9D2', '#1A1714']],
  ['waves', 800, 1000, ['#FF7F6E', '#FFD1BA', '#6EC6CA', '#24495C']],
  ['radial', 800, 1100, ['#C2185B', '#F06292', '#FFCDD2', '#4A0E2E']],
  ['stripes', 800, 700, ['#8A5A3B', '#D9A066', '#F3E2C7', '#3B2416']],
  ['dots', 800, 1000, ['#F2D45C', '#FFF3B0', '#E09F3E', '#335C67']],
  ['linear', 800, 900, ['#00A6A6', '#BBDEF0', '#F49F0A', '#EFCA08']],
  ['arches', 800, 1200, ['#E07A5F', '#F2CC8F', '#81B29A', '#3D405B']],
  ['blocks', 800, 1000, ['#5B5F97', '#B8B8D1', '#FFFFFB', '#FF6B6C']],
  ['waves', 800, 800, ['#264653', '#2A9D8F', '#E9C46A', '#F4A261']],
  ['radial', 800, 1000, ['#9B5DE5', '#F15BB5', '#FEE440', '#00BBF9']],
  ['stripes', 800, 1000, ['#FFB5A7', '#FCD5CE', '#F8EDEB', '#B5838D']],
  ['dots', 800, 1100, ['#1D3557', '#457B9D', '#A8DADC', '#F1FAEE']],
  ['linear', 800, 700, ['#FF5F6D', '#FFC371', '#FFF1D6', '#7B2D26']],
  ['arches', 800, 900, ['#BC4749', '#F2E8CF', '#A7C957', '#386641']],
  ['blocks', 800, 1200, ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF']],
  ['waves', 800, 1000, ['#6A4C93', '#C77DFF', '#E0AAFF', '#10002B']],
  ['radial', 800, 800, ['#06D6A0', '#FFD166', '#EF476F', '#073B4C']],
  ['stripes', 800, 1100, ['#8C8C8C', '#D9D9D9', '#F5F0E6', '#E8359B']],
  ['dots', 800, 900, ['#FB8500', '#FFB703', '#8ECAE6', '#023047']],
  ['linear', 800, 1000, ['#7400B8', '#5390D9', '#48BFE3', '#80FFDB']],
  ['arches', 800, 1100, ['#D4A373', '#FAEDCD', '#E9EDC9', '#CCD5AE']],
  ['blocks', 800, 900, ['#3A86FF', '#FF006E', '#FFBE0B', '#FB5607']],
  ['waves', 800, 1200, ['#F72585', '#B5179E', '#7209B7', '#4CC9F0']],
  ['radial', 800, 1000, ['#A3B18A', '#DAD7CD', '#588157', '#344E41']],
];

// A small deterministic PRNG so every run draws the same board.
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

function svg([kind, w, h, c]) {
  const body = [];
  if (kind === 'blocks') {
    body.push(`<rect width="${w}" height="${h}" fill="${c[2]}"/>`);
    body.push(`<rect x="0" y="0" width="${w * 0.62}" height="${h * 0.55}" fill="${c[0]}"/>`);
    body.push(`<rect x="${w * 0.62}" y="${h * 0.3}" width="${w * 0.38}" height="${h * 0.7}" fill="${c[1]}"/>`);
    body.push(`<circle cx="${w * 0.32}" cy="${h * 0.76}" r="${w * 0.2}" fill="${c[3]}"/>`);
  } else if (kind === 'radial') {
    body.push(`<defs><radialGradient id="g" cx="40%" cy="40%" r="75%"><stop offset="0" stop-color="${c[1]}"/><stop offset="0.45" stop-color="${c[0]}"/><stop offset="0.8" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3]}"/></radialGradient></defs>`);
    body.push(`<rect width="${w}" height="${h}" fill="url(#g)"/>`);
  } else if (kind === 'stripes') {
    const n = 7;
    for (let i = 0; i < n; i++) body.push(`<rect x="${(i * w) / n}" y="0" width="${w / n + 1}" height="${h}" fill="${c[i % 4]}"/>`);
    body.push(`<rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.12}" fill="${c[3]}" opacity="0.85"/>`);
  } else if (kind === 'dots') {
    body.push(`<rect width="${w}" height="${h}" fill="${c[2]}"/>`);
    for (let i = 0; i < 26; i++) body.push(`<circle cx="${rnd() * w}" cy="${rnd() * h}" r="${30 + rnd() * 90}" fill="${c[i % 2 === 0 ? 0 : i % 3 === 0 ? 3 : 1]}" opacity="0.92"/>`);
  } else if (kind === 'linear') {
    body.push(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="0.35" stop-color="${c[1]}"/><stop offset="0.7" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3]}"/></linearGradient></defs>`);
    body.push(`<rect width="${w}" height="${h}" fill="url(#g)"/>`);
    body.push(`<circle cx="${w * 0.7}" cy="${h * 0.3}" r="${w * 0.16}" fill="${c[2]}" opacity="0.9"/>`);
  } else if (kind === 'arches') {
    body.push(`<rect width="${w}" height="${h}" fill="${c[1]}"/>`);
    for (let i = 0; i < 4; i++) {
      const r = w * (0.48 - i * 0.1);
      body.push(`<path d="M ${w / 2 - r} ${h} L ${w / 2 - r} ${h * 0.55} A ${r} ${r} 0 0 1 ${w / 2 + r} ${h * 0.55} L ${w / 2 + r} ${h} Z" fill="${c[[0, 2, 3, 1][i]]}"/>`);
    }
  } else {
    body.push(`<rect width="${w}" height="${h}" fill="${c[1]}"/>`);
    for (let i = 0; i < 5; i++) {
      const y = h * (0.2 + i * 0.18);
      body.push(`<path d="M 0 ${y} C ${w * 0.25} ${y - 90}, ${w * 0.5} ${y + 90}, ${w} ${y - 30} L ${w} ${h} L 0 ${h} Z" fill="${c[[0, 2, 3, 0, 2][i]]}" opacity="0.95"/>`);
    }
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body.join('')}</svg>`);
}

// A few arrive by the iPhone Shortcut (that marks the setup step done), the rest by the Mac folder sync.
const ids = [];
for (let i = P.length - 1; i >= 0; i--) {
  const png = await sharp(svg(P[i])).png().toBuffer();
  const source = i % 5 === 0 ? 'shortcut' : i % 3 === 0 ? 'photos' : 'folder';
  const res = await fetch(`http://localhost:${port}/api/ingest?source=${source}&ref=demo-${i}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'image/png' },
    body: png,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.id) throw new Error(`ingest ${i} failed: ${res.status} ${JSON.stringify(json)}`);
  ids[i] = json.id;
}
// Spread created_at over two months so the wall's newest-first order is P[0] first.
for (let i = 0; i < P.length; i++) {
  await db.execute({ sql: 'update pictures set created_at = ? where id = ?', args: [now - i * 2 * DAY - 3600_000, ids[i]] });
}

const chipsOf = async (id) => JSON.parse((await db.execute({ sql: 'select chips from pictures where id = ?', args: [id] })).rows[0].chips);
const SAVED = [[0, 'Peony parlor'], [7, 'Coral tide'], [12, 'Terracotta garden'], [15, 'Arcade neon'], [4, 'Lavender dusk'], [2, 'Sea glass']];
for (const [k, [i, name]] of SAVED.entries()) {
  await db.execute({
    sql: 'insert into saved_palettes (id, owner_email, name, picture_id, chips, created_at) values (?, ?, ?, ?, ?, ?)',
    args: [randomUUID(), EMAIL, name, ids[i], JSON.stringify(await chipsOf(ids[i])), now - k * DAY],
  });
}
const COLLECTIONS = [['Spring wardrobe', [0, 4, 8, 16, 20]], ['Living room', [2, 5, 9, 26, 29]], ['Bold & bright', [6, 15, 22, 27, 28]]];
for (const [k, [name, members]] of COLLECTIONS.entries()) {
  const cid = randomUUID();
  await db.execute({ sql: 'insert into collections (id, owner_email, name, created_at) values (?, ?, ?, ?)', args: [cid, EMAIL, name, now - (k + 1) * 3 * DAY] });
  for (const i of members) await db.execute({ sql: 'insert into collection_pictures (collection_id, picture_id, added_at) values (?, ?, ?)', args: [cid, ids[i], now - k * DAY] });
}

const count = (t) => db.execute(`select count(*) as n from ${t}`).then((r) => Number(r.rows[0].n));
console.log(`seeded ${await count('pictures')} pictures, ${await count('picture_swatches')} swatch rows, ${await count('saved_palettes')} saved, ${await count('collections')} collections`);
