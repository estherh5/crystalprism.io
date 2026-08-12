// Seeds a throwaway demo DB for vitals with an invented patient.
//
// SAFETY — three separate hazards, all handled here:
//
// 1. PHI. vitals holds real health records. This script hard-refuses to run
//    against anything but a local file: URL, and it must never be pointed at
//    `dev.db` at the repo root: prior sessions restored a real dump into that
//    file. The demo lives in its own `demo.db`.
//
// 2. Epic and Google Calendar. Two pages auto-fire a real sync on mount if a
//    connection row exists: labs/page.tsx gates `autoSyncHealthRecords` on a row
//    in `fhir_connections`, and appointments/page.tsx gates `CalendarSyncBar
//    autoSync` on a row in `calendar_connections`. An Epic refresh ROTATES
//    PRODUCTION TOKENS and kills the live connection. So this seed writes ZERO
//    rows into `fhir_connections` and `calendar_connections` and asserts it
//    afterwards. Those two assertions ARE the offline guarantee. Do not relax
//    them, and do not fold them back together with the wearable one below.
//
// 2b. `wearable_connections` IS SEEDED — one row — and that is safe for a reason
//    that DOES NOT GENERALISE to the two tables above.
//
//    app/(app)/[patient]/wearable/page.tsx is an async server component with NO
//    mount-time sync at all: it reads `observations` and renders. The only
//    caller of `syncWearableNow` anywhere in the app is an explicit form action
//    in components/WearableConnect.tsx:129, on the settings screen — a button a
//    person submits, never something a render does. (Checked by grepping
//    `autoSync` / `syncWearableNow` across app/, lib/ and components/: the two
//    auto-firing gates are labs and appointments, and both hang off tables this
//    seed still leaves empty.)
//
//    The row also carries NO CREDENTIALS — access_token, refresh_token, scope
//    and token_expires_at are all NULL — so even a submitted Sync now would have
//    nothing to authenticate with, and nothing on any render path decrypts them.
//    What the row actually buys is the dashboard's wearable block and the
//    settings panel reading "connected" instead of "connect a watch".
//
// 3. Provenance. Every seeded record is `source: "manual"` except the nightly
//    watch readings, which are `source: "fitbit"` because that is the ONLY
//    thing lib/wearable-series.ts will draw — see the wearable block below. No
//    row claims to have come from a health system, and no Epic-backed document
//    exists for a stray Download click to try to fetch.
//
// 4. The digest — the one path that mails clinical values OUT of this app.
//    `patient_members.wearable_digest_opt_in` stays 0, and `wearable_deviations`
//    stays EMPTY. The wearable page replays past departures on READ
//    (lib/wearable-series.ts#resolvedEpisodes) and never needs a stored row,
//    whereas a stored row with a null `notified_at` is exactly what
//    lib/wearable-digest.ts picks up and sends. Seeding one to "show the
//    feature" would be seeding an outbound email.
//
// Everything below is fictional and deliberately unremarkable: routine values a
// family might track together, not a diagnosis. Nothing here is derived from,
// copied out of, or scaled from any real record.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}
if (/\bdev\.db\b/.test(url)) {
  throw new Error('refusing to seed: dev.db may contain real health records. Use demo.db.');
}

const db = createClient({ url });

const USER = { id: 'demo-user-vitals', email: 'demo@crystalprism.io', name: 'Demo' };
// `slug` is the patient's URL identity since drizzle/0022_patient-slug.sql —
// every patient-scoped route moved from `/p/<uuid>/…` to `/<slug>/…`, and the
// legacy `/p/<uuid>` route now redirects to `/${patient.slug}`. The column
// arrived NOT NULL DEFAULT '', so omitting it does not fail: it produces a
// patient whose every page lives at `/` and whose old-style link redirects to
// the app root, which reads as "the tour is broken" rather than as a bad seed.
// Checked against lib/patient-slug.ts — lowercase, longer than one character,
// and not in RESERVED_SLUGS (which holds `p`, `patients`, `settings`, `admin`,
// `new`, `edit` and the root-served filenames).
const PATIENT = { id: 'demo-patient', slug: 'rosemary', name: 'Rosemary Whitlock', dob: '1952-03-14' };

