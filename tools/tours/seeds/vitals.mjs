// Seeds a throwaway demo DB for vitals with an invented patient.
//
// SAFETY — three separate hazards, all handled here:
//
// 1. PHI. vitals holds real health records. This script hard-refuses to run
//    against anything but a local file: URL, and it must never be pointed at
//    `dev.db` at the repo root: prior sessions restored a real dump into that
//    file. The demo lives in its own `demo.db`.
//
// 2. Epic. Two pages auto-fire a real sync on mount if a connection row exists:
//    labs/page.tsx gates `autoSyncHealthRecords` on a row in `fhir_connections`,
//    and appointments/page.tsx gates `CalendarSyncBar autoSync` on a row in
//    `calendar_connections`. An Epic refresh ROTATES PRODUCTION TOKENS and kills
//    the live connection. So this seed writes ZERO rows into
//    `fhir_connections`, `calendar_connections` and `wearable_connections`.
//    With those tables empty, no page render reaches out to anything.
//
// 3. Provenance. Every seeded record is `source: "manual"`, so nothing claims to
//    have come from a health system, and no Epic-backed document exists for a
//    stray Download click to try to fetch.
//
// Everything below is fictional and deliberately unremarkable: routine values a
// family might track together, not a diagnosis.

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
const PATIENT = { id: 'demo-patient', name: 'Rosemary Whitlock', dob: '1952-03-14' };

const now = Date.now();
const day = 86400000;

// Every integer timestamp in this schema is declared `mode: "timestamp"`, which
// is Drizzle for epoch SECONDS, not milliseconds. Writing ms produces dates in
// the year ~57000 and the app dies with "RangeError: Invalid time value" inside
// lib/observations.ts. `date` columns are TEXT and take a yyyy-mm-dd string.
const secs = (daysAgo) => Math.floor((now - daysAgo * day) / 1000);
const dateStr = (daysAgo) => new Date(now - daysAgo * day).toISOString().slice(0, 10);

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

// Order matters: children before parents. The three connection tables are
// cleared and never repopulated — that is what keeps this recording offline.
for (const t of [
  'wearable_samples', 'wearable_deviations', 'wearable_connections',
  'fhir_connections', 'calendar_connections',
  'observations', 'medications', 'care_team', 'appointments', 'agenda_items',
  'notes', 'documents', 'recordings', 'patient_members', 'patients', 'users',
]) {
  stmts.push({ sql: `DELETE FROM ${t}`, args: [] });
}

stmts.push({
  sql: 'INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)',
  args: [USER.id, USER.email, USER.name, 'admin', secs(400)],
});

stmts.push({
  sql: 'INSERT INTO patients (id, name, dob, created_by, created_at) VALUES (?, ?, ?, ?, ?)',
  args: [PATIENT.id, PATIENT.name, PATIENT.dob, USER.id, secs(400)],
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

CARE_TEAM.forEach(([name, specialty, organization], i) => {
  stmts.push({
    sql: 'INSERT INTO care_team (id, patient_id, name, specialty, organization, phone, notes) VALUES (?, ?, ?, ?, ?, NULL, NULL)',
    args: [`ct-${i + 1}`, PATIENT.id, name, specialty, organization],
  });
});

// Wearable metrics come from `wearable_samples`, which is independent of
// `wearable_connections` — so the chart has data without anything to sync to.
const METRICS = [
  ['sleep_duration', 415, 55],
  ['resting_heart_rate', 58, 4],
  ['hrv_rmssd', 34, 7],
  ['respiratory_rate', 15, 1],
];
let sample = 0;
for (const [metric, base, spread] of METRICS) {
  for (let d = 45; d >= 0; d--) {
    // Deterministic wobble — no Math.random, so re-seeding is reproducible.
    const wobble = Math.sin(d / 3.1) * spread + Math.cos(d / 7.7) * (spread / 2);
    stmts.push({
      sql: 'INSERT INTO wearable_samples (id, patient_id, metric, sampled_at, value) VALUES (?, ?, ?, ?, ?)',
      args: [`ws-${++sample}`, PATIENT.id, metric, secs(d), Math.round((base + wobble) * 10) / 10],
    });
  }
}

await db.batch(stmts, 'write');

for (const t of ['observations', 'medications', 'care_team', 'appointments', 'wearable_samples']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t}: ${rows[0].n}`);
}
for (const t of ['fhir_connections', 'calendar_connections', 'wearable_connections']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  const n = Number(rows[0].n);
  if (n !== 0) throw new Error(`${t} must be empty to keep the demo offline, found ${n}`);
  console.log(`  ${t}: 0 (offline guard OK)`);
}
console.log(`seeded ${url}`);
