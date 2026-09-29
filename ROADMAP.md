# Roadmap

Committed doc, not scratch. Kept current by hand as work ships.
**Shipped** = live in production. **Next** = intended, not promised.
**Declined** = decided against, with the reason, so it doesn't get re-proposed.
**Open questions** = unresolved calls, with what would settle them.

## Shipped

- **2026-09** **My Account and the Thought Writer editor wait for the one-time token migration.**
  Both pages chain their data requests on `checkIfLoggedIn()`'s Promise, so a visitor still holding a
  pre-cookie token gets their data on the first load instead of a blank page. My Account no longer
  bounces a migrating visitor with no stored username through Sign In and back, and
  `common.js#verifySession` resolves only after it has stored the username. Covered by
  `tests/migration.test.js`.

- **2026-09** **Sign-out only reports success when the server confirms it.**
  `common.js#requestLogout` clears `username` only on a 2xx from `/api/logout`; on a network or
  server error the sign-in page keeps the header signed in, skips the redirect to My Account, and
  says "Sign-out didn't reach the server, so you're still signed in." Clicking Sign Out again
  retries. The session check now waits for the logout to settle. Covered by
  `tests/logout.test.js` (red on the old code).
- **2026-09** **Security roadmap closed — session cookie, CSP, username URLs, markup check.**
  - The session token no longer lives in `localStorage`: api.crystalprism.io sets an HttpOnly,
    Secure, SameSite=Strict `cp_session` cookie (Path=/api), and every authed fetch sends
    `credentials: 'include'` with no `Authorization` header. Cookie-authed writes need an
    allowlisted Origin. A legacy stored token is exchanged once via `POST /api/session` and deleted;
    the auth.crystalprism.io bridge token goes through the same exchange. Sign-out calls
    `POST /api/logout`. Verified with a 47-check Playwright run against a local API. Commits
    api 32a9a1f, site 0a72fd6.
  - Content-Security-Policy plus `nosniff` and `Referrer-Policy`, served from `_headers`. There is
    no `unsafe-eval` and no inline script: the easel palette `eval` and jscolor's string callbacks
    were rewritten. 0 violations across all 15 pages, including interactions. Commits d8fdb23, 450c0f4.
  - `contains_markup` now rejects only complete tags, `<!--` and HTML entities, so `a<b` saves.
    My Account, the Thought Writer editor and the easel show the server's 400 reason instead of
    failing silently. Commits api 4981639, site d147fe7.
  - Usernames are `encodeURIComponent`-ed in every profile URL. The profile page validates
    `^[a-zA-Z0-9_-]+$` and shows not-found otherwise. `tests/` (`npm test`) holds a committed
    regression test for the `RICH_TEXT_SRC` image allowlist and the username validator, proven to
    go red. Commit 91ae13b.

- **2026-09** **Stored XSS fixed — other users' rich text is sanitised.** Post/comment content and
  titles, drawing titles, and about/name/email were written to `innerHTML` unsanitised on public
  pages, so a `<font>`/`<img>`-carrying post could run script in any reader's session, including
  reading the auth token. Rich text now passes through DOMPurify on read (this repo) and on write
  (api.crystalprism.io) against a shared allowlist; plain fields (names, about) render via
  `textContent` instead. Image `src` inside rich text is restricted to raster
  `data:image/(png|jpeg|gif|webp)` and `https?:` — `data:image/svg+xml` was accepted in review
  round 1 and tightened, since SVG can carry a `<script>`. Verified: 30 real production posts
  render byte-identical DOM and screenshots before/after; a headless-browser XSS sentinel fired on
  7 pages before the fix and 0 after. Commits c6e49dc, 0bddc24. **Username sinks were ruled out of
  scope for that round** (`update_user` didn't validate usernames before 2026-09-06, so a legacy
  row could still hold markup and reach `innerHTML` — post writer/commenter links, the leaderboard
  and gallery artist links, the profile title, and the header's own-username links) — closed
  2026-09 in commit 2ea978e, which switches all of those to `textContent` too. Render is
  byte-identical for the current `^[a-zA-Z0-9_-]+$` format (headless-Chromium parity check on the
  post, gallery, profile and leaderboard pages); the prod backup's 5 users all conform, so 0 legacy
  rows are affected today.

## Next

- **Stored username still goes into API paths unencoded.** `user/my-account/main.js`
  (`loadPersonalInfo`, `loadScores`, `loadPosts`, `deleteAccount`, `downloadData`, `submitEdits`)
  and `thought-writer/editor/main.js#loadPosts`. The value comes from the server, but wrap it in
  `encodeURIComponent` to match the profile links.
- **Profile cache never hits.** `user/main.js` writes `username + 'profile'` but reads
  `username + '-profile'`.
- **Create-account hangs on an unexpected login status.** `user/create-account/main.js#createAccount`
  does nothing when the post-create `/login` returns anything but 200 or 429, and the button stays
  disabled. `user/my-account/main.js#checkPassword`'s 429 branch also leaves the verify modal open.

## Declined

_Nothing declined yet._

## Open questions

_Nothing outstanding._
