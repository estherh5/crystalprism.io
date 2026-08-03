// Seeds a throwaway demo DB for space with invented app ideas.
// Nothing here is real: no personal notes, no real collaborators.
//
// Writes ONLY to the file named by TURSO_DATABASE_URL. Space already defaults
// to a local file (space/web/db/index.ts:5), but we pass an explicit demo path
// so the seed can never land in her real local.db.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}

const db = createClient({ url });

const USER = {
  id: 'demo-user-space',
  email: 'demo@crystalprism.io',
  name: 'Demo',
};

// brief stays short: the board renders these on ~175px-wide cards in the
// crystalprism modal, so long strings turn to mush at video scale.
//
// notes/problem/mustHaves are filled on EVERY idea, not just the flagship —
// the tour opens whichever square sorts first, and an idea page reading
// "No notes yet." is a dead frame in a 15-second video.
// Titles are DESCRIPTIVE, not evocative. A square renders at ~175px in the
// crystalprism modal, where the title is the only text that reads — so a
// one-word name like "Aviary" or "Kiln" looks like a random word rather than an
// app idea. Say what the thing does.
const IDEAS = [
  ['Rock Pool Field Guide', 'Point your phone at a tidepool and learn what you found.', 'orbit', 4, 'blue', 'nature',
    'Anemones first — telling them apart is the hard part, and the payoff people actually want.',
    'You find something in a rock pool and have no idea what it is. By the time you get home and can search, you have forgotten the details that mattered.',
    'Works with no signal\nPhoto in, name out\nTide times for where you stand'],
  ['File Handoff Tool', 'Move a file between two machines with one QR code.', 'shipped', 3, 'green', 'tools',
    'Shipped in a weekend. The whole trick is that neither machine needs an account.',
    'Sending a file to your own laptop means emailing yourself or hunting for a cable.',
    'No sign-in\nQR to pair\nDies when the tab closes'],
  ['Book Highlight Resurfacer', 'One saved highlight, back in front of you each morning.', 'orbit', 3, 'violet', 'reading',
    'One a day, in the morning, no backlog counter. A queue you can see is a queue you feel behind on.',
    'Highlights go into a file nobody reopens. The reading happened; the remembering did not.',
    'One card a day\nNo unread count\nImport from anywhere'],
  ['Weather Radio Station', 'A station that plays whatever the weather sounds like.', 'spark', 2, 'pink', 'audio',
    'Rain maps to something soft and low. Wind picks up the tempo. Nothing louder than the room.',
    'Every station is trying to hold your attention. Sometimes you want one that is trying not to.',
    'Reads local weather\nNo ads, no talking\nRuns all day'],
  ['Conversation Rehearser', 'Practise a hard conversation before you have to have it.', 'spark', 4, 'orange', 'practice',
    'It should get the other person slightly wrong on purpose — real ones never say the line you rehearsed.',
    'The conversations that matter most are the ones you get exactly one take at.',
    'You set the stakes\nIt pushes back\nNothing is stored'],
  ['Potluck Organizer', 'Who is bringing what, without the group chat.', 'shipped', 2, 'yellow', 'social',
    'A link, a list, no accounts. Shipped because the group chat version made everyone miserable.',
    'Twelve people, one thread, four salads and no bread.',
    'One link to share\nClaim a dish\nNo sign-up'],
  ['Side Project Dashboard', 'Every project you started, and which are still alive.', 'orbit', 3, 'blue', 'tools',
    'Green for shipped, amber for stalled, and an honest grey for the ones that quietly died.',
    'Half a dozen half-finished apps, and no single place that says which are alive.',
    'Reads deploys\nFlags what is stale\nOne screen only'],
  ['Wardrobe Wear Tracker', 'Track what you actually wear, not what you own.', 'spark', 2, 'pink', 'closet',
    'The interesting number is what has not been worn in a year — and it should never feel like a scolding.',
    'You own far more than you wear, and cannot say which is which.',
    'Log a wear in one tap\nNo photos required\nNo shopping suggestions'],
  ['Note Warmth Sorter', 'Notes get warmer the more you come back to them.', 'spark', 3, 'orange', 'notes',
    'Heat as the sort order. Cold notes sink without being deleted — nothing is ever thrown away.',
    'Good notes and abandoned notes look identical in a list sorted by date.',
    'Revisits raise heat\nCold notes sink\nNothing deleted'],
  ['Running Late Notifier', 'Tell six people you are running late, all at once.', 'shipped', 1, 'green', 'social',
    'One button, one message, six threads. The smallest thing here and the one used most.',
    'Being late means six apologies typed while driving.',
    'Pick a group\nOne tap\nSends everywhere at once'],
  ['Read Later Rescuer', 'Saved links come back when they are relevant again.', 'orbit', 2, 'violet', 'reading',
    'Resurface by context, not by date. The link about roofing should come back when roofing comes up.',
    'Read-it-later apps become a graveyard you feel guilty about.',
    'Save with no tags\nComes back in context\nNo unread badge'],
  ['Birdsong Mapper', 'Record ten seconds of birdsong and map where you heard it.', 'spark', 4, 'yellow', 'nature',
    'Record ten seconds, get a name and a pin. Over a year the map turns into a migration chart.',
    'You hear something remarkable on a walk and have no way to keep it.',
    'Ten-second capture\nWorks offline\nBuilds a map over time'],
];

