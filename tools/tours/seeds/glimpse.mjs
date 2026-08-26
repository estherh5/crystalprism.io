// Seeds a throwaway demo DB for glimpse.
//
// The CLIPS ARE REAL — the same footage Esther shoots the app for, four of the
// five files in `glimpse/samples/`. Glimpse is a gallery of cinemagraphs, and a
// gallery of invented ones does not exist: there is no way to fabricate "an
// iPhone held still while something in the frame moves". This is the vantage
// case exactly, and it gets vantage's answer — genuine footage, invented
// account around it.
//
// The fifth sample (`portrait-IMG_1721.mov`) is DELIBERATELY LEFT OUT. It is
// the most striking clip of the set and the strongest candidate for a video
// that has to sell the app in fifteen seconds, and it is the inside of her
// bathroom. The tile and the video are public. If she ever says to use it,
// add it here; do not add it on your own reading of "it just looks abstract".
//
// Nothing here reaches Cloudflare. `loop_url` and `poster_url` are full URL
// TEXT columns written once at render time by `web/lib/storage.ts:publicUrl`
// and read back verbatim by `web/components/Loop.tsx` — nothing re-derives them
// from a key — so a local `/demo/...` path is all it takes to keep a recording
// off R2 entirely. The assertion at the bottom proves it rather than trusting
// it, the same way seeds/vantage.mjs does.
//
// The media itself is built by `tools/tours/seeds/glimpse-media.sh`, which
// writes `glimpse/web/public/demo/`. Both that directory and `web/data/` are
// gitignored in the glimpse repo.
//
// Writes ONLY to the file named by TURSO_DATABASE_URL.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}

const db = createClient({ url });

// The email must equal the ADMIN_EMAIL the demo server is started with. Every
// screen except `/s/[token]` calls `isAdminEmail(email)` and `notFound()`s
// otherwise (`web/lib/admin.ts:isAdminEmail`), so an ordinary invited account
// would record a tour of four 404s.
const USER = {
  id: 'demo-user-glimpse',
  email: 'demo@crystalprism.io',
  name: 'Demo',
};

// Titles are what the shot IS. In the crystalprism modal the gallery renders at
// ~175px wide, where the title is a single line under a moving frame — an
// evocative name reads as a random word, and these clips already carry all the
// atmosphere the screen can hold.
//
// [slug, title, note, w, h, durationMs, loopMode, crossfadeMs, capturedDaysAgo]
//
// `pines` is the portrait one, and it is here to prove the product's hardest
// claim: the gallery holds portrait and landscape side by side without making
// either fit a box. Three landscape to one portrait is the ratio of the real
// library.
const CLIPS = [
  ['harbor', 'Harbour at last light', 'The whole surface moves and nothing else does.',
    960, 540, 8008, 'crossfade', 600, 41],
  ['circle', 'Traffic, from above, in the rain',
    'Six lanes and a crossing signal, all of it on its own clock.',
    960, 540, 8008, 'repeat', 0, 96],
  ['pines', 'Rain coming through the pines', 'Held on the one gap where the light gets in.',
    540, 960, 8008, 'repeat', 0, 132],
  ['bridge', 'Under the bridge at slack water',
    'Barely anything happens. That is the entire point of it.',
    960, 540, 5005, 'pingpong', 0, 178],
];

const now = Date.now();
const day = 86_400_000;

const stmts = [];

// Clean slate so re-running the seed is idempotent.
for (const t of ['feedback_messages', 'feedback', 'clips', 'invites', 'users']) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO users (id, email, name, image, created_at) VALUES (?, ?, ?, NULL, ?)',
  args: [USER.id, USER.email, USER.name, now - 200 * day],
});

CLIPS.forEach(([slug, title, note, w, h, durationMs, mode, crossfadeMs, daysAgo], i) => {
  const capturedAt = now - daysAgo * day;
  stmts.push({
    sql: `INSERT INTO clips
      (id, owner_id, title, note, captured_at, created_at, updated_at,
       source_key, source_w, source_h, source_duration_ms,
       trim_start_ms, trim_end_ms, loop_mode, crossfade_ms,
       loop_url, loop_duration_ms, poster_url,
       audio_mode, audio_url, audio_offset_ms, audio_gain,
       stabilized, stabilize_cost_pct, unoptimized,
       visibility, share_token, sort_order, collection_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'silent', NULL, 0, 1,
              ?, ?, 0, ?, ?, ?, NULL)`,
    args: [
      `demo-clip-${slug}`,
      USER.id,
      title,
      note,
      capturedAt,
      capturedAt,
      capturedAt,
      // Never read during a recording — the original is fetched only by the
      // editor's "Re-edit" panel, which the tour does not open. A local path
      // rather than an R2 key so the off-box assertion below covers it too.
      `/demo/${slug}.mp4`,
      w,
      h,
      durationMs,
      0,
      durationMs,
      mode,
      crossfadeMs,
      `/demo/${slug}.mp4`,
      durationMs,
      `/demo/${slug}.jpg`,
      // `stabilized` is a real column with a real meaning; the harbour clip was
      // shot handheld and reads as steadied, the others were not.
      slug === 'harbor' ? 1 : 0,
      slug === 'harbor' ? 1.8 : 0,
      // One clip carries a live share link so the clip page has something to
      // show in its share control instead of an empty affordance. `unlisted` is
      // the pair `shareFields` writes with a token; a token without it would be
      // a link the route refuses.
      slug === 'harbor' ? 'unlisted' : 'private',
      slug === 'harbor' ? 'demo-share-token-harbour' : null,
      i,
    ],
  });
});

await db.batch(stmts, 'write');

// Prove the recording cannot reach Cloudflare, rather than trusting the rows
// above: one stray absolute URL in any media column is one R2 request in a
// public video.
const { rows: offbox } = await db.execute(
  `SELECT id, loop_url, poster_url, source_key, audio_url FROM clips
   WHERE loop_url LIKE 'http%' OR poster_url LIKE 'http%'
      OR source_key LIKE 'http%' OR audio_url LIKE 'http%'`,
);
if (offbox.length) {
  throw new Error(`${offbox.length} clip row(s) still point off-box: ${JSON.stringify(offbox)}`);
}

const { rows } = await db.execute(
  'SELECT loop_mode, source_w, source_h, visibility FROM clips ORDER BY sort_order',
);
console.log(`seeded ${url}`);
for (const r of rows) {
  console.log(`  ${r.source_w}x${r.source_h}  ${r.loop_mode}  ${r.visibility}`);
}
