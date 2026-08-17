// Seeds a throwaway demo DB for flare with entirely INVENTED apps and errors.
//
// SAFETY: flare's real queue is a live index of every private repo in the fleet —
// real file paths, real function names, real route paths, real commit SHAs. The
// tour video and the projects-page tile are both PUBLIC, so not one byte of the
// real queue may appear in either. This script therefore:
//
//   1. hard-refuses to run against anything but a local `file:` URL, and
//   2. hard-refuses to run against `data/local.db`, the working dev database,
//   3. seeds a wholly fictional fleet — "pinelight.dev" and its six apps do not
//      exist, and none of their slugs collides with a real one.
//
// It also asserts afterwards that no real fleet slug, real domain, or real
// filesystem path made it into any column.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}
if (/local\.db$/.test(url)) {
  throw new Error(`refusing to seed: ${url} is the working dev database, not a throwaway`);
}

const db = createClient({ url });

const DAY = 86_400_000;
const HOUR = 3_600_000;
const NOW = Date.now();
// listGroups() buckets by UTC day (`t - t % DAY`), so the strip's day boundaries
// are computed the same way here — otherwise a day's events land in the wrong tile.
const DAY_START = (daysAgo) => NOW - (NOW % DAY) - daysAgo * DAY;
const at = (daysAgo, hour = 11, min = 0) => DAY_START(daysAgo) + hour * HOUR + min * 60_000;

/**
 * `count` timestamps inside the UTC day `daysAgo`, none later than `end` and none
 * outside that day — so an event always lands in the confetti tile its `daily`
 * entry names, whatever hour of the day the tour happens to be recorded at, and
 * never carries a timestamp in the future.
 *
 * Returns [] when `end` falls before the day begins, which is how a group whose
 * last_seen is older than the window keeps its quiet days genuinely quiet.
 */
function spread(daysAgo, count, end) {
  if (count === 0) return [];
  const dayStart = DAY_START(daysAgo);
  const last = Math.min(end, dayStart + 22 * HOUR);
  const first = Math.max(dayStart + 30 * 60_000, last - 8 * HOUR);
  if (last < first) return [];
  const step = count > 1 ? (last - first) / (count - 1) : 0;
  return Array.from({ length: count }, (_, k) => Math.round(first + k * step));
}

/* ── the invented fleet ─────────────────────────────────────────────────────
   Six fictional apps belonging to a fictional studio at pinelight.dev. Names
   chosen to sound like the kind of small personal app flare actually watches,
   and deliberately disjoint from every real slug. */
const APPS = [
  ['app-lantern', 'Lantern', '/srv/pinelight/lantern'],
  ['app-kestrel', 'Kestrel', '/srv/pinelight/kestrel'],
  ['app-dovetail', 'Dovetail', '/srv/pinelight/dovetail'],
  ['app-tessera', 'Tessera', '/srv/pinelight/tessera'],
  ['app-quill', 'Quill', '/srv/pinelight/quill'],
  ['app-driftwood', 'Driftwood', '/srv/pinelight/driftwood'],
];

/* ── the star group ─────────────────────────────────────────────────────────
   The one the tour opens. A minified client stack of the exact shape flare was
   built for, plus the source-mapped rendering of it. `resolvedStack` is written
   here on purpose: with it present, resolveAndCacheStack() returns the cached
   value and the page NEVER reaches the network during a recording.

   classifyStack() reports "resolved" when every browser frame in `stack` is gone
   from `resolvedStack` — all four http frames below become repo-relative paths,
   so the badge reads "Source-mapped". Two of them land in node_modules, which is
   what puts the dimmed `·` vendor markers on screen. */
const MIN_STACK = [
  "TypeError: Cannot read properties of undefined (reading 'count')",
  '    at Ur (https://lantern.pinelight.dev/_next/static/chunks/main-4f2a.js:1:88213)',
  '    at wc (https://lantern.pinelight.dev/_next/static/chunks/main-4f2a.js:1:41077)',
  '    at Sn (https://lantern.pinelight.dev/_next/static/chunks/fw-8b1e.js:2:19604)',
  '    at ho (https://lantern.pinelight.dev/_next/static/chunks/fw-8b1e.js:2:7712)',
].join('\n');

