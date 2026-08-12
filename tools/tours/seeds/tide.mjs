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
// The receipt tables stay EMPTY for the same class of reason. `receipt_email`
// holds whole message bodies pulled out of a real Gmail account — subject,
// sender, the text of the mail — which is somebody's correspondence, not a
// balance. There is no de-identified version of that worth filming, so the
// four tables are cleared and then ASSERTED empty at the end beside
// `institution_link`, rather than merely never written.
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
//   - THIRTEEN prior months carry a full month of activity, not the seven this
//     started with. `earnedTrend` needs several months with income before its
//     trailing median is a median at all; the twelve-month history strip under
//     every category needs twelve months that actually happened; and
//     /retirement measures its contribution against the trailing twelve
//     COMPLETED months, falling back to stated income expectations — and
//     saying so on screen — the moment history is one month short. Thirteen is
//     the smallest number that satisfies the last of those: the check is for a
//     transaction OLDER than the oldest of the twelve.
//
// The later screens — /cards, /merchants, /plan, /retirement — each need their
// own shape of data before they are worth filming, and every one of them draws
// a WATER LEVEL rather than a number. A cap vessel, a fund, a projection
// channel: all three read as broken when they come out empty and as staged
// when they come out at 100%. So every level below is deliberately PART full,
// and the comment beside it says which rows put it there.

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
 *  own monthBounds() would resolve it to. A NEGATIVE `back` is months AHEAD,
 *  which is how the fund deadlines below are built. */
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

/** YYYY-MM-DD for a date this file built, i.e. one at noon UTC. Slicing the ISO
 *  string of a MIDNIGHT-UTC instant would name the previous day in every US
 *  timezone — the hazard lib/planDates.ts exists to avoid — but noon has four
 *  hours of clearance on either side, so this is exact for everything here. */
const isoDay = (d) => d.toISOString().slice(0, 10);

// Today's day-of-month, on the app's own calendar. Read before anything else
// is built because two things depend on it: this month is seeded only as far
// as today, and the statement-cycle card below closes on it.
const today = Number(
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', day: 'numeric' }).format(now),
);

// The quarter `now` falls in, on the same calendar the months above use. The
// rotating card's 5% window is written against these two instants, and
// `capPeriodBounds('quarter', ...)` resolves the cap it fills to the same three
// months — a window and a cap period that disagreed would let a purchase earn
// the bonus rate against the wrong quarter's allowance.
const quarterStart = monthStart(now.getUTCMonth() % 3);
const quarterEndMonth = monthStart((now.getUTCMonth() % 3) - 2);
const quarterEnd = new Date(
  Date.UTC(quarterEndMonth.getUTCFullYear(), quarterEndMonth.getUTCMonth() + 1, 0, 12),
);

// ---------------------------------------------------------------- accounts

// Nine accounts across five invented institutions, covering all six types the
// app knows — including `crypto`, which is a plain asset kept separate from
// `investment`, and the two liabilities, whose balances subtract.
//
// `taxTreatment` is set on both market-exposed accounts and nothing else:
// /retirement NAMES every account it had to leave out of the projection, so an
// unclassified brokerage would put "2 accounts are missing a tax treatment" on
// screen under the channel. Cash and debt never carry one — neither compounds
// inside the simulator's tax-aware buckets — and the 401(k) is what makes the
// Tax-deferred bucket a real figure rather than a $0 row beside three others.
//
// `isFundPool` marks the ONE savings account /plan divides between sinking
// funds. Exactly one per user, enforced in the action rather than by a
// constraint, so a second `1` here would be a state the app cannot produce.
const ACCOUNTS = [
  // id, name, orgName, orgDomain, type, balanceCents, taxTreatment, isFundPool
  ['acct-checking', 'Everyday Checking', 'Meridian Trust', 'meridiantrust.example', 'checking', 482055, null, 0],
  ['acct-savings', 'Tidewater Savings', 'Meridian Trust', 'meridiantrust.example', 'savings', 1824000, null, 1],
  ['acct-brokerage', 'Brokerage — Individual', 'Harborline Investments', 'harborline.example', 'investment', 6153018, 'taxable', 0],
  ['acct-401k', 'Retirement 401(k)', 'Harborline Investments', 'harborline.example', 'investment', 18240600, 'tax_deferred', 0],
  ['acct-crypto', 'ADA Wallet', 'Coinbase', 'coinbase.example', 'crypto', 214560, 'taxable', 0],
  ['acct-card', 'Everyday Rewards Visa', 'Meridian Trust', 'meridiantrust.example', 'credit', 128642, null, 0],
  ['acct-card-flex', 'Harbor Flex Card', 'Lantern Bank', 'lanternbank.example', 'credit', 64230, null, 0],
  ['acct-card-club', 'Northgate Signature', 'Northgate Credit Union', 'northgatecu.example', 'credit', 39810, null, 0],
  ['acct-loan', 'Auto Loan', 'Northgate Credit Union', 'northgatecu.example', 'loan', 941000, null, 0],
];

