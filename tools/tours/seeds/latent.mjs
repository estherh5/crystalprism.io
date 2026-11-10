// ~/Developer/crystalprism.io/tools/tours/seeds/latent.mjs
// Seeds a throwaway demo DB for Latent with INVENTED thoughts. Nothing here is Esther's: her
// real notes are private. Writes ONLY to the file: URL in DATABASE_URL (run latent's own
// migrator first: `node scripts/migrate.mjs`). Every thought is already `ready` with a plain
// original layout and no generated design, so the demo never asks a model for anything.
import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const db = createClient({ url });

const EMAIL = 'demo@crystalprism.io';
const OWNER = 'demo-user-latent';
const DAY = 86_400_000;
const now = Date.now();

await db.execute({ sql: 'insert or replace into user (id, name, email, createdAt) values (?, ?, ?, ?)', args: [OWNER, 'Demo', EMAIL, now - 90 * DAY] });

// [id, layout, days ago, text, source]. Layouts are the app's 15 originals, one each plus one repeat, and
// every text is short enough for its layout's budget (AR wants one short line, AV a few short strips).
const T = [
  ['demo-thought-01', 'AF', 1, 'The best part of the walk was the five minutes where I forgot I was walking.', null],
  ['demo-thought-02', 'AR', 2, 'Slow down before the good part', null],
  ['demo-thought-03', 'AL', 3, 'Idea: a cookbook organized by what is already in the fridge, not by course.', null],
  ['demo-thought-04', 'AK', 4, 'Things the lake taught me\nfloat first\nswim second\nlisten always', null],
  ['demo-thought-05', 'AM', 6, 'My grandmother sang while she kneaded dough, and the bread never once failed.', 'Grandma'],
  ['demo-thought-06', 'AV', 7, 'Call the plant shop about the fern.', null],
  ['demo-thought-07', 'AN', 9, 'You do not need a plan for the whole staircase, only the next step and a good railing.', null],
  ['demo-thought-08', 'AP', 11, 'Write the toast now. Short. Mention the terrible karaoke and the borrowed umbrella.', null],
  ['demo-thought-09', 'AG', 13, 'A city is a conversation between the people who left and the people who stayed.', 'a train window'],
  ['demo-thought-10', 'AH', 15, 'Morning light\nthrough the kitchen glass\nmakes a small cathedral\nof the toast', null],
  ['demo-thought-11', 'AQ', 18, 'Try the blue door bakery on Saturday before the line forms.', null],
  ['demo-thought-12', 'AS', 21, 'Be a little more like water.', null],
  ['demo-thought-13', 'AT', 24, 'What if every app asked one good question and then got out of the way?', null],
  ['demo-thought-14', 'AU', 28, 'The garden does not care how busy I was. It just wants water on Thursday.', null],
  ['demo-thought-15', 'AJ', 33, 'Ask Priya about the pottery class. Bring the green mug to be fired.', null],
  ['demo-thought-16', 'AF', 40, 'Left a note in the library book for whoever reads it next: you are going to love chapter nine.', 'library'],
];

let i = 0;
for (const [id, layout, ago, text, source] of T) {
  const at = now - ago * DAY - (i++ % 5) * 3_600_000;
  const imported = ago >= 24 ? 'apple-notes' : null;
  await db.execute({
    sql: `insert or replace into thoughts
      (id, owner_id, text, source, created_at, updated_at, imported_from, original_created_at, layout, palette, design, design_status, design_attempts)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, null, null, 'ready', 0)`,
    args: [id, OWNER, text, source, at, at, imported, imported ? at : null, layout],
  });
}
const [{ n }] = (await db.execute('select count(*) as n from thoughts')).rows;
console.log(`seeded ${n} invented thoughts for ${EMAIL}`);
