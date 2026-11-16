// ~/Developer/crystalprism.io/tools/tours/seeds/pigeonhole.mjs
// Seeds a throwaway demo DB for Pigeonhole with INVENTED links. Nothing here is Esther's: her real
// queue is her own phone tabs and bookmarks. Every site, title and summary below is made up, every
// iconUrl is null (a remote favicon would be an off-box request, and the stamp then shows the
// title's initial). Writes ONLY to the file: URL in DATABASE_URL (run Pigeonhole's own migrator
// first: `node scripts/migrate.mjs`).
import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
const db = createClient({ url });

const EMAIL = 'demo@crystalprism.io';
const OWNER = 'demo-user-pigeonhole';
const DAY = 86_400_000;
const now = Date.now();

await db.execute({ sql: 'delete from close_requests where userId = ?', args: [OWNER] });
await db.execute({ sql: 'delete from links where userId = ?', args: [OWNER] });
await db.execute({ sql: 'insert or replace into user (id, name, email, createdAt) values (?, ?, ?, ?)', args: [OWNER, 'Demo', EMAIL, now - 90 * DAY] });

const loc = {
  phone: [{ source: 'phone', path: 'Phone tabs' }],
  firefox: [{ source: 'firefox', path: 'Bookmarks Menu/Reading' }],
  safari: [{ source: 'safari', path: 'Favorites/Kitchen' }],
  reading: [{ source: 'safari-reading-list', path: 'Reading List' }],
  added: [{ source: 'added', path: '' }],
};