// Thirteen monthly snapshots per account, oldest first: index 0 is twelve
// months back, index 12 is the 1st of the current month. Today's balance (the
// `account` row above) is written as a fourteenth point, so the series ends at
// its own peak — the net worth vessel fills, and the tide mark drawn from a
// month ago sits a little below it. Two small dips are deliberate: a curve
// that only ever rises reads as decoration rather than data.
//
// Both new cards SHRINK across the year and end at their own smallest balance.
// A liability subtracts, so a card series that ended high would pull the last
// point of the net worth curve below an earlier one and quietly cost the
// vessel the peak the whole shape above is built around.
const SNAPSHOTS = {
  'acct-checking': [312040, 358120, 291470, 402330, 355900, 428610, 389240, 461780, 412350, 470120, 443980, 501240, 476300],
  'acct-savings': [1105000, 1155000, 1205000, 1255000, 1305000, 1355000, 1420000, 1470000, 1545000, 1620000, 1690000, 1760000, 1810000],
  'acct-brokerage': [3812400, 3945100, 3878600, 4162300, 4310900, 4224700, 4498300, 4732100, 4655800, 5011600, 5384200, 5762900, 6088400],
  'acct-401k': [14120400, 14580200, 14338900, 15012600, 15486300, 15264800, 15921400, 16473900, 16218500, 16942300, 17456100, 17903400, 18162700],
  'acct-crypto': [98400, 112300, 104900, 131600, 148200, 139700, 162400, 178900, 171200, 195600, 202800, 224100, 209700],
  'acct-card': [174320, 152880, 191450, 168230, 143910, 187640, 159380, 132750, 176420, 148960, 121340, 139870, 133410],
  'acct-card-flex': [92400, 84130, 97260, 88540, 76920, 91340, 82150, 70480, 88760, 74210, 71590, 79340, 68120],
  'acct-card-club': [58200, 63410, 51870, 66240, 57930, 48610, 62480, 54120, 45870, 59340, 50260, 43980, 41520],
  'acct-loan': [1712000, 1648000, 1584000, 1520000, 1456000, 1392000, 1328000, 1264000, 1200000, 1136000, 1072000, 1006000, 949000],
};

// -------------------------------------------------------------- categories

// id, name, kind, monthlyLimitCents, hue, rewardCategory
//
// `rewardCategory` is what makes /cards work at all. A transaction claims a
// bonus rate through the reward category its own category maps to, and an
// unmapped one claims NOTHING — so with this column left null everywhere (as
// it was before the cards screens existed) every vessel on that page draws
// empty, every "which card" row falls back to base, and the missed summary has
// nothing it can assess. `Home` stays null on purpose: it is rent plus a power
// bill, and no card pays a bonus on rent.
const CATEGORIES = [
  ['cat-home', 'Home', 'spending', 210000, 'lilac', null],
  ['cat-groceries', 'Groceries', 'spending', 60000, 'teal', 'grocery'],
  ['cat-dining', 'Dining out', 'spending', 25000, 'pink', 'dining'],
  ['cat-transit', 'Transit', 'spending', 16000, 'amber', 'transit'],
  ['cat-health', 'Health', 'spending', 18000, 'cobalt', 'drugstore'],
  ['cat-subs', 'Subscriptions', 'spending', 6000, 'plain', 'streaming'],
  ['cat-fun', 'Entertainment', 'spending', 12000, 'pink', 'entertainment'],
  ['cat-travel', 'Travel', 'spending', 40000, 'cobalt', 'travel'],
  // Its own category rather than a slice of Home, because /retirement needs a
  // cost that genuinely ENDS on a date — see RETIREMENT_CATEGORY_PLANS.
  ['cat-auto', 'Auto loan', 'spending', 70000, 'plain', null],
  ['cat-paycheck', 'Paycheck', 'income', null, 'amber', null],
  ['cat-freelance', 'Freelance', 'income', null, 'teal', null],
  ['cat-interest', 'Interest', 'income', null, 'plain', null],
  ['cat-transfers', 'Transfers', 'transfer', null, 'plain', null],
];

