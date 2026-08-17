# App tour recorder

Records the short silent demo videos shown on the projects page of
crystalprism.io. Output matches what is already in `../../videos/`:
**1280×720, H.264 mp4, 15.00s, no audio.**

Re-run a tour whenever an app's UI changes — that is the point of this
existing at all, rather than filming once by hand.

## Why it is built this way

- **Recorded against throwaway demo databases seeded with invented data.**
  Nexus holds real private information about real people and Savor holds real
  eating-disorder recovery data. Neither may ever appear in a public video.
  Every seed script hard-refuses to run against anything but a local `file:` URL.
- **The production build is recorded, not `next dev`** — dev mode paints a Next
  dev-indicator badge that would end up in the video.
- **Nothing in an app repo is edited.** Env overrides are passed inline on the
  command line; Next does not override variables already set in `process.env`,
  so `.env` files stay untouched.
- **Frame 1 is the thumbnail.** The players on the projects page are
  click-to-play with no `poster` attribute, so whatever frame the video opens on
  is what a visitor stares at. The harness times the handover to the tour script
  and trims all page-load frames off the head.
- **Videos display at 175–345px wide** (`../../style.css`). Tours favour big
  colour and motion over dense screens, because fine text is unreadable there.

## Running one

Start the app's production build against its seeded demo DB, then record.
Each app needs its DB seeded once; after that only the server and the recorder.

### space

```sh
cd ~/Developer/space/web
TURSO_DATABASE_URL="file:data/demo.db" npx drizzle-kit push --force
TURSO_DATABASE_URL="file:data/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/space.mjs
TURSO_DATABASE_URL="file:data/demo.db" AUTH_TRUST_HOST=true npm run build
TURSO_DATABASE_URL="file:data/demo.db" AUTH_TRUST_HOST=true PORT=3210 npm run start
```

### nexus

Nexus's `.env` points at the **production** Turso database. The inline override
below is what keeps this local; do not drop it.

```sh
cd ~/Developer/nexus/web
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./drizzle "file:$(pwd)/data/demo.db"
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/nexus.mjs
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true npm run build
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true PORT=3220 npm run start
```

### savor

```sh
cd ~/Developer/savor
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./migrations "file:$(pwd)/demo.db"
TURSO_DATABASE_URL="file:$(pwd)/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/savor.mjs
TURSO_DATABASE_URL="file:$(pwd)/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true npm run build
TURSO_DATABASE_URL="file:$(pwd)/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true PORT=3230 npm run start
```

### giftme

Also points at prod. Its migrations are **not replayable onto a fresh DB**:
`0004` deliberately omits three `feedback` ALTERs because those columns already
existed in production from schema drift, which leaves `0005`'s backfill
referencing a column that never got created. Apply either side of the gap and
patch the middle:

```sh
cd ~/Developer/giftme/web
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./drizzle "file:$(pwd)/data/demo.db" --to 4
# then add the drifted columns: response (text), notify (integer NOT NULL DEFAULT 0), updated_at (integer)
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./drizzle "file:$(pwd)/data/demo.db" --from 5
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/giftme.mjs
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true PORT=3240 npm run start
```

### vitals

**Read seeds/vitals.mjs before touching this one.** An Epic refresh rotates
production tokens, and two pages auto-sync on mount if a connection row exists.
The seed writes zero rows to `fhir_connections`, `calendar_connections` and
`wearable_connections` and asserts it afterwards; the tour additionally aborts
any request leaving localhost. Never point it at `dev.db` — that file has held
real records.

```sh
cd ~/Developer/vitals
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./drizzle "file:$(pwd)/demo.db"
TURSO_DATABASE_URL="file:$(pwd)/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/vitals.mjs
TURSO_DATABASE_URL="file:$(pwd)/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true npm run build
TURSO_DATABASE_URL="file:$(pwd)/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true PORT=3250 npm run start
```

Note vitals is **not** on the crystalprism SSO ring: its cookie is
`authjs.session-token` with no `__Secure-` prefix over http, and the token needs
`role` and `checkedAt` claims.

