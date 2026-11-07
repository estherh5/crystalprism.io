// ~/Developer/crystalprism.io/tools/tours/seeds/tastebuds.mjs
// Seeds a throwaway demo DB for Taste Buds with INVENTED places, visits, reviews and
// delivery orders for two invented people. Nothing here is Esther's or Ankur's; their
// real log is private. Writes ONLY to the file: URL in DATABASE_URL. Run tastebuds' own
// migrator first (`node scripts/migrate.mjs` with DATABASE_URL pointing at the file).
import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const db = createClient({ url });

const EMAIL = 'demo@crystalprism.io';
const OWNER = 'demo-user-tastebuds';
const PARTNER = 'demo-partner-tastebuds';
const DAY = 86_400_000;
const now = Date.now();
const ago = (d) => now - Math.round(d * DAY);
const dateAgo = (d) => new Date(ago(d)).toISOString().slice(0, 10);

// Google-shaped weekly periods: every day, open..close (hours, 24h clock).
const week = (open, close, days = [0, 1, 2, 3, 4, 5, 6]) =>
  days.map((day) => ({ open: { day, hour: open, minute: 0 }, close: { day, hour: close, minute: 0 } }));

// kind, name, cuisines, neighborhood, address, hours, price, tags
const PLACES = [
  ['restaurant', 'Saffron & Salt', ['Persian'], 'Queen Village', '412 Delancey Row', week(11, 22), 3, ['date night', 'special occasion']],
  ['cafe', 'Little Fig Cafe', ['Cafe', 'Bakery'], 'Fishtown', '88 Orchard Ave', week(7, 18), 2, ['coworking', 'quiet']],
  ['restaurant', 'Juniper Dumpling House', ['Chinese', 'Dumplings'], 'Chinatown', '1120 Race Lane', week(11, 21, [0, 2, 3, 4, 5, 6]), 2, ['groups', 'cheap eats']],
  ['cafe', 'The Daily Loaf', ['Bakery', 'Sandwiches'], 'Rittenhouse', '27 Pine Court', week(6, 16), 2, ['breakfast']],
  ['coworking', 'Parlor 9', ['Coworking'], 'Old City', '9 Market Passage', week(8, 20, [1, 2, 3, 4, 5]), 2, ['coworking', 'wifi']],
  ['restaurant', 'Moonrise Tacos', ['Mexican'], 'East Passyunk', '1604 Moonrise Blvd', week(12, 23), 2, ['groups', 'late night']],
  ['restaurant', 'Blue Hen Diner', ['Diner', 'American'], 'University City', '3300 Hen Street', week(7, 21), 1, ['breakfast', 'cheap eats']],
  ['restaurant', 'Olive & Ember', ['Mediterranean'], 'Graduate Hospital', '2210 Ember Way', week(17, 22), 3, ['date night']],
  ['delivery', 'Bao Bao Express', ['Taiwanese'], null, '', [], null, ['comfort food']],
  ['delivery', 'Green Bowl Co.', ['Salads', 'Healthy'], null, '', [], null, ['lunch']],
  ['delivery', 'Slice Society', ['Pizza'], null, '', [], null, ['groups']],
  ['restaurant', 'Cardamom Corner', ['Indian'], 'Northern Liberties', '503 Spice Alley', week(11, 22), 2, []],
];