// The rules are what make the categories screen worth showing: they are how a
// payee gets filed automatically next time.
//
// The last column is the merchant a rule has been CONVERTED to. Three of these
// are linked and three are not, which is the honest mid-conversion state the
// merchants screen is built to show: the linked ones appear under their
// merchant's "what it does" line, and the three that are left drive the
// "3 category rules not yet linked to a merchant" notice at the top of that
// page. A fully-converted database would render that banner away and with it
// the reason /merchants/convert exists.
const RULES = [
  ['rule-rent', 'payee_contains', 'Harbor Street', 'cat-home', 10, null],
  ['rule-power', 'payee_contains', 'Keystone Power', 'cat-home', 20, null],
  ['rule-market', 'payee_contains', 'Fairview Market', 'cat-groceries', 30, 'mch-fairview'],
  ['rule-septa', 'payee_contains', 'SEPTA', 'cat-transit', 40, 'mch-septa'],
  ['rule-aurora', 'payee_contains', 'Aurora', 'cat-subs', 50, 'mch-aurora'],
  ['rule-payroll', 'payee_contains', 'Lumen Analytics', 'cat-paycheck', 60, null],
];

// --------------------------------------------------------------- merchants

// One shop, several bank spellings. The merchants screen exists to show that
// collapse, so every merchant here answers to three of them and the aliases are
// written the way institutions actually mangle a name — a store number, a
// processor prefix, a truncation. A merchant with one alias would render a row
// that proves nothing.
//
// These are invented shops. The spellings are the interesting part and they
// have to be invented too: a real merchant list is a map of where somebody
// actually goes.
const MERCHANTS = [
  ['mch-fairview', 'Fairview Market', ['Fairview Market', 'FAIRVIEW MARKET #218', 'FAIRVIEW MKT 0218']],
  ['mch-kettle', 'Second Kettle Coffee', ['Second Kettle Coffee', 'SQ *SECOND KETTLE COFFEE', 'SECOND KETTLE COF PHL']],
  ['mch-poppy', 'Poppy & Vine', ['Poppy & Vine', 'POPPY AND VINE PHL', 'POPPY+VINE 21ST']],
  ['mch-aurora', 'Aurora Streaming', ['Aurora Streaming', 'AURORA STREAMING MONTHLY', 'AURORA*STRM']],
  ['mch-northgate', 'Northgate Wholesale', ['Northgate Wholesale', 'NORTHGATE WHSL #12', 'NORTHGATE WHOLESALE CL']],
  ['mch-septa', 'SEPTA Key', ['SEPTA Key', 'SEPTA KEY RELOAD', 'SEPTAKEY.ORG']],
];

// ------------------------------------------------------------------- cards

// id, accountId, baseRateBps, annualFeeCents, rotates, cycleCloseDay
//
// Three cards, because every figure on /cards is a COMPARISON. One card makes
// the which-card table a list of the only answer there is, and the missed
// summary structurally zero — nothing was missed if nothing else could have
// been reached for. With three, the table names a different winner per row and
// the grocery and dining charges below genuinely land on the wrong one.
const CARDS = [
  ['card-visa', 'acct-card', 150, 0, 0, null],
  ['card-flex', 'acct-card-flex', 100, 0, 1, null],
  // A statement-cycle cap is the one period that belongs to the card rather
  // than the calendar, and the only reason `cycleCloseDay` is not null.
  //
  // The close day is DERIVED from today, and that is not decoration. A cycle
  // closing on the 18th runs the 19th to the 18th, so a seed run on the 25th
  // would open the current cycle on the 19th — after every row this month —
  // and draw that card's vessel bone empty on a screen whose whole subject is
  // how full it is. Clamped up to the 6th so the previous month's warehouse
  // run (day 6) still falls in the PREVIOUS cycle, whatever day this runs.
  ['card-club', 'acct-card-club', 100, 9500, 0, Math.max(today, 6)],
];

