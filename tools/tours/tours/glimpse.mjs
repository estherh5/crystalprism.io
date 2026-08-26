// Tour: glimpse — a private gallery of clips that loop.
//
// The clips are REAL footage (four of the five in `glimpse/samples/`), the
// account around them is invented, and the media is served from
// `glimpse/web/public/demo/` rather than R2. seeds/glimpse.mjs explains why,
// and asserts that no row points off-box before the build is even started.
//
// glimpse is NOT on the crystalprism SSO ring. Two consequences, both of which
// will silently 302 a recording to /login or 404 it if missed:
//
//   * Its cookie is plain `authjs.session-token`. It sets no custom name, so
//     @auth/core's default applies, and that drops the `__Secure-` prefix over
//     plain http.
//   * Every screen except `/s/[token]` is gated to the OWNER, not merely to an
//     admitted account: `web/lib/admin.ts:isAdminEmail` compares against
//     `ADMIN_EMAIL` and the pages call `notFound()`. So the demo server must be
//     started with `ADMIN_EMAIL` equal to the address the seed wrote, and the
//     minted token must carry that same address. A recording that lands on
//     /login is the cookie; one that lands on a 404 is the address.
//
// The token also carries `checkedAt:glimpse` — the app's own admission stamp
// (`web/lib/admin.ts:ADMISSION_CLAIM`). The owner would pass the gate without
// it, but the stamp skips a database round trip on the first navigation, which
// is one less thing racing the opening frames.
//
// Assumes a production build on APP_PORT against the seeded demo DB. See README.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/glimpse/web');
const APP_PORT = Number(process.env.APP_PORT ?? 3290);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3291);

const insert = (slug) => `[data-clip-id="demo-clip-${slug}"] .insert-pick`;

export default async function run() {
  const secret =
    (await readEnvVar(path.join(APP_DIR, '.env.local'), 'AUTH_SECRET')) ??
    (await readEnvVar(path.join(APP_DIR, '.env'), 'AUTH_SECRET'));

  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-glimpse',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    cookieName: 'authjs.session-token',
    extraClaims: { 'checkedAt:glimpse': Date.now() },
  });

  const proxy = await startCookieProxy({
    listenPort: PROXY_PORT,
    targetPort: APP_PORT,
    cookieName: cookie.name,
    cookieValue: cookie.value,
  });

  try {
    return await recordTour({
      name: 'glimpse',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      // glimpse commits to one look: `app/globals.css` declares
      // `color-scheme: light` and carries no `prefers-color-scheme` query at
      // all, so this matches what the app declares rather than emulating a
      // scheme it never reads.
      colorScheme: 'light',
      async tour(page) {
        // The seed asserts the rows; this asserts the running app. One request
        // to Cloudflare would mean a media column got past both.
        //
        // Everything off-box is aborted, but only a request that is not
        // ANALYTICS is counted as a failure. Glimpse loads Plausible from
        // plausible.crystalprism.io in a production build, so an unconditional
        // counter throws on every single take and says "a media column still
        // points at R2" while pointing at the analytics script.
        const ANALYTICS = 'plausible.crystalprism.io';
        let offbox = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (host === 'localhost' || host === '127.0.0.1') return route.continue();
          if (host !== ANALYTICS) {
            offbox++;
            console.warn(`  BLOCKED off-box request to ${host}`);
          }
          return route.abort();
        });

        // The backglass: one clip lit large above a row of inserts, all of them
        // moving. Waiting on the element alone would record a frame of black —
        // wait until the hero's video has actually decoded something.
        await page.waitForSelector('.hero-frame video');
        await page.waitForFunction(
          () => {
            const v = document.querySelector('.hero-frame video');
            return v && v.readyState >= 2 && v.videoWidth > 0;
          },
          { timeout: 15000 },
        );
        await beat(2600);

        // Pick the portrait one. This is the product's hardest claim made
        // visible: the hero re-shapes itself around the clip rather than
        // fitting the clip into a box, and the landscape inserts beside it do
        // not move to accommodate it.
        await glideTo(page, insert('pines'), { click: true });
        await beat(2500);

        await glideTo(page, insert('circle'), { click: true });
        await beat(900);

        // Open it full-bleed. The interface recedes to a top bar and two arrows.
        await glideTo(page, '.hero-cap-actions a[href="/c/demo-clip-circle"]', { click: true });
        await page.waitForURL(/\/c\/demo-clip-circle$/, { timeout: 10000 });
        await page.waitForSelector('.clip-frame video', { state: 'visible', timeout: 15000 });
        await beat(1800);

        // Step to the neighbour, which is the one clip the seed gave a share
        // token, and then tap its share control.
        //
        // The receipt is CLIENT state, not a render of the token: `ClipRail`'s
        // `receipt` starts false and only `onShare` opens it, so a clip page
        // that already holds a live link still shows no URL until someone taps.
        // Waiting for `.clip-rail-status-live` on arrival times out — which is
        // the right behaviour and cost one take to learn. `data-live="true"` is
        // what distinguishes "show the existing link" from "make one".
        await glideTo(page, 'button.clip-nav:has-text("Prev")', { click: true });
        await page.waitForURL(/\/c\/demo-clip-harbor$/, { timeout: 10000 });
        await page.waitForSelector('.clip-frame video', { state: 'visible', timeout: 15000 });
        await beat(900);

        await glideTo(page, 'button.clip-icon[data-live="true"]', { click: true });
        await page.waitForSelector('.clip-rail-status-live', { timeout: 10000 });
        await beat(3200);

        if (offbox > 0) {
          throw new Error(`${offbox} off-box request(s) attempted — a media column still points at R2.`);
        }
      },
    });
  } finally {
    await proxy.close();
  }
}
