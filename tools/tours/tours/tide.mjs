// Tour: tide.crystalprism.io — net worth, spending and income, as water levels.
//
// SAFETY: tide is a single-user app holding real bank balances behind a live
// SimpleFIN link. This tour must only ever run against the seeded demo file —
// see seeds/tide.mjs, which writes zero rows to `institution_link` so there is
// no credential to decrypt and nothing to sync. `/settings` is deliberately
// never visited: it is the one screen that renders link state.
//
// SHAPE: the app's whole idea is that each block is a vessel and the number
// inside it is a water level, so the tour is paced to let the levels be read
// rather than to visit every route. It opens and closes on the overview — the
// one screen where all four levels sit together — and spends its middle on the
// three screens whose type stays legible at the 175-345px the projects page
// actually renders these at. The transactions table is the least legible of
// them at that size, so it gets the shortest hold and earns its place with
// motion instead.
//
// Assumes a production build of tide is listening on APP_PORT against the
// SEEDED DEMO FILE, never dev.db and never a remote Turso URL. See README.md.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/tide');
const APP_PORT = Number(process.env.APP_PORT ?? 3260);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3261);

export default async function run() {
  const secret =
    (await readEnvVar(path.join(APP_DIR, '.env.local'), 'AUTH_SECRET')) ??
    (await readEnvVar(path.join(APP_DIR, '.env'), 'AUTH_SECRET'));

  // tide is on the crystalprism SSO ring, so the default ring cookie name is
  // correct here. Its session callback resolves the user id by EMAIL through
  // upsertUserByEmail, not from the token's `sub` — so this address must match
  // the one seeds/tide.mjs wrote, or the app quietly creates a second, empty
  // user and every screen renders the "link your first account" state.
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-tide',
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
      name: 'tide',
      baseURL: `http://localhost:${PROXY_PORT}/overview`,
      colorScheme: 'light',
      async tour(page) {
        const settle = async (re, selector) => {
          await page.waitForURL(re, { timeout: 10000 });
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          await beat(250);
        };

        // Open on the four filled vessels. This is frame 1, and therefore the
        // thumbnail: net worth at its own 12-month peak with the dashed "last
        // month" tide mark just under the rim, spending two thirds up its
        // planned total, income half way to a typical month.
        await page.waitForSelector('.blk');
        await beat(2000);

        // The net worth block is itself a link to the accounts it is made of —
        // clicking the number to see what is behind it, rather than reaching
        // for the nav.
        await glideTo(page, 'a.blk.hue-teal', { click: true });
        await settle(/\/accounts/, '.acct-list');
        await beat(1000);

        // Categories: the colour vocabulary the blocks are drawn from, and the
        // limits the spending level is measured against. The screen opens on
        // its "add a category" form, which is an empty grey form in a silent
        // video — scroll straight past it to the coloured rows, which are the
        // part worth showing.
        await glideTo(page, '.nav-item:has-text("Categories")', { click: true });
        await settle(/\/categories/, '.cat-list');
        await beat(300);
        await glideScroll(page, 300);
        await beat(1000);

        // Transactions — the ledger under all of it. Short hold, then a scroll,
        // because at the size this video renders the table reads as texture and
        // movement rather than as rows anyone can parse.
        await glideTo(page, '.nav-item:has-text("Transactions")', { click: true });
        await settle(/\/transactions/, '.txn-table');
        await beat(450);
        await glideScroll(page, 320);
        await beat(600);

        // Close where it opened, then flip the theme. The toggle cycles
        // System -> Light -> Dark and the recording context is light, so the
        // first click is a no-op on screen and the second is the one that
        // turns the cream ground to ink and re-tints all four water levels.
        // Two clicks, not one — and the hold after them is the longest in the
        // tour, because that re-tint is the single most alive thing this app
        // does and it deserves the last word.
        await glideTo(page, '.nav-item:has-text("Overview")', { click: true });
        await settle(/\/overview/, '.blk');
        await beat(650);

        await glideTo(page, '.theme-toggle', { click: true });
        await beat(150);
        await page.mouse.down();
        await beat(70);
        await page.mouse.up();
        await beat(3000);
      },
    });
  } finally {
    await proxy.close();
  }
}
