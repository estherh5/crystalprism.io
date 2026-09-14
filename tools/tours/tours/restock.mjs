// Tour: restock.crystalprism.io — a household consumables tracker.
//
// SHAPE: restock just consolidated its sidebar from seven pages to four
// (Inventory · To order · Household · Admin). The old /deliveries page became
// an "On the way" section at the bottom of /shopping-list ("To order"); the
// old /trends page became a usage strip (Use rate, Runs out, sparkline) at
// the top of the item edit drawer on /inventory. Both old routes now redirect
// rather than existing, so this tour has to show the SURVIVING surfaces doing
// what the retired pages used to: a gentle −/+ on the inventory list, the
// drawer's usage strip with a real sparkline, then the On-the-way section
// with its dates and coverage chips. /admin is deliberately never visited —
// it renders the feedback queue, which has no seeded demo shape here.
//
// Assumes a production build of restock is listening on APP_PORT against the
// SEEDED DEMO FILE (see seeds/restock.mjs), never dev.db. See README.md.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/restock');
const APP_PORT = Number(process.env.APP_PORT ?? 3920);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3921);

export default async function run() {
  const secret =
    (await readEnvVar(path.join(APP_DIR, '.env.local'), 'AUTH_SECRET')) ??
    (await readEnvVar(path.join(APP_DIR, '.env'), 'AUTH_SECRET'));

  // restock is on the crystalprism SSO ring, so the default ring cookie name
  // is correct here. The session callback resolves the user by EMAIL
  // (lib/session-user.ts localUserByEmail -> lib/users.ts upsertUserByEmail),
  // not by the token's sub — this address must match the one seeds/restock.mjs
  // wrote (demo@crystalprism.io), and the server must be started with
  // ADMIN_EMAIL=demo@crystalprism.io so lib/guard.ts's admission gate and
  // requireAdmin() both recognize it.
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-restock',
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
      name: 'restock',
      baseURL: `http://localhost:${PROXY_PORT}/inventory`,
      colorScheme: 'light',
      async tour(page) {
        const settle = async (re, selector) => {
          await page.waitForURL(re, { timeout: 10000 });
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          await beat(250);
        };

        // Open on the inventory list, urgency-sorted — this is frame 1, and
        // therefore the thumbnail.
        await page.waitForSelector('.inv-table-wrap table');
        await beat(2600);

        // A gentle −/+ on one row: nudge Organic Rolled Oats down, then back
        // up. QtyStepper's optimistic update moves the on-hand number and the
        // level bar instantly, which is the whole point of filming it.
        await glideTo(page, 'button[aria-label="Decrease Organic Rolled Oats"]', {
          click: true,
        });
        await beat(550);
        await glideTo(page, 'button[aria-label="Increase Organic Rolled Oats"]', {
          click: true,
        });
        await beat(700);

        // Open an item that has real history — Magnesium Glycinate, seeded
        // with ~60 days of adjustment rows — so the drawer's usage strip
        // shows a real sparkline rather than the "not enough history yet"
        // hint. The strip sits above the scrolling body, so it's visible the
        // instant the drawer opens.
        await glideTo(page, 'tr:has-text("Magnesium Glycinate") button.row-name', {
          click: true,
        });
        await page.waitForSelector('.usage-strip', { state: 'visible', timeout: 10000 });
        await page.waitForSelector('.usage-strip-graph svg', { timeout: 10000 });
        await beat(2200);

        // Close the drawer.
        await glideTo(page, '.drawer button.x', { click: true });
        await beat(500);

        // To order, via the sidebar — the old /deliveries page's successor.
        await glideTo(page, '.nav a:has-text("To order")', { click: true });
        await settle(/\/shopping-list/, '.page-body');
        await beat(1200);

        // Scroll down to the On-the-way section: real dates, real coverage
        // chips (some deliveries beat the predicted run-out, one arrives
        // after it, one is overdue) — exactly what /deliveries used to show,
        // now living at the bottom of this page.
        await glideScroll(page, 900);
        await page.waitForSelector('#on-the-way', { state: 'visible', timeout: 10000 });
        await beat(1600);
        await glideTo(page, '#on-the-way', {});
        await beat(2600);
      },
    });
  } finally {
    await proxy.close();
  }
}