// id, cardId, rewardCategories, rateBps, capCents, capPeriod, startsOn, endsOn,
// payeePatterns, merchantIds
//
// Every capped rate is sized against the spending seeded below so its vessel
// lands PART full — roughly 40%, 30% and 60% of the way up on the day this is
// seeded. Empty reads as a card nobody has used; full reads as a screenshot
// someone posed. The tide line beside each one is how far through the period
// we are, and it is drawn independently, so the two only agree by accident —
// which is exactly the comparison the block is for.
const CARD_RATES = [
  // Fills from this month's two Fairview Market rows (one settled, one still
  // pending — the fold counts pending spend, since the money is committed).
  ['rate-visa-grocery', 'card-visa', ['grocery'], 300, 50000, 'month', null, null, null, []],
  ['rate-visa-drugstore', 'card-visa', ['drugstore'], 200, null, null, null, null, null, []],
  // An UNCONVERTED merchant bonus: a raw payee pattern with no merchant row
  // behind it. It earns its own line in the which-card table, set in the
  // verbatim mono face, beside the two merchant rows below that carry a
  // canonical name — the visible difference between a rate somebody typed and
  // one they converted.
  ['rate-visa-online', 'card-visa', ['online'], 300, null, null, null, null, ['Rivet & Cloth'], []],
  // The rotating card's quarter. `rotates` with a live dated rate is what makes
  // the block say what THIS quarter pays instead of "not told yet" — a rotating
  // card never carries last quarter's categories forward.
  ['rate-flex-quarter', 'card-flex', ['entertainment', 'travel'], 500, 150000, 'quarter', quarterStart, quarterEnd, null, []],
  ['rate-flex-transit', 'card-flex', ['transit'], 200, null, null, null, null, null, []],
  // The merchant-scoped bonus: no reward category at all, claimed purely
  // through `card_rate_merchant`. Its cap is the fullest of the three.
  ['rate-club-shops', 'card-club', [], 500, 30000, 'cycle', null, null, null, ['mch-fairview', 'mch-northgate']],
  ['rate-club-dining', 'card-club', ['dining'], 400, null, null, null, null, null, []],
];

// A reward rule beats the category mapping, and these two exist for rows that
// have NO category to map: both split parents below carry a null `categoryId`
// (the split's own invariant), so without a rule their reward category would be
// unresolvable and their cash back would silently fall to base. Unique on
// (userId, matchType, pattern), so one rule per payee.
const REWARD_RULES = [
  ['rrule-fairview', 'payee_contains', 'Fairview Market', 'grocery', 10],
  ['rrule-northgate', 'payee_contains', 'Northgate Whsl', 'wholesale_club', 20],
  ['rrule-rivet', 'payee_contains', 'Rivet & Cloth', 'online', 30],
];

// ------------------------------------------------------------ transactions

// day, payee, raw description, amountCents (negative = out), account, category
const THIS_MONTH = [
  [1, 'Harbor Street Apartments', 'HARBOR ST APTS RENT', -185000, 'acct-checking', 'cat-home'],
  [1, 'Lumen Analytics', 'LUMEN ANALYTICS PAYROLL', 320000, 'acct-checking', 'cat-paycheck'],
  [2, 'Northgate Credit Union', 'NORTHGATE CU AUTO PAY', -64000, 'acct-checking', 'cat-auto'],
  [2, 'Second Kettle Coffee', 'SQ *SECOND KETTLE COFFEE', -675, 'acct-card', 'cat-dining'],
  [3, 'SEPTA Key', 'SEPTA KEY RELOAD', -4500, 'acct-card', 'cat-transit'],
  [3, 'Aurora Streaming', 'AURORA STREAMING MONTHLY', -1499, 'acct-card', 'cat-subs'],
  [3, 'Rialto Cinema', 'RIALTO CINEMA 4', -3600, 'acct-card-flex', 'cat-fun'],
  [4, 'Poppy & Vine', 'POPPY AND VINE PHL', -6820, 'acct-card', 'cat-dining'],
  [4, 'Wells Pharmacy', 'WELLS PHARMACY 4471', -3210, 'acct-card', 'cat-health'],
  [4, 'Lantern Air', 'LANTERN AIR 0918', -28400, 'acct-card-flex', 'cat-travel'],
  [5, 'Keystone Power', 'KEYSTONE POWER EBILL', -9630, 'acct-checking', 'cat-home'],
  [5, 'Anchor & Anchor', 'ANCHOR AND ANCHOR', -4980, 'acct-card-club', 'cat-dining'],
  [8, 'Marbury Design', 'MARBURY DESIGN INVOICE', 65000, 'acct-checking', 'cat-freelance'],
];

