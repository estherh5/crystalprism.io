// Tour: flare.crystalprism.io — fleet error triage.
//
// The story is the one the app exists for: a wall of grouped noise becomes one
// actionable thing, and the minified client stack that nobody can read becomes a
// stack naming real files and real line numbers.
//
// Assumes a production build of flare is already listening on APP_PORT with
// TURSO_DATABASE_URL pointing at the seeded THROWAWAY demo DB — never
// data/local.db and never the Turso database. See README.md.
//
// Two things differ from the other tours in this directory:
//
//  * flare's session cookie is plain `authjs.session-token`. It is not on the
//    crystalprism SSO ring and sets no custom cookie name, so @auth/core's own
//    default applies — and that default drops the `__Secure-` prefix when the
//    request arrives over http, which a local recording always does. The
//    prefixed name is silently rejected (404, because requireAdmin() throws and
//    the page calls notFound()).
//  * the session must carry a `uid` claim. flare's session callback reads
//    session.user.id from token.uid and from nothing else, and requireAdmin()
//    demands both an id and an email matching ADMIN_EMAIL.
//
// The queue's rows are not links, so the walk from the list to a group's detail
// page is a goto rather than a click. The cursor is parked on the row it is
// "opening" first so the cut still reads as a click rather than a jump.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/flare');
const APP_PORT = Number(process.env.APP_PORT ?? 3280);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3281);

/** flare keeps no .env file, so the demo secret is passed in by the operator. */
const SECRET = process.env.AUTH_SECRET;

/** The group the tour opens: the source-mapped client stack, seeded by seeds/flare.mjs. */
const GROUP = 'grp-lantern-shelf-count';

export default async function run() {
  if (!SECRET) throw new Error('flare tour: AUTH_SECRET must match the running server');

  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret: SECRET,
    userId: 'demo-user-flare',
    email: process.env.ADMIN_EMAIL ?? 'demo@pinelight.dev',
    name: 'Demo',
    cookieName: 'authjs.session-token',
    extraClaims: { uid: 'demo-user-flare' },
  });

  const proxy = await startCookieProxy({
    listenPort: PROXY_PORT,
    targetPort: APP_PORT,
    cookieName: cookie.name,
    cookieValue: cookie.value,
  });

  try {
    return await recordTour({
      name: 'flare',
      baseURL: `http://localhost:${PROXY_PORT}/`,
      colorScheme: 'light',
      // flare is the most text-dense app in the fleet and the payoff is a stack
      // trace, so it is laid out at 896 CSS pixels and scaled up into the 1280x720
      // frame: the players on the projects page are 345px wide, and at 1280 CSS
      // pixels a 13px stack line lands under 4 physical pixels there. 896 keeps the
      // detail page's 860px reading measure edge to edge with nothing wasted.
      viewport: { width: 896, height: 504 },
      // Budgeted a shade over 15s: ffmpeg trims the tail rather than leaving the
      // video short. The long hold is on the resolved stack — it is the reason the
      // app exists and it must not flash past.
      async tour(page) {
        // Open held on the populated queue. This frame is the video thumbnail.
        await page.waitForSelector('.row');
        await beat(1600);

        // The filter band: the queue narrows to what has not been looked at yet.
        await glideTo(page, '.triage-band .chip:has-text("New")', { click: true });
        await page.waitForSelector('.chip.on');
        await beat(1000);

        await glideTo(page, '.triage-band .chip:has-text("All")', { click: true });
        await beat(600);

        // Drift down the wall so more than three rows are seen.
        await glideScroll(page, 240, { steps: 18 });
        await beat(600);

        // Park on the row being opened, then open it. The rows are not anchors, so
        // this is a goto; the pause on the row is what makes the cut read as a
        // click. glideTo scrolls the row back into view on its own.
        await glideTo(page, '.rows .row:first-child .row-title');
        await beat(400);
        await page.goto(`http://localhost:${PROXY_PORT}/g/${GROUP}`, {
          waitUntil: 'networkidle',
        });

        // The header: which app, what threw, and the culprit still in its minified
        // form — `Ur@main-4f2a.js`, the thing a person cannot act on.
        await page.waitForSelector('.detail-title');
        await beat(1300);

        // Down to the payoff. Wait on the stack itself, not on the URL: the section
        // is suspended, so the surrounding page paints before the frames exist.
        await page.waitForSelector('.detail-stack');
        await glideScroll(page, 320, { steps: 20 });
        // The synthetic cursor resets to 0,0 on a goto, so it would otherwise spend
        // the whole payoff parked in the corner. Moved by hand rather than with
        // glideTo, whose scrollIntoViewIfNeeded would jump the scroll position that
        // the glide above just set smoothly.
        await page.mouse.move(520, 250, { steps: 20 });
        await beat(300);

        // Hold, and hold properly — this is the whole reason the app exists. Badge
        // reads "Source-mapped"; the frames name real files and real line numbers,
        // with the two node_modules frames dimmed as library code.
        await beat(3600);

        // A last short nudge so the line naming which event the stack came from is
        // read too, and rest with the trace still on screen.
        await glideScroll(page, 90, { steps: 10 });
        await beat(900);
      },
    });
  } finally {
    await proxy.close();
  }
}