// [slug, url, title, kind, pile, source, days ago, state, suggestedDest, suggestedReason, summary, destination, fullSummary]
const LINKS = [
  // The queue, newest first: the tour sorts the top two (Research, then Done).
  ['map', 'https://slowpaper.org/essays/the-quiet-comeback-of-the-paper-map', 'The quiet comeback of the paper map', 'article', 'queue', 'phone', 2, 'open',
    'research', 'a long read worth keeping',
    'Why hikers, cabbies and a few city planners are going back to folded maps, and what a screen leaves out of the picture.', null, null],
  ['kettle', 'https://hearthandhob.com/notes/descaling-a-kettle-with-citric-acid', 'Descaling a kettle with citric acid', 'note', 'queue', 'phone', 3, 'open',
    'done', 'a quick tip, already used',
    'Two tablespoons of citric acid, a full kettle, one boil, then rinse twice. No vinegar smell left behind.', null, null],
  ['apron', 'https://fernandflax.shop/products/cross-back-linen-apron', 'Cross-back linen apron in rust', 'product', 'queue', 'firefox', 4, 'open',
    'giftme', 'a gift idea for someone who cooks',
    'A heavy washed-linen apron with deep front pockets and straps that cross at the back instead of tying at the neck.', null, null],
  ['cookies', 'https://hearthandhob.com/recipes/brown-butter-miso-cookies', 'Brown butter miso cookies', 'recipe', 'queue', 'safari', 6, 'open',
    'methods', 'a recipe to cook',
    'Chewy cookies with browned butter and white miso, rested overnight so the edges set and the middles stay soft.', null, null],
  ['inn', 'https://valleyroads.travel/stays/a-lakeside-inn-with-a-rowboat', 'A lakeside inn that lends you a rowboat', 'place', 'queue', 'phone', 9, 'open',
    'passage', 'a place to visit',
    'A twelve-room inn on a quiet lake, with breakfast on the dock and rowboats free to guests from May to October.', null, null],
  ['letterpress', 'https://makersreel.tv/watch/setting-type-by-hand', 'How a letterpress studio sets type by hand', 'video', 'queue', 'reading', 12, 'open',
    'research', 'a process to come back to',
    'Eight minutes in a two-person print shop, from picking lead type out of the case to pulling the first proof.', null, null],
  ['plant-app', 'https://sproutlog.dev/blog/an-app-that-reminds-you-to-water', 'Idea: an app that learns when each plant needs water', 'note', 'queue', 'added', 15, 'open',
    'space', 'an idea for something to build',
    'A short post sketching a watering log that learns each plant\'s rhythm from when you actually water it, rather than a fixed schedule.', null, null],
  ['noodles', 'https://nightmarketguide.com/spots/hand-pulled-noodles-on-fifth', 'Hand-pulled noodles on Fifth Street', 'place', 'queue', 'phone', 20, 'open',
    'tastebuds', 'a place to eat',
    'A counter-only noodle shop where the dough is pulled to order. The cumin lamb bowl is the one everyone talks about.', null, null],
  ['candle', 'https://wickandwhim.shop/products/fig-and-cedar', 'Fig and cedar candle', 'product', 'queue', 'firefox', 26, 'open',
    'giftme', 'a small gift',
    'A soy candle in a stoneware cup that keeps as a planter once it burns down.', null, null],
  ['sourdough', 'https://hearthandhob.com/guides/sourdough-starter-week-one', 'Your sourdough starter, day by day', 'article', 'queue', 'safari', 33, 'open',
    null, null, null, null, null],
  ['tide', 'https://coastalnotes.org/reading-a-tide-table', 'How to read a tide table', 'article', 'queue', 'reading', 41, 'open',
    'research', 'a reference to keep',
    'High and low water, springs and neaps, and why the times shift about fifty minutes each day.', null, null],
  ['bike', 'https://spokeandsaddle.com/guides/a-first-overnight-bike-trip', 'Packing for a first overnight bike trip', 'article', 'queue', 'phone', 55, 'open',
    'passage', 'a trip to plan',
    'A one-night loop, a checklist that fits on a handlebar bag, and the three things first-timers always forget.', null, null],

  // The bookmarks pile.
  ['glaze', 'https://kilnandclay.org/glazes/celadon-at-cone-six', 'Mixing a celadon glaze at cone six', 'article', 'bookmarks', 'firefox', 120, 'open',
    'research', 'a technique to keep',
    'A base recipe, the iron oxide range that gets the green, and test tiles at four thicknesses.', null, null],
  ['dumplings', 'https://hearthandhob.com/recipes/pork-and-chive-dumplings', 'Pork and chive dumplings', 'recipe', 'bookmarks', 'safari', 150, 'open',
    'methods', 'a recipe to cook',
    'A pleated-dumpling dough with hot water, a juicy filling, and a pan-fry that steams them through at the end.', null, null],
  ['stargazing', 'https://darkskyatlas.org/guides/a-beginners-sky', 'A beginner\'s sky, season by season', 'article', 'bookmarks', 'firefox', 210, 'open',
    'research', 'a long read worth keeping',
    'Four constellations per season to learn first, and how to find them from the ones you already know.', null, null],

  // On the Research shelf, with their full summaries already written.
  ['bread', 'https://slowpaper.org/essays/why-bread-goes-stale', 'Why bread goes stale, and what actually helps', 'research', 'queue', 'phone', 40, 'research',
    'research', 'a long read worth keeping',
    'Staling is starch recrystallizing, not drying out, which is why the fridge makes it worse.', 'research',
    'Stale bread is not mostly dry bread. As a loaf cools, the starch that swelled in the oven slowly packs back into tight crystals, and that is what makes the crumb firm and crumbly.\n\nWhat helps:\n- Keep it at room temperature, cut side down, or freeze it in slices.\n- Never the fridge: cold speeds the crystals up about six times.\n- A few minutes in a hot oven reverses it for a while, once.'],
  ['moss', 'https://fieldandfern.org/notes/growing-a-moss-garden', 'Growing a moss garden in the shade', 'research', 'queue', 'firefox', 60, 'research',
    'research', 'a project to read up on',
    'Moss wants shade, acid soil and regular misting, and it outcompetes lawn where grass struggles.', 'research',
    'Moss is the easy answer for the corner where grass gives up. It needs shade, compact acidic soil and steady moisture, and no mowing.\n\n- Clear the patch and rake it firm rather than loose.\n- Press in pieces from a similar spot, or blend moss with buttermilk and paint it on.\n- Mist daily for the first six weeks, then only in dry spells.'],
  ['quilt', 'https://patchandpiece.com/history/the-story-of-the-log-cabin-quilt', 'The story of the log cabin quilt', 'research', 'queue', 'reading', 75, 'research',
    'research', 'history to read slowly',
    'How a block built from strips around a center square became one of the most made quilt patterns.', 'research',
    'The log cabin block starts from a single center square, traditionally red for the hearth, with strips added around it in rings, light on one side and dark on the other.\n\nThe arrangement of the blocks, not the block itself, makes the pattern: the same blocks become Barn Raising, Straight Furrows or Sunshine and Shadow depending on how they are turned.'],

  // Already sorted, so her most-used apps rank first.
  ['done-1', 'https://hearthandhob.com/notes/sharpening-with-a-whetstone', 'Sharpening with a whetstone', 'note', 'queue', 'phone', 70, 'done', 'done', null, null, 'done', null],
  ['gift-1', 'https://fernandflax.shop/products/waffle-towel-set', 'Waffle-weave towel set', 'product', 'queue', 'firefox', 80, 'routed', 'giftme', null, null, 'giftme', null],
  ['gift-2', 'https://wickandwhim.shop/products/beeswax-tapers', 'Hand-dipped beeswax tapers', 'product', 'queue', 'phone', 85, 'routed', 'giftme', null, null, 'giftme', null],
  ['space-1', 'https://sproutlog.dev/blog/a-shared-grocery-list-that-sorts-by-aisle', 'A grocery list that sorts itself by aisle', 'note', 'queue', 'added', 90, 'routed', 'space', null, null, 'space', null],
];

for (const [i, [slug, href, title, kind, pile, source, ago, state, sug, reason, summary, destination, full]] of LINKS.entries()) {
  const seen = now - ago * DAY;
  const u = new URL(href);
  const key = `${u.host.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`;
  const decided = state === 'open' ? null : seen + 2 * DAY + i * 60_000;
  await db.execute({
    sql: `insert into links (id, userId, key, url, title, site, iconUrl, pile, kind, locations, inPhoneTabs, firstSeenAt,
            summary, summaryNote, suggestedDest, suggestedReason, pageText, state, destination, decidedAt, prevState,
            laterCount, laterUntil, fullSummary, fullSummaryRequestedAt, createdAt, updatedAt)
          values (?, ?, ?, ?, ?, ?, null, ?, ?, ?, ?, ?, ?, null, ?, ?, null, ?, ?, ?, null, 0, null, ?, ?, ?, ?)`,
    args: [
      `demo-link-${slug}`, OWNER, key, href, title, u.host.replace(/^www\./, ''), pile, kind, JSON.stringify(loc[source]),
      source === 'phone' && state === 'open' ? 1 : 0, seen,
      summary, sug, reason, state, destination, decided, full, full ? decided : null, seen, decided ?? seen,
    ],
  });
}

const count = await db.execute({ sql: 'select pile, state, count(*) as n from links where userId = ? group by pile, state', args: [OWNER] });
console.log(count.rows.map((r) => `${r.pile}/${r.state}: ${r.n}`).join('\n'));