// Charges divided across two categories. The parent's own `categoryId` is
// forced null — a split set's first invariant — and the lines carry the
// categories instead, which is why both payees also have a REWARD_RULES entry:
// the reward category has to come from somewhere once the category is gone.
//
// Deliberately not equal halves. A split whose lines are 50/50 could be a
// placeholder; a grocery run with the pharmacy counter pulled out of it, or a
// warehouse trip with one board game in it, is what the feature is actually for.
const THIS_MONTH_SPLIT = [
  [2, 'Fairview Market', 'FAIRVIEW MARKET #218', -12844, 'acct-card', [
    [-9640, 'cat-groceries', 'food'],
    [-3204, 'cat-health', 'pharmacy counter'],
  ]],
  [2, 'Northgate Wholesale', 'NORTHGATE WHSL #12', -18620, 'acct-card-club', [
    [-15120, 'cat-groceries', 'bulk food'],
    [-3500, 'cat-fun', 'board game'],
  ]],
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

// A month of history, replayed for each of the thirteen months before this one.
// Paycheck amounts vary per month (below) so the trailing median is a real
// median rather than one repeated constant.
//
// The three card rows here are what give /cards a year-to-date figure per card
// rather than one card with earnings and two at zero. The Northgate run sits on
// day 6 on purpose: the club card's cap runs 19th-to-18th, so a day-25 row
// would land INSIDE the current cycle and push that vessel past the level the
// comment above claims for it.
const PRIOR_MONTH = [
  [1, 'Harbor Street Apartments', 'HARBOR ST APTS RENT', -185000, 'acct-checking', 'cat-home'],
  [2, 'Northgate Credit Union', 'NORTHGATE CU AUTO PAY', -64000, 'acct-checking', 'cat-auto'],
  [3, 'SEPTA Key', 'SEPTA KEY RELOAD', -4500, 'acct-card', 'cat-transit'],
  [3, 'Aurora Streaming', 'AURORA STREAMING MONTHLY', -1499, 'acct-card', 'cat-subs'],
  [4, 'Fairview Market', 'FAIRVIEW MARKET #218', -11290, 'acct-card', 'cat-groceries'],
  [5, 'Keystone Power', 'KEYSTONE POWER EBILL', -9180, 'acct-checking', 'cat-home'],
  [6, 'Poppy & Vine', 'POPPY AND VINE PHL', -7240, 'acct-card', 'cat-dining'],
  [6, 'Northgate Wholesale', 'NORTHGATE WHSL #12', -9200, 'acct-card-club', 'cat-groceries'],
  [8, 'Marbury Design', 'MARBURY DESIGN INVOICE', 65000, 'acct-checking', 'cat-freelance'],
  [8, 'Rialto Cinema', 'RIALTO CINEMA 4', -2400, 'acct-card-flex', 'cat-fun'],
  [9, 'Wells Pharmacy', 'WELLS PHARMACY 4471', -3210, 'acct-card', 'cat-health'],
  [11, 'Fairview Market', 'FAIRVIEW MARKET #218', -14405, 'acct-card', 'cat-groceries'],
  [13, 'Second Kettle Coffee', 'SQ *SECOND KETTLE COFFEE', -1350, 'acct-card', 'cat-dining'],
  [15, 'Harbor Line Rail', 'HARBOR LINE RAIL', -9600, 'acct-card-flex', 'cat-travel'],
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

// One paycheck on the 1st and one on the 16th, per prior month. The LENGTH of
// this array is what decides how many months of history exist — see the note
// above on why thirteen.
const PAYCHECKS = [
  [318400, 321600],
  [320000, 320000],
  [318400, 326900],
  [320000, 318400],
  [322400, 320000],
  [318400, 320000],
  [316200, 320000],
  [316200, 316200],
  [314800, 316200],
  [316200, 319400],
  [314800, 314800],
  [312600, 314800],
  [314800, 312600],
];

// ------------------------------------------------------------------- plan

// id, name, expectedCents PER OCCURRENCE, cadence, anchorDate, matchPattern
//
// Both anchors name a real past payday in the seeded history, because /plan
// derives every future occurrence from the anchor and then asks how many of
// this month's have actually landed. An anchor with no matching deposits
// behind it renders the row in its "nothing matched yet" state — a red mark
// against the one part of this screen that is supposed to be reassuring.
// Semimonthly anchored on the 1st pays on the 1st and 15th.
const INCOME_SOURCES = [
  ['inc-lumen', 'Lumen Analytics', 320000, 'semimonthly', isoDay(monthDay(1, 1)), 'Lumen Analytics'],
  ['inc-marbury', 'Marbury Design', 65000, 'monthly', isoDay(monthDay(1, 8)), 'Marbury Design'],
];

// id, name, targetCents, targetDate, createdBackMonths, contributionMonths,
// perMonthCents
//
// Sinking funds are water levels too, and the three here are at 76%, 65% and
// 42% — with the last one deliberately BEHIND its pace, since "behind" is a
// state the block draws differently and a demo where everything is on track
// never shows it. The cushion has no deadline at all, which is the third
// state: it fills and is never reported behind, because it has no pace to be
// behind of.
const FUNDS = [
  ['fund-cushion', 'Emergency cushion', 600000, null, 14, 12, 38000],
  ['fund-japan', 'Kyoto in April', 480000, isoDay(monthDay(-8, 1)), 7, 6, 52000],
  ['fund-bike', 'New bike', 180000, isoDay(monthDay(-3, 1)), 5, 4, 19000],
];

// -------------------------------------------------------------- retirement

// Every column is stated, because every one of them is blocking: with any of
// the eight missing, /retirement renders a form and no projection at all —
// deliberately, since a figure nobody can know is one the app must be told
// rather than supply quietly and report back as a finding.
//
// The age is derived from `now` rather than written as a year, so the demo
// person does not age past their retirement date as this seed gets re-run.
const RETIREMENT_AGE_NOW = 38;
const RETIREMENT_PLAN = {
  birthYear: now.getUTCFullYear() - RETIREMENT_AGE_NOW,
  retireAtAge: 62,
  planThroughAge: 92,
  inflationBps: 250,
  returnMeanBps: 620,
  returnVolatilityBps: 1400,
  salaryGrowthBps: 300,
  effectiveTaxBps: 2200,
  socialSecurityMonthlyCents: 214000,
  socialSecurityStartAge: 67,
  // Null, so the screen shows the MEASURED contribution with its "measured"
  // mark and the basis it was measured on. A number here would be the user
  // overriding that, and the mark would disappear with it.
  contributionOverrideCents: null,
};

// Departures from the default, and nothing else — a category with no row here
// keeps its spending for every year of the horizon, so this table never stores
// "keeps". Two rows, one of each disposition: commuting stops at retirement,
// and the auto loan falls off on a DATE. The date is the month the loan's own
// balance runs out at the rate its snapshots are declining, so the two figures
// on screen agree with each other.
const RETIREMENT_CATEGORY_PLANS = [
  ['cat-transit', 'stops', null],
  ['cat-auto', 'ends', isoDay(monthStart(-15)).slice(0, 7)],
];

// ------------------------------------------------------------------ write

const stmts = [];

// Child-first, so nothing is orphaned mid-delete on a re-seed. The receipt and
// extractor tables are cleared here even though nothing below writes them:
// clearing a table this script never fills is what keeps a re-seed over a
// database somebody once pointed at real data from leaving that data behind.
for (const t of [
  'transaction_split', 'receipt_line_item', 'receipt_extraction', 'receipt_email',
  'receipt_sweep', 'extractor_run', 'feedback_messages', 'feedback', '"transaction"',
  'card_rate_merchant', 'card_rate', 'card', 'reward_rule', 'category_rule',
  'merchant_merge_dismissal', 'merchant_alias', 'merchant',
  'fund_contribution', 'fund', 'finance_suggestion_dismissal', 'income_source',
  'retirement_category_plan', 'retirement_new_cost', 'retirement_plan',
  'balance_snapshot', 'category', 'account', 'institution_link', 'authAccount', 'user',
]) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO user (id, name, email, emailVerified, image, createdAt) VALUES (?, ?, ?, ?, NULL, ?)',
  args: [USER.id, USER.name, USER.email, nowMs - 400 * 86400000, nowMs - 400 * 86400000],
});