// place name -> [visit days ago, owner [would_return, stars, liked, scores, dishes], partner [...]]
const dish = (name, verdict, note = '', safe = false) => ({ name, verdict, note, safe });
const REVIEWS = {
  'Saffron & Salt': [[26, ['yes', 5, 'The saffron rice is the whole reason to go. Quiet enough to talk.', { atmosphere: 4.5, service: 4.5, food: 5, foodQuality: 5, price: 3, value: 4, noise: 4 },
    [dish('Tahdig with stew', 'loved', 'Crispy edges, every time'), dish('Lamb shank', 'loved'), dish('Mast-o-khiar', 'fine')]],
    ['yes', 4.5, 'Lamb fell off the bone. Would book ahead for a Friday.', { atmosphere: 4.5, service: 4, food: 5, value: 4 }, [dish('Lamb shank', 'loved', 'Best of the night')]]]],
  'Little Fig Cafe': [[9, ['yes', 4.5, 'Our Tuesday spot: outlets at every table and the cardamom bun is the move.', { atmosphere: 4.5, space: 4, noise: 3.5, internet: 5, charger: 5, drinkQuality: 4.5, price: 3.5 },
    [dish('Cardamom bun', 'loved'), dish('Oat flat white', 'fine')]],
    ['maybe', 3.5, 'Good coffee, a little loud after ten.', { noise: 2.5, internet: 4, drinkQuality: 4 }, []]]],
  'Juniper Dumpling House': [[18, ['yes', 4, 'Pork and chive, fried. Order two plates.', { food: 4.5, service: 3.5, price: 4.5, value: 5 },
    [dish('Pork and chive dumplings', 'loved'), dish('Scallion pancake', 'fine'), dish('Hot and sour soup', 'skip', 'Too sour')]],
    ['yes', 4, null, { food: 4.5, value: 5 }, [dish('Pork and chive dumplings', 'loved')]]]],
  'The Daily Loaf': [[5, ['yes', 4, 'Egg sandwich on the seeded roll. Line moves fast.', { food: 4, service: 4.5, price: 3.5 }, [dish('Egg and cheddar roll', 'loved')]],
    null]],
  'Parlor 9': [[3, ['yes', 4.5, 'Day pass is worth it: big desks, phone booths, fast wifi.', { space: 4.5, noise: 4, internet: 5, charger: 4.5, price: 3, bathroom: 4 }, []], null]],
  'Moonrise Tacos': [[40, ['maybe', 3.5, 'Al pastor was great, salsa bar was the star.', { food: 4, atmosphere: 4, service: 3 }, [dish('Al pastor', 'loved'), dish('Nopal taco', 'fine')]],
    ['yes', 4, 'Margarita flight and late hours. Loud in a fun way.', { atmosphere: 4.5, noise: 2, value: 4 }, [dish('Al pastor', 'loved')]]]],
  'Blue Hen Diner': [[60, [null, null, null, null, []],
    ['yes', 3.5, 'Pancakes are exactly what they should be.', { food: 3.5, price: 5, value: 4.5 }, [dish('Buttermilk pancakes', 'loved')]]]],
};

// Delivery orders: place, service, days ago, total cents, owner review, partner review
const ORDERS = [
  ['Bao Bao Express', 'ubereats', 4, 3842, ['yes', 4.5, 'Braised pork bao arrived hot and still soft.', {}, [dish('Braised pork bao', 'loved'), dish('Cucumber salad', 'fine')]], ['yes', 4, null, {}, [dish('Braised pork bao', 'loved')]]],
  ['Green Bowl Co.', 'doordash', 11, 2475, ['maybe', 3, 'Fresh, but the dressing pooled at the bottom.', {}, [dish('Harvest bowl', 'fine')]], null],
  ['Slice Society', 'grubhub', 19, 3190, ['yes', 4, 'Hot honey pie travelled well.', {}, [dish('Hot honey pie', 'loved')]], ['yes', 4.5, null, {}, [dish('Hot honey pie', 'loved')]]],
  ['Bao Bao Express', 'ubereats', 33, 2960, ['yes', 4, null, {}, [dish('Scallion noodles', 'loved')]], null],
];

for (const t of ['photos', 'dish_lines', 'reviews', 'orders', 'visits', 'place_tags', 'place_lists', 'maps_lists', 'import_links', 'unmatched', 'import_runs', 'places', 'invites', 'users']) {
  await db.execute(`delete from ${t}`);
}
const user = (id, email, name, letter, color, created) =>
  db.execute({ sql: 'insert into users (id, email, name, tag_letter, tag_color, created_at) values (?,?,?,?,?,?)', args: [id, email, name, letter, color, created] });