const now = Date.now();
const day = 86400000;

// Every integer timestamp in this schema is declared `mode: "timestamp"`, which
// is Drizzle for epoch SECONDS, not milliseconds. Writing ms produces dates in
// the year ~57000 and the app dies with "RangeError: Invalid time value" inside
// lib/observations.ts. `date` columns are TEXT and take a yyyy-mm-dd string.
const secs = (daysAgo) => Math.floor((now - daysAgo * day) / 1000);
const dateStr = (daysAgo) => new Date(now - daysAgo * day).toISOString().slice(0, 10);

// A wearable night's row is filed at NOON UTC on the night's OWN date —
// lib/google-health-sync.ts#observedAtFor — and lib/wearable-series.ts recovers
// the night by taking the UTC date straight back off the stored instant. Any
// other hour is a different night, and the failure is silent: the whole series
// shifts by one day and every sentence on the page still reads perfectly.
const nightSecs = (night) => Date.parse(`${night}T12:00:00Z`) / 1000;

// name, loinc, unit, refLow, refHigh, series of values (oldest first)
const LABS = [
  ['Hemoglobin', '718-7', 'g/dL', 12.0, 15.5, [12.8, 13.1, 12.9, 13.4, 13.6, 13.5]],
  ['Vitamin D, 25-OH', '1989-3', 'ng/mL', 30, 100, [22, 26, 31, 38, 44, 47]],
  ['TSH', '3016-3', 'mIU/L', 0.4, 4.0, [3.6, 3.1, 2.8, 2.4, 2.2, 2.1]],
  ['Ferritin', '2276-4', 'ng/mL', 15, 150, [38, 41, 45, 52, 58, 61]],
  ['HDL Cholesterol', '2085-9', 'mg/dL', 50, 100, [48, 51, 54, 56, 58, 59]],
  ['Platelets', '777-3', 'K/uL', 150, 400, [232, 245, 251, 240, 238, 247]],
];

const MEDS = [
  ['Vitamin D3', '2000 IU', 'Once daily', 420],
  ['Levothyroxine', '75 mcg', 'Once daily, morning', 300],
  ['Calcium citrate', '600 mg', 'Twice daily with food', 180],
  ['Amlodipine', '5 mg', 'Once daily', 95],
];

const CARE_TEAM = [
  ['Dr. Helena Ward', 'Primary care', 'Bath Medical Practice'],
  ['Dr. Idris Bello', 'Endocrinology', 'Royal United Hospital'],
  ['Marta Kowalski', 'Practice nurse', 'Bath Medical Practice'],
];

const APPOINTMENTS = [
  ['Endocrinology follow-up', -9, 'Royal United Hospital, Clinic 4'],
  ['Bloods before appointment', -2, 'Bath Medical Practice'],
  ['Annual review', -31, 'Bath Medical Practice'],
  ['Bone density scan', -54, 'Royal United Hospital, Imaging'],
];

const stmts = [];

// Order matters: children before parents. `fhir_connections` and
// `calendar_connections` are cleared and never repopulated — that is what keeps
// this recording offline. `wearable_connections` is cleared and then given
// exactly one credential-free row; hazard 2b at the top is the argument for why
// that is not the same act.
for (const t of [
  'wearable_samples', 'wearable_deviations', 'wearable_connections',
  'fhir_connections', 'calendar_connections', 'watched_analytes',
  'observations', 'medications', 'care_team', 'appointments', 'agenda_items',
  'notes', 'documents', 'recordings', 'patient_members', 'patients', 'users',
]) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

// `temp_unit` is stated rather than left to its default. Skin temperature is
// STORED in Celsius (the unit Google sends) and converted only at the screen by
// lib/wearable-units.ts, with the viewer's own preference read by
// lib/user-units.ts#tempUnitForUser. Its column default is already 'F', so this
// is belt and braces — but a recording that silently rendered 32.8 °C would be
// off-brief for a US demo, and the default is not something this file should
// have to trust.
stmts.push({
  sql: 'INSERT INTO users (id, email, name, role, temp_unit, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  args: [USER.id, USER.email, USER.name, 'admin', 'F', secs(400)],
});

