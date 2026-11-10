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
  color and motion over dense screens, because fine text is unreadable there.

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

vitals is on the crystalprism SSO ring (2026-11), so the default ring cookie
applies, not `authjs.session-token`. The token needs a `role` claim; the claims
`capture-tile.mjs`'s `APPS.vitals` mints are the authority.

### tide

Build `demo.db` from scratch with tide's OWN migrator (`npm run db:migrate`),
not `lib/apply-migrations.mjs`. The generic runner dies on 0031, whose only
statement is a `/* */` comment, and it writes no `__drizzle_migrations` ledger
either way. A `demo.db` with no ledger, or one that predates the newest
migration, fails sign-in with "admission lookup failed" because the `user`
table lacks the newer columns. Delete the old file first; the seed dates every
row relative to today, so a re-seed also keeps current-month figures off $0.
The env var is `DATABASE_URL`, not `TURSO_DATABASE_URL`.

```sh
cd ~/Developer/tide
rm -f demo.db
DATABASE_URL="file:$(pwd)/demo.db" DATABASE_AUTH_TOKEN= npm run db:migrate
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

### restock

Its migrations replay cleanly onto an empty file, so no `drizzle-kit push` and
no patching is needed. The env var is `DATABASE_URL`, like tide.

`ADMIN_EMAIL` must be set at both build and start, to `demo@crystalprism.io` —
the address `seeds/restock.mjs` writes. Two things depend on it: it is what
puts the fourth row (Admin) in the sidebar (`lib/guard.ts` `isAdminEmail`),
and it is what lets the seeded account past the admission gate on every
session read (`lib/guard.ts` `maySignIn` / `revalidateAdmission`) without a
row in `invites`.

```sh
cd ~/Developer/restock
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./db/migrations "file:$(pwd)/demo.db"
DATABASE_URL="file:$(pwd)/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/restock.mjs
DATABASE_URL="file:$(pwd)/demo.db" ADMIN_EMAIL=demo@crystalprism.io RESEND_API_KEY= BLOB_READ_WRITE_TOKEN= \
  AUTH_TRUST_HOST=true npm run build
DATABASE_URL="file:$(pwd)/demo.db" ADMIN_EMAIL=demo@crystalprism.io RESEND_API_KEY= BLOB_READ_WRITE_TOKEN= \
  AUTH_TRUST_HOST=true PORT=3300 npm run start
```

Blank `RESEND_API_KEY` and `BLOB_READ_WRITE_TOKEN` on the command line —
restock's own `.env.local` carries live values for both, and Next does not
override a variable already set in `process.env`.

`seeds/restock.mjs` writes ~60 days of real `adjustment` rows for every item,
ending exactly at that item's current `qty`, so `lib/predict.ts`
`estimateRatePerDay` has real signal — the item drawer's usage-strip
sparkline (what replaced the old /trends page) is never the "not enough
history yet" placeholder, and the On-the-way section's coverage chips (what
replaced /deliveries) are the app's own `isCovered` arithmetic, not a staged
label.

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
top-left corner of a gray canvas.

Every queue row is a real anchor to `/g/<id>` wrapping the whole row, so the step
from the list to a group's detail page is an actual click on the row — it used to
be a `goto`, because the rows were not links until that was fixed while filming.
The selector has to reach the row through its `<li>` (`.rows li:first-child …`):
`.row` is the anchor and the anchor is its `<li>`'s only child, so
`.row:first-child` matches every row rather than the first one.

### glimpse

Its migrations replay cleanly onto an empty file. Build the demo media first —
it is four of the five clips in `glimpse/samples/`, trimmed and re-encoded into
`glimpse/web/public/demo/`, which is gitignored along with `web/data/`:

```sh
sh ~/Developer/crystalprism.io/tools/tours/seeds/glimpse-media.sh
cd ~/Developer/glimpse/web
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./drizzle "file:$(pwd)/data/demo.db"
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/glimpse.mjs
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" ADMIN_EMAIL=demo@crystalprism.io \
  AUTH_TRUST_HOST=true npm run build
TURSO_DATABASE_URL="file:$(pwd)/data/demo.db" TURSO_AUTH_TOKEN="" ADMIN_EMAIL=demo@crystalprism.io \
  AUTH_TRUST_HOST=true PORT=3290 npm run start
