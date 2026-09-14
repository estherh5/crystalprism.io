// Seeds a throwaway demo DB for restock with an invented household's inventory.
//
// SAFETY: this script hard-refuses to run against anything but a local file:
// URL, exactly like the other seeds here. NO real personal data — the owner
// account is demo@crystalprism.io, not a real address, and every product name
// below is invented.
//
// SHAPE: restock's sidebar is four rows (Inventory · To order · Household ·
// Admin), reached from a household consolidation that folded the old
// /deliveries page into a "On the way" section at the bottom of /shopping-list
// and the old /trends page into a usage strip (Use rate, Runs out, sparkline)
// at the top of the item edit drawer on /inventory. Both retired routes now
// redirect, so this seed has to make the SURVIVING surfaces worth filming
// rather than the pages themselves:
//
//   - every item gets ~60 days of real `adjustment` rows, ending EXACTLY at
//     that item's current qty, so `estimateRatePerDay` (lib/predict.ts) has
//     real signal and the drawer's sparkline has real shape instead of a
//     flat line or the "not enough history yet" hint;
//   - qty/reorderAt pairs are chosen to land a believable spread across all
//     three statuses (reorder / low / stocked);
//   - six items carry a Subscribe & Save delivery (`snsEnabled`, `snsNextAt`),
//     with a mix of coverage: some where the shipment beats the predicted
//     run-out (`covered`, per `lib/predict.ts` `isCovered`), one where it
//     does not (the run-out lands before the delivery), and one overdue.
//
// The owner is a real accepted household member, not just a user row:
// `lib/guard.ts` `assertMember` / `currentHouseholdId` both require a
// `householdMember` row with a non-null `acceptedAt`, and `lib/household.ts`
// `ensureHousehold` is idempotent on exactly that — so seeding it up front
// means the app's own first-load logic finds an existing household instead
// of minting a second, empty one.

import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
}

const db = createClient({ url });

const DAY = 86_400_000;
const now = Date.now();

const USER = { id: 'demo-user-restock', email: 'demo@crystalprism.io', name: 'Demo' };
const HOUSEHOLD_ID = 'hh-demo-restock';

// ---------------------------------------------------------------------------
// Categories — restock's real six, not the app's five stock CATEGORY_SEEDS
// (Kitchen/Household/Bathroom/Pets/Health). Item.category is a plain string,
// not a foreign key, so these just need to match what the items below use.
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: 'cat-supplements', name: 'Supplements', emoji: '✚', color: '#fbe4ea', sortOrder: 0 },
  { id: 'cat-pantry', name: 'Pantry', emoji: '✦', color: '#fce7d6', sortOrder: 1 },
  { id: 'cat-bathroom', name: 'Bathroom', emoji: '❦', color: '#eee7f6', sortOrder: 2 },
  { id: 'cat-cleaning', name: 'Cleaning', emoji: '✧', color: '#eaf1fb', sortOrder: 3 },
  { id: 'cat-pet', name: 'Pet', emoji: '✿', color: '#f8e3ee', sortOrder: 4 },
  { id: 'cat-paper', name: 'Paper Goods', emoji: '❥', color: '#f4ece0', sortOrder: 5 },
];

// ---------------------------------------------------------------------------
// Items. Each row: [id, name, category, unit, emoji, qty, reorderAt,
//   ratePerDay, restockQty, restockEveryDays, priceCents, sns]
//
// `sns`, when present: { inDays, deliveryQty } — inDays may be negative
// (overdue). Coverage is not chosen directly; it falls out of qty/rate/inDays
// exactly the way lib/predict.ts `isCovered` computes it for real, so the
// badges and chips the tour records are the app's own arithmetic, not a
// staged label.
// ---------------------------------------------------------------------------