for (const [id, name, orgName, orgDomain, type, balanceCents, taxTreatment, isFundPool] of ACCOUNTS) {
  stmts.push({
    sql: `INSERT INTO account
      (id, userId, linkId, externalId, connId, name, orgName, orgDomain, type,
       taxTreatment, currency, balanceCents, availableCents, lastBalanceAt,
       isManual, isFundPool, closedAt)
      VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, 'USD', ?, NULL, ?, 0, ?, NULL)`,
    args: [id, USER.id, `demo-${id}`, name, orgName, orgDomain, type, taxTreatment, balanceCents, nowMs, isFundPool],
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

for (const [id, name, kind, limitCents, hue, rewardCategory] of CATEGORIES) {
  stmts.push({
    sql: `INSERT INTO category
      (id, userId, name, kind, parentId, monthlyLimitCents, hue, isRestockList, rewardCategory, archivedAt)
      VALUES (?, ?, ?, ?, NULL, ?, ?, 0, ?, NULL)`,
    args: [id, USER.id, name, kind, limitCents, hue, rewardCategory],
  });
}

for (const [id, name, aliases] of MERCHANTS) {
  stmts.push({
    sql: 'INSERT INTO merchant (id, userId, name, archivedAt) VALUES (?, ?, ?, NULL)',
    args: [id, USER.id, name],
  });
  aliases.forEach((alias, i) => {
    stmts.push({
      sql: 'INSERT INTO merchant_alias (id, userId, merchantId, alias) VALUES (?, ?, ?, ?)',
      args: [`${id}-alias-${i}`, USER.id, id, alias],
    });
  });
}

for (const [id, matchType, pattern, categoryId, priority, merchantId] of RULES) {
  stmts.push({
    sql: `INSERT INTO category_rule (id, userId, matchType, pattern, categoryId, priority, merchantId)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, USER.id, matchType, pattern, categoryId, priority, merchantId],
  });
}

for (const [id, accountId, baseRateBps, annualFeeCents, rotates, cycleCloseDay] of CARDS) {
  stmts.push({
    sql: `INSERT INTO card
      (id, userId, accountId, baseRateBps, annualFeeCents, rotates, archivedAt, createdAt, cycleCloseDay)
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    args: [id, USER.id, accountId, baseRateBps, annualFeeCents, rotates, nowMs - 300 * 86400000, cycleCloseDay],
  });
}

for (const [
  id, cardId, rewardCategories, rateBps, capCents, capPeriod, startsOn, endsOn, payeePatterns, merchantIds,
] of CARD_RATES) {
  stmts.push({
    sql: `INSERT INTO card_rate
      (id, userId, cardId, rewardCategories, rateBps, capCents, capPeriod, startsOn, endsOn, payeePatterns, capGroup)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    args: [
      id, USER.id, cardId, JSON.stringify(rewardCategories), rateBps, capCents, capPeriod,
      startsOn ? startsOn.getTime() : null, endsOn ? endsOn.getTime() : null,
      payeePatterns ? JSON.stringify(payeePatterns) : null,
    ],
  });
  for (const merchantId of merchantIds) {
    stmts.push({
      sql: 'INSERT INTO card_rate_merchant (id, rateId, merchantId) VALUES (?, ?, ?)',
      args: [`${id}-${merchantId}`, id, merchantId],
    });
  }
}

for (const [id, matchType, pattern, rewardCategory, priority] of REWARD_RULES) {
  stmts.push({
    sql: `INSERT INTO reward_rule (id, userId, matchType, pattern, rewardCategory, priority)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, USER.id, matchType, pattern, rewardCategory, priority],
  });
}

let txnSeq = 0;
/** Writes one transaction, and its split lines when it has them. A split set
 *  forces `categoryId` to null on the parent — the app's own invariant, not a
 *  shortcut here — so the lines are the only categories the charge has, and
 *  the reward rules above are what keep it earning cash back regardless. */
function pushTxn({ at, payee, raw, amountCents, accountId, categoryId, isPending = false, splits = null }) {
  const id = `txn-${String(++txnSeq).padStart(4, '0')}`;
  stmts.push({
    sql: `INSERT INTO "transaction"
      (id, userId, accountId, externalId, postedAt, amountCents, payee, rawDescription,
       bankPayee, categoryId, isPending, transferPairId, note, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
    args: [
      id, USER.id, accountId, `demo-${id}-${randomUUID().slice(0, 8)}`,
      at.getTime(), amountCents, payee, raw, payee, splits ? null : categoryId,
      isPending ? 1 : 0, nowMs,
    ],
  });
  (splits ?? []).forEach(([lineCents, lineCategoryId, label], i) => {
    stmts.push({
      sql: `INSERT INTO transaction_split (id, transactionId, amountCents, categoryId, label, sortOrder)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [`${id}-split-${i}`, id, lineCents, lineCategoryId, label, i],
    });
  });
}