await user(OWNER, EMAIL, 'Demo', 'E', '#d4127a', ago(120));
await user(PARTNER, 'sam@example.com', 'Sam', 'A', '#0b7f86', ago(100));
// The partner has accepted, so the owner's setup checklist is out of the way.
await db.execute({
  sql: 'insert into invites (id, email, token, invitedBy, createdAt, expiresAt, acceptedAt) values (?,?,?,?,?,?,?)',
  args: [randomUUID(), 'sam@example.com', randomUUID(), EMAIL, ago(101), ago(94), ago(100)],
});

const placeId = {};
let n = 0;
for (const [kind, name, cuisines, hood, address, hours, price, tags] of PLACES) {
  const id = randomUUID();
  placeId[name] = id;
  const delivery = kind === 'delivery';
  await db.execute({
    sql: `insert into places (id, google_place_id, delivery_url, name, kind, cuisines, address, neighborhood, hours, price_level, want_delivery, created_at)
          values (?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, delivery ? null : `demo-place-${++n}`, delivery ? `https://example.com/order/${n++}` : null, name, kind, JSON.stringify(cuisines), address, hood,
      hours.length ? JSON.stringify(hours) : null, price, 0, ago(90 - n)],
  });
  for (const tag of tags) await db.execute({ sql: 'insert into place_tags (place_id, tag) values (?,?)', args: [id, tag] });
}

async function review(userId, ids, [wouldReturn, stars, liked, scores, dishes], when) {
  const rid = randomUUID();
  await db.execute({
    sql: `insert into reviews (id, user_id, visit_id, order_id, would_return, liked, stars, scores, source, created_at) values (?,?,?,?,?,?,?,?,?,?)`,
    args: [rid, userId, ids.visit ?? null, ids.order ?? null, wouldReturn, liked ?? '', stars, JSON.stringify(scores ?? {}), 'app', when],
  });
  for (const d of dishes) {
    await db.execute({
      sql: 'insert into dish_lines (id, review_id, name, verdict, safe, note) values (?,?,?,?,?,?)',
      args: [randomUUID(), rid, d.name, d.verdict, d.safe ? 1 : 0, d.note],
    });
  }
}

const snap = (name) => {
  const p = PLACES.find((x) => x[1] === name);
  return JSON.stringify({ name, address: p[4] });
};
for (const [name, [[days, mine, theirs]]] of Object.entries(REVIEWS).map(([k, v]) => [k, v])) {
  const vid = randomUUID();
  await db.execute({
    sql: 'insert into visits (id, place_id, date, snapshot, created_at) values (?,?,?,?,?)',
    args: [vid, placeId[name], dateAgo(days), snap(name), ago(days)],
  });
  if (mine && mine[0]) await review(OWNER, { visit: vid }, mine, ago(days));
  if (theirs) await review(PARTNER, { visit: vid }, theirs, ago(days));
}
let k = 0;
for (const [name, service, days, total, mine, theirs] of ORDERS) {
  const oid = randomUUID();
  await db.execute({
    sql: 'insert into orders (id, place_id, service, order_number, date, total, source, snapshot, created_at) values (?,?,?,?,?,?,?,?,?)',
    args: [oid, placeId[name], service, `DEMO-${++k}`, dateAgo(days), total, 'manual', snap(name), ago(days)],
  });
  if (mine) await review(OWNER, { order: oid }, mine, ago(days));
  if (theirs) await review(PARTNER, { order: oid }, theirs, ago(days));
}

const [{ c }] = (await db.execute('select count(*) c from places')).rows;
console.log(`seeded ${c} places, ${ORDERS.length} orders, 2 people into ${url}`);
