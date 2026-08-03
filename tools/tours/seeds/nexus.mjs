// Seeds a throwaway demo DB for nexus with an invented social graph.
//
// SAFETY: nexus's .env points TURSO_DATABASE_URL at the PRODUCTION Turso
// database holding real, private information about real people. This script
// hard-refuses to run against anything but a local file: URL. Do not soften
// that check.
//
// Everyone below is fictional.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}

const db = createClient({ url });

const USER = { id: 'demo-user-nexus', email: 'demo@crystalprism.io', name: 'Demo' };

const CIRCLES = [
  ['c-family', 'Family', 0],
  ['c-friends', 'Friends', 1],
  ['c-work', 'Work', 2],
  ['c-neighbours', 'Neighbourhood', 3],
];

const now = Math.floor(Date.now() / 1000);
const day = 86400;
const iso = (daysAgo) => new Date((now - daysAgo * day) * 1000).toISOString().slice(0, 10);

// name, circle, relationToMe, closeness, yearMet, colour, mbti, enneagram,
// loveLanguage, gender, daysSinceContact, location
const PEOPLE = [
  ['Ada Whitlock', 'c-family', 'Mother', 4, 1961, '#e8b4c8', 'ENFJ', 2, 'time', 'woman', 3, 'Bath'],
  ['Gerald Whitlock', 'c-family', 'Father', 4, 1958, '#7fa8d4', 'ISTJ', 1, 'acts', 'man', 9, 'Bath'],
  ['Nora Whitlock', 'c-family', 'Sister', 4, 1991, '#f2c76a', 'ENFP', 7, 'words', 'woman', 2, 'Bristol'],
  ['Tom Whitlock', 'c-family', 'Brother', 3, 1994, '#8fd4a8', 'INTP', 5, 'time', 'man', 21, 'Leeds'],
  ['Marguerite Ellery', 'c-family', 'Grandmother', 3, 1935, '#c9a8e8', 'ISFJ', 9, 'gifts', 'woman', 14, 'Wells'],
  ['Priya Raman', 'c-friends', null, 4, 2009, '#e88fa8', 'ENTP', 7, 'time', 'woman', 1, 'London'],
  ['Callum Reyes', 'c-friends', null, 3, 2012, '#6ec3d4', 'ISFP', 4, 'words', 'man', 6, 'Manchester'],
  ['Ingrid Soltau', 'c-friends', null, 3, 2016, '#f2a06a', 'INFJ', 4, 'time', 'woman', 34, 'Copenhagen'],
  ['Bo Lindqvist', 'c-friends', null, 2, 2018, '#a8d46e', 'ESTP', 8, 'touch', 'nonbinary', 58, 'Malmö'],
  ['Yusuf Demir', 'c-friends', null, 3, 2014, '#d48fc3', 'ENFP', 2, 'acts', 'man', 11, 'Berlin'],
  ['Harriet Nwosu', 'c-work', null, 3, 2019, '#6ea8d4', 'INTJ', 3, 'words', 'woman', 4, 'London'],
  ['Sam Okonkwo', 'c-work', null, 2, 2021, '#e8c76a', 'ESFJ', 6, 'acts', 'man', 8, 'London'],
  ['Delphine Roux', 'c-work', null, 2, 2020, '#c36ed4', 'ENTJ', 8, 'time', 'woman', 26, 'Paris'],
  ['Rafael Costa', 'c-work', null, 2, 2022, '#6ed4a8', 'ISTP', 5, 'acts', 'man', 41, 'Lisbon'],
  ['June Halloway', 'c-neighbours', null, 2, 2017, '#d4a86e', 'ISFJ', 9, 'gifts', 'woman', 7, 'Bath'],
  ['Otto Halloway', 'c-neighbours', null, 1, 2017, '#8f8fd4', 'ISTJ', 1, 'acts', 'man', 63, 'Bath'],
  ['Wren Ashby', 'c-friends', null, 4, 2005, '#e86e8f', 'INFP', 4, 'words', 'nonbinary', 1, 'Bath'],
  ['Solveig Aas', 'c-friends', null, 2, 2021, '#6ed4c3', 'ENFJ', 2, 'time', 'woman', 47, 'Oslo'],
];

const id = (name) => 'p-' + name.toLowerCase().replace(/[^a-z]+/g, '-');