// This month, only as far as today (`today`, above): the overview's Spent
// block is a running partial-month total, and seeding past today would make it
// a lie.
for (const [day, payee, raw, amountCents, accountId, categoryId] of THIS_MONTH) {
  if (day > today) continue;
  pushTxn({ at: monthDay(0, day), payee, raw, amountCents, accountId, categoryId });
}
for (const [day, payee, raw, amountCents, accountId, splits] of THIS_MONTH_SPLIT) {
  if (day > today) continue;
  pushTxn({ at: monthDay(0, day), payee, raw, amountCents, accountId, categoryId: null, splits });
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

for (const [id, name, expectedCents, cadence, anchorDate, matchPattern] of INCOME_SOURCES) {
  stmts.push({
    sql: `INSERT INTO income_source
      (id, userId, name, expectedCents, cadence, anchorDate, matchPattern, createdAt, archivedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    args: [id, USER.id, name, expectedCents, cadence, anchorDate, matchPattern, nowMs - 300 * 86400000],
  });
}

for (const [id, name, targetCents, targetDate, createdBack, months, perMonth] of FUNDS) {
  stmts.push({
    sql: `INSERT INTO fund
      (id, userId, name, targetCents, targetDate, createdAt, archivedAt, sourceApp, sourceRef)
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
    args: [id, USER.id, name, targetCents, targetDate, monthDay(createdBack, 3).getTime()],
  });
  // Saved-so-far is the SUM of this ledger, never a stored column, so the water
  // level in the block is only ever as real as these rows.
  for (let i = 0; i < months; i += 1) {
    const back = months - i;
    stmts.push({
      sql: 'INSERT INTO fund_contribution (id, fundId, at, amountCents, note) VALUES (?, ?, ?, ?, NULL)',
      args: [`${id}-c${i}`, id, monthDay(back, 3).getTime(), perMonth],
    });
  }
}

stmts.push({
  sql: `INSERT INTO retirement_plan
    (id, userId, birthYear, retireAtAge, planThroughAge, inflationBps, returnMeanBps,
     returnVolatilityBps, salaryGrowthBps, effectiveTaxBps, socialSecurityMonthlyCents,
     socialSecurityStartAge, contributionOverrideCents, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [
    'ret-plan-demo', USER.id, RETIREMENT_PLAN.birthYear, RETIREMENT_PLAN.retireAtAge,
    RETIREMENT_PLAN.planThroughAge, RETIREMENT_PLAN.inflationBps, RETIREMENT_PLAN.returnMeanBps,
    RETIREMENT_PLAN.returnVolatilityBps, RETIREMENT_PLAN.salaryGrowthBps,
    RETIREMENT_PLAN.effectiveTaxBps, RETIREMENT_PLAN.socialSecurityMonthlyCents,
    RETIREMENT_PLAN.socialSecurityStartAge, RETIREMENT_PLAN.contributionOverrideCents, nowMs,
  ],
});

RETIREMENT_CATEGORY_PLANS.forEach(([categoryId, disposition, endsOn], i) => {
  stmts.push({
    sql: `INSERT INTO retirement_category_plan
      (id, userId, categoryId, disposition, endsOn, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [`ret-cat-${i}`, USER.id, categoryId, disposition, endsOn, nowMs],
  });
});

await db.batch(stmts, 'write');

for (const t of [
  'user', 'account', 'balance_snapshot', 'category', 'category_rule', '"transaction"',
  'transaction_split', 'merchant', 'merchant_alias', 'card', 'card_rate', 'card_rate_merchant',
  'reward_rule', 'income_source', 'fund', 'fund_contribution',
  'retirement_plan', 'retirement_category_plan',
]) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t.replace(/"/g, '')}: ${rows[0].n}`);
}

// The rows that must never exist here. Asserted rather than assumed: an
// accidental link row is a live SimpleFIN credential inside a public recording,
// and an accidental receipt row is somebody's mail.
for (const t of ['institution_link', 'receipt_email', 'receipt_extraction', 'receipt_line_item', 'receipt_sweep']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  if (Number(rows[0].n) !== 0) {
    throw new Error(`${t} must be empty in a demo DB, found ${rows[0].n} rows`);
  }
}

console.log(`seeded ${url}`);
