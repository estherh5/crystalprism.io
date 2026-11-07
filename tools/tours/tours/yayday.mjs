// ~/Developer/crystalprism.io/tools/tours/tours/yayday.mjs
// Tour: yayday — small joys, one sunny pick a day across three lists.
// Assumes a production build on APP_PORT against demo.db seeded by seeds/yayday.mjs,
// started with ADMIN_EMAIL=demo@crystalprism.io and the AUTH_SECRET exported here.
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/yayday');
const APP_PORT = Number(process.env.APP_PORT ?? 3269);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3268);
const LOCAL = new Set(['localhost', '127.0.0.1']);

export default async function run() {
  // The default ring cookie, and all three of yayday's claims, so no session read leaves
  // the box (see APPS.yayday in capture-tile.mjs). The seed wrote the users row this
  // email resolves to.
  const now = Date.now();
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    userId: 'demo@crystalprism.io',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    extraClaims: { 'checkedAt:yayday': now, signedInAt: now, ringCheckedAt: now },
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'yayday',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
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
        // Today's pick in the sun is the thumbnail.
        await page.waitForSelector('.sun-title');
        await beat(2200);
        // Capture in seconds: a few words, a list, Add it.
        await glideTo(page, '.capture-box', { click: true });
        await page.keyboard.type('Picnic under the cherry trees', { delay: 45 });
        await beat(300);
        await glideTo(page, '.capture .chip-yay', { click: true });
        await glideTo(page, '.capture-submit', { click: true });
        await beat(1300);
        // A list: the Bucket list terrace.
        await glideTo(page, '.terrace-bucket .terrace-link', { click: true });
        await page.waitForURL(/\/bucket$/, { timeout: 10000 });
        await page.waitForSelector('.item-row');
        await beat(2300);
        // The Did it ✶ shelf.
        await glideTo(page, '.shell-didit', { click: true });
        await page.waitForURL(/\/did-it$/, { timeout: 10000 });
        await page.waitForSelector('.shelf-card');
        await beat(3200);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