// Kinship between OTHER people (your own edges are derived from relationToMe).
const CONNECTIONS = [
  ['Ada Whitlock', 'Gerald Whitlock', 'partner', 'partner'],
  ['Marguerite Ellery', 'Ada Whitlock', 'parent', 'mother'],
  ['Ada Whitlock', 'Nora Whitlock', 'parent', 'mother'],
  ['Gerald Whitlock', 'Nora Whitlock', 'parent', 'father'],
  ['Ada Whitlock', 'Tom Whitlock', 'parent', 'mother'],
  ['Gerald Whitlock', 'Tom Whitlock', 'parent', 'father'],
  ['Nora Whitlock', 'Tom Whitlock', 'sibling', 'sibling'],
  ['June Halloway', 'Otto Halloway', 'partner', 'partner'],
];

// Social edges — these draw the constellation lines between non-family stars.
const TIES = [
  ['Priya Raman', 'Callum Reyes', 'friend', 3],
  ['Priya Raman', 'Wren Ashby', 'friend', 4],
  ['Callum Reyes', 'Yusuf Demir', 'friend', 2],
  ['Ingrid Soltau', 'Bo Lindqvist', 'friend', 3],
  ['Ingrid Soltau', 'Solveig Aas', 'friend', 2],
  ['Harriet Nwosu', 'Sam Okonkwo', 'coworker', 3],
  ['Harriet Nwosu', 'Delphine Roux', 'coworker', 2],
  ['Sam Okonkwo', 'Rafael Costa', 'coworker', 2],
  ['Delphine Roux', 'Rafael Costa', 'coworker', 3],
  ['Wren Ashby', 'June Halloway', 'friend', 2],
  ['Yusuf Demir', 'Solveig Aas', 'friend', 2],
  ['Priya Raman', 'Harriet Nwosu', 'friend', 2],
  ['Nora Whitlock', 'Wren Ashby', 'friend', 3],
];

const stmts = [];

for (const t of [
  'group_members', 'groups', 'ties', 'connections', 'pulse_suggestions',
  'profiles', 'people', 'circles', 'users',
]) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO users (id, email, name, image, created_at) VALUES (?, ?, ?, NULL, ?)',
  args: [USER.id, USER.email, USER.name, now - 900 * day],
});

stmts.push({
  sql: `INSERT INTO profiles (user_id, mbti, photo_url, aliases, enneagram, favorite_color,
        love_language, birthday, location, likes, adjectives, notes, created_at, updated_at)
        VALUES (?, 'INFJ', NULL, NULL, 4, '#f0d9a8', 'time', '1990-04-11', 'Bath', NULL, NULL, NULL, ?, ?)`,
  args: [USER.id, now - 900 * day, now],
});

for (const [cid, name, position] of CIRCLES) {
  stmts.push({
    sql: 'INSERT INTO circles (id, user_id, name, position, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [cid, USER.id, name, position, now - 800 * day],
  });
}

for (const [name, circleId, relation, closeness, yearMet, colour, mbti, enneagram, love, gender, since, location] of PEOPLE) {
  stmts.push({
    sql: `INSERT INTO people
      (id, user_id, name, photo_url, location, circle_id, closeness, how_we_met, year_met,
       gift_match, dream_match, relation_to_me, aliases, likes, adjectives, dream_decisions,
       gift_dismissed, mbti, enneagram, favorite_color, love_language, gender, notes,
       birthday, last_connected, created_at, updated_at)
      VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, ?, NULL, NULL, ?, NULL, NULL, NULL, NULL, NULL,
              ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
    args: [
      id(name), USER.id, name, location, circleId, closeness, yearMet, relation,
      mbti, enneagram, colour, love, gender, iso(since), now - 700 * day, now,
    ],
  });
}

CONNECTIONS.forEach(([a, b, kind, label], i) => {
  stmts.push({
    sql: 'INSERT INTO connections (id, user_id, person_a_id, person_b_id, label, kind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [`conn-${i + 1}`, USER.id, id(a), id(b), label, kind, now - 600 * day],
  });
});

TIES.forEach(([a, b, type, weight], i) => {
  stmts.push({
    sql: 'INSERT INTO ties (id, user_id, person_a_id, person_b_id, type, reverse_type, weight, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)',
    args: [`tie-${i + 1}`, USER.id, id(a), id(b), type, weight, now - 500 * day],
  });
});

await db.batch(stmts, 'write');

for (const t of ['people', 'circles', 'connections', 'ties']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t}: ${rows[0].n}`);
}
console.log(`seeded ${url}`);