stmts.push({
  sql: 'INSERT INTO patients (id, name, slug, dob, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  args: [PATIENT.id, PATIENT.name, PATIENT.slug, PATIENT.dob, USER.id, secs(400)],
});

stmts.push({
  sql: 'INSERT INTO patient_members (patient_id, user_id, role, wearable_digest_opt_in) VALUES (?, ?, ?, 0)',
  args: [PATIENT.id, USER.id, 'owner'],
});

let obs = 0;
for (const [name, loinc, unit, refLow, refHigh, series] of LABS) {
  series.forEach((value, i) => {
    const daysAgo = (series.length - 1 - i) * 62 + 4;
    stmts.push({
      sql: `INSERT INTO observations
        (id, patient_id, loinc, name, value, value_comparator, value_text, unit,
         ref_low, ref_high, observed_at, category, source, fhir_connection_id,
         created_by, fhir_category, notes)
        VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, 'clinical', 'manual', NULL, ?, NULL, NULL)`,
      args: [`obs-${++obs}`, PATIENT.id, loinc, name, value, unit, refLow, refHigh, secs(daysAgo), USER.id],
    });
  });
}

MEDS.forEach(([name, dose, frequency, startedDaysAgo], i) => {
  stmts.push({
    sql: `INSERT INTO medications
      (id, patient_id, name, dose, frequency, start_date, end_date, source, notes,
       fhir_connection_id, status, end_date_marked_at, authored_on_absent)
      VALUES (?, ?, ?, ?, ?, ?, NULL, 'manual', NULL, NULL, 'active', NULL, 0)`,
    args: [`med-${i + 1}`, PATIENT.id, name, dose, frequency, dateStr(startedDaysAgo)],
  });
});

// Appointments are safe to seed: the hazard on that page is a row in
// `calendar_connections`, not the appointments themselves. Every gcal_* column
// stays null so nothing looks like it came from, or belongs in, a real calendar.
APPOINTMENTS.forEach(([title, daysAgo, location], i) => {
  stmts.push({
    sql: `INSERT INTO appointments
      (id, patient_id, title, starts_at, ends_at, location, care_team_id,
       gcal_event_id, gcal_etag, status, description, created_by, created_at,
       updated_at, gcal_last_error, gcal_review_reason, deleted_at, source,
       fhir_connection_id)
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, 'scheduled', NULL, ?, ?, ?, NULL, NULL, NULL, 'manual', NULL)`,
    args: [
      `appt-${i + 1}`,
      PATIENT.id,
      title,
      secs(daysAgo),
      secs(daysAgo) + 3600,
      location,
      USER.id,
      secs(120),
      secs(120),
    ],
  });
});

/**
 * THE FIVE STARRED ANALYTES, AND WHY THIS IS NOT DECORATION.
 *
 * lib/watched-analytes.ts#resolveWatchedRow fills WATCHED_ROW_SIZE (5) slots
 * with the family's stars first and ranked analytes after — and the ranking, in
 * lib/analyte-ranking.ts, scores DISTINCT MONTHS at weight 10 over EVERY
 * observation on the patient, wearable rows included. Nothing filters them out.
 *
 * Measured against this seed rather than assumed: with the nightly readings in
 * and no stars set, the row came back as `Minutes below 90% oxygen`, `Awake
 * during sleep`, `REM sleep`, `Sleep duration`, `Deep sleep` — five wearable
 * metrics, seven months of them each, beating six lab draws that touch six
 * distinct months between them. Ferritin, which the tour clicks BY NAME, was not
 * on the page at all, and the click would have failed on a screen that looked
 * merely odd rather than broken.
 *
 * Starring pins the row deterministically, which is worth more than the two
 * lines it costs: it stops depending on a scoring function this seed does not
 * own. Vitamin D leads because the FIRST WATCHED SLOT is what the chart opens
 * on (components/LabTrendSection.tsx), so Ferritin has to be a slot the tour can
 * click TO rather than the one already selected.
 */
const WATCHED = ['loinc:1989-3', 'loinc:718-7', 'loinc:3016-3', 'loinc:2276-4', 'loinc:2085-9'];

WATCHED.forEach((analyteKey, i) => {
  stmts.push({
    sql: 'INSERT INTO watched_analytes (patient_id, analyte_key, created_by, created_at) VALUES (?, ?, ?, ?)',
    args: [PATIENT.id, analyteKey, USER.id, secs(200 - i)],
  });
});

