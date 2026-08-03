// Tour: savor.crystalprism.io — safe foods, built for ED recovery.
//
// CONTENT RULES: savor permanently bans calories, macros, weight and streaks
// (savor/ROADMAP.md). Two consequences for this tour:
//   - /food/[id] is deliberately NOT visited. It renders "Ideal servings" as a
//     bare integer, and a viewer glancing at a number beside a food name in a
//     silent video could read it as a calorie count.
//   - Nothing here counts anything. No tallies enter frame.
//
// Assumes a production build of savor is listening on APP_PORT against the
// SEEDED DEMO FILE, never the remote DB. See run.mjs.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/savor');
const APP_PORT = Number(process.env.APP_PORT ?? 3230);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3231);

export default async function run() {
  const secret =
    (await readEnvVar(path.join(APP_DIR, '.env.local'), 'AUTH_SECRET')) ??
    (await readEnvVar(path.join(APP_DIR, '.env'), 'AUTH_SECRET'));

  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-savor',
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
      name: 'savor',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      async tour(page) {
        const settle = async (re, selector) => {
          await page.waitForURL(re, { timeout: 10000 });
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          await beat(250);
        };

        // Open on the safe-foods grid. Since the desktop redesign this is a
        // four-column wall of photographs, so it holds as the thumbnail on its
        // own. Safety and fullness read as sun rays and moons, never numbers.
        await page.waitForSelector('.nav-item');
        await beat(1600);
        await glideScroll(page, 220);
        await beat(800);

        // Re-sort by how filling things are; the whole grid reflows.
        await glideTo(page, 'a:has-text("Most filling")', { click: true });
        await beat(1500);

        // Wins — foods that have repeatedly felt good. No count is displayed,
        // by design: a tally would be counting, which this app does not do.
        await glideTo(page, '.nav-item:has-text("Wins")', { click: true });
        await settle(/\/wins/, 'main');
        await beat(2300);

        // Back to the list, briefly — the overwhelmed flow is reachable from
        // the rail, below the fold of the main nav.
        await glideTo(page, '.nav-item:has-text("Safe")', { click: true });
        await settle(/localhost:\d+\/(\?.*)?$/, '.nav-item');
        await beat(600);

        // Finish on the overwhelmed flow: night sky, moonbeam, and a breathing
        // circle on a 4-3-8 cycle. This gets the longest hold in the tour — it
        // is the one screen that keeps moving on its own, and the whole point
        // of the app in one frame.
        await glideTo(page, 'a:has-text("overwhelmed")', { click: true });
        await settle(/\/overwhelmed/, 'main');
        await beat(4300);
      },
    });
  } finally {
    await proxy.close();
  }
}
