// Seeds a throwaway demo DB for giftme with invented people and gifts.
//
// SAFETY: giftme's env points TURSO_DATABASE_URL at the PRODUCTION Turso
// database. Every screen in this app renders real names, real gift notes and
// real uploaded photos with no anonymisation layer, so all of it is replaced
// here. This script hard-refuses to run against anything but a local file: URL.
//
// Everyone below is fictional.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}

const db = createClient({ url });

const USER = { id: 'demo-user-giftme', email: 'demo@crystalprism.io', name: 'Demo' };

const now = Date.now();
const day = 86400000;
const thisYear = new Date(now).getFullYear();

// name, emoji — the avatar strip reads as a row of faces at video scale.
const PEOPLE = [
  ['Ada', '🌿'],
  ['Nora', '🎈'],
  ['Priya', '📚'],
  ['Callum', '🎧'],
  ['Wren', '🕯️'],
  ['Gerald', '🧭'],
];

// person, label, month, day, relation
const soon = (offsetDays) => {
  const d = new Date(now + offsetDays * day);
  return [d.getMonth() + 1, d.getDate()];
};
const OCCASIONS = [
  ['Ada', 'Birthday', ...soon(6), 'Mother'],
  ['Callum', 'Birthday', ...soon(13), 'Friend'],
  ['Nora', 'Birthday', ...soon(24), 'Sister'],
  ['Wren', 'Anniversary', ...soon(38), 'Friend'],
  ['Priya', 'Birthday', ...soon(52), 'Friend'],
];

// category, name, person, occasion, daysAgo, price, note
const GIFTS = [
  ['ideas', 'Hand-thrown mug, the heavy kind', 'Ada', 'Birthday', 4, '£28', 'She keeps chipping the last one.'],
  ['ideas', 'Field recorder', 'Callum', 'Birthday', 9, '£140', 'For the birdsong thing he keeps talking about.'],
  ['ideas', 'Letterpress notebook', 'Priya', 'Birthday', 14, '£22', null],
  ['given', 'Wool blanket, moss green', 'Nora', 'Christmas', 38, '£65', 'Went down very well.'],
  ['given', 'Cast iron pan', 'Gerald', 'Birthday', 96, '£54', null],
  ['given', 'Botanical print, framed', 'Ada', 'Christmas', 41, '£40', 'Hung it in the hallway the same day.'],
  ['received', 'Pocket knife with a walnut handle', 'Gerald', 'Birthday', 27, null, 'Sharpened it properly before wrapping it.'],
  ['received', 'Book of coastal walks', 'Wren', 'Christmas', 44, null, null],
  ['wishlist', 'Good secateurs', null, null, 20, '£35', null],
  ['wishlist', 'A proper raincoat', null, null, 33, null, 'The kind that survives a winter.'],
  ['wishlist', 'Tickets to the observatory', null, null, 47, '£18', null],
];

const OCCASION_TYPES = ['Birthday', 'Christmas', 'Anniversary', 'Thank you', 'Just because'];

const stmts = [];

for (const t of ['gifts', 'occasions', 'occasion_types', 'people', 'users']) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO users (id, email, password_hash, name, share_token, nexus_synced_at, created_at) VALUES (?, ?, NULL, ?, ?, NULL, ?)',
  args: [USER.id, USER.email, USER.name, 'demo-wishlist-token', now - 400 * day],
});

PEOPLE.forEach(([name, emoji], i) => {
  stmts.push({
    sql: 'INSERT INTO people (id, user_id, name, emoji, photo_url, email, created_at) VALUES (?, ?, ?, ?, NULL, NULL, ?)',
    args: [`person-${i + 1}`, USER.id, name, emoji, now - 300 * day],
  });
});

OCCASION_TYPES.forEach((label, i) => {
  stmts.push({
    sql: 'INSERT INTO occasion_types (id, user_id, label, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [`otype-${i + 1}`, USER.id, label, i, now - 300 * day],
  });
});

OCCASIONS.forEach(([person, label, month, dayOfMonth, relation], i) => {
  stmts.push({
    sql: 'INSERT INTO occasions (id, user_id, person, label, month, day, year, relation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      `occ-${i + 1}`,
      USER.id,
      person,
      label,
      month,
      dayOfMonth,
      label === 'Birthday' ? thisYear - 30 - i * 4 : null,
      relation,
      now - 200 * day,
    ],
  });
});

GIFTS.forEach(([category, name, person, occasion, daysAgo, price, note], i) => {
  const date = new Date(now - daysAgo * day).toISOString().slice(0, 10);
  stmts.push({
    sql: `INSERT INTO gifts
      (id, user_id, category, name, person, occasion, date, price, note, url, photos,
       ready, thanked, thank_you_note, thanked_at, thank_you_theme, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0, ?, NULL, NULL, NULL, ?)`,
    args: [
      `gift-${i + 1}`,
      USER.id,
      category,
      name,
      person,
      occasion,
      date,
      price,
      note,
      category === 'received' ? 1 : 0,
      now - daysAgo * day,
    ],
  });
});

await db.batch(stmts, 'write');

for (const t of ['people', 'occasions', 'gifts']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t}: ${rows[0].n}`);
}
console.log(`seeded ${url}`);
