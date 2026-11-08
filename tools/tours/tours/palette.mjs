// ~/Developer/crystalprism.io/tools/tours/tours/palette.mjs
// Tour: palette — an inspiration board. Every picture lands with its paint-chip palette.
// Assumes a production build on APP_PORT, run from a COPY of the palette repo against the
// demo.db seeded by seeds/palette.mjs, started with ADMIN_EMAIL=demo@crystalprism.io and the
// AUTH_SECRET exported here (the palette block in README.md has the exact environment).
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

// Minting only: the real checkout's next-auth, read-only. The server runs from the copy.
const APP_DIR = path.join(os.homedir(), 'Developer/palette');
const APP_PORT = Number(process.env.APP_PORT ?? 3488);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3489);
const LOCAL = new Set(['localhost', '127.0.0.1']);

export default async function run() {
  // The default ring cookie and all three of palette's claims, so no session read leaves the box
  // (see APPS.palette in capture-tile.mjs). Identity is the email.
  const now = Date.now();
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    userId: 'demo@crystalprism.io',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    extraClaims: { 'checkedAt:palette': now, signedInAt: now, ringCheckedAt: now },
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'palette',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      viewport: { width: 1100, height: 619 },
      async tour(page) {
        let offbox = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (LOCAL.has(host)) return route.continue();
          // The analytics script is hardcoded in the root layout. Dropped quietly, so a demo run
          // never counts as a pageview; anything else off the box fails the tour.
          if (host === 'plausible.crystalprism.io') return route.abort();
          offbox++;
          return route.abort();
        });
        // The Wall is the thumbnail.
        await page.waitForSelector('.pcard img');
        await beat(1500);
        await glideScroll(page, 240);
        await beat(700);
        // Filter by color: closest to pink first.
        await glideTo(page, '.swatch[aria-label="Pink"]', { click: true });
        await page.waitForSelector('.swatch[aria-label="Pink"][aria-pressed="true"]');
        await page.waitForSelector('.wall-filter-note');
        await beat(1900);
        // A picture's detail: the photo beside its six named chips.
        await glideTo(page, '.pcard .pcard-hit', { click: true });
        await page.waitForURL(/\/p\//, { timeout: 10000, waitUntil: 'commit' });
        await page.waitForSelector('.detail-photo img');
        await beat(1300);
        await glideScroll(page, 200);
        await beat(1100);
        // Saved palettes. The cursor rests on the tab and the page is LOADED, not clicked: on
        // 2026-11-08 a client-side click on Saved (from the wall or a detail) landed back on the
        // Wall in the demo build, while a direct load of /saved rendered normally.
        await glideTo(page, 'a[href="/saved"]');
        await page.goto(`http://localhost:${PROXY_PORT}/saved`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.saved-name');
        await beat(1600);
        await glideScroll(page, 300);
        await beat(1800);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