CARE_TEAM.forEach(([name, specialty, organization], i) => {
  stmts.push({
    sql: 'INSERT INTO care_team (id, patient_id, name, specialty, organization, phone, notes) VALUES (?, ?, ?, ?, ?, NULL, NULL)',
    args: [`ct-${i + 1}`, PATIENT.id, name, specialty, organization],
  });
});

/* ────────────────────────────── the watch ────────────────────────────── */

// THE WEARABLE PAGE DOES NOT READ `wearable_samples`. It reads `observations`.
//
// This block used to write four rows per night into `wearable_samples` under
// metric names like `sleep_duration`, and the page drew NOTHING from any of
// them — an empty state on a screen holding 184 rows. Two separate mismatches,
// both silent:
//
//   * `lib/wearable-series.ts#loadWearableHistory` selects from `observations`
//     WHERE `source = 'fitbit'`, and maps `observations.loinc` back to a metric
//     through the codes in lib/wearable-metrics.ts. A row whose code is not in
//     that map is skipped without a word, so a typo here is indistinguishable
//     from a watch that was never worn.
//   * `wearable_samples` holds the RAW per-minute streams and nothing else. Its
//     `metric` column takes Google's own data-type ids — `heart-rate` and
//     `oxygen-saturation`, those two strings exactly (app/actions/wearable.ts
//     validates `stream` against them and returns [] for anything else) — and
//     the only thing that reads it is the per-night curve a reader can open on
//     the three sections that have one.
//
// So: nightly derived values go into `observations`, raw curves go into
// `wearable_samples`, and the two are seeded from the same numbers so the curve
// a reader opens agrees with the value printed above it.

// Copied VERBATIM from WEARABLE_METRICS in lib/wearable-metrics.ts: metric key,
// the code the sync writes (`loinc ?? localCode`), the label it writes into
// `observations.name`, and the STORED unit. All eleven, because the page builds
// seven sections and sleep's four stages nest inside the first of them — a
// missing metric is a section that renders "no readings" beside six that work.
// Degree sign written as an escape so this file stays pure ASCII.
const WEARABLE_METRICS = [
  ['sleep_duration', '93832-4', 'Sleep duration', 'min'],
  ['sleep_deep', 'vitals-local:sleep-deep', 'Deep sleep', 'min'],
  ['sleep_rem', 'vitals-local:sleep-rem', 'REM sleep', 'min'],
  ['sleep_light', 'vitals-local:sleep-light', 'Light sleep', 'min'],
  ['sleep_awake', 'vitals-local:sleep-awake', 'Awake during sleep', 'min'],
  ['spo2_min', '59408-5', 'Oxygen saturation (nightly low)', '%'],
  ['spo2_minutes_below_90', 'vitals-local:spo2-minutes-below-90', 'Minutes below 90% oxygen', 'min'],
  ['resting_heart_rate', '40443-4', 'Resting heart rate', 'beats/min'],
  ['hrv_rmssd', 'vitals-local:hrv-rmssd', 'Heart rate variability', 'ms'],
  ['respiratory_rate', '9279-1', 'Respiratory rate', 'breaths/min'],
  ['skin_temp', 'vitals-local:skin-temp', 'Skin temperature (overnight)', '\u00B0C'],
];

/**
 * HOW MUCH HISTORY, AND WHY IT IS NOT A FULL YEAR.
 *
 * The window switch offers 30 / 90 / 365 nights and 200 nights lights all three
 * — the 365 view shows everything on file, which is the honest shape for a
 * family who connected the watch about seven months ago (see the connection
 * row's `created_at` below, which agrees with it).
 *
 * A LONGER RECORD ACTIVELY BREAKS THE LABS SCREEN, which is the real reason for
 * the ceiling. lib/analyte-ranking.ts scores an analyte on DISTINCT MONTHS at
 * weight 10, and the labs page does not filter wearable rows out of that
 * ranking: eleven metrics measured every night for a year would be eleven
 * analytes at ~13 months each, they would take all five slots of the watched
 * row (WATCHED_ROW_SIZE = 5), and Ferritin — which the tour clicks by name —
 * would vanish off the page. At 200 nights the wearable metrics score ~7 months
 * against the seeded labs' ~11 and stay behind them. If this number is ever
 * raised, re-check the labs page before shipping the video.
 */
