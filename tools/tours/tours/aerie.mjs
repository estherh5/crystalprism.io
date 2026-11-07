// ~/Developer/crystalprism.io/tools/tours/tours/aerie.mjs
// Tour: aerie — the lit 3D apartment, "Where's my...?" search, an item card, the Items list.
// Assumes a production build on APP_PORT against a demo.db seeded by aerie's own
// `npm run seed:demo`, started from ~/Developer/aerie with NEXT_DIST_DIR=.next-demo,
// STORAGE_DISK=1, ADMIN_EMAIL=demo@crystalprism.io and the AUTH_SECRET exported here.
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/aerie');
const APP_PORT = Number(process.env.APP_PORT ?? 3418);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3419);
const LOCAL = new Set(['localhost', '127.0.0.1']);

export default async function run() {
  // The default ring cookie and all three of aerie's claims, so no session read leaves
  // the box (see APPS.aerie in capture-tile.mjs). The seed wrote users row demo-user-aerie.
  const now = Date.now();
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    userId: 'demo-user-aerie',
    email: 'demo@crystalprism.io',
    name: 'Maya',
    extraClaims: { 'checkedAt:aerie': now, signedInAt: now, ringCheckedAt: now },
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'aerie',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'dark',
      // 960x540 lays the app out narrower than 1280 so text survives the 345px player.
      viewport: { width: 960, height: 540 },
      async tour(page) {
        let offbox = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (LOCAL.has(host)) return route.continue();
          // Analytics dropped quietly so a demo run never counts as a pageview; anything
          // else off the box (fonts, weather) fails the tour.
          if (host === 'plausible.crystalprism.io') return route.abort();
          offbox++;
          return route.abort();
        });
        // The lit apartment is the thumbnail.
        await page.waitForSelector('.model-stage svg');
        // Frame one is the thumbnail: bring the model card to the top, search row just above.
        await page.evaluate(() => window.scrollTo(0, 170));
        await beat(1800);
        // Where's my stand mixer?
        await glideTo(page, '.search-input', { click: true });
        await page.keyboard.type('mixer', { delay: 70 });
        await page.waitForSelector('[data-search-hit]', { timeout: 10000 });
        await beat(900);
        // Choosing a hit closes the list, so read the item card's address first.
        const card = await page.locator('.search-open').first().getAttribute('href');
        await glideTo(page, '[data-search-hit]', { click: true });
        await beat(2400);
        // Its item card.
        await page.goto(new URL(card, page.url()).href, { waitUntil: 'networkidle' });
        await page.waitForSelector('main img, .item-page img', { timeout: 10000 }).catch(() => {});
        await beat(3000);
        // Everything, by room.
        await glideTo(page, '.chrome-link', { click: true });
        await page.waitForURL(/\/items$/, { timeout: 10000 });
        await page.waitForSelector('.spot-item-link');
        await beat(3800);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
