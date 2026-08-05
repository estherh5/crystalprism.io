// Seeds a throwaway demo DB for tide with invented personal-finance data.
//
// SAFETY: tide holds real bank balances and a real transaction history for a
// real person, reached through a live SimpleFIN link. None of it may appear in
// a public video, so this script hard-refuses to run against anything but a
// local file: URL, exactly like the other seeds here.
//
// It also writes ZERO rows to `institution_link`. That table's `accessUrlEnc`
// is the encrypted SimpleFIN access URL — the credential itself — and the
// settings page decrypts it on render. No link row means there is nothing to
// decrypt, nothing to sync, and no path by which a recording can reach
// SimpleFIN. The accounts on the overview are ordinary rows with a null
// `linkId`, which is what a linked account looks like once its provider is
// forgotten.
//
// The numbers are built to exercise the app's actual display logic rather than
// to look full:
//   - net worth ends at its own 12-month peak, so the vessel fills and the
//     dashed "last month" tide mark lands just below the rim;
//   - this month is seeded only through today, so "Spent this month" is a real
//     partial-month total against real limits, not a staged full month;
//   - one transaction is left pending, because the overview says so in words
//     ("$X pending, not yet counted") and a video should show the sentence
//     with a number behind it;
//   - six prior months carry income, because `earnedTrend` takes the trailing
//     median of months that actually had some — with none, the Earned block
//     falls back to a fixed resting level and says "First month tracked".

import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
}

const db = createClient({ url });

const USER = { id: 'demo-user-tide', email: 'demo@crystalprism.io', name: 'Demo' };

const now = new Date();
const nowMs = now.getTime();

/** Noon UTC on day 1 of the month `back` months before now. Noon, not midnight,
 *  so the instant stays inside the same America/New_York calendar day the app's
 *  own monthBounds() would resolve it to. */
function monthStart(back) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12));
  d.setUTCMonth(d.getUTCMonth() - back);
  return d;
}

/** Noon UTC on `day` of the month `back` months before now. */
function monthDay(back, day) {
  const d = monthStart(back);
  d.setUTCDate(day);
  return d;
}

// ---------------------------------------------------------------- accounts

// Six accounts across four invented institutions, covering all six types the
// app knows — including `crypto`, which is a plain asset kept separate from
// `investment`, and the two liabilities, whose balances subtract.
const ACCOUNTS = [
  ['acct-checking', 'Everyday Checking', 'Meridian Trust', 'meridiantrust.example', 'checking', 482055],
  ['acct-savings', 'Tidewater Savings', 'Meridian Trust', 'meridiantrust.example', 'savings', 1824000],
  ['acct-brokerage', 'Brokerage — Individual', 'Harborline Investments', 'harborline.example', 'investment', 6153018],
  ['acct-crypto', 'ADA Wallet', 'Coinbase', 'coinbase.example', 'crypto', 214560],
  ['acct-card', 'Everyday Rewards Visa', 'Meridian Trust', 'meridiantrust.example', 'credit', 128642],
  ['acct-loan', 'Auto Loan', 'Northgate Credit Union', 'northgatecu.example', 'loan', 941000],
];

// Thirteen monthly snapshots per account, oldest first: index 0 is twelve
// months back, index 12 is the 1st of the current month. Today's balance (the
// `account` row above) is written as a fourteenth point, so the series ends at
// its own peak — the net worth vessel fills, and the tide mark drawn from a
// month ago sits a little below it. Two small dips are deliberate: a curve
// that only ever rises reads as decoration rather than data.
const SNAPSHOTS = {
  'acct-checking': [312040, 358120, 291470, 402330, 355900, 428610, 389240, 461780, 412350, 470120, 443980, 501240, 476300],
  'acct-savings': [1105000, 1155000, 1205000, 1255000, 1305000, 1355000, 1420000, 1470000, 1545000, 1620000, 1690000, 1760000, 1810000],
  'acct-brokerage': [3812400, 3945100, 3878600, 4162300, 4310900, 4224700, 4498300, 4732100, 4655800, 5011600, 5384200, 5762900, 6088400],
  'acct-crypto': [98400, 112300, 104900, 131600, 148200, 139700, 162400, 178900, 171200, 195600, 202800, 224100, 209700],
  'acct-card': [174320, 152880, 191450, 168230, 143910, 187640, 159380, 132750, 176420, 148960, 121340, 139870, 133410],
  'acct-loan': [1712000, 1648000, 1584000, 1520000, 1456000, 1392000, 1328000, 1264000, 1200000, 1136000, 1072000, 1006000, 949000],
};