const NIGHTS = 200;

/**
 * THREE NIGHTS SHE WAS FIGHTING SOMETHING OFF, ten to twelve nights ago, as
 * daysAgo -> intensity. Invented, like everything else here.
 *
 * Placed in the PAST rather than at the end of the record, deliberately. A
 * departure still running renders as a present-tense deviation and sorts its
 * section to the top of the page; one that has resolved renders as the
 * "Earlier: …" sentence plus a shaded span on the chart, which is the feature
 * worth showing and reads as a record rather than as an alarm. It sits inside
 * the 30-night window so the default view shows it without touching the switch.
 *
 * The intensities are shaped so it builds and fades. Resting heart rate, skin
 * temperature and HRV all clear their own 3-MAD bands on every one of the three
 * nights (the detector needs two consecutive); sleep and respiratory rate move
 * visibly and deliberately do NOT clear theirs, because a page where every
 * metric fires at once teaches a reader that firing means nothing.
 */
const EPISODE = { 12: 0.85, 11: 1, 10: 0.75 };

/** Nights the watch was off the wrist. Absence is shown as absence — the app
 * stores no row at all for a night with no data, never a zero, and a gap in the
 * chart is what that looks like. Kept well clear of the last fortnight: two
 * missing nights at the END would trip lib/wearable-series.ts#freshnessLine and
 * print "No readings since …" across the top of the recording. */
const OFF_NIGHTS = new Set([141, 96, 95, 94]);

/** Deterministic pseudo-noise in [-0.5, 0.5). No Math.random anywhere in this
 * file: a re-seed has to produce a byte-identical database, or two recordings
 * of the same tour disagree about what the chart showed. */