### tide

Its migrations replay cleanly onto an empty file, so no `drizzle-kit push` is
needed. The env var is `DATABASE_URL`, not `TURSO_DATABASE_URL`.

```sh
cd ~/Developer/tide
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./db/migrations "file:$(pwd)/demo.db"
DATABASE_URL="file:$(pwd)/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/tide.mjs
DATABASE_URL="file:$(pwd)/demo.db" DATABASE_AUTH_TOKEN="" AUTH_TRUST_HOST=true npm run build
DATABASE_URL="file:$(pwd)/demo.db" DATABASE_AUTH_TOKEN="" AUTH_TRUST_HOST=true PORT=3260 npm run start
```

The seed writes **zero rows to `institution_link`**, and asserts it afterwards.
That table's `accessUrlEnc` is the encrypted SimpleFIN access URL — the bank
credential itself — and `/settings` decrypts it on render, which is why the
tour never goes there. No link row means nothing to decrypt and nothing a sync
could reach.

Tide's session callback resolves the user id **by email**, through
`upsertUserByEmail`, not from the token's `sub`. The address in `tours/tide.mjs`
must match the one the seed wrote or the app silently creates a second, empty
user and every screen renders its "link your first account" state.

Its tile is captured at `cssWidth: 620` rather than the default full width: the
overview is a four-column strip that would leave two thirds of a 458x376 tile
empty, and 620 puts it under its own two-column breakpoint.

### vantage

The only app whose demo data is **real**. It is a photo archive — an archive of
invented tiles demonstrates nothing — so the nightly dump is restored and then
de-identified: genuine photographs and capture metadata, invented account.

```sh
cd ~/Developer/vantage/web
rm -f data/demo.db && sqlite3 data/demo.db < ~/blob-backups/db/vantage.sql
ln -s ~/blob-backups/vantage/photos public/demo      # 3GB; symlink, never copy
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/vantage.mjs
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true npm run build
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" AUTH_TRUST_HOST=true PORT=3270 npm run start
```

The seed repoints every `photos.displayUrl`/`thumbUrl` at a local `/demo/` path
and asserts none are left pointing at R2, so a recording never touches
Cloudflare. `web/public/demo` and `web/data/` are gitignored.

**Delete order is load-bearing.** `archives.ownerUserId` cascades and
`photos.archiveId` cascades in turn, so clearing `users` first silently destroys
the archive and all 5,000 photo rows — the seed reports success against an empty
database. Create the demo owner and move the archive onto it *first*. The seed
now asserts a non-empty archive rather than trusting the order.

Its secret lives only in `.env.production.local`, not `.env.local`.

### flare

flare indexes every private repo in the fleet — real file paths, real function
names, real route paths, real commit SHAs — and both the video and the tile are
public, so **the real queue may never be recorded**. `seeds/flare.mjs` invents a
whole fictional fleet (six apps at `pinelight.dev`) and then sweeps every text
column in the seeded database for a real slug, domain or path before it exits.
Never point this at `flare.crystalprism.io`, and never at the Turso database.

flare keeps **no env file at all**, so the demo secret is passed inline and must
be the same value for the server, the tour and the tile. Two more differences
from every other app here: its session cookie is plain `authjs.session-token`
(it is not on the crystalprism SSO ring and sets no custom name, so @auth/core's
default applies and drops the `__Secure-` prefix over http), and the token must
carry a `uid` claim — `session.user.id` is read from that and from nothing else.

The two failure signatures are different and each names its own cause. A cookie
the server cannot read at all — wrong name, wrong `AUTH_SECRET` — is no session,
so `proxy.ts` 307s every page to `/login`. A cookie that reads fine but carries
an address other than `ADMIN_EMAIL` is a session that is not the administrator's,
so the page answers **404**: `requireAdmin()` throws and the page calls
`notFound()` on purpose. A recording that lands on the sign-in screen is the
first; one that lands on a 404 is the second.

