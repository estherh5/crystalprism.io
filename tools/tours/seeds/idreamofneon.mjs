// Seeds a throwaway demo DB for idreamofneon with invented dreams.
//
// SAFETY: dreams are about as personal as a record gets, and this app's real
// data is local-only. Two separate live databases sit in this repo —
// `data/local.db` (what the app reads) and `data.nosync/local.db` (what the
// Apple Notes importer writes) — and NEITHER may be touched. The app falls back
// to `data/local.db` whenever TURSO_DATABASE_URL is unset, so that variable has
// to be set explicitly, and this script refuses anything that is not a demo file.
//
// Everything below is invented.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}
if (/local\.db/.test(url)) {
  throw new Error('refusing to seed: that is a real dream database. Use demo.db.');
}

const db = createClient({ url });

const now = Math.floor(Date.now() / 1000);
const day = 86400;
const dstr = (d) => new Date((now - d * day) * 1000).toISOString().slice(0, 10);

// title, daysAgo, mood, body
// The recurring imagery is deliberate: the map draws a thread between dreams
// that reference each other, so the demo needs dreams that genuinely recur.
const DREAMS = [
  ['The house with the extra corridor', 2, 'unsettled',
    'My grandmother\'s house again, but past the airing cupboard there was a corridor that has never been there. Same green carpet. It went further than the house could possibly go, and at the end there was a door I did not open.'],
  ['Tide coming in through the kitchen', 9, 'calm',
    'Water was rising through the kitchen floor, warm and clear, and nobody minded. Sofia was making tea and the sea was at her ankles. Somehow this was normal and had happened before.'],
  ['The corridor, from the other end', 16, 'unsettled',
    'Standing at the far door this time, looking back down the extra corridor toward the airing cupboard. The green carpet again. I understood that the house was longer on the inside and always had been.'],
  ['Owls on the telephone wire', 23, 'wonder',
    'Six owls along the wire outside the old flat, all facing the same way. When I looked up they turned their heads together, like one thing with six heads.'],
  ['The bridge that keeps going', 31, 'restless',
    'Cycling over the bridge near Kelvin Street and it just kept extending — every time I reached the middle, the middle moved. Not frightening, only tiring.'],
  ['Sofia\'s house underwater', 38, 'calm',
    'The tide dream again but it was Sofia\'s house this time, and the water had reached the pictures. She was completely unbothered. We drank the tea standing up.'],
  ['Rehearsing in an empty theatre', 45, 'exposed',
    'I had to go on in a play I had never read. The theatre was enormous and empty except for Marguerite in the third row, who kept nodding encouragingly.'],
  ['The green carpet in a hotel', 52, 'unsettled',
    'A hotel corridor, but it was my grandmother\'s green carpet underfoot. I kept checking the room numbers and they were all 14.'],
  ['Owls again, in daylight', 60, 'wonder',
    'The same six owls, but at noon and inside the supermarket, along the top of the freezer aisle. Nobody else looked up.'],
  ['Swimming in the reservoir at night', 68, 'calm',
    'Warm black water, no bottom, no fear. Callum was somewhere ahead and I could hear him but not see him.'],
  ['The bridge, walking this time', 76, 'restless',
    'Same bridge near Kelvin Street, on foot, carrying something heavy I never identified. It still kept extending, and I still was not afraid, only tired.'],
  ['A door I finally opened', 84, 'wonder',
    'The end of the corridor again. This time I opened it and it was simply the airing cupboard, from the wrong side. That felt like an answer.'],
  ['Marguerite in the third row again', 92, 'exposed',
    'Another theatre, smaller, but Marguerite was in the third row exactly as before, nodding. I still had not read the play.'],
  ['The supermarket at 4am', 99, 'calm',
    'Empty supermarket, all the lights on, and the freezer aisle humming. Sofia was choosing between two identical things and could not decide.'],
  ['Cycling the long way round', 106, 'restless',
    'Avoiding the Kelvin Street bridge entirely, taking the towpath, and arriving at the bridge anyway from the other side.'],
  ['Water at the top of the stairs', 113, 'calm',
    'The tide had reached the landing this time. Warm and clear as always. Callum was sitting on the top step with his feet in it.'],
  ['Owls in my grandmother\'s house', 120, 'wonder',
    'The six owls were along the picture rail in the front room, above the green carpet. Two things that do not belong together, together.'],
  ['A play I have read', 127, 'calm',
    'The theatre again, but this time I knew every line. Marguerite was not there, and I minded that more than I expected.'],
  ['The reservoir in winter', 134, 'restless',
    'Black water again but cold this time, and I would not go in. Callum was already out in the middle, not calling.'],
  ['Room 14', 141, 'unsettled',
    'The hotel corridor, all doors numbered 14, and the green carpet. I tried a key in one of them and it turned.'],
  ['Six owls, one wire, no sound', 148, 'wonder',
    'The wire outside the old flat. Six owls. Completely silent, which is how I knew it was the dream and not a memory.'],
  ['Sofia at the door', 155, 'calm',
    'She was at the end of the extra corridor, on the other side of the door I do not open, saying it was fine and I could come through.'],
  ['The bridge, from underneath', 162, 'restless',
    'Standing on the towpath under the Kelvin Street bridge watching it extend above me, span after span, out over nothing.'],
  ['Tea while it rose', 169, 'calm',
    'Sofia\'s kitchen, the water at the windowsill, both of us drinking tea and talking about something ordinary I cannot recall.'],
  ['The airing cupboard, from inside', 176, 'wonder',
    'Inside the cupboard looking out at the extra corridor. The green carpet ran right up to my feet. Nothing frightening about it at all.'],
  ['Freezer aisle owls', 183, 'wonder',
    'The supermarket again, the owls along the freezers again, and this time Sofia looked up too and said nothing about it.'],
];

