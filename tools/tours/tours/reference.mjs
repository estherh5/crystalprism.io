// ~/Developer/crystalprism.io/tools/tours/tours/reference.mjs
// Tour: reference — look a thing up, tap it, tap who mentioned it, then see that person's list.
// Assumes a production build on APP_PORT, run from a COPY of the reference repo against the
// demo.db seeded by seeds/reference.mjs, started with ADMIN_EMAIL=demo@crystalprism.io and the
// AUTH_SECRET exported here (the reference block in README.md has the exact environment). The
// search it types ("Tosca") and that result's summary are answered from the seeded lookupCache,
// and REFERENCE_NEXUS_TOKEN / REFERENCE_GIFTME_TOKEN stay empty, so the save goes nowhere.
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

// Minting only: the real checkout's next-auth, read-only. The server runs from the copy.
const APP_DIR = path.join(os.homedir(), 'Developer/reference');
const APP_PORT = Number(process.env.APP_PORT ?? 3508);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3509);
const LOCAL = new Set(['localhost', '127.0.0.1']);

export default async function run() {
  // The default ring cookie and all three of reference's claims, so no session read leaves the box
  // (see APPS.reference in capture-tile.mjs).
  const now = Date.now();
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    userId: 'demo-user-reference',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    extraClaims: { 'checkedAt:reference': now, signedInAt: now, ringCheckedAt: now },
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'reference',
      baseURL: `http://localhost:${PROXY_PORT}/home`,
      colorScheme: 'light',
      viewport: { width: 1100, height: 619 },
      // E4 Sage & Coral, the app's fixed identity, matching the tile; otherwise a random palette.
      initScript: "try{localStorage.setItem('reference:palette:keep','E4')}catch(e){}",
      async tour(page) {
        let offbox = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (LOCAL.has(host)) return route.continue();
          // Analytics is dropped quietly so a demo run never counts as a pageview; anything else
          // off the box fails the tour.
          if (host === 'plausible.crystalprism.io') return route.abort();
          offbox++;
          return route.abort();
        });
        // Home: the cabinet of recent occasions, each a drawer of what was mentioned there.
        await page.waitForSelector('.cab-list h3');
        await beat(2600);
        // Look it up. Typed faster than the 250ms debounce, so only "Tosca" is ever searched.
        await glideTo(page, '#look-up', { click: true });
        await page.keyboard.type('Tosca', { delay: 70 });
        await page.waitForSelector('button.result:has-text("Opera by Giacomo Puccini")');
        await beat(1300);
        // Tap the opera: its short summary, and who mentioned it.
        await glideTo(page, 'button.result:has-text("Opera by Giacomo Puccini")', { click: true });
        await page.waitForSelector('.chips button.chip:not([disabled])');
        await beat(2300);
        await glideTo(page, '.chips button.chip:has-text("Walter")', { click: true });
        await page.waitForSelector('.saved-line');
        await beat(2000);
        // Everything Walter has told her about.
        await glideTo(page, 'nav a:has-text("People")', { click: true });
        await page.waitForURL(/\/people$/, { timeout: 10000, waitUntil: 'commit' });
        await page.waitForSelector('.person-name');
        await beat(700);
        await glideTo(page, '.row-link:has-text("Walter")', { click: true });
        await page.waitForURL(/\/people\/demo-person-walter/, { timeout: 10000, waitUntil: 'commit' });
        await page.waitForSelector('.mention-list');
        await beat(2600);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