const ITEMS = [
  // Supplements
  ['sup-vitd', 'Vitamin D3 5000 IU', 'Supplements', 'bottles', '\u{1F7E1}', 0, 1, 0.017, 2, 55, 1499, null],
  ['sup-mag', 'Magnesium Glycinate', 'Supplements', 'bottles', '\u{1F48A}', 2, 1, 0.02, 2, 50, 1899, null],
  ['sup-omega', 'Omega-3 Fish Oil 1000mg', 'Supplements', 'bottles', '\u{1F41F}', 4, 1, 0.018, 2, 60, 2199, null],
  ['sup-probiotic', 'Probiotic 50 Billion CFU', 'Supplements', 'bottles', '\u{1F9EB}', 2, 1, 0.02, 2, 55, 2499, null],
  ['sup-bcomplex', 'B-Complex Capsules', 'Supplements', 'bottles', '⚡', 3, 1, 0.02, 2, 60, 1599, null],

  // Pantry
  ['pan-oats', 'Organic Rolled Oats', 'Pantry', 'bags', '\u{1F33E}', 3, 1, 0.03, 1, 45, 699, null],
  ['pan-rice', 'Jasmine Rice 5lb', 'Pantry', 'bags', '\u{1F35A}', 2, 1, 0.025, 1, 50, 899, null],
  ['pan-coffee', 'Dark Roast Coffee Beans', 'Pantry', 'bags', '☕', 1, 1, 0.06, 2, 30, 1299, { inDays: 6, deliveryQty: 2 }],
  ['pan-oliveoil', 'Extra Virgin Olive Oil', 'Pantry', 'bottles', '\u{1FAD2}', 3, 1, 0.02, 1, 60, 1099, null],
  ['pan-honey', 'Raw Local Honey', 'Pantry', 'jars', '\u{1F36F}', 2, 1, 0.025, 1, 55, 899, null],

  // Bathroom
  ['bath-shampoo', 'Lavender Shampoo Bar', 'Bathroom', 'bars', '\u{1F9F4}', 1, 1, 0.05, 2, 35, 1499, { inDays: 2, deliveryQty: 2 }],
  ['bath-toothpaste', 'Fluoride-Free Toothpaste', 'Bathroom', 'tubes', '\u{1F9B7}', 1, 1, 0.033, 2, 60, 799, null],
  ['bath-soap', 'Oatmeal Bar Soap', 'Bathroom', 'bars', '\u{1F9FC}', 4, 1, 0.04, 3, 60, 599, null],
  ['bath-floss', 'Mint Dental Floss', 'Bathroom', 'packs', '\u{1F9B7}', 2, 1, 0.02, 2, 70, 499, null],
  ['bath-conditioner', 'Argan Oil Conditioner', 'Bathroom', 'bottles', '\u{1F9F4}', 3, 1, 0.025, 2, 60, 1399, null],

  // Cleaning
  ['clean-laundry', 'Free & Clear Laundry Detergent', 'Cleaning', 'bottles', '\u{1F9FA}', 1, 1, 0.1, 2, 40, 1199, { inDays: 14, deliveryQty: 2 }],
  ['clean-dish', 'Fragrance-Free Dish Soap', 'Cleaning', 'bottles', '\u{1F9FC}', 2, 1, 0.04, 2, 45, 599, null],
  ['clean-allpurpose', 'All-Purpose Cleaner Spray', 'Cleaning', 'bottles', '\u{1F9F4}', 3, 1, 0.03, 2, 60, 699, null],
  ['clean-sponges', 'Multi-Pack Scrub Sponges', 'Cleaning', 'packs', '\u{1F9FD}', 1, 1, 0.04, 2, 50, 499, null],
  ['clean-glass', 'Streak-Free Glass Cleaner', 'Cleaning', 'bottles', '\u{1FA9F}', 3, 1, 0.025, 2, 70, 599, null],

  // Pet
  ['pet-dogfood', 'Salmon & Rice Dog Food 30lb', 'Pet', 'bags', '\u{1F415}', 1, 1, 0.045, 1, 30, 3499, { inDays: -3, deliveryQty: 1 }],
  ['pet-litter', 'Clumping Cat Litter 20lb', 'Pet', 'tubs', '\u{1F408}', 1, 1, 0.04, 1, 35, 1899, { inDays: 3, deliveryQty: 1 }],
  ['pet-treats', 'Training Treats, Chicken', 'Pet', 'bags', '\u{1F9B4}', 3, 1, 0.03, 2, 55, 899, null],
  ['pet-catfood', 'Pate Variety Cat Food 12-pack', 'Pet', 'packs', '\u{1F31F}', 2, 1, 0.035, 2, 40, 1699, null],
  ['pet-flea', 'Flea & Tick Chews, Monthly', 'Pet', 'packs', '\u{1F98B}', 4, 1, 0.02, 3, 90, 2999, null],

  // Paper Goods
  ['paper-tp', 'Ultra Soft Toilet Paper 12-Pack', 'Paper Goods', 'packs', '\u{1F9FB}', 2, 1, 0.05, 1, 40, 1399, { inDays: 5, deliveryQty: 1 }],
  ['paper-towels', 'Select-A-Size Paper Towels', 'Paper Goods', 'packs', '\u{1F9FB}', 1, 1, 0.06, 2, 35, 1199, null],
  ['paper-tissue', 'Facial Tissues 3-Pack', 'Paper Goods', 'packs', '\u{1F933}', 3, 1, 0.03, 2, 70, 599, null],
  ['paper-napkins', 'Dinner Napkins 200-Count', 'Paper Goods', 'packs', '\u{1F9FB}', 3, 1, 0.02, 2, 90, 499, null],
  ['paper-trash', 'Kitchen Trash Bags 13-Gal', 'Paper Goods', 'boxes', '\u{1F5D1}', 2, 1, 0.045, 2, 45, 999, null],
];

// ---------------------------------------------------------------------------
// Adjustment history — deterministic per item (seeded on its id), so re-runs
// of this script produce the same demo data.
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let s = seed | 0;
  return function rand() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h;
}

/**
 * Builds ~60 days of `adjustment` rows for one item: periodic small usage
 * decrements with occasional larger restock jumps, ending EXACTLY at
 * `finalQty` — which is what the item's own row (below) states as current
 * stock. The very last row's delta is forced to land there, so the drawer's
 * headline numbers and the sparkline's final point can never disagree.
 */