const wobble = (salt, d) => {
  const x = Math.sin(salt * 127.1 + d * 311.7) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

/** Rounded to the metric's own reporting step, the way the device would send
 * it. lib/wearable-baseline.ts floors the MAD at that step, so a series finer
 * than its instrument would produce bands narrower than a single tick. */
const step = (value, size) => Number((Math.round(value / size) * size).toFixed(4));

/** One plausible night. A slow seasonal swing, a weekend lie-in, a little
 * nightly noise, and the episode above — not a random walk, which is what a
 * band drawn over a random walk exposes immediately. */
function nightlyValues(d) {
  const night = dateStr(d);
  const season = Math.sin((d / NIGHTS) * Math.PI * 2);
  // Friday and Saturday nights. `dateStr` is a UTC date and this is read back
  // in UTC, so the two never disagree about which day of the week it was.
  const weekday = new Date(`${night}T12:00:00Z`).getUTCDay();
  const lieIn = weekday === 5 || weekday === 6 ? 26 : 0;
  const ill = EPISODE[d] ?? 0;

  const duration = Math.round(418 + lieIn + season * 10 + wobble(1, d) * 46 - ill * 55);
  const deep = Math.round(duration * 0.17 + wobble(2, d) * 10 - ill * 14);
  const rem = Math.round(duration * 0.21 + wobble(3, d) * 12 - ill * 12);
  // How far she dipped tonight, in points of oxygen. ONE driver behind both
  // SpO2 metrics so they cannot contradict each other: a nightly low of 88.9%
  // beside zero minutes under 90% is a pair of numbers that cannot both be true.
  const desat = Math.max(0, 0.9 + season * 0.15 + wobble(5, d) * 1.1 + ill * 0.5);

  return {
    night,
    values: {
      sleep_duration: duration,
      sleep_deep: deep,
      sleep_rem: rem,
      // The stages of a night sum to the night. Light is what is left over;
      // awake is beside them, not part of them, exactly as Fitbit reports it.
      sleep_light: duration - deep - rem,
      sleep_awake: Math.round(38 + wobble(4, d) * 14 + ill * 16),
      spo2_min: step(91 - desat, 0.1),
      spo2_minutes_below_90: Math.max(0, Math.round(desat * 7 + wobble(6, d) * 2)),
      resting_heart_rate: Math.round(57 + season * 1.6 + wobble(7, d) * 3.4 + ill * 13),
      hrv_rmssd: step(33 + season * 2 + wobble(8, d) * 5.5 - ill * 11, 0.05),
      respiratory_rate: step(14.6 + season * 0.3 + wobble(9, d) * 0.9 + ill * 0.5, 0.2),
      // CELSIUS, because that is the unit the record stores and the detector
      // runs on. The page converts to Fahrenheit at the boundary for a viewer
      // whose `temp_unit` is 'F' — 32.78 C is 91.0 F.
      skin_temp: step(32.78 + season * 0.12 + wobble(10, d) * 0.34 + ill * 0.62, 0.001),
    },
  };
}

const NIGHTLY = [];
for (let d = NIGHTS; d >= 1; d--) {
  if (OFF_NIGHTS.has(d)) continue;
  NIGHTLY.push({ daysAgo: d, ...nightlyValues(d) });
}

let nightly = 0;
for (const { night, values } of NIGHTLY) {
  for (const [metric, code, label, unit] of WEARABLE_METRICS) {
    stmts.push({
      // `ref_low` / `ref_high` stay NULL. A watch-derived value has no
      // reference range, and inventing one would paint a "normal band" across
      // the one screen in this app deliberately built without a target line —
      // the only thing a night is ever compared against is her own history.
      // `created_by` is NULL for the same kind of reason: nobody typed these.
      sql: `INSERT INTO observations
        (id, patient_id, loinc, name, value, value_comparator, value_text, unit,
         ref_low, ref_high, observed_at, category, source, fhir_connection_id,
         created_by, fhir_category, notes)
        VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, ?, 'wellness', 'fitbit', NULL, NULL, NULL, NULL)`,
      args: [`wn-${++nightly}`, PATIENT.id, code, label, values[metric], unit, nightSecs(night)],
    });
  }
}

/**
 * The per-minute curves behind the last 30 nights.
 *
 * THIRTY, because lib/wearable-series.ts#RAW_CURVE_NIGHTS is 30 and is pinned by
 * a test to the sync's own `SAMPLE_RETENTION_DAYS`: older nights are offered as
 * unopenable rather than opened empty, so seeding further back would put rows in
 * the table that no screen can ever reach.
 *
 * Sampled every ten minutes rather than every minute — sixty points draw the
 * same curve as six hundred and keep this seed to one batch.
 *
 * THE TIMESTAMPS ARE THE FIDDLY PART. A night runs noon-to-noon in
 * America/New_York (lib/wearable-metrics.ts#nightOf), and `loadNightCurve`
 * re-asks that same function about every sample it fetched. 23:20Z on the
 * night's date through 10:50Z the next morning is inside that night under both
 * EDT and EST, so no sample can fall out of the night it was written for when
 * the clocks change.
 */
const CURVE_NIGHTS = 30;
const CURVE_STEP_MIN = 10;
const CURVE_SAMPLES = 69;

let sample = 0;
for (const { daysAgo, night, values } of NIGHTLY) {
  if (daysAgo > CURVE_NIGHTS) continue;
  const start = Date.parse(`${night}T23:20:00Z`);
  // Where the night's deepest desaturation sits. Fixed, so the curve's own
  // minimum IS the `spo2_min` printed above it rather than merely near it.
  const dipAt = Math.round(CURVE_SAMPLES * 0.42);

  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const at = Math.floor((start + i * CURVE_STEP_MIN * 60000) / 1000);
    const phase = i / (CURVE_SAMPLES - 1);

    // Heart rate falls through the first half of the night and climbs back
    // towards waking. The nightly resting figure is the floor it settles at.
    const hr = values.resting_heart_rate + 8 - 10 * Math.sin(phase * Math.PI) + wobble(20 + i, daysAgo) * 4;
    stmts.push({
      sql: 'INSERT INTO wearable_samples (id, patient_id, metric, sampled_at, value) VALUES (?, ?, ?, ?, ?)',
      args: [`ws-${++sample}`, PATIENT.id, 'heart-rate', at, Math.round(hr)],
    });

    // Oxygen sits in the mid-nineties and dips once. `g` is 1 at the dip's
    // centre, where the expression collapses to exactly the night's low.
    const g = Math.exp(-Math.pow((i - dipAt) / 6, 2));
    const spo2 = values.spo2_min * g + (95.6 + wobble(40 + i, daysAgo) * 1.1) * (1 - g);
    stmts.push({
      sql: 'INSERT INTO wearable_samples (id, patient_id, metric, sampled_at, value) VALUES (?, ?, ?, ?, ?)',
      args: [`ws-${++sample}`, PATIENT.id, 'oxygen-saturation', at, step(spo2, 0.1)],
    });
  }
}

