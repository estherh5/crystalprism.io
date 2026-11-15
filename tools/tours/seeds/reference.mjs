// ~/Developer/crystalprism.io/tools/tours/seeds/reference.mjs
// Seeds a throwaway demo DB for Reference with INVENTED people and occasions around real but
// generic works (a novel, an opera, an album). Nothing here is Esther's: her real saves name her
// family. Writes ONLY to the file: URL in DATABASE_URL (run Reference's own migrator first:
// `node scripts/migrate.mjs`).
//
// It also fills `lookupCache` for the one search the tour types ("Tosca") and that result's
// summary, so the lookup is answered from the cache and the demo server never calls Wikipedia or
// Open Library. Every imageUrl is null: a remote thumbnail would be an off-box request.
import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const db = createClient({ url });

const EMAIL = 'demo@crystalprism.io';
const OWNER = 'demo-user-reference';
const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.now();
const isoIn = (days) => new Date(now + days * DAY).toISOString().slice(0, 10);

await db.execute({ sql: 'insert or replace into user (id, name, email, createdAt) values (?, ?, ?, ?)', args: [OWNER, 'Demo', EMAIL, now - 60 * DAY] });

const PEOPLE = ['Walter', 'June', 'Marcus', 'Ines', 'Theo'];
for (const [i, name] of PEOPLE.entries()) {
  await db.execute({
    sql: 'insert or replace into people (id, ownerId, name, nexusPersonId, nexusName, createdAt) values (?, ?, ?, null, null, ?)',
    args: [`demo-person-${name.toLowerCase()}`, OWNER, name, now - (50 - i) * DAY],
  });
}

// [id, name or null (the app then names it "Evening · Nov 12"), days ago, hour offset from midnight UTC]
const OCCASIONS = [
  ['demo-occ-1', 'Sunday dinner at Walter’s', 1, 23],
  ['demo-occ-2', null, 5, 23],
  ['demo-occ-3', 'Coffee with June', 11, 15],
  ['demo-occ-4', null, 19, 17],
];
const occAt = Object.fromEntries(OCCASIONS.map(([id, , ago, h]) => [id, now - ago * DAY - ((now % DAY) - h * HOUR)]));
for (const [id, name] of OCCASIONS) {
  await db.execute({
    sql: 'insert or replace into occasions (id, ownerId, name, startedAt, latestAt) values (?, ?, ?, ?, ?)',
    args: [id, OWNER, name, occAt[id], occAt[id] + 40 * 60_000],
  });
}

// [id, title, kind, source, subtitle, summary, eventDate, status, occasion, person, minutes in, note]
const THINGS = [
  ['demo-thing-01', 'Middlemarch', 'book', 'wikipedia', 'Novel by George Eliot',
    'Middlemarch, A Study of Provincial Life is a novel by George Eliot, first published in eight installments in 1871 and 1872. It follows the lives of the people of a fictional English town.',
    null, 'saved', 'demo-occ-1', 'walter', 5, 'He reads it every ten years'],
  ['demo-thing-02', 'Kind of Blue', 'other', 'wikipedia', '1959 studio album by Miles Davis',
    'Kind of Blue is a studio album by the American jazz trumpeter Miles Davis, recorded in 1959. It is often named among the greatest jazz records ever made.',
    null, 'tried', 'demo-occ-1', 'walter', 12, null],
  ['demo-thing-03', 'La bohème', 'opera', 'wikipedia', 'Opera by Giacomo Puccini',
    'La bohème is an opera in four acts by Giacomo Puccini, first performed in Turin in 1896. It follows young artists living in the Latin Quarter of Paris.',
    null, 'saved', 'demo-occ-1', 'june', 25, null],
  ['demo-thing-04', 'Messiah sing-along', 'event', 'manual', null, null,
    isoIn(26), 'saved', 'demo-occ-1', 'walter', 32, 'Bring the old score'],
  ['demo-thing-05', 'The Remains of the Day', 'book', 'wikipedia', 'Novel by Kazuo Ishiguro',
    'The Remains of the Day is a 1989 novel by Kazuo Ishiguro. An English butler looks back on decades of service during a drive through the West Country.',
    null, 'saved', 'demo-occ-2', 'marcus', 4, null],
  ['demo-thing-06', 'Rumours', 'other', 'wikipedia', '1977 studio album by Fleetwood Mac',
    'Rumours is the eleventh studio album by the British-American rock band Fleetwood Mac, released in 1977.',
    null, 'saved', 'demo-occ-2', 'ines', 18, null],
  ['demo-thing-07', 'Spring lantern festival', 'event', 'manual', null, null,
    isoIn(48), 'saved', 'demo-occ-2', 'ines', 22, null],
  ['demo-thing-08', 'The Night Circus', 'book', 'wikipedia', 'Novel by Erin Morgenstern',
    'The Night Circus is a 2011 fantasy novel by Erin Morgenstern, about a magical competition staged inside a circus that opens only at night.',
    null, 'saved', 'demo-occ-3', 'june', 6, null],
  ['demo-thing-09', 'Spirited Away', 'other', 'wikipedia', '2001 film by Hayao Miyazaki',
    'Spirited Away is a 2001 Japanese animated fantasy film written and directed by Hayao Miyazaki.',
    null, 'tried', 'demo-occ-3', 'june', 14, null],
  ['demo-thing-10', 'Gödel, Escher, Bach', 'book', 'wikipedia', '1979 book by Douglas Hofstadter',
    'Gödel, Escher, Bach: an Eternal Golden Braid is a 1979 book by Douglas Hofstadter about how meaning can arise from formal systems.',
    null, 'saved', 'demo-occ-4', 'theo', 8, null],
  ['demo-thing-11', 'Cello Suites', 'other', 'wikipedia', 'Six suites by Johann Sebastian Bach',
    'The Cello Suites are six suites for unaccompanied cello by Johann Sebastian Bach, probably written in the early eighteenth century.',
    null, 'saved', 'demo-occ-4', 'theo', 20, null],
];