// source -> target: which dream calls back to which. This is the web.
const REFS = [
  [0, 2], [2, 7], [7, 11], [0, 11], [2, 11], [11, 24], [7, 19], [19, 24],
  [1, 5], [5, 9], [9, 15], [15, 23], [5, 23], [1, 23],
  [3, 8], [8, 16], [16, 20], [20, 25], [3, 20], [8, 25],
  [4, 10], [10, 14], [14, 22], [4, 22], [10, 22],
  [6, 12], [12, 17], [6, 17],
  [13, 25], [13, 8],
  [18, 15], [18, 9],
  [21, 5], [21, 1],
];

// name, kind, dream indexes it appears in
const ENTITIES = [
  ['Sofia', 'person', [1, 5, 13, 21, 23, 25]],
  ['Marguerite', 'person', [6, 12, 17]],
  ['Callum', 'person', [9, 15, 18]],
  ['my grandmother\'s house', 'place', [0, 2, 7, 11, 16, 19, 24]],
  ['Kelvin Street bridge', 'place', [4, 10, 14, 22]],
  ['the reservoir', 'place', [9, 18]],
  ['the old flat', 'place', [3, 20]],
  ['the theatre', 'place', [6, 12, 17]],
  ['the supermarket', 'place', [8, 13, 25]],
  ['owls', 'thing', [3, 8, 16, 20, 25]],
  ['green carpet', 'thing', [0, 2, 7, 16, 19, 24]],
  ['rising water', 'thing', [1, 5, 9, 15, 23]],
  ['tea', 'thing', [1, 23]],
  ['a door I do not open', 'situation', [0, 11, 21, 24]],
  ['being unprepared', 'situation', [6, 12]],
  ['something that keeps extending', 'situation', [4, 10, 14, 22]],
  ['a place that is longer inside', 'situation', [0, 2, 19, 24]],
];

const stmts = [];
for (const t of ['entity_mentions', 'entities', 'dream_refs', 'dream_entries', 'dreams', 'users']) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO users (id, provider, google_sub, email, display_name, anthropic_api_key, anthropic_api_key_hint, created_at) VALUES (1, ?, NULL, NULL, ?, NULL, NULL, ?)',
  args: ['local', 'Demo', now - 500 * day],
});

DREAMS.forEach(([title, daysAgo, mood, body], i) => {
  const refCount = REFS.filter(([s, t]) => s === i || t === i).length;
  stmts.push({
    sql: `INSERT INTO dreams
      (id, user_id, title, body, dream_date, mood, song, source_id, source_modified,
       from_notes_tagged_at, created_at, updated_at, ref_count)
      VALUES (?, 1, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?, ?)`,
    args: [i + 1, title, body, dstr(daysAgo), mood, now - daysAgo * day, now - daysAgo * day, refCount],
  });
});

REFS.forEach(([s, t]) => {
  stmts.push({
    sql: 'INSERT INTO dream_refs (source_dream_id, target_dream_id) VALUES (?, ?)',
    args: [s + 1, t + 1],
  });
});

ENTITIES.forEach(([name, kind, dreamIdx], i) => {
  stmts.push({
    sql: 'INSERT INTO entities (id, user_id, name, kind, dream_count, hidden, created_at) VALUES (?, 1, ?, ?, ?, 0, ?)',
    args: [i + 1, name, kind, dreamIdx.length, now - 400 * day],
  });
  for (const d of dreamIdx) {
    stmts.push({
      sql: 'INSERT INTO entity_mentions (entity_id, dream_id, count) VALUES (?, ?, ?)',
      args: [i + 1, d + 1, 1 + (d % 2)],
    });
  }
});

await db.batch(stmts, 'write');

for (const t of ['dreams', 'dream_refs', 'entities', 'entity_mentions']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t}: ${rows[0].n}`);
}
console.log(`seeded ${url}`);
