// ~/Developer/crystalprism.io/tools/tours/tours/toile.mjs
// Tour: toile — a paper-doll fashion studio. The signed-in home (the cutting
// table: last-edited design on a paper card, four ways in, then Designs /
// Swatches / Inspiration columns), into the Studio, then the feedback threads.
// Assumes a production build on APP_PORT against a demo DB seeded by seeds/toile.mjs,
// started with ADMIN_EMAIL=demo@crystalprism.io and the AUTH_SECRET exported here.
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/toile');
const APP_PORT = Number(process.env.APP_PORT ?? 3320);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3321);
const LOCAL = new Set(['localhost', '127.0.0.1']);

export default async function run() {
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    // sub = email: listMyFeedback keys on `user.id || user.email`, and the seed
    // writes the feedback rows under this address.
    userId: 'demo@crystalprism.io',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    // Not on the crystalprism SSO ring: @auth/core's default name over http.
    cookieName: 'authjs.session-token',
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'toile',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      // At 1280 the cutting table lays out in full: hero card left, four ways in
      // and the three ruled columns right, all on one screen.
      viewport: { width: 1280, height: 720 },
      async tour(page) {
        let offbox = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (LOCAL.has(host)) return route.continue();
          // The analytics snippet: dropped so a recording is never a pageview,
          // and not counted, since it carries nothing from the demo DB.
          if (host === 'plausible.crystalprism.io') return route.abort();
          console.error(`off-box: ${route.request().url()}`);
          offbox++;
          return route.abort();
        });
        // The cutting table, Picnic dress on the paper card: the thumbnail.
        // record.mjs cuts at 15s rather than speeding up, so every beat is short.
        await page.waitForSelector('.home-hero-stage svg');
        await beat(1300);
        // Across the four ways in.
        for (const n of [1, 2, 3, 4]) {
          await glideTo(page, `.home-ways li:nth-child(${n}) .home-way`, { steps: 12 });
          await beat(120);
        }
        // The ruled columns: pinked swatches, then the inspiration board. At 720
        // tall the page overruns by a few dozen px and the Feedback pill sits on
        // "Open in Studio" until the page is scrolled to its foot.
        await glideScroll(page, 120, { steps: 14 });
        await glideTo(page, '.home-slots .home-swatch', { steps: 14 });
        await beat(300);
        await glideTo(page, '.home-insp li:nth-child(3)', { steps: 12 });
        await beat(400);
        // Into the Studio with the design on the table.
        await glideTo(page, 'a.btn-hot:has-text("Open in Studio")', { click: true, steps: 16 });
        await page.waitForSelector('.studio-doll svg');
        await beat(1600);
        // The feedback threads, from the floating pill.
        await glideTo(page, '.feedback-fab', { click: true, steps: 14 });
        await page.waitForSelector('.feedback-modal');
        await beat(500);
        await glideTo(page, '.feedback-tab:nth-child(2)', { click: true, steps: 12 });
        await page.waitForSelector('.feedback-item-toggle');
        await beat(300);
        await glideTo(page, '.feedback-item:first-child .feedback-item-toggle', { click: true, steps: 12 });
        await beat(1100);
        // The owner's triage page.
        await page.goto(`http://localhost:${PROXY_PORT}/feedback`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.admin-fb-row');
        await beat(1500);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
