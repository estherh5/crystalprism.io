// Tour: giftme.crystalprism.io — gift tracking.
//
// Replaces an outdated video. Assumes a production build of giftme is listening
// on APP_PORT against the SEEDED DEMO FILE, never prod. See README.md.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/giftme/web');
const APP_PORT = Number(process.env.APP_PORT ?? 3240);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3241);

export default async function run() {
  const secret =
    (await readEnvVar(path.join(APP_DIR, '.env.local'), 'AUTH_SECRET')) ??
    (await readEnvVar(path.join(APP_DIR, '.env'), 'AUTH_SECRET'));

  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-giftme',
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
      name: 'giftme',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      async tour(page) {
        const settle = async (re, selector) => {
          await page.waitForURL(re, { timeout: 10000 });
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          await beat(250);
        };

        // Dashboard: greeting, the four category cards, upcoming countdowns and
        // the people strip. The gift-box mascots bob continuously behind all of
        // it, so even the held opening frame has motion in it.
        await page.waitForSelector('.nav-link');
        await beat(2000);
        await glideScroll(page, 260);
        await beat(900);

        // People — the cards stagger in on a row-rise keyframe.
        await glideTo(page, '.nav-link:has-text("People")', { click: true });
        await settle(/\/people/, '.person-card');
        await beat(2600);

        // One person: their avatar, next occasion countdown, and gifts grouped
        // by category.
        await glideTo(page, '.person-card', { click: true });
        await settle(/\/person\//, 'main');
        await beat(2600);
        await glideScroll(page, 240);
        await beat(1800);
      },
    });
  } finally {
    await proxy.close();
  }
}