const now = Math.floor(Date.now() / 1000);
const day = 86400;

const stmts = [];

// Clean slate so re-running the seed is idempotent.
for (const t of ['activity', 'comments', 'idea_tags', 'idea_links', 'idea_shares', 'ideas', 'users']) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO users (id, email, name, image, created_at) VALUES (?, ?, ?, NULL, ?)',
  args: [USER.id, USER.email, USER.name, now - 400 * day],
});

IDEAS.forEach(([title, brief, status, magnitude, color, tag, notes, problem, mustHaves], i) => {
  const id = `idea-${String(i + 1).padStart(3, '0')}`;
  const createdAt = now - (IDEAS.length - i) * 9 * day;
  stmts.push({
    sql: `INSERT INTO ideas
      (id, owner_id, designation, title, brief, notes, status, magnitude, color, kind,
       target_app, problem, must_haves, out_of_scope, constraints, vibe, position,
       public_token, public_enabled, created_by_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'app', NULL, ?, ?, NULL, NULL, NULL, ?, NULL, 0, ?, ?, ?)`,
    args: [
      id,
      USER.id,
      `SP-${String(i + 1).padStart(3, '0')}`,
      title,
      brief,
      notes,
      status,
      magnitude,
      color,
      problem,
      mustHaves,
      createdAt,
      USER.id,
      createdAt,
      createdAt,
    ],
  });
  stmts.push({
    sql: 'INSERT INTO idea_tags (id, idea_id, label) VALUES (?, ?, ?)',
    args: [`tag-${i + 1}`, id, tag],
  });
  stmts.push({
    sql: 'INSERT INTO activity (id, idea_id, actor_id, type, meta, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
    args: [`act-${i + 1}`, id, USER.id, 'created', createdAt],
  });
});

// A little conversation on the flagship card, so the detail dialog is not bare.
stmts.push({
  sql: 'INSERT INTO comments (id, idea_id, author_id, parent_id, body, created_at) VALUES (?, ?, ?, NULL, ?, ?)',
  args: ['cmt-1', 'idea-001', USER.id, 'Start with anemones — the hard part is telling them apart.', now - 5 * day],
});
stmts.push({
  sql: 'INSERT INTO comments (id, idea_id, author_id, parent_id, body, created_at) VALUES (?, ?, ?, NULL, ?, ?)',
  args: ['cmt-2', 'idea-001', USER.id, 'Offline first. There is no signal on a beach.', now - 2 * day],
});

await db.batch(stmts, 'write');

const { rows } = await db.execute('SELECT status, COUNT(*) AS n FROM ideas GROUP BY status');
console.log(`seeded ${url}`);
for (const r of rows) console.log(`  ${r.status}: ${r.n}`);
