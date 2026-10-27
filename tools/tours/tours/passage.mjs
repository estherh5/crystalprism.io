// Tour: passage.crystalprism.io — plan the trip, keep the record.
//
// Every trip on screen is invented (seeds/passage.mjs) and every photo is a
// drawing. passage's real trips carry companions' emails and are never recorded.
//
// Assumes a production build of passage is listening on APP_PORT against the
// SEEDED DEMO FILE, served from a COPY of the repo (launchd's passage-web owns
// ~/Developer/passage/.next). AUTH_SECRET must be exported with the same value
// the server was started with. See README.md.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/passage');
const APP_PORT = Number(process.env.APP_PORT ?? 3330);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3331);

export default async function run() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('export AUTH_SECRET: the demo server was started with a throwaway one');

  const now = Date.now();
  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-passage',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    // passage's own admission stamp plus the ring-check pair, so no session
    // read reaches out to the ring endpoint on crystalprism.io.
    extraClaims: { 'checkedAt:passage': now, signedInAt: now, ringCheckedAt: now },
  });

  const proxy = await startCookieProxy({
    listenPort: PROXY_PORT,
    targetPort: APP_PORT,
    cookieName: cookie.name,
    cookieValue: cookie.value,
  });

  try {
    return await recordTour({
      name: 'passage',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      // Smaller than 1280x720 so the page's own 1024px column fills the frame
      // and the masthead type survives a 345px player.
      viewport: { width: 1024, height: 576 },
      async tour(page) {
        // Open on the home page: the world map of everywhere visited. Big
        // color, so it holds as the thumbnail.
        await page.waitForSelector('.map-hero svg', { state: 'visible' });
        await beat(1700);

        // Down to the timeline of trips, each with its cover photo.
        await glideScroll(page, 560);
        await beat(900);

        // Into the finished Lisbon trip.
        await glideTo(page, 'a[href="/trips/trip-lisbon"]', { click: true });
        await page.waitForURL(/\/trips\/trip-lisbon/, { timeout: 10000 });
        await page.waitForSelector('.maplibregl-canvas', { state: 'visible', timeout: 15000 });
        // No hold here: the first scroll's own round trip waits ~3s on the
        // busy main thread, and that wait is already the masthead's hold.
        await beat(200);

        // Below the fold the trip page runs six maplibre maps, which in
        // headless (software GL) Chromium keep the main thread saturated for
        // seconds. glideScroll's 26 queued wheel events then crawl, and any
        // that land on a map zoom it instead of the page. One in-page smooth
        // scrollBy per move is a single round trip and is drawn by the
        // compositor.
        const smoothScroll = (dy) =>
          page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), dy);

        // The itinerary map: every activity, the stay and the photos, pinned.
        await smoothScroll(470);
        await beat(2600);

        // Down onto Day 1: its stamp, the weather it actually had, the photos
        // that landed on it, and the day's own map.
        await smoothScroll(420);
        await beat(1800);
        await smoothScroll(380);
        await beat(4000);
      },
    });
  } finally {
    await proxy.close();
  }
}
