// ~/Developer/crystalprism.io/tools/tours/seeds/menagerie.mjs
// Seeds a throwaway demo DB for menagerie with INVENTED animals and drawn stand-in
// photos. The real collection and its photos are private; none of it is used here.
// Writes ONLY to the file: URL in DATABASE_URL, and the drawings to
// ~/Developer/menagerie/public/uploads/photos/demo-*.jpg (gitignored there).
import { createClient } from '@libsql/client';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const db = createClient({ url });
const OUT = path.join(os.homedir(), 'Developer/menagerie/public/uploads/photos');
await mkdir(OUT, { recursive: true });

const OWNER = 'demo@crystalprism.io';
// name, nicknames, species, maker, year, card ink, frame ink, body colour, ground, kind
const ANIMALS = [
  ['Juniper', 'Juju', 'Bear', 'Jellycat', 2021, 'sun', 'keyline', '#b07a4f', '#f4e3c3', 'bear'],
  ['Pip', null, 'Bunny', 'Handmade', 2014, 'teal', 'sun', '#efe6da', '#cfe9e6', 'bunny'],
  ['Admiral Moss', 'The Admiral', 'Frog', 'Steiff', 1998, 'magenta', 'keyline', '#7fae4e', '#f6d6e6', 'frog'],
  ['Clementine', 'Clem', 'Fox', 'Jellycat', 2023, 'lime', 'tomato', '#e0793a', '#fff1d6', 'fox'],
  ['Barnaby', null, 'Sheep', 'Handmade', 2010, 'sky', 'keyline', '#f5f1ea', '#dcebf8', 'sheep'],
  ['Octavia', 'Tavi', 'Octopus', 'Jellycat', 2022, 'purple', 'sun', '#d77fb0', '#efe0f5', 'octo'],
  ['Sir Waffles', null, 'Bear', 'Build-A-Bear', 2005, 'tomato', 'keyline', '#8a5a3c', '#ffe0d6', 'bear'],
  ['Marzipan', 'Marzi', 'Bunny', 'Steiff', 2019, 'cream', 'magenta', '#f2c9d4', '#f7f1dc', 'bunny'],
];

function plush(a, size) {
  const [, , , , , , , body, ground, kind] = a;
  const ears = kind === 'bunny'
    ? `<ellipse cx="78" cy="48" rx="13" ry="38" fill="${body}"/><ellipse cx="122" cy="48" rx="13" ry="38" fill="${body}"/>`
    : kind === 'fox' ? `<polygon points="62,78 80,30 98,70" fill="${body}"/><polygon points="102,70 120,30 138,78" fill="${body}"/>`
    : kind === 'frog' ? `<circle cx="72" cy="70" r="20" fill="${body}"/><circle cx="128" cy="70" r="20" fill="${body}"/>`
    : kind === 'octo' ? '' : `<circle cx="66" cy="72" r="18" fill="${body}"/><circle cx="134" cy="72" r="18" fill="${body}"/>`;
  const legs = kind === 'octo'
    ? [60, 80, 100, 120, 140].map((x) => `<rect x="${x - 7}" y="140" width="14" height="44" rx="7" fill="${body}"/>`).join('')
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">
    <rect width="200" height="200" fill="${ground}"/><ellipse cx="100" cy="196" rx="80" ry="36" fill="${body}" opacity=".85"/>
    ${ears}${legs}<ellipse cx="100" cy="110" rx="56" ry="50" fill="${body}"/>
    <circle cx="84" cy="104" r="6" fill="#111014"/><circle cx="116" cy="104" r="6" fill="#111014"/>
    <ellipse cx="100" cy="122" rx="8" ry="6" fill="#3a2a22"/></svg>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();
async function render(a, file, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${plush(a, size)}</body></html>`);
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: size, height: size } });
}

const now = Date.now();
const day = 86_400_000;
for (const [i, a] of ANIMALS.entries()) {
  const [name, nicknames, species, maker, year, cardInk, frameInk] = a;
  const id = `demo-animal-${i}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const photoId = `demo-${i}`;
  await render(a, `${photoId}.jpg`, 1200);
  await render(a, `${photoId}_t.jpg`, 600);
  await db.execute({
    sql: 'insert into photos (id, full_key, thumb_key, width, height, taken_at, uploaded_by, created_at) values (?,?,?,?,?,?,?,?)',
    args: [photoId, `photos/${photoId}.jpg`, `photos/${photoId}_t.jpg`, 1200, 1200, now - (i + 3) * 30 * day, OWNER, now - i * day],
  });
  await db.execute({
    sql: `insert into animals (id, slug, name, nicknames, species, maker, acquired_year, card_ink, frame_ink,
      portrait_photo_id, personality, created_by, created_at, updated_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, slug, name, nicknames, species, maker, year, cardInk, frameInk, photoId,
      'Invented for this demo. Loves naps in sunny windows.', OWNER, now - i * day, now - i * day],
  });
  await db.execute({
    sql: 'insert into tags (id, photo_id, animal_id, x, y, created_by) values (?,?,?,?,?,?)',
    args: [`demo-tag-${i}`, photoId, id, 0.5, 0.55, OWNER],
  });
}
// One untagged photo, so the roster shows the untagged link.
await render(ANIMALS[1], 'demo-untagged.jpg', 1200);
await render(ANIMALS[1], 'demo-untagged_t.jpg', 600);
await db.execute({
  sql: 'insert into photos (id, full_key, thumb_key, width, height, uploaded_by, created_at) values (?,?,?,?,?,?,?)',
  args: ['demo-untagged', 'photos/demo-untagged.jpg', 'photos/demo-untagged_t.jpg', 1200, 1200, OWNER, now],
});
const [lo, hi] = ['demo-animal-0', 'demo-animal-1'].sort();
await db.execute({ sql: 'insert into relationships (id, animal_a_id, animal_b_id, label) values (?,?,?,?)', args: ['demo-rel-0', lo, hi, 'best friends'] });
await browser.close();

const { rows } = await db.execute("select count(*) as n from photos where full_key not like 'photos/demo-%'");
if (Number(rows[0].n) !== 0) throw new Error('a photo row points somewhere other than the local demo drawings');
console.log(`seeded ${ANIMALS.length} invented animals, ${ANIMALS.length + 1} drawn photos, 1 relationship`);