```sh
export FLARE_SECRET="$(openssl rand -base64 32)"
cd ~/Developer/flare
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./drizzle "file:$(pwd)/data/demo.db"
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/flare.mjs
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" ADMIN_EMAIL=demo@pinelight.dev \
  AUTH_SECRET="$FLARE_SECRET" AUTH_TRUST_HOST=true npm run build
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" ADMIN_EMAIL=demo@pinelight.dev \
  AUTH_SECRET="$FLARE_SECRET" AUTH_TRUST_HOST=true PORT=3280 npm run start
```

Then, with `AUTH_SECRET` still exported, `node run.mjs flare` and
`node capture-tile.mjs flare`.

It is the one tour recorded at a **smaller CSS viewport** (896x504, scaled up
into the 1280x720 frame by ffmpeg). The payoff is a stack trace, and at 1280 CSS
pixels a 13px stack line lands under four physical pixels in a 345px player.
Note that Playwright only ever scales a page DOWN into `recordVideo.size`, so
the harness records at the viewport's own size and lets ffmpeg do the upscale;
asking Playwright for a frame bigger than the viewport parks the page in the
top-left corner of a grey canvas.

Every queue row is a real anchor to `/g/<id>` wrapping the whole row, so the step
from the list to a group's detail page is an actual click on the row — it used to
be a `goto`, because the rows were not links until that was fixed while filming.
The selector has to reach the row through its `<li>` (`.rows li:first-child …`):
`.row` is the anchor and the anchor is its `<li>`'s only child, so
`.row:first-child` matches every row rather than the first one.

### then

```sh
cd ~/Developer/crystalprism.io/tools/tours
node run.mjs space     # -> out/space.mp4
```

Copy the result into `../../videos/`. The filename must equal the
`data-project` attribute in `../../index.html`; `main.js` builds the src from it.

## Tile images

Each entry also needs `images/<app>.png` (the projects-page tile) and
`images/<app>-icon.png`.

**The tile must be exactly 458x376.** The grid centres each item in its flex
row, so any image with a different aspect ratio sits with visible gaps above and
below it while its neighbours fill their cells — which is exactly how nexus,
space, savor and vitals first shipped. With the app running:

```sh
node capture-tile.mjs vitals    # writes ../../images/vitals.png at 458x376
```

The icon is the app's own `public/icon-512.png` scaled to 512x512.

Verify after any change — this should print one line:

```sh
cd ../../images && for f in $(grep -o 'images/[a-z0-9.-]*\.png' ../index.html | grep -v icon | sed 's|images/||' | sort -u); do
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$f"; done | sort | uniq -c
```

Tiles are public, so they must show seeded demo data too — giftme's shipped for
a while showing real names and real gift counts.

## Reviewing a take

A contact sheet is far faster than watching:

```sh
ffmpeg -y -i out/space.mp4 -vf "fps=1,scale=426:240,tile=5x3" -frames:v 1 /tmp/sheet.jpg
```

Watch for blank frames at route changes. If one appears, the tour is waiting on
the URL rather than on content — wait for a selector that only exists once the
screen has actually drawn.

## Gotchas that cost time

- **The session token must be minted by the target app's own `next-auth`.** A
  copy of `@auth/core` installed beside this rig produces a token the app
  silently rejects with a 302 to `/login` and no error. `lib/session.mjs` shells
  out with `cwd` set to the app directory for exactly this reason.
- **The salt passed to `encode()` must equal the cookie name**, and under a
  production build that name carries the `__Secure-` prefix. Browsers refuse to
  send a `__Secure-` cookie over plain http, which is why `lib/cookie-proxy.mjs`
  injects it server-side instead of letting the browser hold it.
- **Playwright does not draw a cursor.** `lib/cursor.js` paints a synthetic one,
  otherwise clicks look like the UI changing by itself.
- **Keep the tour a little over 15s.** ffmpeg trims the tail; overrun by more
  than a second or two and the ending is cut off. The harness warns if a video
  comes out short.
