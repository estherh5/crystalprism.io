// Tour: vitals — a private family health tracker.
//
// SAFETY. This is the most dangerous app in the fleet to record, for reasons
// that are not obvious from the UI:
//
//   - An Epic FHIR refresh ROTATES PRODUCTION TOKENS. Triggering one from a
//     local run kills the real connection for every health system.
//   - labs/page.tsx auto-fires `syncHealthRecordsNow` on mount when a row
//     exists in `fhir_connections`; appointments/page.tsx auto-fires
//     `syncCalendarNow` against Google when a row exists in
//     `calendar_connections`. Neither needs a click.
//
// Three layers keep this recording inert:
//   1. seeds/vitals.mjs writes ZERO rows to fhir_connections,
//      calendar_connections and wearable_connections, and asserts it afterwards.
//      With those empty, both auto-sync gates evaluate false.
//   2. This tour visits only dashboard, labs and timeline. The appointments,
//      settings, documents and wearable screens are deliberately never opened.
//   3. The route guard below aborts any request leaving localhost, so even an
//      unforeseen client-side fetch cannot reach Epic or Google.
//
// The Wearable screen is excluded despite being visually strong: it renders an
// empty state unless a `wearable_connections` row exists, and creating one to
// get a nicer video is not a trade worth making.

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/vitals');
const APP_PORT = Number(process.env.APP_PORT ?? 3250);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3251);
const PATIENT = 'demo-patient';

// vitals is NOT on the crystalprism SSO ring — it uses Auth.js's own default
// cookie name, and over plain http that name carries no `__Secure-` prefix
// (verified against the running production build, not assumed).
const COOKIE = 'authjs.session-token';

export default async function run() {
  const secret = await readEnvVar(path.join(APP_DIR, '.env.local'), 'AUTH_SECRET');

  const cookie = await mintRingSession({
    appDir: APP_DIR,
    secret,
    userId: 'demo-user-vitals',
    email: 'demo@crystalprism.io',
    name: 'Demo',
    cookieName: COOKIE,
    // vitals' own scripts/local-verify-proxy.mjs mints these two extra claims;
    // without them the session resolves but the admin surfaces do not.
    extraClaims: { role: 'admin', checkedAt: Date.now() },
  });

  const proxy = await startCookieProxy({
    listenPort: PROXY_PORT,
    targetPort: APP_PORT,
    cookieName: cookie.name,
    cookieValue: cookie.value,
  });

  try {
    return await recordTour({
      name: 'vitals',
      baseURL: `http://localhost:${PROXY_PORT}/p/${PATIENT}`,
      colorScheme: 'light',
      async tour(page) {
        // Layer 3: nothing leaves the machine.
        let blocked = 0;
        await page.route('**/*', (route) => {
          const host = new URL(route.request().url()).hostname;
          if (host === 'localhost' || host === '127.0.0.1') return route.continue();
          blocked++;
          console.warn(`  BLOCKED outbound request to ${host}`);
          return route.abort();
        });

        // `main` lands before the rows do on the timeline, which put a skeleton
        // frame in the video. Waiting for the network to go quiet as well fixes it.
        const settle = async (re, selector) => {
          await page.waitForURL(re, { timeout: 10000 });
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          await page.waitForLoadState('networkidle');
          await beat(300);
        };

        // Dashboard: next appointment, and the watched-analyte trend.
        await page.waitForSelector('nav a');
        await beat(2400);
        await glideScroll(page, 240);
        await beat(700);

        // Labs — the strongest screen. The chart draws itself in on mount, and
        // the reference band only paints where a range is actually known.
        await glideTo(page, `a[href$="/${PATIENT}/labs"]`, { click: true });
        await settle(/\/labs/, 'svg');
        await beat(3000);

        // Switch the watched analyte; the chart redraws against a new range.
        await glideTo(page, 'button:has-text("Ferritin")', { click: true });
        await beat(2600);

        // Timeline: labs grouped by blood draw, medications filed alongside.
        await glideTo(page, `a[href$="/${PATIENT}/timeline"]`, { click: true });
        await settle(/\/timeline/, 'main');
        await beat(3200);

        if (blocked > 0) {
          throw new Error(
            `${blocked} outbound request(s) were attempted and blocked — investigate before shipping this video.`,
          );
        }
      },
    });
  } finally {
    await proxy.close();
  }
}