const RESOLVED_STACK = [
  "TypeError: Cannot read properties of undefined (reading 'count')",
  '    at ShelfHeader (app/shelves/[slug]/ShelfHeader.tsx:42:7)',
  '    at useShelfTotals (lib/shelf-totals.ts:18:22)',
  '    at renderWithHooks (node_modules/react-dom/client.prod.js:5241:16)',
  '    at beginWork (node_modules/react-dom/client.prod.js:7683:20)',
].join('\n');

const SERVER_STACK = (fn, file, line) =>
  [
    `Error: ${fn} failed`,
    `    at ${fn} (${file}:${line}:11)`,
    '    at async handler (app/api/route.ts:24:5)',
  ].join('\n');

/* ── the queue ──────────────────────────────────────────────────────────────
   [id, appId, kind, title, culprit, status, eventCount, daysOld, hoursAgo,
    stack, resolvedStack, extras]
   Ordered newest-lastSeen first, which is the order the triage list renders. */
const GROUPS = [
  {
    id: 'grp-lantern-shelf-count',
    appId: 'app-lantern',
    kind: 'client',
    title: "Cannot read properties of undefined (reading 'count')",
    culprit: 'Ur@main-4f2a.js',
    status: 'new',
    eventCount: 218,
    firstSeenDays: 3,
    lastSeenHours: 1,
    stack: MIN_STACK,
    resolvedStack: RESOLVED_STACK,
    release: '9f3c1ad',
    // A fresh spike: quiet all week, then a release lights the last three days.
    daily: [0, 0, 0, 0, 6, 30, 54],
    context: { route: '/shelves/[slug]', viewport: '390x844', shelf: 'winter-reading' },
  },
  {
    id: 'grp-quill-connections',
    appId: 'app-quill',
    kind: 'server',
    title: 'DbError: too many connections',
    culprit: 'getDraft (db/drafts.ts)',
    status: 'fixing',
    eventCount: 1204,
    firstSeenDays: 6,
    lastSeenHours: 3,
    stack: SERVER_STACK('getDraft', 'db/drafts.ts', 61),
    resolvedStack: null,
    release: '4b70e92',
    daily: [4, 6, 8, 10, 14, 20, 28],
    context: { route: '/drafts/[id]', pool: 'writer', waited_ms: 5031 },
  },
  {
    id: 'grp-dovetail-cutlist',
    appId: 'app-dovetail',
    kind: 'server',
    title: 'TypeError: cuts.length is not a function',
    culprit: 'renderCutlist (app/plans/[id]/page.tsx)',
    status: 'queued',
    eventCount: 312,
    firstSeenDays: 5,
    lastSeenHours: 6,
    stack: SERVER_STACK('renderCutlist', 'app/plans/[id]/page.tsx', 88),
    resolvedStack: null,
    release: '4b70e92',
    daily: [0, 0, 18, 20, 4, 6, 2],
    context: { route: '/plans/[id]', plan: 'walnut-shelf', units: 'imperial' },
  },
  {
    id: 'grp-kestrel-sync',
    appId: 'app-kestrel',
    kind: 'job',
    title: 'Sighting sync aborted after 3 retries',
    culprit: 'syncSightings (jobs/sync.ts)',
    status: 'regressed',
    eventCount: 46,
    firstSeenDays: 6,
    lastSeenHours: 9,
    stack: SERVER_STACK('syncSightings', 'jobs/sync.ts', 134),
    resolvedStack: null,
    release: '2ec55d0',
    daily: [8, 0, 0, 0, 10, 14, 8],
    context: { job: 'sync-sightings', attempt: 3, region: 'coastal' },
  },
  {
    id: 'grp-tessera-tile-range',
    appId: 'app-tessera',
    kind: 'client',
    title: 'Invariant: tile index out of range',
    culprit: 'placeTile (lib/board.ts)',
    status: 'needs-review',
    eventCount: 27,
    firstSeenDays: 4,
    lastSeenHours: 14,
    stack: [
      'Invariant: tile index out of range',
      '    at placeTile (lib/board.ts:73:9)',
      '    at onDrop (components/Board.tsx:112:5)',
    ].join('\n'),
    resolvedStack: null,
    release: '81aa4f6',
    branch: 'flare/tessera-tile-index',
    attemptCount: 2,
    lastAttemptNote:
      'Clamped the drop target to the board bounds and added a case for the 12x12 layout. Two tests added; the whole suite is green.',
    daily: [0, 3, 6, 4, 8, 5, 2],
    context: { route: '/play', layout: '12x12', dropped_at: 144 },
  },
  {
    id: 'grp-driftwood-upload-abort',
    appId: 'app-driftwood',
    kind: 'client',
    title: 'AbortError: The user aborted a request.',
    culprit: 'uploadPhoto (components/Uploader.tsx)',
    status: 'new',
    eventCount: 89,
    firstSeenDays: 2,
    lastSeenHours: 20,
    stack: [
      'AbortError: The user aborted a request.',
      '    at uploadPhoto (components/Uploader.tsx:57:13)',
      '    at async onSelect (components/Uploader.tsx:31:5)',
    ].join('\n'),
    resolvedStack: null,
    release: '9f3c1ad',
    daily: [0, 0, 4, 9, 16, 12, 7],
    context: { route: '/upload', bytes: 8_412_663, network: 'slow-2g' },
  },
  {
    id: 'grp-lantern-slug-collision',
    appId: 'app-lantern',
    kind: 'soft',
    title: 'Shelf slug collided, fell back to id',
    culprit: 'slugForShelf (lib/slug.ts)',
    status: 'ignored',
    eventCount: 15,
    firstSeenDays: 6,
    lastSeenHours: 30,
    stack: null,
    resolvedStack: null,
    release: '2ec55d0',
    // Quiet today — last_seen is 30h back, so the newest tile stays empty.
    daily: [2, 1, 3, 2, 4, 3, 0],
    context: { slug: 'winter-reading', fell_back_to: 'shelf_8812' },
  },
  {
    id: 'grp-kestrel-invalid-time',
    appId: 'app-kestrel',
    kind: 'server',
    title: 'RangeError: Invalid time value',
    culprit: 'formatSpotted (lib/dates.ts)',
    status: 'fixed',
    eventCount: 8,
    firstSeenDays: 6,
    lastSeenHours: 44,
    stack: SERVER_STACK('formatSpotted', 'lib/dates.ts', 22),
    resolvedStack: null,
    release: '2ec55d0',
    fixedDays: 1,
    fixedSha: '9f3c1ad',
    fixedRelease: '9f3c1ad',
    attemptCount: 1,
    lastAttemptNote: 'Guarded the parse and fell back to the raw string.',
    daily: [3, 2, 1, 1, 1, 0, 0],
    context: { route: '/sightings', value: 'unknown' },
  },
];