// THE CONNECTION ROW — no credentials, and see hazard 2b at the top of this file
// for why one row here is not the hazard the other two connection tables are.
// `status: 'active'` is what makes the dashboard block and the settings panel
// read "connected"; `last_sync_at` is this morning, so nothing on screen claims
// a sync that never happened, and `sync_started_at` stays NULL because that is
// the claim column and no run is in flight.
stmts.push({
  sql: `INSERT INTO wearable_connections
    (id, patient_id, provider, google_account_email, access_token, refresh_token,
     token_expires_at, scope, status, last_sync_at, sync_started_at, last_error,
     connected_by, created_at)
    VALUES (?, ?, 'google_health', ?, NULL, NULL, NULL, NULL, 'active', ?, NULL, NULL, ?, ?)`,
  args: [
    'wconn-demo',
    PATIENT.id,
    'demo@crystalprism.io',
    secs(0),
    USER.id,
    // The day the watch was connected, one night before the first reading.
    secs(NIGHTS + 1),
  ],
});

// Chunked rather than one call: a single batch of ~6,400 statements is one
// enormous request for libsql to hold in memory, and the chunks are independent
// inserts into tables this script emptied at the top, so a torn run is a rerun
// rather than a repair.
for (let i = 0; i < stmts.length; i += 500) {
  await db.batch(stmts.slice(i, i + 500), 'write');
}

for (const t of ['observations', 'medications', 'care_team', 'appointments', 'wearable_samples']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t}: ${rows[0].n}`);
}
// UNCHANGED, AND NOT TO BE MERGED WITH THE CHECK BELOW. These two tables are the
// ones whose mere existence fires a network sync on a page render, and this loop
// is the assertion that they are empty. `wearable_connections` was in this list
// and has been taken out of it deliberately — see hazard 2b at the top — which
// is precisely why it now gets its own check with its own message rather than a
// relaxed shared one that would quietly cover all three again.
for (const t of ['fhir_connections', 'calendar_connections']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  const n = Number(rows[0].n);
  if (n !== 0) throw new Error(`${t} must be empty to keep the demo offline, found ${n}`);
  console.log(`  ${t}: 0 (offline guard OK)`);
}
// EXACTLY ONE, both ways. Zero is the empty wearable screen this seed exists to
// fix; more than one means the unique (patient, provider) index has been worked
// around and a second, unaccounted-for connection is in the demo.
{
  const { rows } = await db.execute('SELECT COUNT(*) AS n FROM wearable_connections');
  const n = Number(rows[0].n);
  if (n !== 1) throw new Error(`wearable_connections must hold exactly 1 row, found ${n}`);
  const { rows: creds } = await db.execute(
    'SELECT COUNT(*) AS n FROM wearable_connections WHERE access_token IS NOT NULL OR refresh_token IS NOT NULL',
  );
  if (Number(creds[0].n) !== 0) throw new Error('a demo wearable connection must carry no credentials');
  console.log('  wearable_connections: 1 (no credentials)');
}
// The digest is the only way clinical values leave this app. Nobody is enrolled,
// and there is nothing unsent for it to pick up.
{
  const { rows } = await db.execute('SELECT COUNT(*) AS n FROM wearable_deviations');
  if (Number(rows[0].n) !== 0) throw new Error('wearable_deviations must be empty — a stored row is an outbound email');
  const { rows: optIn } = await db.execute(
    'SELECT COUNT(*) AS n FROM patient_members WHERE wearable_digest_opt_in <> 0',
  );
  if (Number(optIn[0].n) !== 0) throw new Error('nobody may be opted into the wearable digest in a demo');
  console.log('  wearable_deviations: 0, digest opt-ins: 0 (no mail guard OK)');
}
console.log(`seeded ${url}`);