// -------------------------------------------------------------- categories

// id, name, kind, monthlyLimitCents, hue
const CATEGORIES = [
  ['cat-home', 'Home', 'spending', 210000, 'lilac'],
  ['cat-groceries', 'Groceries', 'spending', 60000, 'teal'],
  ['cat-dining', 'Dining out', 'spending', 25000, 'pink'],
  ['cat-transit', 'Transit', 'spending', 16000, 'amber'],
  ['cat-health', 'Health', 'spending', 18000, 'cobalt'],
  ['cat-subs', 'Subscriptions', 'spending', 6000, 'plain'],
  ['cat-paycheck', 'Paycheck', 'income', null, 'amber'],
  ['cat-interest', 'Interest', 'income', null, 'plain'],
  ['cat-transfers', 'Transfers', 'transfer', null, 'plain'],
];

// The rules are what make the categories screen worth showing: they are how a
// payee gets filed automatically next time.
const RULES = [
  ['rule-rent', 'payee_contains', 'Harbor Street', 'cat-home', 10],
  ['rule-power', 'payee_contains', 'Keystone Power', 'cat-home', 20],
  ['rule-market', 'payee_contains', 'Fairview Market', 'cat-groceries', 30],
  ['rule-septa', 'payee_contains', 'SEPTA', 'cat-transit', 40],
  ['rule-aurora', 'payee_contains', 'Aurora', 'cat-subs', 50],
  ['rule-payroll', 'payee_contains', 'Lumen Analytics', 'cat-paycheck', 60],
];

// ------------------------------------------------------------ transactions

// day, payee, raw description, amountCents (negative = out), account, category
const THIS_MONTH = [
  [1, 'Harbor Street Apartments', 'HARBOR ST APTS RENT', -185000, 'acct-checking', 'cat-home'],
  [1, 'Lumen Analytics', 'LUMEN ANALYTICS PAYROLL', 320000, 'acct-checking', 'cat-paycheck'],
  [2, 'Fairview Market', 'FAIRVIEW MARKET #218', -12844, 'acct-card', 'cat-groceries'],
  [2, 'Second Kettle Coffee', 'SQ *SECOND KETTLE COFFEE', -675, 'acct-card', 'cat-dining'],
  [3, 'SEPTA Key', 'SEPTA KEY RELOAD', -4500, 'acct-card', 'cat-transit'],
  [3, 'Aurora Streaming', 'AURORA STREAMING MONTHLY', -1499, 'acct-card', 'cat-subs'],
  [4, 'Poppy & Vine', 'POPPY AND VINE PHL', -6820, 'acct-card', 'cat-dining'],
  [4, 'Wells Pharmacy', 'WELLS PHARMACY 4471', -3210, 'acct-card', 'cat-health'],
  [5, 'Keystone Power', 'KEYSTONE POWER EBILL', -9630, 'acct-checking', 'cat-home'],
];

// Left uncategorized on purpose, so the transactions page has a real row to
// demonstrate filing — an "Uncategorized" filter over an empty set shows
// nothing about what the screen is for.
const THIS_MONTH_UNFILED = [
  [3, 'Rivet & Cloth', 'RIVET AND CLOTH 0092', -8450, 'acct-card'],
];

// The one pending row. It is excluded from every settled total and named in
// words under the Spent block.
const THIS_MONTH_PENDING = [
  [5, 'Fairview Market', 'FAIRVIEW MARKET #218', -7486, 'acct-card', 'cat-groceries'],
];