const stmts = [];
for (const t of ['events', 'groups', 'apps']) stmts.push({ sql: `DELETE FROM ${t}`, args: [] });

APPS.forEach(([id, name, repoPath], i) => {
  stmts.push({
    sql: `INSERT INTO apps (id, name, key_hash, repo_path, app_subdir, test_command,
            typecheck_command, autofix_enabled, created_at)
          VALUES (?, ?, ?, ?, '', 'npx vitest run', './node_modules/.bin/tsc --noEmit', 1, ?)`,
    // Invented digests: 64 hex characters that are not a hash of anything.
    args: [id, name, `${'a1b2c3d4e5f6'.repeat(5)}${String(i).padStart(4, '0')}`, repoPath, at(120)],
  });
});

for (const g of GROUPS) {
  const lastSeen = NOW - g.lastSeenHours * HOUR;
  stmts.push({
    sql: `INSERT INTO groups (id, app_id, fingerprint, kind, title, culprit, status,
            first_seen, last_seen, event_count, fixed_at, fixed_sha, fixed_release,
            branch, attempt_count, last_attempt_at, last_attempt_note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      g.id,
      g.appId,
      `fp-${g.id}`,
      g.kind,
      g.title,
      g.culprit,
      g.status,
      at(g.firstSeenDays),
      lastSeen,
      g.eventCount,
      g.fixedDays ? at(g.fixedDays) : null,
      g.fixedSha ?? null,
      g.fixedRelease ?? null,
      g.branch ?? null,
      g.attemptCount ?? 0,
      g.attemptCount ? at(1, 9) : null,
      g.lastAttemptNote ?? null,
    ],
  });

  // One row per event in the 7-day window, oldest bucket first. The confetti
  // strip buckets these by day, so the shape of `daily` is what a viewer sees.
  // Every event of a group carries the same stack, which makes the rule in
  // newestEventWithStack() indifferent to which one it picks.
  let n = 0;
  g.daily.forEach((count, dayIdx) => {
    const daysAgo = 6 - dayIdx;
    for (const occurredAt of spread(daysAgo, count, lastSeen)) {
      stmts.push({
        sql: `INSERT INTO events (id, group_id, occurred_at, release, environment,
                message, stack, resolved_stack, url, user_agent, context)
              VALUES (?, ?, ?, ?, 'production', ?, ?, ?, ?, ?, ?)`,
        args: [
          `${g.id}-e${n++}`,
          g.id,
          occurredAt,
          g.release,
          g.title,
          g.stack,
          g.resolvedStack,
          `https://${g.appId.replace('app-', '')}.pinelight.dev${g.context.route ?? '/'}`,
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36',
          JSON.stringify(g.context),
        ],
      });
    }
  });
}

