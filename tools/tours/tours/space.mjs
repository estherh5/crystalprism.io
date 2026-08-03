// Tour: space.crystalprism.io — the Thought Squares board.
//
// Assumes a production build of space is already listening on APP_PORT with
// TURSO_DATABASE_URL pointing at the seeded demo DB. See run.mjs.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/space/web');
const APP_PORT = Number(process.env.APP_PORT ?? 3210);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3211);

export default async function run() {
  const secret = await readEnvVar(path.join(APP_DIR, '.env'), 'AUTH_SECRET');
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-space',
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
      name: 'space',
      baseURL: `http://localhost:${PROXY_PORT}/board`,
      colorScheme: 'light',
      // Budgeted to land a shade over 15s of footage: ffmpeg then trims the
      // tail rather than leaving the video short. Overrunning by more than a
      // second or two cuts the ending off, so keep the sum honest.
      async tour(page) {
        // Open held on the full board — this frame is the video thumbnail.
        await page.waitForSelector('.sq');
        await beat(1800);

        // Filter down to what's in flight, then to what shipped. The squares
        // hide/show, which is the clearest motion the board has.
        await glideTo(page, '.toolbar button:has-text("Orbit")', { click: true });
        await beat(1400);

        await glideTo(page, '.toolbar button:has-text("Shipped")', { click: true });
        await beat(1400);

        await glideTo(page, '.toolbar button:has-text("All")', { click: true });
        await beat(1200);

        // Drift down the scattered grid.
        await glideScroll(page, 320);
        await beat(800);

        // Open one square and let the idea page settle on its notes.
        await glideTo(page, '.sq', { click: true });
        await page.waitForURL(/\/idea\//, { timeout: 10000 });
        await beat(2800);
        await glideScroll(page, 240);
        await beat(1800);
      },
    });
  } finally {
    await proxy.close();
  }
}