```

**The clips in the video are real footage.** Glimpse is a gallery of
cinemagraphs — an iPhone held still while something inside the frame moves — and
there is no way to invent one, so this is the vantage case and gets vantage's
answer: genuine clips, invented account. The fifth sample is deliberately not
seeded; `seeds/glimpse.mjs` says why in its header.

On the crystalprism SSO ring (2026-11), so the default ring cookie applies, not
`authjs.session-token`. Its own difference is the gate: `ADMIN_EMAIL` is
the **owner** check, not an admission list, and every screen except `/s/[token]`
calls `notFound()` for anyone else (`web/lib/admin.ts:isAdminEmail`). So the
inline `ADMIN_EMAIL` above must equal the address `seeds/glimpse.mjs` writes.
A recording that lands on `/login` is the cookie name; one that lands on a 404
is the address.

Its tile framing lives in `capture-tile.mjs`'s `APPS` literal and **that file is
the authority, not this one** — this paragraph said `cssWidth: 900` for weeks
after the code had settled on 760, and a reader who trusted it reintroduced a
framing that had already been tried and thrown away. It is currently
`cssWidth: 760, scrollY: 45`; the comment beside it records what else was tried.

The gallery is no longer a lit hero above a row of inserts. O2 made it a
pink-hour sky over a brick facade of justified courses, and the tour and the
tile were both re-framed for it on 2026-09-01. Two things follow: the sheet is
packed on the CLIENT, so anything waiting on it must wait for
`.sheet[data-packed="1"]` and not for a tile (before that flag flips, a course
may wrap and you capture short unjustified lines); and a tile goes live on
`pointerenter` under a fine pointer, so the tour's gesture is a GLIDE across the
wall — there is no hero to promote a clip into, and each tile links straight to
its own page.

### menagerie

**Every animal is invented and every "photo" is a drawing.** Esther's real
collection and its photos are private, so `seeds/menagerie.mjs` writes eight
made-up animals and renders their portraits with Chromium in the style of the
approved mockup. Nothing comes from production and nothing is fetched from R2 —
the seed refuses to run against anything but a `file:` DATABASE_URL, and it
fails if any photo row points somewhere other than its own local drawings.

```sh
cd ~/Developer/menagerie
rm -f demo.db
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs ./db/migrations "file:$(pwd)/demo.db"
(cd ~/Developer/crystalprism.io/tools/tours && DATABASE_URL="file:$HOME/Developer/menagerie/demo.db" node seeds/menagerie.mjs)
export AUTH_SECRET="$(openssl rand -base64 32)"
export DATABASE_URL="file:$(pwd)/demo.db" DATABASE_AUTH_TOKEN= ADMIN_EMAIL=demo@crystalprism.io \
  AUTH_TRUST_HOST=true R2_ACCOUNT_ID= R2_PUBLIC_BASE= RESEND_API_KEY=