// A month of history, replayed for each of the seven months before this one.
// Paycheck amounts vary per month (below) so the trailing median is a real
// median rather than one repeated constant.
const PRIOR_MONTH = [
  [1, 'Harbor Street Apartments', 'HARBOR ST APTS RENT', -185000, 'acct-checking', 'cat-home'],
  [3, 'SEPTA Key', 'SEPTA KEY RELOAD', -4500, 'acct-card', 'cat-transit'],
  [3, 'Aurora Streaming', 'AURORA STREAMING MONTHLY', -1499, 'acct-card', 'cat-subs'],
  [4, 'Fairview Market', 'FAIRVIEW MARKET #218', -11290, 'acct-card', 'cat-groceries'],
  [5, 'Keystone Power', 'KEYSTONE POWER EBILL', -9180, 'acct-checking', 'cat-home'],
  [6, 'Poppy & Vine', 'POPPY AND VINE PHL', -7240, 'acct-card', 'cat-dining'],
  [9, 'Wells Pharmacy', 'WELLS PHARMACY 4471', -3210, 'acct-card', 'cat-health'],
  [11, 'Fairview Market', 'FAIRVIEW MARKET #218', -14405, 'acct-card', 'cat-groceries'],
  [13, 'Second Kettle Coffee', 'SQ *SECOND KETTLE COFFEE', -1350, 'acct-card', 'cat-dining'],
  [17, 'SEPTA Key', 'SEPTA KEY RELOAD', -4500, 'acct-card', 'cat-transit'],
  [18, 'Fairview Market', 'FAIRVIEW MARKET #218', -9860, 'acct-card', 'cat-groceries'],
  [21, 'Anchor & Anchor', 'ANCHOR AND ANCHOR', -5615, 'acct-card', 'cat-dining'],
  [25, 'Fairview Market', 'FAIRVIEW MARKET #218', -13120, 'acct-card', 'cat-groceries'],
  [27, 'Poppy & Vine', 'POPPY AND VINE PHL', -6480, 'acct-card', 'cat-dining'],
  [28, 'Meridian Trust', 'INTEREST PAID', 1240, 'acct-savings', 'cat-interest'],
  // Card paid off from checking each month. Filed as a transfer, so it counts
  // as neither spending nor income — which is the whole reason that kind
  // exists, and worth having in the data a demo runs against.
  [26, 'Meridian Trust', 'CARD AUTOPAY THANK YOU', -132750, 'acct-checking', 'cat-transfers'],
];

// One paycheck on the 1st and one on the 16th, per prior month.
const PAYCHECKS = [
  [318400, 321600],
  [320000, 320000],
  [318400, 326900],
  [320000, 318400],
  [322400, 320000],
  [318400, 320000],
  [316200, 320000],
];

// ------------------------------------------------------------------ write

const stmts = [];

// Child-first, so nothing is orphaned mid-delete on a re-seed.
for (const t of [
  'feedback_messages', 'feedback', '"transaction"', 'category_rule',
  'balance_snapshot', 'category', 'account', 'institution_link', 'authAccount', 'user',
]) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO user (id, name, email, emailVerified, image, createdAt) VALUES (?, ?, ?, ?, NULL, ?)',
  args: [USER.id, USER.name, USER.email, nowMs - 400 * 86400000, nowMs - 400 * 86400000],
});

for (const [id, name, orgName, orgDomain, type, balanceCents] of ACCOUNTS) {
  stmts.push({
    sql: `INSERT INTO account
      (id, userId, linkId, externalId, connId, name, orgName, orgDomain, type,
       currency, balanceCents, availableCents, lastBalanceAt, isManual, closedAt)
      VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, ?, 'USD', ?, NULL, ?, 0, NULL)`,
    args: [id, USER.id, `demo-${id}`, name, orgName, orgDomain, type, balanceCents, nowMs],
  });

  const series = SNAPSHOTS[id];
  series.forEach((cents, i) => {
    const at = monthStart(series.length - 1 - i);
    stmts.push({
      sql: 'INSERT INTO balance_snapshot (id, accountId, at, balanceCents) VALUES (?, ?, ?, ?)',
      args: [`snap-${id}-${i}`, id, at.getTime(), cents],
    });
  });

  // Today's balance closes the series, so netWorthSeries' last point and
  // netWorthNow's total are the same number rather than two near-misses.
  stmts.push({
    sql: 'INSERT INTO balance_snapshot (id, accountId, at, balanceCents) VALUES (?, ?, ?, ?)',
    args: [`snap-${id}-now`, id, nowMs, balanceCents],
  });
}

