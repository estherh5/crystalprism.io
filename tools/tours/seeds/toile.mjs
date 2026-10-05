// ~/Developer/crystalprism.io/tools/tours/seeds/toile.mjs
// Seeds a throwaway demo DB for toile with INVENTED rows only: one synthetic
// swatch (so the setup checklist reads "1 of 2") and two feedback threads from
// the demo owner, so the feedback panel and /feedback are not empty states.
// Toile at step 1 has no swatch or design screens yet, so nothing else shows.
// Writes ONLY to the file: URL in DATABASE_URL.
import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const db = createClient({ url });

// Must equal ADMIN_EMAIL on the server and the session's sub/email in the tour:
// listMyFeedback filters on `user.id || user.email`, and the tour mints sub = this.
const OWNER = 'demo@crystalprism.io';
const now = Date.now();
const day = 86_400_000;

await db.batch([
  'DELETE FROM feedback_messages', 'DELETE FROM feedback', 'DELETE FROM swatches', 'DELETE FROM designs',
  {
    sql: `INSERT INTO swatches (id, photo_key, status, name, price_cents, amount, amount_unit, fibre, notes)
          VALUES (?, ?, 'want', ?, ?, ?, 'm', ?, ?)`,
    args: ['demo-swatch-1', 'demo/rose-toile.jpg', 'Rose toile de Jouy (synthetic demo)', 1800, 2.5, 'cotton', 'Invented demo row.'],
  },
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
  `SELECT (SELECT count(*) FROM swatches) s, (SELECT count(*) FROM feedback) f, (SELECT count(*) FROM feedback_messages) m`,
);
const r = rows[0];
if (Number(r.s) !== 1 || Number(r.f) !== 2 || Number(r.m) !== 2) throw new Error(`seed counts wrong: ${JSON.stringify(r)}`);
console.log(`seeded toile demo: ${r.s} swatch, ${r.f} feedback threads, ${r.m} messages`);
