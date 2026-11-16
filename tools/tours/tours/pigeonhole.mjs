// ~/Developer/crystalprism.io/tools/tours/tours/pigeonhole.mjs
// Tour: pigeonhole — sort the top envelope to Research, file the next as Done, then open the
// Research shelf and one link's full summary.
// Assumes a production build on APP_PORT, run from a COPY of the pigeonhole repo against the
// demo.db seeded by seeds/pigeonhole.mjs, started with ADMIN_EMAIL=demo@crystalprism.io and the
// AUTH_SECRET exported here (the pigeonhole block in README.md has the exact environment). The two
// decisions it makes write only to that demo DB; it never taps an app cubby, which would open a
// new tab on another Crystal Prism app.
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

// Minting only: the real checkout's next-auth, read-only. The server runs from the copy.
const APP_DIR = path.join(os.homedir(), 'Developer/pigeonhole');
const APP_PORT = Number(process.env.APP_PORT ?? 3518);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3519);
const LOCAL = new Set(['localhost', '127.0.0.1']);

export default async function run() {
  // The default ring cookie and all three of pigeonhole's claims, so no session read leaves the box
  // (see APPS.pigeonhole in capture-tile.mjs).
  const now = Date.now();
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    userId: 'demo-user-pigeonhole',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    extraClaims: { 'checkedAt:pigeonhole': now, signedInAt: now, ringCheckedAt: now },
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'pigeonhole',
      baseURL: `http://localhost:${PROXY_PORT}/home`,
      colorScheme: 'light',
      viewport: { width: 1100, height: 619 },
      async tour(page) {
        let offbox = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (LOCAL.has(host)) return route.continue();
          // Analytics is dropped quietly so a demo run never counts as a pageview, and the fleet
          // menu's apps.json falls back to its bundled list; anything else off the box fails the tour.
          if (host === 'plausible.crystalprism.io' || host === 'crystalprism.io') return route.abort();
          offbox++;
          return route.abort();
        });
        // The top envelope, and the sorting case under it with the suggestion largest.
        await page.waitForSelector('.env-title:has-text("paper map")');
        await beat(2400);
        await glideTo(page, '.hole.is-best:has-text("Research")', { click: true });
        await page.waitForSelector('.env-title:has-text("Descaling a kettle")');
        await beat(1900);
        // A quick tip, already used: Done.
        await glideTo(page, '.hole.is-best:has-text("Done")', { click: true });
        await page.waitForSelector('.env-title:has-text("linen apron")');
        await beat(2000);
        // The Research shelf, and one link's full summary.
        await glideTo(page, 'nav a:has-text("Research")', { click: true });
        await page.waitForURL(/\/research$/, { timeout: 10000, waitUntil: 'commit' });
        await page.waitForSelector('.slip-link:has-text("Why bread goes stale")');
        await beat(1400);
        await glideTo(page, '.slip-link:has-text("Why bread goes stale")', { click: true });
        await page.waitForURL(/\/research\/demo-link-bread/, { timeout: 10000, waitUntil: 'commit' });
        await page.waitForSelector('.ledger-body');
        await beat(3800);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
