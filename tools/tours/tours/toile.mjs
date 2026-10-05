// ~/Developer/crystalprism.io/tools/tours/tours/toile.mjs
// Tour: toile — a paper-doll fashion studio, at step 1 (foundation): the doll on
// her figure, the setup checklist, and the feedback threads.
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
      // At 1280 CSS px the page is two 420px cards in the left third of a pink
      // field. 768x432 (16:9, scaled up by ffmpeg) fills the frame with them.
      viewport: { width: 768, height: 432 },
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
        // Wordmark, checklist and the doll's head: the thumbnail.
        await page.waitForSelector('.doll-stage svg');
        await beat(1600);
        // Down the doll, head to toe.
        await glideScroll(page, 260);
        await beat(1100);
        await glideScroll(page, 200);
        await beat(1200);
        // The feedback threads, from the floating pill.
        await glideTo(page, '.feedback-fab', { click: true });
        await page.waitForSelector('.feedback-modal');
        await beat(900);
        await glideTo(page, '.feedback-tab:nth-child(2)', { click: true });
        await page.waitForSelector('.feedback-item-toggle');
        await beat(700);
        await glideTo(page, '.feedback-item:first-child .feedback-item-toggle', { click: true });
        await beat(2000);
        await glideTo(page, '.feedback-x', { click: true });
        await beat(400);
        // The owner's triage page.
        await page.goto(`http://localhost:${PROXY_PORT}/feedback`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.admin-fb-row');
        await beat(1800);
        await glideScroll(page, 240);
        await beat(1400);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
