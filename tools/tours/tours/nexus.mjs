// Tour: nexus.crystalprism.io — the Luminous Observatory.
//
// Assumes a production build of nexus is already listening on APP_PORT with
// TURSO_DATABASE_URL pointing at the SEEDED DEMO FILE, never prod. See run.mjs.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/nexus/web');
const APP_PORT = Number(process.env.APP_PORT ?? 3220);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3221);

export default async function run() {
  const secret = await readEnvVar(path.join(APP_DIR, '.env'), 'AUTH_SECRET');
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-nexus',
    email: 'demo@crystalprism.io',
    name: 'Demo',
  });

  const proxy = await startCookieProxy({
    listenPort: PROXY_PORT,
    targetPort: APP_PORT,
    cookieName: cookie.name,
    cookieValue: cookie.value,
  });

  try {
    return await recordTour({
      name: 'nexus',
      baseURL: `http://localhost:${PROXY_PORT}/sky`,
      // The observatory is designed dark; forcing light would fight the artwork.
      colorScheme: 'dark',
      async tour(page) {
        // Route changes here paint an empty stage for a beat before the stars
        // arrive — and the heading lands before the bodies do, so waiting on the
        // URL or on networkidle is not enough. Wait for a node that only exists
        // once the constellation has actually been drawn.
        const settle = async (re, selector) => {
          await page.waitForURL(re, { timeout: 10000 });
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          await beat(250);
        };

        // Open on the starfield — this frame is the video thumbnail, and the
        // background stars breathe on a 3.2s cycle, so a still moment still moves.
        await page.waitForSelector('.sky-node');
        await beat(1700);

        // Turn on names, so a viewer reads "people" rather than "abstract dots".
        await glideTo(page, '.sky-controls button:has-text("names")', { click: true });
        await beat(1500);

        // Open one star and rest on the rail of facts: personality, enneagram,
        // love language, favourite colour. This is what the app is FOR — the
        // sky is how you find someone, this is what it remembers about them.
        await glideTo(page, '.sky-node:not(:first-child)', { click: true });
        await settle(/\/person\//, '.sky-wrap.ego .sky-node');
        await beat(1200);
        await page.locator('.rail-facts').first().scrollIntoViewIfNeeded();
        await beat(3000);

        // Finish on The Field — every person as a browsable list, the plainer
        // counterpart to the sky.
        await glideTo(page, 'nav a:has-text("The Field")', { click: true });
        await settle(/localhost:\d+\/(\?.*)?$/, '.seek');
        await beat(1400);
        await glideScroll(page, 300);
        await beat(2000);
      },
    });
  } finally {
    await proxy.close();
  }
}
