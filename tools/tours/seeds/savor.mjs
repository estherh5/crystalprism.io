// Seeds a throwaway demo DB for savor with invented safe-foods data.
//
// SAFETY: savor holds real eating-disorder recovery data. This script hard-
// refuses to run against anything but a local file: URL.
//
// CONTENT RULES (permanent bans, savor/ROADMAP.md): no calories, no macros, no
// weight, no streaks. Nothing seeded here may imply a tally, a target, or a
// run of consecutive days. `safety` and `filling` are 1-5 feelings rendered as
// sun rays and moons, never as numbers. ideal_servings is left NULL so no bare
// integer can be misread as a count of anything.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}

const db = createClient({ url });

const USER = { id: 'demo-user-savor', email: 'demo@crystalprism.io', name: 'Demo' };

const nowMs = Date.now();
const dayMs = 86400000;
const iso = (daysAgo) => new Date(nowMs - daysAgo * dayMs).toISOString();

// name, safety(1-5), filling(1-5), status, tags, notes, photo slug
// Photos are generated stand-ins in public/demo-photos, NOT the real archive:
// which foods someone finds safe is the sensitive part of this app, so the
// demo must not reuse real photographs even under invented names.
const FOODS = [
  ['Buttered toast', 5, 3, 'safe', ['morning', 'warm', 'always works'], 'The one that never fails. Thick cut, plenty of butter, no thinking required.', 'buttered-toast'],
  ['Miso soup', 5, 2, 'safe', ['warm', 'gentle', 'evening'], 'Good on a day when nothing else sounds possible. Warm and salty and easy.', 'miso-soup'],
  ['Scrambled eggs', 4, 4, 'safe', ['morning', 'soft', 'protein'], 'Soft, slow, low heat. Rushed eggs are a different food entirely.', 'scrambled-eggs'],
  ['Plain congee', 5, 3, 'safe', ['warm', 'gentle', 'sick days'], 'Kept for the days when texture is the problem.', 'plain-congee'],
  ['Apple slices', 4, 2, 'safe', ['cold', 'crisp', 'snack'], 'Cut thin. Whole apples feel like a task; slices feel like a snack.', 'apple-slices'],
  ['Cheese toastie', 4, 4, 'safe', ['warm', 'lunch', 'reliable'], 'Reliable on a bad afternoon.', 'cheese-toastie'],
  ['Porridge with honey', 5, 4, 'safe', ['morning', 'warm', 'sweet'], 'Sweeter than seems necessary, which is the point.', 'porridge-honey'],
  ['Roast carrots', 3, 2, 'safe', ['warm', 'dinner', 'sweet'], 'Better than expected once they caramelise at the edges.', 'roast-carrots'],
  ['Ramen from the corner shop', 3, 4, 'curious', ['warm', 'evening', 'trying'], 'Trying this one. Broth is fine, still working up to the rest.', 'ramen'],
  ['Yoghurt with berries', 4, 2, 'safe', ['cold', 'morning', 'soft'], 'Cold and soft. Works when warm food feels like too much.', 'yoghurt-berries'],
  ['Baked potato', 4, 5, 'safe', ['warm', 'dinner', 'filling'], 'A whole dinner with almost no steps.', 'baked-potato'],
  ['Banana bread', 3, 3, 'curious', ['sweet', 'snack', 'trying'], 'Somewhere between a cake and a bread, which helps.', 'banana-bread'],
];

// Repeated positive entries are what promote a food onto the Wins page.
const FEELINGS = ['calm', 'satisfied', 'energized'];

const stmts = [];

for (const t of ['planned_meals', 'entries', 'foods', 'user_settings', 'users']) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)',
  args: [USER.id, USER.email, USER.name, Math.floor(nowMs / 1000) - 400 * 86400],
});

FOODS.forEach(([name, safety, filling, status, tags, notes, photo], i) => {
  const id = `food-${String(i + 1).padStart(2, '0')}`;
  stmts.push({
    sql: `INSERT INTO foods
      (id, user_id, name, safety, ideal_servings, ideal_servings_note, where_to_get,
       cost, photo_url, notes, tags, status, filling, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, USER.id, name, safety, `/demo-photos/${photo}.png`, notes, JSON.stringify(tags), status, filling, iso(200 - i * 4), iso(i)],
  });

  // Scatter a few entries per food, on non-consecutive days so nothing in the
  // data resembles a streak.
  const count = status === 'curious' ? 2 : 3 + (i % 3);
  for (let e = 0; e < count; e++) {
    stmts.push({
      sql: 'INSERT INTO entries (id, user_id, food_id, had_at, felt_after, note) VALUES (?, ?, ?, ?, ?, NULL)',
      args: [
        `entry-${id}-${e}`,
        USER.id,
        id,
        iso(2 + e * 5 + (i % 4)),
        FEELINGS[(i + e) % FEELINGS.length],
      ],
    });
  }
});

await db.batch(stmts, 'write');

for (const t of ['foods', 'entries']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t}: ${rows[0].n}`);
}
console.log(`seeded ${url}`);