npm run build && (PORT=3310 npm run start &)
```

Keep that `AUTH_SECRET` exported: `capture-tile.mjs` and `run.mjs` both mint
their session with it, and a fresh one mid-run lands you on `/login`.

`ADMIN_EMAIL` **must** equal `demo@crystalprism.io` — the address the seed
writes. Anything else and every page redirects to `/login?removed=1`, which
reads like a broken cookie rather than a wrong address.

With `R2_PUBLIC_BASE` empty the drawings are served from the app's own
`public/uploads/photos/`, which is gitignored in menagerie.

Juniper and Octavia have real clips: Gemini output from their drawings, made
once (2026-11-02, ~41c each) and committed in `seeds/menagerie-clips/`. The seed
copies them to `public/uploads/clips/` and writes ready `clips` rows with the
app's own source hash, so nothing offers to remake them. Never regenerate them
by running `scripts/photo-scan.mts --clips-only` against the demo: it loads
`.env.scan.local`, whose R2 credentials are production. `capture-tile.mjs`
hovers a clip card (`hover`/`hoverMs`) so the tile catches Juniper mid-blink, and
the tour is budgeted to `run.mjs`'s hard 15s cut — add a beat and the photo
pins fall off the end.

Building in `~/Developer/menagerie` itself works, but a `git archive HEAD` copy
with `cp -cR node_modules` keeps its `.next` untouched; copy
`public/uploads/{photos,clips}` into the copy after seeding.

Pins reveal on HOVER (`onMouseEnter`), so the tour glides onto `.photo-frame`
and holds — it must not click, because on a hover-capable device the click
toggles the reveal straight back off.

### passage

**Build in a COPY, never in `~/Developer/passage`.** launchd's
`com.esther.passage-web` serves that checkout's `.next` on :4700, so a demo
build there replaces her live one. Its `.env.local` DATABASE_URL is production
too; `git archive` leaves every env file behind, so the copy has no
credentials at all. Every trip is invented and every photo is a drawing the
seed renders into the copy's `public/uploads/demo/`, which must happen before
the build (a production server only serves what `public/` held at build time).

```sh
C=/tmp/passage-demo && rm -rf $C && mkdir -p $C
git -C ~/Developer/passage archive origin/main | tar -x -C $C
cp -Rc ~/Developer/passage/node_modules $C/          # APFS clone, ~free
node ~/Developer/crystalprism.io/tools/tours/lib/apply-migrations.mjs $C/db/migrations "file:$C/demo.db"
(cd ~/Developer/crystalprism.io/tools/tours && DATABASE_URL="file:$C/demo.db" PASSAGE_APP_DIR=$C node seeds/passage.mjs)
export AUTH_SECRET="$(openssl rand -base64 32)"
export DATABASE_URL="file:$C/demo.db" DATABASE_AUTH_TOKEN= ADMIN_EMAIL=demo@crystalprism.io AUTH_TRUST_HOST=true
cd $C && npm run build && (npx next start -H 127.0.0.1 -p 3330 &)
```

Keep `AUTH_SECRET` exported for `capture-tile.mjs passage` and `run.mjs passage`.
The session is minted by the real checkout's `next-auth` (read-only). It
carries `checkedAt:passage`, `signedInAt` and `ringCheckedAt`, so no session
read calls the ring endpoint on crystalprism.io.

The trip page runs six maplibre maps, which keep headless Chromium's main
thread busy for seconds. So the tour scrolls with one in-page smooth
`scrollBy` per move instead of `glideScroll`. Queued wheel events crawl, and
any that land on a map zoom the map instead of scrolling the page.

### yayday

**Every idea is invented.** Esther's lists are private, so `seeds/yayday.mjs`
writes made-up ideas across the three lists (Little bit of yay, Better me,
Bucket list), four Did it ✶ memories and a fixed pick for today, so the
thumbnail is the same sun on every run. Run yayday's OWN migrator to build the
file; the seed refuses anything but a `file:` DATABASE_URL.

```sh
cd ~/Developer/yayday
rm -f demo.db
DATABASE_URL="file:$(pwd)/demo.db" DATABASE_AUTH_TOKEN= node scripts/migrate.mjs
DATABASE_URL="file:$(pwd)/demo.db" node ~/Developer/crystalprism.io/tools/tours/seeds/yayday.mjs
export AUTH_SECRET="$(openssl rand -base64 32)"
export DATABASE_URL="file:$(pwd)/demo.db" DATABASE_AUTH_TOKEN= ADMIN_EMAIL=demo@crystalprism.io \
  AUTH_TRUST_HOST=true RING_SERVICE_SECRET= RESEND_API_KEY=
npx next build && (npx next start -p 3269 & ~/.claude/hooks/dev-servers.sh track $!)
```

Building in `~/Developer/yayday` is safe: it is Vercel-hosted, with no launchd
job serving its `.next`. Delete `demo.db` when done.

Items are keyed on `users.id`, which `lib/guard.ts#currentUser` looks up by the
session's email. The minted session carries a fresh `checkedAt:yayday` (plus
`signedInAt` and `ringCheckedAt`, so nothing asks auth.crystalprism.io), so
admission never re-runs and never writes that row itself. The seed writes it.
Without it, Home renders as a brand-new account: an empty sun and no tallies.

R2 is unset, so the shelf shows its sparkle stubs, not photos. The tour types
one idea into Add an idea, which writes to `demo.db`; re-seed before a second
take. The Plausible script is aborted quietly; any other off-box request fails
the tour.

### aerie

**Everything is invented.** Aerie's own `db/seed/demo.ts` (`npm run seed:demo`) writes an
invented household, spots, items and generated photos onto the floor plan: no unit number,
street address or building name appears on any screen. It refuses anything but a `file:`
(or `aerie-demo`) DATABASE_URL. `STORAGE_DISK=1` serves the photos from `public/uploads`.