for (const [id, name, kind, limitCents, hue] of CATEGORIES) {
  stmts.push({
    sql: `INSERT INTO category (id, userId, name, kind, parentId, monthlyLimitCents, hue, archivedAt)
          VALUES (?, ?, ?, ?, NULL, ?, ?, NULL)`,
    args: [id, USER.id, name, kind, limitCents, hue],
  });
}

for (const [id, matchType, pattern, categoryId, priority] of RULES) {
  stmts.push({
    sql: `INSERT INTO category_rule (id, userId, matchType, pattern, categoryId, priority)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, USER.id, matchType, pattern, categoryId, priority],
  });
}

let txnSeq = 0;
function pushTxn({ at, payee, raw, amountCents, accountId, categoryId, isPending = false }) {
  const id = `txn-${String(++txnSeq).padStart(4, '0')}`;
  stmts.push({
    sql: `INSERT INTO "transaction"
      (id, userId, accountId, externalId, postedAt, amountCents, payee, rawDescription,
       categoryId, isPending, transferPairId, note, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
    args: [
      id, USER.id, accountId, `demo-${id}-${randomUUID().slice(0, 8)}`,
      at.getTime(), amountCents, payee, raw, categoryId, isPending ? 1 : 0, nowMs,
    ],
  });
}

// This month, only as far as today: the overview's Spent block is a running
// partial-month total, and seeding past today would make it a lie.
const today = Number(
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', day: 'numeric' }).format(now),
);

for (const [day, payee, raw, amountCents, accountId, categoryId] of THIS_MONTH) {
  if (day > today) continue;
  pushTxn({ at: monthDay(0, day), payee, raw, amountCents, accountId, categoryId });
}
for (const [day, payee, raw, amountCents, accountId] of THIS_MONTH_UNFILED) {
  if (day > today) continue;
  pushTxn({ at: monthDay(0, day), payee, raw, amountCents, accountId, categoryId: null });
}
for (const [day, payee, raw, amountCents, accountId, categoryId] of THIS_MONTH_PENDING) {
  if (day > today) continue;
  pushTxn({ at: monthDay(0, day), payee, raw, amountCents, accountId, categoryId, isPending: true });
}

PAYCHECKS.forEach(([first, second], i) => {
  const back = i + 1;
  for (const [day, payee, raw, amountCents, accountId, categoryId] of PRIOR_MONTH) {
    pushTxn({ at: monthDay(back, day), payee, raw, amountCents, accountId, categoryId });
  }
  pushTxn({
    at: monthDay(back, 1), payee: 'Lumen Analytics', raw: 'LUMEN ANALYTICS PAYROLL',
    amountCents: first, accountId: 'acct-checking', categoryId: 'cat-paycheck',
  });
  pushTxn({
    at: monthDay(back, 16), payee: 'Lumen Analytics', raw: 'LUMEN ANALYTICS PAYROLL',
    amountCents: second, accountId: 'acct-checking', categoryId: 'cat-paycheck',
  });
});

await db.batch(stmts, 'write');

for (const t of ['user', 'account', 'balance_snapshot', 'category', 'category_rule', '"transaction"']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t.replace(/"/g, '')}: ${rows[0].n}`);
}

// The one row that must never exist here. Asserted rather than assumed: an
// accidental link row is a live SimpleFIN credential inside a public recording.
const { rows: links } = await db.execute('SELECT COUNT(*) AS n FROM institution_link');
if (Number(links[0].n) !== 0) {
  throw new Error(`institution_link must be empty in a demo DB, found ${links[0].n} rows`);
}

console.log(`seeded ${url}`);
