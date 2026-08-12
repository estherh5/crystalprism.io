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
//   2. This tour visits only dashboard, labs and wearable. The appointments,
//      settings, documents and timeline screens are deliberately never opened,
//      and no "Sync now" control is ever clicked.
//   3. The route guard below aborts any request leaving localhost, so even an
//      unforeseen client-side fetch cannot reach Epic or Google.
//
// The Wearable screen WAS excluded on the grounds that it renders an empty
// state without a `wearable_connections` row. It is included as of Aug 2026,
// because that exclusion conflated two different hazards. The one that matters
// is auto-sync on mount, and it lives on labs (`syncHealthRecordsNow`) and
// appointments (`syncCalendarNow`) — both gated on tables this seed still
// leaves empty and still asserts empty. The wearable page is an async server
// component with no mount-time sync at all; `syncWearableNow` fires only from
// an explicit form action in components/WearableConnect.tsx. So the seed now
// writes one wearable connection and its nightly readings, layers 2 and 3 are
// unchanged, and the single new rule is that this tour must never click
// "Sync now".

import path from 'node:path';
import os from 'node:os';
import { recordTour, beat, glideTo, glideScroll } from '../lib/record.mjs';
import { mintRingSession, readEnvVar } from '../lib/session.mjs';
import { startCookieProxy } from '../lib/cookie-proxy.mjs';

const APP_DIR = path.join(os.homedir(), 'Developer/vitals');
const APP_PORT = Number(process.env.APP_PORT ?? 3250);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 3251);
// The patient's SLUG, not its id. Every patient-scoped route moved from
// `/p/<uuid>/…` to `/<slug>/…` in Aug 2026; `/p/<uuid>` survives only as a
// redirect shim, and filming a redirect puts a blank frame at the head of the
// video. This must match the slug seeds/vitals.mjs writes — `patients.slug` is
// NOT NULL and uniquely indexed, so a mismatch is a 404, not a fallback.
const PATIENT = 'rosemary';

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
      baseURL: `http://localhost:${PROXY_PORT}/${PATIENT}`,
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
        await beat(2600);
        await glideScroll(page, 240);
        await beat(800);

        // Labs — the strongest screen. The chart draws itself in on mount, and
        // the reference band only paints where a range is actually known.
        await glideTo(page, `a[href$="/${PATIENT}/labs"]`, { click: true });
        await settle(/\/labs/, 'svg');
        await beat(3000);

        // Switch the watched analyte; the chart redraws against a new range.
        // Ferritin is reachable by name only because seeds/vitals.mjs stars
        // five labs in `watched_analytes` — lib/analyte-ranking.ts scores on
        // distinct months across ALL observations, so with nothing starred the
        // wearable metrics win every slot and this button does not exist.
        await glideTo(page, 'button:has-text("Ferritin")', { click: true });
        await beat(2400);

        // The timeline is deliberately NOT visited, and the reason is worth
        // writing down because it looks like an omission.
        //
        // lib/timeline.ts builds its rows from lib/observations.ts#groupIntoDraws
        // over every observation, with no filter on source. A night of wearable
        // readings shares one instant, so it collapses to exactly one row —
        // which means once a Fitbit is connected, nightly rows outnumber blood
        // draws roughly 10:1. Measured against this seed: 19 of the 20 most
        // recent draws are `source='fitbit'`. Filming it would show a wall of
        // identical nightly entries, and it would show them immediately before
        // the wearable screen says the same thing better.
        //
        // So the tour goes straight to wearable. If the timeline ever grows a
        // source filter or a collapse for nightly rows, put this beat back —
        // it is a strong screen, it is just not a strong screen *here*.

        // Wearable — the one screen drawn against the patient's OWN baseline
        // rather than a population range, which is the argument the app makes
        // about what continuous data is for. The banded sections read as shape
        // at thumbnail size, so this closes the tour.
        //
        // Never click "Sync now" here. It is the only control on this screen
        // that would reach Fitbit, and the whole reason the screen is safe to
        // film is that nothing else on it syncs.
        await glideTo(page, `a[href$="/${PATIENT}/wearable"]`, { click: true });
        // `.wearable-section` is the per-metric panel and is present on load.
        // NOT `.wearable-curve` — that only mounts when a night row is expanded
        // (WearableMetricSection.tsx:286), so waiting on it times out on a page
        // that has in fact drawn perfectly well.
        await settle(/\/wearable/, '.wearable-section');
        await beat(1700);
        await glideScroll(page, 280);
        await beat(1700);

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
