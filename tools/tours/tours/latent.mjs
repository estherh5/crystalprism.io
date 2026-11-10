// ~/Developer/crystalprism.io/tools/tours/tours/latent.mjs
// Tour: latent — catch a thought, get it back as its own page. Assumes a production build on
// APP_PORT, run from a COPY of the latent repo against the demo.db seeded by seeds/latent.mjs,
// started with ADMIN_EMAIL=demo@crystalprism.io and the AUTH_SECRET exported here (the latent
// block in README.md has the exact environment). ANTHROPIC_API_KEY stays empty: every thought
// is already a ready original, and the tour never keeps a new one.
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

// Minting only: the real checkout's next-auth, read-only. The server runs from the copy.
const APP_DIR = path.join(os.homedir(), 'Developer/latent');
const APP_PORT = Number(process.env.APP_PORT ?? 3498);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3499);
const LOCAL = new Set(['localhost', '127.0.0.1']);

export default async function run() {
  // The default ring cookie and all three of latent's claims, so no session read leaves the box
  // (see APPS.latent in capture-tile.mjs). Identity is the email.
  const now = Date.now();
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    userId: 'demo-user-latent',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    extraClaims: { 'checkedAt:latent': now, signedInAt: now, ringCheckedAt: now },
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'latent',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      viewport: { width: 1100, height: 619 },
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
        // Home: whichever of the seven homes the app picks, with the thoughts laid out on it.
        await page.waitForSelector('main.home:not([data-home="none"]) button[class*="patch"]');
        await beat(3600);
        // Open a thought: it comes back as its own page.
        await glideTo(page, 'main.home button[class*="patch"]', { click: true });
        await page.waitForURL(/\/t\//, { timeout: 10000, waitUntil: 'commit' });
        await page.waitForSelector('.pgframe');
        await beat(2900);
        // Another one, then two side by side.
        await glideTo(page, 'button.dockbtn:has-text("Another")', { click: true });
        await beat(2800);
        await glideTo(page, 'button.dockbtn:has-text("Set beside")', { click: true });
        await page.waitForURL(/\/with\//, { timeout: 10000, waitUntil: 'commit' });
        await page.waitForSelector('.tstage-pair .pgframe');
        await beat(3400);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