```sh
cd ~/Developer/aerie
export DATABASE_URL="file:$(pwd)/demo.db"
npx drizzle-kit migrate && npm run seed:demo
export AUTH_SECRET="$(openssl rand -base64 32)"
export DATABASE_AUTH_TOKEN= ADMIN_EMAIL=demo@crystalprism.io AUTH_TRUST_HOST=true STORAGE_DISK=1 \
  R2_ACCOUNT_ID= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_PUBLIC_BASE= RESEND_API_KEY= \
  NEXT_DIST_DIR=.next-demo
npm run build && git checkout -- tsconfig.json
(PORT=3418 npm run start & ~/.claude/hooks/dev-servers.sh track $!)
```

`NEXT_DIST_DIR=.next-demo` keeps the demo build out of `.next`. The seed's user id is
`demo-user-aerie`; the minted session stamps all three of aerie's claims. Restart the server
after re-seeding. Delete `demo.db` when done.

### tastebuds

**Everything is invented.** `seeds/tastebuds.mjs` writes invented places, visits, reviews and delivery
orders for two invented people (the owner is `demo@crystalprism.io`, the partner `sam@example.com`)
and refuses anything but a `file:` DATABASE_URL. Taste Buds' `.env.local` holds the PRODUCTION Turso
token and a Google Maps key, so every variable below is overridden inline, including the
`NEXT_PUBLIC_` flare pair that is baked in at build time. No R2 and no Maps key means no photos and no
Google calls. Build in place (the app has no `NEXT_DIST_DIR`), then restore `tsconfig.json` if it changed.

```sh
cd ~/Developer/tastebuds
export DATABASE_URL="file:$(pwd)/demo.db" DATABASE_AUTH_TOKEN= TURSO_PROD_URL= TURSO_PROD_AUTH_TOKEN=
export AUTH_SECRET="$(openssl rand -base64 32)" ADMIN_EMAIL=demo@crystalprism.io ANKUR_EMAIL= AUTH_TRUST_HOST=true
export R2_ACCOUNT_ID= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_BUCKET= R2_PUBLIC_BASE= RESEND_API_KEY= \
  GOOGLE_MAPS_API_KEY= CRON_SECRET= FLARE_URL= FLARE_KEY= NEXT_PUBLIC_FLARE_URL= NEXT_PUBLIC_FLARE_KEY= \
  AUTH_GOOGLE_ID= AUTH_GOOGLE_SECRET= RING_SERVICE_SECRET= APP_URL=http://localhost:3478 \
  FEEDBACK_REPLY_SECRET= RESEND_WEBHOOK_SECRET= FEEDBACK_EMAIL_TO= FEEDBACK_REPLY_DOMAIN=
rm -f demo.db && node scripts/migrate.mjs
node ~/Developer/crystalprism.io/tools/tours/seeds/tastebuds.mjs
npm run build
(PORT=3478 npm run start & ~/.claude/hooks/dev-servers.sh track $!)
```

The tour and `capture-tile.mjs` read `AUTH_SECRET` from the environment, so export the same value
there. The seed's user id is `demo-user-tastebuds`; the minted session stamps all three claims.
Delete `demo.db` when done.

### palette

**Every picture is invented.** Esther's board is ~1,100 private inspiration pictures, so
`seeds/palette.mjs` draws 30 abstract pictures with sharp (gradients, stripes, dots, color blocks)
and sends them through the app's own `POST /api/ingest`, so each gets its real six-chip palette and
swatch rows; then it writes six saved palettes and three collections. It refuses anything but a
`file:` DATABASE_URL. palette's `.env.local` holds the PRODUCTION Turso token and R2 keys, so
**build in a COPY** (`git archive` leaves every env file behind) and blank everything inline. With
no R2 env the server writes pictures to the copy's `public/uploads`.

