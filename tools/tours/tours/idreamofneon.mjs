// Tour: idreamofneon.com — a dream journal that notices what recurs.
//
// SAFETY: this app's real data is local-only and dreams are about as personal
// as a record gets. TWO live databases sit in the repo — `data/local.db` (what
// the app reads) and `data.nosync/local.db` (what the Apple Notes importer
// writes). The app silently falls back to the first whenever
// TURSO_DATABASE_URL is unset, so the variable must be set explicitly to the
// demo file; seeds/idreamofneon.mjs refuses anything named local.db.
//
// Auth is iron-session behind a password, not the crystalprism SSO ring. Under
// `next start` the cookie is `__Host-idon_session`. Rather than seal a token by
// hand, run.mjs expects the cookie to have been obtained by POSTing /api/login
// as a FORM (not JSON) and written to raw/idon-cookie.txt.

import path from 'node:path';
import os from 'node:os';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_PORT = Number(process.env.APP_PORT ?? 3290);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3291);

export default async function run() {
  const raw = (await readFile(path.join(HERE, '..', 'raw', 'idon-cookie.txt'), 'utf8')).trim();
  const [name, ...rest] = raw.split('=');
  const value = rest.join('=');
  if (!name || !value) throw new Error('raw/idon-cookie.txt is not a cookie');

  const proxy = await startCookieProxy({
    listenPort: PROXY_PORT,
    targetPort: APP_PORT,
    cookieName: name,
    cookieValue: value,
  });

  try {
    return await recordTour({
      name: 'idreamofneon',
      baseURL: `http://localhost:${PROXY_PORT}/journal`,
      colorScheme: 'dark',
      async tour(page) {
        // The map paints a skeleton before the canvas mounts, so waiting on the
        // element alone still recorded a frame of placeholder bars.
        const settle = async (re, selector) => {
          await page.waitForURL(re, { timeout: 10000 });
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          await page.waitForLoadState('networkidle');
          await beat(300);
        };

        // The journal: dreams newest first, on the neon dark ground.
        await beat(1600);
        await glideScroll(page, 260);
        await beat(800);

        // One dream, read as written.
        // Not a bare href prefix: "+ new dream" is /dream/new and sits FIRST in
        // the DOM, so the prefix match opened an empty compose form.
        await glideTo(page, 'main a[href^="/dream/"]:not([href="/dream/new"])', { click: true });
        await settle(/\/dream\//, 'main');
        await beat(2400);

        // The map is the point of the app and gets the rest of the time: every
        // night is a star, cyan threads are one dream referencing another, and
        // the coloured stars are the people, places, things and situations that
        // keep coming back. The force layout settles over a couple of seconds,
        // so it is still moving while it is held.
        await glideTo(page, 'nav a[href="/map"]', { click: true });
        await settle(/\/map/, 'canvas');
        await beat(4200);

        // Drift across the constellation rather than clicking: a click opens an
        // insights panel that covers the web we came here to show.
        await page.mouse.move(560, 470, { steps: 26 });
        await beat(900);
        await page.mouse.move(760, 420, { steps: 26 });
        await beat(1600);
      },
    });
  } finally {
    await proxy.close();
  }
}