await db.batch(stmts, 'write');

/* ── assertions ─────────────────────────────────────────────────────────────
   Never trust that the invented data stayed invented. Every text column in the
   database is swept for a real fleet slug, a real domain, or a real path. */
const BANNED = [
  'crystalprism',
  'estherhoffman',
  'hoffman.esther',
  '/Users/',
  'Developer/',
  'turso.io',
  'vercel.app',
  ...['tide', 'vitals', 'nexus', 'giftme', 'passage', 'savor', 'restock', 'space',
      'vantage', 'idreamofneon', 'methods', 'marian', 'backups'],
];

const TEXT_COLUMNS = {
  apps: ['id', 'name', 'key_hash', 'repo_path', 'app_subdir', 'test_command', 'typecheck_command'],
  groups: ['id', 'app_id', 'fingerprint', 'kind', 'title', 'culprit', 'status', 'fixed_sha',
           'fixed_release', 'branch', 'last_attempt_note'],
  events: ['id', 'group_id', 'release', 'environment', 'message', 'stack', 'resolved_stack',
           'url', 'user_agent', 'context'],
};

/**
 * A word-boundary matcher that stays honest for terms whose own edges are not
 * word characters. A blanket `(^|[^a-z0-9])…([^a-z0-9]|$)` silently NEVER fires
 * on `/Users/` — the character after the trailing slash is the first letter of a
 * username — which is exactly the kind of guard that reports "clean" forever.
 */
const boundaried = (term) => {
  const t = term.toLowerCase().replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const lead = /^[a-z0-9]/.test(term) ? '(?<![a-z0-9])' : '';
  const tail = /[a-z0-9]$/.test(term) ? '(?![a-z0-9])' : '';
  return new RegExp(`${lead}${t}${tail}`);
};

// Proof the matcher is not inert, run before it is trusted with anything.
for (const [sample, term] of [
  ['/Users/someone/Developer/app', '/Users/'],
  ['at x (app/vitals/page.tsx:1:1)', 'vitals'],
  ['demo@crystalprism.io', 'crystalprism'],
]) {
  if (!boundaried(term).test(sample.toLowerCase())) {
    throw new Error(`leak matcher is inert: ${term} did not match ${sample}`);
  }
}
for (const [sample, term] of [['whitespace matters', 'space'], ['tidewater', 'tide']]) {
  if (boundaried(term).test(sample.toLowerCase())) {
    throw new Error(`leak matcher over-fires: ${term} matched ${sample}`);
  }
}

let hits = 0;
for (const [table, cols] of Object.entries(TEXT_COLUMNS)) {
  const { rows } = await db.execute(`SELECT ${cols.join(', ')} FROM ${table}`);
  for (const row of rows) {
    for (const col of cols) {
      const value = row[col];
      if (typeof value !== 'string') continue;
      const lower = value.toLowerCase();
      for (const banned of BANNED) {
        if (boundaried(banned).test(lower)) {
          console.error(`LEAK ${table}.${col}: ${banned} in ${JSON.stringify(value)}`);
          hits++;
        }
      }
    }
  }
}
if (hits) throw new Error(`refusing to finish: ${hits} real identifier(s) found in the seeded DB`);

const counts = {};
for (const t of ['apps', 'groups', 'events']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  counts[t] = Number(rows[0].n);
}
console.log(`seeded ${url}`);
console.log(`  ${counts.apps} apps, ${counts.groups} groups, ${counts.events} events`);
console.log('  0 real identifiers found');
