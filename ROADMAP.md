# Roadmap

Committed doc, not scratch. Kept current by hand as work ships.
**Shipped** = live in production. **Next** = intended, not promised.
**Declined** = decided against, with the reason, so it doesn't get re-proposed.
**Open questions** = unresolved calls, with what would settle them.

## Shipped

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

- [security] **Auth token kept in `localStorage` (Medium).** `token` is read at
  `localStorage['token']`, so any future XSS can still steal a reader's session — the stored-XSS
  path above is closed, but this is defence in depth against the next one. Fix: move the session
  token to an HttpOnly cookie set by api.crystalprism.io.

- [security] **No Content-Security-Policy (Medium).** The site is static, served from Netlify,
  with no CSP header anywhere. Fix: set a CSP via Netlify `_headers` or `netlify.toml`.

- [security] **My Account silently 400s on a field containing markup, and `contains_markup` also
  rejects innocent text (Low).** The server's `contains_markup` check (api.crystalprism.io)
  rejects any plain-text field — about, name, email — that merely resembles markup, e.g. `a<b`,
  and the client shows no error when this happens, just a silent failure. Fix: show the rejection
  reason in the UI; loosen `contains_markup` to require a closing tag or a real HTML entity, not
  any bare `<`.

- [security] **Client-side `RICH_TEXT_SRC` image check has no committed regression test (Low).**
  `common.js`'s allowlist for image `src` inside rich text was verified only with a throwaway
  Playwright harness during the fix, not a committed test. Fix: commit a regression test asserting
  `data:image/svg+xml` and non-image URLs are rejected client-side too.

- [security] **Unvalidated username in URLs (Medium).** `common.js`
  (`profileLink.href = root + '/user/?username=' + payload['username']`) and `user/main.js`
  (`location.search.split('username=')[1]` into a fetch URL and localStorage keys) allow path
  injection within the API origin (GET only). Fix: `encodeURIComponent` and validate against
  `^[a-zA-Z0-9_-]+$`.

## Declined

_Nothing declined yet._

## Open questions

_Nothing outstanding._