```sh
C=<scratch>/palette-demo && mkdir -p $C
git -C ~/Developer/palette archive HEAD | tar -x -C $C
cp -cR ~/Developer/palette/node_modules $C/node_modules     # APFS clone, ~free
cd $C && cat > demo.env <<EOF
export DATABASE_URL="file:$C/demo.db" DATABASE_AUTH_TOKEN=
export AUTH_SECRET="$(openssl rand -base64 32)" ADMIN_EMAIL=demo@crystalprism.io AUTH_TRUST_HOST=true
export USER_API_KEY_ENCRYPTION_KEY="$(openssl rand -base64 32)"
export R2_ACCOUNT_ID= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_BUCKET= R2_PUBLIC_BASE= RESEND_API_KEY= \
  AUTH_GOOGLE_ID= AUTH_GOOGLE_SECRET= RING_SERVICE_SECRET= APP_URL=http://localhost:3488 \
  FEEDBACK_REPLY_SECRET= RESEND_WEBHOOK_SECRET= FEEDBACK_EMAIL_TO= FEEDBACK_REPLY_DOMAIN= \
  FLARE_URL= FLARE_KEY= NEXT_PUBLIC_FLARE_URL= NEXT_PUBLIC_FLARE_KEY= \
  RENDER_BACKEND= CODEX_BIN= OPENAI_API_KEY= SPACE_LINK_KEY= SPACE_URL= PALETTE_LINK_KEY= CRON_SECRET=
EOF
source demo.env && node scripts/migrate.mjs && npm run build
(npx next start -p 3488 & ~/.claude/hooks/dev-servers.sh track $!)
(cd ~/Developer/crystalprism.io/tools/tours && PALETTE_APP_DIR=$C APP_PORT=3488 node seeds/palette.mjs)
# restart the server once after seeding: pictures written after start are not served until then
```

Keep `demo.env` sourced for `capture-tile.mjs palette` and `run.mjs palette`: the session is
minted with its `AUTH_SECRET` by the real checkout's `next-auth` (read-only), carrying all three of
palette's claims. The seed encrypts an invented OpenAI key under the demo
`USER_API_KEY_ENCRYPTION_KEY` so the wall's setup panel is done and stays out of the frame.

A client-side click on the Saved tab landed back on the Wall in the demo build (2026-11-08), while
a direct load of `/saved` rendered, so the tour rests the cursor on the tab and loads the page.

### latent

**Every thought is invented.** `seeds/latent.mjs` writes 16 invented thoughts for `demo@crystalprism.io`,
each already `ready` with a plain original layout and no generated design, so the demo never calls a model
(leave `ANTHROPIC_API_KEY` empty), and refuses anything but a `file:` DATABASE_URL. latent's `.env.local`
holds production secrets, so **build in a COPY** (`git archive` leaves every env file behind) and blank
everything inline.

```sh
C=<scratch>/latent-demo && mkdir -p $C
git -C ~/Developer/latent archive HEAD | tar -x -C $C
cp -cR ~/Developer/latent/node_modules $C/node_modules     # APFS clone, ~free
cd $C && cat > demo.env <<EOF
export DATABASE_URL="file:$C/demo.db" DATABASE_AUTH_TOKEN=
export AUTH_SECRET="$(openssl rand -base64 32)" ADMIN_EMAIL=demo@crystalprism.io AUTH_TRUST_HOST=true INVITE_ONLY=
export USER_API_KEY_ENCRYPTION_KEY="$(openssl rand -base64 32)" ENCRYPTION_KEY=
export ANTHROPIC_API_KEY= DESIGN_BACKEND=api RESEND_API_KEY= EMAIL_FROM= AUTH_GOOGLE_ID= AUTH_GOOGLE_SECRET= \
  RING_SERVICE_SECRET= APP_URL=http://localhost:3498 CRON_SECRET= FEEDBACK_REPLY_SECRET= RESEND_WEBHOOK_SECRET= \
  FEEDBACK_EMAIL_TO= FEEDBACK_REPLY_DOMAIN= FLARE_URL= FLARE_KEY= FLARE_ROSTER_KEY= NEXT_PUBLIC_FLARE_URL= \
  NEXT_PUBLIC_FLARE_KEY= VITALS_URL= INTEGRATION_TOKEN_LATENT= SPACE_URL= SPACE_LINK_KEY_LATENT= \
  PALETTE_URL= PALETTE_LINK_KEY_LATENT= LATENT_SLIDES_BUCKET=
EOF
source demo.env && node scripts/migrate.mjs && npm run build
(npx next start -p 3498 & ~/.claude/hooks/dev-servers.sh track $!)
(cd ~/Developer/crystalprism.io/tools/tours && node seeds/latent.mjs)
```

Keep `demo.env` sourced for `capture-tile.mjs latent` and `run.mjs latent`. The tile is the first
thought's own page (`/t/demo-thought-01`); the tour opens one thought from whichever home the app
picks, then Another and Set beside. Delete the copy when done.

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

**The tile must be exactly 458x376.** The grid centers each item in its flex
row, so any image with a different aspect ratio sits with visible gaps above and
below it while its neighbors fill their cells — which is exactly how nexus,
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