function buildHistory({ itemId, householdId, finalQty, ratePerDay, restockQty, restockEveryDays, days = 60 }) {
  const rng = mulberry32(hashSeed(itemId));
  const startQty = Math.max(
    finalQty + Math.round(ratePerDay * days * (0.5 + rng() * 0.4)),
    finalQty + 1,
  );

  const rows = [];
  let qty = startQty;
  let daysAgo = days;
  let daysSinceRestock = 0;

  while (daysAgo > 1.5) {
    const interval = 3 + rng() * 4;
    daysAgo -= interval;
    if (daysAgo < 1.5) daysAgo = 1.5;
    daysSinceRestock += interval;

    let delta;
    if (daysSinceRestock >= restockEveryDays && rng() > 0.15) {
      delta = restockQty + Math.round((rng() - 0.5) * restockQty * 0.3);
      daysSinceRestock = 0;
    } else {
      const used = Math.max(1, Math.round(ratePerDay * interval * (0.6 + rng() * 0.8)));
      delta = -used;
    }

    qty = Math.max(0, qty + delta);
    const at = Math.round(now - daysAgo * DAY);
    rows.push({
      id: `${itemId}-adj${rows.length}`,
      itemId,
      householdId,
      at,
      delta,
      newQty: qty,
    });

    if (daysAgo <= 1.5) break;
  }

  // Force the final row to the item's real current quantity.
  if (rows.length > 0) {
    const last = rows[rows.length - 1];
    const prevQty = rows.length > 1 ? rows[rows.length - 2].newQty : startQty;
    last.newQty = finalQty;
    last.delta = finalQty - prevQty;
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Build statements
// ---------------------------------------------------------------------------

const stmts = [];

stmts.push({
  sql: `INSERT INTO user (id, name, email, emailVerified, image, last_active_at)
    VALUES (?, ?, ?, NULL, NULL, ?)`,
  args: [USER.id, USER.name, USER.email, now - 3 * 3600_000],
});

stmts.push({
  sql: `INSERT INTO household (id, name, ownerId, createdAt) VALUES (?, ?, ?, ?)`,
  args: [HOUSEHOLD_ID, "Demo's Home", USER.id, now - 200 * DAY],
});

stmts.push({
  sql: `INSERT INTO householdMember
    (id, householdId, userId, email, role, invitedByName, invitedAt, acceptedAt)
    VALUES (?, ?, ?, ?, 'owner', NULL, ?, ?)`,
  args: ['hm-demo-owner', HOUSEHOLD_ID, USER.id, USER.email, now - 200 * DAY, now - 200 * DAY],
});

for (const cat of CATEGORIES) {
  stmts.push({
    sql: `INSERT INTO category (id, householdId, name, emoji, color, sortOrder, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [cat.id, HOUSEHOLD_ID, cat.name, cat.emoji, cat.color, cat.sortOrder, now - 200 * DAY],
  });
}

let adjustmentCount = 0;

for (const [
  id, name, category, unit, emoji, qty, reorderAt, ratePerDay, restockQty, restockEveryDays,
  priceCents, sns,
] of ITEMS) {
  const snsEnabled = sns != null;
  const snsNextAt = sns != null ? Math.round(now + sns.inDays * DAY) : null;
  const deliveryQty = sns != null ? sns.deliveryQty : null;

  stmts.push({
    sql: `INSERT INTO item
      (id, householdId, name, category, unit, qty, reorderAt, imageKind, emoji, photoUrl, url,
       defaultPerDay, snsEnabled, snsIntervalDays, snsNextAt, expiresAt, deliveryQty, priceCents,
       createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'emoji', ?, NULL, NULL,
       NULL, ?, NULL, ?, NULL, ?, ?,
       ?, ?)`,
    args: [
      id, HOUSEHOLD_ID, name, category, unit, qty, reorderAt, emoji,
      snsEnabled ? 1 : 0, snsNextAt, deliveryQty, priceCents,
      now - 180 * DAY, now - Math.round((1 + hashSeed(id) % 5) * DAY),
    ],
  });

  const history = buildHistory({
    itemId: id,
    householdId: HOUSEHOLD_ID,
    finalQty: qty,
    ratePerDay,
    restockQty,
    restockEveryDays,
  });
  adjustmentCount += history.length;
  for (const row of history) {
    stmts.push({
      sql: `INSERT INTO adjustment (id, itemId, householdId, at, delta, newQty)
        VALUES (?, ?, ?, ?, ?, ?)`,
      args: [row.id, row.itemId, row.householdId, row.at, row.delta, row.newQty],
    });
  }
}

await db.batch(stmts, 'write');

for (const t of ['user', 'household', 'householdMember', 'category', 'item', 'adjustment']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
  console.log(`  ${t}: ${rows[0].n}`);
}

console.log(`  ${ITEMS.length} items, ${adjustmentCount} adjustment rows`);
console.log(`seeded ${url}`);
