// ~/Developer/crystalprism.io/tools/tours/tours/tastebuds.mjs
// Tour: tastebuds — a two-person log of restaurants, cafes and delivery orders.
// Assumes a production build on APP_PORT against demo.db seeded by seeds/tastebuds.mjs,
// started with ADMIN_EMAIL=demo@crystalprism.io and the AUTH_SECRET exported here
// (the tastebuds block in README.md has the exact environment).
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/tastebuds');
const APP_PORT = Number(process.env.APP_PORT ?? 3478);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3479);
const LOCAL = new Set(['localhost', '127.0.0.1']);

export default async function run() {
  // The default ring cookie, and all three of tastebuds' claims, so no session read leaves
  // the box (see APPS.tastebuds in capture-tile.mjs). The seed wrote the users row this
  // email resolves to.
  const now = Date.now();
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    userId: 'demo-user-tastebuds',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    extraClaims: { 'checkedAt:tastebuds': now, signedInAt: now, ringCheckedAt: now },
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'tastebuds',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      viewport: { width: 1100, height: 619 },
      async tour(page) {
        let offbox = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (LOCAL.has(host)) return route.continue();
          // The analytics script is hardcoded in the root layout. Dropped quietly, so a
          // demo run never counts as a pageview; anything else off the box fails the tour.
          if (host === 'plausible.crystalprism.io') return route.abort();
          offbox++;
          return route.abort();
        });
        // The Places list is the thumbnail.
        await page.waitForSelector('.place');
        await beat(2200);
        await glideScroll(page, 260);
        await beat(1200);
        // A place: both people's takes, dishes, scores.
        await glideTo(page, '.place:has-text("Saffron") .place-link', { click: true });
        await page.waitForURL(/\/places\//, { timeout: 10000 });
        await page.waitForSelector('.detail-name');
        await beat(2200);
        await glideScroll(page, 520);
        await beat(2600);
        // Delivery: orders with their own reviews.
        await glideTo(page, '.tabs .tab:has-text("Delivery")', { click: true });
        await page.waitForURL(/\/delivery$/, { timeout: 10000 });
        await page.waitForSelector('.order');
        await beat(2200);
        await glideTo(page, '.order .place-link', { click: true });
        await page.waitForURL(/\/delivery\//, { timeout: 10000 });
        await beat(2600);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
