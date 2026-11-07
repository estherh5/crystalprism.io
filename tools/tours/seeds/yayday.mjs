// ~/Developer/crystalprism.io/tools/tours/seeds/yayday.mjs
// Seeds a throwaway demo DB for yayday with INVENTED ideas across the three lists
// (Little bit of yay, Better me, Bucket list), a few Did it ✶ memories, and today's
// pick in the sun. Nothing here is Esther's; her lists are private.
// Writes ONLY to the file: URL in DATABASE_URL. Run yayday's own migrator first.
import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const db = createClient({ url });

// Items are keyed on users.id, which lib/guard.ts#currentUser looks up by the session's
// email. The minted session carries a fresh `checkedAt:yayday`, so admission never re-runs
// and never upserts this row itself: the seed has to.
const EMAIL = 'demo@crystalprism.io';
const OWNER = 'demo-user-yayday';
const DAY = 86_400_000;
const now = Date.now();
const ago = (days) => now - Math.round(days * DAY);

// kind, title, note, cost, created (days ago), done (days ago | null), done note, steps [[text, done?]]
const ITEMS = [
  ['yay', 'A warm croissant from the corner bakery', null, '$', 20, null, null, []],
  ['yay', 'Peonies for the kitchen table', null, '$$', 18, null, null, []],
  ['yay', 'Bubble bath with a new book', null, null, 15, null, null, []],
  ['yay', 'Matcha latte on the bench by the river', null, '$', 12, null, null, []],
  ['yay', 'Sunset walk, no phone', null, null, 9, null, null, []],
  ['better', 'Learn to make fresh pasta', 'A Saturday class, or a long video and a lot of flour', '$$', 30, null, null,
    [['Find a class nearby', true], ['Buy a pasta board', false], ['Make tagliatelle for friends', false]]],
  ['better', 'Get a standing desk', null, '$$$', 25, null, null, [['Measure the nook', true], ['Pick one', false]]],
  ['better', 'Take a pottery wheel class', null, '$$', 14, null, null, []],
  ['bucket', 'See the northern lights in Tromsø', null, '$$$$', 40, null, null, []],
  ['bucket', 'Kyoto in cherry blossom season', null, '$$$$', 35, null, null, []],
  ['bucket', 'Hot air balloon over Cappadocia', null, '$$$$', 28, null, null, []],
  ['bucket', 'Swim with manta rays', null, '$$$', 22, null, null, []],
  // The Did it ✶ shelf.
  ['better', 'Learn to roller skate', null, '$$', 60, 21, 'Fell twice, laughed the whole time.', []],
  ['bucket', 'Hike to a glacier', null, '$$$', 90, 45, 'The blue was unreal.', []],
  ['better', 'Start a little herb garden', null, '$', 50, 12, 'Basil is thriving. Rosemary is sulking.', []],
  ['bucket', 'See a show on Broadway', null, '$$$', 80, 6, null, []],
];

const PICK = 'A warm croissant from the corner bakery';

await db.execute('delete from pick_log');
await db.execute('delete from had_log');
await db.execute('delete from item_steps');
await db.execute('delete from items');
await db.execute('delete from users');
await db.execute({ sql: 'insert into users (id, email, name, created_at) values (?, ?, ?, ?)', args: [OWNER, EMAIL, 'Demo', now - 90 * DAY] });

const ids = {};
for (const [kind, title, note, cost, created, done, doneNote, steps] of ITEMS) {
  const id = randomUUID();
  ids[title] = id;
  await db.execute({
    sql: `insert into items (id, owner_id, kind, title, note, cost, created_at, done_at, done_note)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, OWNER, kind, title, note, cost, ago(created), done === null ? null : ago(done), doneNote],
  });
  for (const [i, [text, stepDone]] of steps.entries()) {
    await db.execute({
      sql: 'insert into item_steps (id, item_id, position, text, done_at) values (?, ?, ?, ?, ?)',
      args: [randomUUID(), id, i, text, stepDone ? ago(3 + i) : null],
    });
  }
}

// A few "Had it ♡" taps on the small joys.
for (const [title, days] of [['Peonies for the kitchen table', [16, 4]], ['Sunset walk, no phone', [7, 2, 1]], ['Matcha latte on the bench by the river', [5]]]) {
  for (const d of days) {
    await db.execute({ sql: 'insert into had_log (id, item_id, had_at) values (?, ?, ?)', args: [randomUUID(), ids[title], ago(d)] });
  }
}

// Today's pick, fixed so the thumbnail is the same on every run. `day` is the owner's
// local day in the default zone (user_settings has no row, so America/New_York).
const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
await db.execute({
  sql: 'insert into pick_log (id, owner_id, day, item_id, shown_at) values (?, ?, ?, ?, ?)',
  args: [randomUUID(), OWNER, day, ids[PICK], now],
});

const { rows } = await db.execute('select kind, count(*) n, sum(done_at is not null) done from items group by kind');
console.log('seeded yayday demo:', rows.map((r) => `${r.kind} ${r.n} (${r.done} done)`).join(', '), `· pick ${day}`);