for (const [id, title, kind, source, subtitle, summary, eventDate, status, occ, person, mins, note] of THINGS) {
  const heard = occAt[occ] + mins * 60_000;
  const sourceId = source === 'manual' ? null : title;
  const thingUrl = sourceId ? `https://en.m.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` : null;
  const tried = status === 'tried' ? heard + 3 * DAY : null;
  await db.execute({
    sql: `insert or replace into things (id, ownerId, title, kind, source, sourceId, url, imageUrl, summary, subtitle, eventDate, status, triedAt, createdAt)
      values (?, ?, ?, ?, ?, ?, ?, null, ?, ?, ?, ?, ?, ?)`,
    args: [id, OWNER, title, kind, source, sourceId, thingUrl, summary, subtitle, eventDate, status, tried, heard],
  });
  await db.execute({
    sql: `insert or replace into mentions (id, thingId, personId, occasionId, heardAt, note, toldBackAt, createdAt)
      values (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [`${id}-m`, id, `demo-person-${person}`, occ, heard, note, tried ? tried + DAY : null, heard],
  });
}

// The tour types "Tosca": its results and the opera's summary come from here, never the network.
const results = [
  { source: 'wikipedia', sourceId: 'Tosca', title: 'Tosca', subtitle: 'Opera by Giacomo Puccini', imageUrl: null, kind: 'opera' },
  { source: 'wikipedia', sourceId: 'La Tosca', title: 'La Tosca', subtitle: '1887 play by Victorien Sardou', imageUrl: null, kind: 'other' },
  { source: 'wikipedia', sourceId: 'Tosca (1941 film)', title: 'Tosca (1941 film)', subtitle: 'Film directed by Carl Koch', imageUrl: null, kind: 'other' },
];
const summary = {
  ...results[0],
  summary:
    'Tosca is an opera in three acts by Giacomo Puccini to an Italian libretto by Luigi Illica and Giuseppe Giacosa. It premiered at the Teatro Costanzi in Rome on 14 January 1900.',
  url: 'https://en.m.wikipedia.org/wiki/Tosca',
};
const CACHE = [
  ['search:tosca', { results, unavailable: false }],
  ['summary:wikipedia:Tosca', summary],
];
for (const [key, body] of CACHE) {
  await db.execute({
    sql: 'insert or replace into lookupCache (key, body, fetchedAt) values (?, ?, ?)',
    args: [key, JSON.stringify(body), now],
  });
}

const count = async (t) => Number((await db.execute(`select count(*) as n from ${t}`)).rows[0].n);
console.log(`seeded ${await count('things')} things, ${await count('mentions')} mentions, ${await count('people')} people, ${await count('occasions')} occasions, ${await count('lookupCache')} cached lookups for ${EMAIL}`);
