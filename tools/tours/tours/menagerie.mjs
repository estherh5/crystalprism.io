// ~/Developer/crystalprism.io/tools/tours/tours/menagerie.mjs
// Tour: menagerie — a Backglass roster of (invented) stuffed animals.
// Assumes a production build on APP_PORT against demo.db seeded by seeds/menagerie.mjs,
// started with ADMIN_EMAIL=demo@crystalprism.io and the AUTH_SECRET exported here.
import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/menagerie');
const APP_PORT = Number(process.env.APP_PORT ?? 3310);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3311);
const LOCAL = new Set(['localhost', '127.0.0.1', 'fonts.gstatic.com', 'fonts.googleapis.com']);

export default async function run() {
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: process.env.AUTH_SECRET,
    userId: 'demo@crystalprism.io',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    cookieName: 'authjs.session-token',
  });
  const proxy = await startCookieProxy({ listenPort: PROXY_PORT, targetPort: APP_PORT, cookieName: cookie.name, cookieValue: cookie.value });
  try {
    return await recordTour({
      name: 'menagerie',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      async tour(page) {
        let offbox = 0;
        await page.route('**/*', (route) => {
          if (LOCAL.has(new URL(route.request().url()).hostname)) return route.continue();
          offbox++;
          return route.abort();
        });
        // The roster wall is the thumbnail: a patchwork of inks.
        await page.waitForSelector('.roster-grid .card img');
        await beat(1800);
        await glideTo(page, '.chip-rail .chip:nth-child(2)', { click: true });
        await beat(1200);
        await glideTo(page, '.chip-rail .chip:first-child', { click: true });
        await beat(600);
        await glideScroll(page, 360);
        await beat(700);
        // A profile: the card as a header, the character sheet, the photos.
        await glideTo(page, '.roster-grid li:first-child .card', { click: true });
        await page.waitForURL(/\/a\//, { timeout: 10000 });
        await page.waitForSelector('.card-hero img');
        await beat(1500);
        await glideScroll(page, 420);
        await beat(900);
        // A photo, pins revealed by a tap.
        await glideTo(page, '.photo-grid li:first-child a', { click: true });
        await page.waitForURL(/\/p\//, { timeout: 10000 });
        await page.waitForSelector('.photo-img');
        // Hover reveals the pins; a CLICK would toggle them straight back off on a
        // hover-capable device, which is the whole point of the reveal.
        await glideTo(page, '.photo-frame');
        await beat(2600);
        await glideScroll(page, 340);
        await beat(1300);
        if (offbox > 0) throw new Error(`${offbox} off-box request(s) attempted — the demo must stay local.`);
      },
    });
  } finally {
    await proxy.close();
  }
}
