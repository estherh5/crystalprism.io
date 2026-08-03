// Tour: vantage — a photo archive of one fixed viewpoint.
//
// The photographs and their capture metadata are REAL, restored from the
// nightly backup and repointed at a local mirror by seeds/vantage.mjs; only the
// account around them is invented. An archive of fabricated tiles would
// demonstrate nothing, and this app is entirely about the images.
//
// Nothing is fetched from Cloudflare during a recording: the seed asserts every
// photo URL is a local /demo/ path before the build is even started.
//
// Assumes a production build on APP_PORT against the seeded demo DB, with
// web/public/demo symlinked to ~/blob-backups/vantage/photos. See README.md.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/vantage/web');
const APP_PORT = Number(process.env.APP_PORT ?? 3270);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3271);
const SLUG = 'river';

export default async function run() {
  const secret =
    (await readEnvVar(path.join(APP_DIR, '.env.local'), 'AUTH_SECRET')) ??
    (await readEnvVar(path.join(APP_DIR, '.env'), 'AUTH_SECRET')) ??
    (await readEnvVar(path.join(APP_DIR, '.env.production.local'), 'AUTH_SECRET'));

  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-vantage',
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
      name: 'vantage',
      baseURL: `http://localhost:${PROXY_PORT}/a/${SLUG}`,
      colorScheme: 'dark',
      async tour(page) {
        // The archive is local, but assert it rather than trust it: a single
        // stray R2 request would mean the seed missed a row.
        let offbox = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (host === 'localhost' || host === '127.0.0.1') return route.continue();
          offbox++;
          console.warn(`  BLOCKED off-box request to ${host}`);
          return route.abort();
        });

        // The wall of one river, thousands of times over. This is the thumbnail
        // and it needs no explaining.
        await page.waitForSelector('.wall-cell img');
        await beat(1900);
        await glideScroll(page, 420);
        await beat(1000);

        // Time Machine — the archive playing itself back. `.tm-img` exists before
        // its bytes arrive, so waiting on the element alone still records a frame
        // of empty stage; wait until the image has actually decoded.
        await glideTo(page, `a[href$="/${SLUG}/time"]`, { click: true });
        await page.waitForURL(/\/time/, { timeout: 10000 });
        await page.waitForSelector('.tm-img', { state: 'visible', timeout: 15000 });
        await page.waitForFunction(
          () => {
            const img = document.querySelector('.tm-img');
            return img && img.complete && img.naturalWidth > 0;
          },
          { timeout: 15000 },
        );
        await beat(900);

        // Press play and simply let it run. Six years of one viewpoint
        // flickering past is the product; nothing else needs to happen.
        await glideTo(page, 'button.tm-play', { click: true });
        await beat(7200);

        if (offbox > 0) {
          throw new Error(`${offbox} off-box request(s) attempted — a photo row still points at R2.`);
        }
      },
    });
  } finally {
    await proxy.close();
  }
}
