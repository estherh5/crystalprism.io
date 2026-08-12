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
// actually renders these at.
//
// The middle was re-cut in Aug 2026. The nav went from five items to nine and
// the earlier walk (accounts, categories, transactions) showed none of what had
// been added, so it now visits Cards, Merchants and Retirement instead. Those
// three were chosen over Plan and Transactions on legibility: a which-card
// table, a set of alias rows collapsing into one name, and a widening
// projection channel each read as shape at thumbnail size, whereas the ledger
// reads as grey texture. Nothing here is a claim that the dropped screens
// matter less — only that they survive a 345px-wide silent video worse.
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

        // Cards — the longest hold in the middle, because it is the screen that
        // answers a question the others only describe: which card to hand over
        // at this register. The which-card table is the answer and the cap
        // vessels beside it are why the answer changes through the month, so
        // hold long enough for both to be taken in, then scroll to the caps.
        await glideTo(page, '.nav-item:has-text("Cards")', { click: true });
        await settle(/\/cards/, '.which-table');
        await beat(1500);
        await glideScroll(page, 260);
        await beat(700);

        // Merchants — one shop, several bank spellings, gathered under a single
        // name. The alias rows sitting indented under their canonical merchant
        // are the whole point of the screen and read fine at thumbnail size.
        await glideTo(page, '.nav-item:has-text("Merchants")', { click: true });
        await settle(/\/merchants/, '.mrc-list');
        await beat(1600);

        // Retirement — a thousand simulated lifetimes drawn as one widening
        // channel with a dashed median through it. It is the most purely
        // graphic screen in the app, which is exactly what a silent 345px-wide
        // video can carry, so it gets the last of the middle.
        await glideTo(page, '.nav-item:has-text("Retirement")', { click: true });
        await settle(/\/retirement/, '.ret-headline');
        await beat(1800);

        // Close where it opened, then flip the theme. The toggle cycles
        // System -> Light -> Dark and the recording context is light, so the
        // first click is a no-op on screen and the second is the one that
        // turns the cream ground to ink and re-tints all four water levels.
        // Two clicks, not one — and the hold after them is the longest in the
        // tour, because that re-tint is the single most alive thing this app
        // does and it deserves the last word.
        await glideTo(page, '.nav-item:has-text("Overview")', { click: true });
        await settle(/\/overview/, '.blk');
        await beat(500);

        await glideTo(page, '.theme-toggle', { click: true });
        await beat(150);
        await page.mouse.down();
        await beat(70);
        await page.mouse.up();
        await beat(2400);
      },
    });
  } finally {
    await proxy.close();
  }
}
