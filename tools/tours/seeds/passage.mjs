// Seeds a throwaway demo DB for passage with three invented trips.
//
// SAFETY: passage's .env.local DATABASE_URL is the PRODUCTION Turso database,
// and its real trips are Esther's own travel record, with companions' emails.
// This script hard-refuses anything but a local file: URL, and every trip,
// lodging, confirmation code and photo below is invented. The places are
// public landmarks; who went, when, where they slept and what they did is not
// anyone's real itinerary.
//
// PHOTOS are drawings rendered here with Chromium, never photographs. They are
// written to <PASSAGE_APP_DIR>/public/uploads/demo/ and stored as
// "/uploads/demo/<file>.jpg" — passage's own dev fallback (lib/storage.ts):
// with R2_ACCOUNT_ID unset, `viewUrl` returns a "/uploads/..." value unchanged
// and Next serves it from public/. Files must exist BEFORE `next build`: a
// production server only serves what was in public/ at build time.
//
// PASSAGE_APP_DIR is required and has no default on purpose. launchd's
// com.esther.passage-web serves ~/Developer/passage/.next on :4700, so the demo
// build happens in a COPY (see README.md), and the drawings belong in that copy.
//
//   DATABASE_URL=file:/abs/demo.db PASSAGE_APP_DIR=/abs/copy node seeds/passage.mjs

import { createClient } from '@libsql/client';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: DATABASE_URL must be a file: URL, got ${url}`);
}
const appDir = process.env.PASSAGE_APP_DIR;
if (!appDir) throw new Error('PASSAGE_APP_DIR must name the passage copy the demo server is built from');

const db = createClient({ url });

const USER = { id: 'demo-user-passage', email: 'demo@crystalprism.io', name: 'Demo' };

// Every date is relative to today, so Lisbon is always a finished trip with
// its record kept and Kyoto is always one still being planned.
const DAY = 86400000;
const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
const isoDate = (offsetDays) => new Date(today + offsetDays * DAY).toISOString().slice(0, 10);
const at = (offsetDays, hhmm) => `${isoDate(offsetDays)}T${hhmm}`;
const ms = (offsetDays, hhmm) => Date.parse(`${at(offsetDays, hhmm)}:00Z`);

// ---------------------------------------------------------------------------
// The drawings. Flat poster scenes, nothing that could pass for a photograph.
// ---------------------------------------------------------------------------
const W = 1200;
const H = 900;
const scene = (body, sky = ['#fde2c4', '#f6b38a']) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>${body}
</svg>`;

const DRAWINGS = {
  // A yellow tram climbing a hill street.
  'tram': scene(`
    <circle cx="930" cy="200" r="90" fill="#fff4d6"/>
    <path d="M0 520 L1200 330 L1200 900 L0 900Z" fill="#c9b8a4"/>
    <path d="M0 610 L1200 420 L1200 460 L0 650Z" fill="#8f7f6e"/>
    <g transform="translate(360 330) rotate(-9)">
      <rect width="440" height="230" rx="26" fill="#f2c230"/>
      <rect y="150" width="440" height="80" rx="10" fill="#e0e0d8"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="${30 + i * 102}" y="34" width="80" height="86" rx="8" fill="#5b7a94"/>`).join('')}
      <circle cx="90" cy="248" r="28" fill="#3b3631"/><circle cx="350" cy="248" r="28" fill="#3b3631"/>
      <line x1="220" y1="0" x2="250" y2="-150" stroke="#3b3631" stroke-width="7"/>
    </g>
    <line x1="0" y1="140" x2="1200" y2="-40" stroke="#3b3631" stroke-width="4"/>
    <rect x="0" y="380" width="170" height="520" fill="#e88f6b"/>
    <rect x="1010" y="250" width="190" height="650" fill="#7fb3a6"/>`),
  // A river-mouth tower at sunset.
  'tower': scene(`
    <circle cx="300" cy="520" r="150" fill="#ffd27a"/>
    <rect y="560" width="${W}" height="340" fill="#3f6f8f"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${140 + i * 60}" y="${600 + i * 40}" width="${300 - i * 30}" height="8" rx="4" fill="#ffd27a" opacity="0.55"/>`).join('')}
    <g fill="#5a4a5e">
      <rect x="720" y="300" width="160" height="300"/>
      <rect x="760" y="210" width="80" height="100"/>
      <path d="M752 210 L800 150 L848 210Z"/>
      <rect x="650" y="480" width="300" height="120"/>
    </g>`, ['#f7a072', '#e85d75']),
  // Blue-and-white tiles on a facade.
  'azulejo': scene(`
    ${Array.from({ length: 6 * 8 }, (_, k) => {
      const x = (k % 8) * 150, y = Math.floor(k / 8) * 150;
      return `<g transform="translate(${x} ${y})"><rect width="150" height="150" fill="#f4f1ea" stroke="#d8d2c4" stroke-width="3"/>
        <circle cx="75" cy="75" r="40" fill="none" stroke="#2f5d9e" stroke-width="10"/>
        <path d="M75 10 L90 60 L140 75 L90 90 L75 140 L60 90 L10 75 L60 60Z" fill="#2f5d9e" opacity="0.85"/>
        <circle cx="75" cy="75" r="12" fill="#e7b33c"/></g>`;
    }).join('')}`, ['#f4f1ea', '#f4f1ea']),
  // A hilltop palace in yellow and red over green hills.
  'palace': scene(`
    <path d="M0 640 Q300 470 600 560 T1200 520 L1200 900 L0 900Z" fill="#6f9a62"/>
    <path d="M0 760 Q400 640 800 720 T1200 700 L1200 900 L0 900Z" fill="#4f7a4a"/>
    <rect x="430" y="330" width="200" height="220" fill="#e9b949"/>
    <rect x="630" y="390" width="190" height="160" fill="#c8553d"/>
    <circle cx="530" cy="320" r="62" fill="#c8553d"/>
    <rect x="700" y="290" width="60" height="110" fill="#e9b949"/>
    <path d="M690 290 L730 230 L770 290Z" fill="#2f5d9e"/>
    ${[0, 1, 2].map((i) => `<rect x="${460 + i * 55}" y="420" width="30" height="50" rx="15" fill="#5a4a5e"/>`).join('')}`, ['#cfe3ef', '#f3e6d0']),
  // Terracotta rooftops down to the water.
  'rooftops': scene(`
    <rect y="300" width="${W}" height="140" fill="#7fb7c9"/>
    ${Array.from({ length: 18 }, (_, i) => {
      const x = (i % 6) * 210 - 40 + (Math.floor(i / 6) % 2) * 90, y = 400 + Math.floor(i / 6) * 170;
      const wall = ['#f6efe2', '#f3d9b1', '#e8c5c0', '#d9e4d2'][i % 4];
      return `<g transform="translate(${x} ${y})"><rect width="190" height="190" fill="${wall}"/>
        <path d="M-12 0 L95 -70 L202 0Z" fill="#c8673f"/>
        <rect x="30" y="50" width="34" height="50" fill="#5b7a94"/><rect x="120" y="50" width="34" height="50" fill="#5b7a94"/></g>`;
    }).join('')}`, ['#bfe0ee', '#f7e8cf']),
  // Ochre sea cliffs and a beach.
  'cliffs': scene(`
    <rect y="470" width="${W}" height="430" fill="#3e8fa8"/>
    <path d="M0 900 L0 640 Q200 600 380 680 L520 900Z" fill="#f2deb0"/>
    <path d="M700 900 L760 420 Q830 330 930 360 L1000 300 Q1100 260 1200 300 L1200 900Z" fill="#d68a4c"/>
    <path d="M840 900 L880 560 Q900 500 960 520 L1000 900Z" fill="#b8693a"/>
    <path d="M560 560 Q600 470 660 520 L680 640 L560 640Z" fill="#d68a4c"/>
    ${[0, 1, 2].map((i) => `<path d="M${60 + i * 160} ${560 + i * 30} q40 -14 80 0" stroke="#ffffff" stroke-width="6" fill="none" opacity="0.7"/>`).join('')}`, ['#a9d8ea', '#f5e9d3']),
  // A waterfall over dark basalt.
  'waterfall': scene(`
    <path d="M0 260 L1200 220 L1200 900 L0 900Z" fill="#3f4a45"/>
    <rect x="520" y="240" width="170" height="560" fill="#e9f3f5"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${540 + i * 38}" y="250" width="10" height="540" fill="#bcd6dc"/>`).join('')}
    <ellipse cx="605" cy="800" rx="300" ry="70" fill="#dfeef1"/>
    <path d="M0 260 Q300 200 600 250 T1200 220 L1200 280 L0 320Z" fill="#7c9a6e"/>`, ['#c9d6dc', '#e9eef0']),
  // A black-sand beach with sea stacks.
  'blacksand': scene(`
    <rect y="460" width="${W}" height="200" fill="#5e7f8f"/>
    <path d="M0 640 Q600 600 1200 650 L1200 900 L0 900Z" fill="#26292b"/>
    <path d="M0 640 Q600 600 1200 650" stroke="#f1f4f4" stroke-width="10" fill="none"/>
    <path d="M820 470 L850 260 L890 250 L920 470Z" fill="#34383a"/>
    <path d="M950 470 L975 330 L1005 320 L1030 470Z" fill="#34383a"/>`, ['#b9c7cf', '#e3e7e6']),
};

const outDir = path.join(appDir, 'public', 'uploads', 'demo');
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const full = await browser.newPage({ viewport: { width: W, height: H } });
const thumb = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 0.4 });
for (const [name, svg] of Object.entries(DRAWINGS)) {
  const html = `<html><body style="margin:0">${svg}</body></html>`;
  await full.setContent(html);
  await full.screenshot({ path: path.join(outDir, `${name}.jpg`), type: 'jpeg', quality: 85 });
  await thumb.setContent(html);
  await thumb.screenshot({ path: path.join(outDir, `${name}-thumb.jpg`), type: 'jpeg', quality: 82 });
}
await browser.close();

// ---------------------------------------------------------------------------
// The trips.
// ---------------------------------------------------------------------------
const TRIPS = [
  {
    id: 'trip-lisbon', name: 'Lisbon & Sintra', destination: 'Lisbon, Portugal',
    lat: 38.7223, lng: -9.1393, country: 'PT', start: -42, nights: 5, created: -120,
    notes: 'Tiles, trams and custard tarts. Sintra on the one cloudy day.',
    days: [
      { label: 'Arrival & Alfama', acts: [
        ['10:30', '12:00', 'Check in and wander Alfama', 'Miradouro de Santa Luzia', 38.7118, -9.1302],
        ['13:00', '14:30', 'Lunch at the market', 'Time Out Market', 38.7071, -9.1458],
        ['17:30', '19:00', 'Sunset at the castle', 'Castelo de S. Jorge', 38.7139, -9.1335],
      ], photos: [['tram', '11:20', 38.7112, -9.1310, 'Tram 28 on the hill'], ['azulejo', '18:05', 38.7135, -9.1330, null]] },
      { label: 'Belém', acts: [
        ['09:30', '11:30', 'Jerónimos Monastery', 'Mosteiro dos Jerónimos', 38.6979, -9.2068],
        ['11:45', '12:15', 'Pastéis de nata, still warm', 'Rua de Belém', 38.6975, -9.2032],
        ['18:30', '20:00', 'Golden hour at the tower', 'Torre de Belém', 38.6916, -9.2160],
      ], photos: [['tower', '19:35', 38.6920, -9.2150, 'Belém at golden hour']] },
      { label: 'Day trip to Sintra', acts: [
        ['08:40', '09:20', 'Train from Rossio', 'Estação do Rossio', 38.7142, -9.1410],
        ['10:00', '13:00', 'Pena Palace and the park', 'Palácio da Pena', 38.7876, -9.3906],
        ['14:30', '16:30', 'Quinta da Regaleira', 'Quinta da Regaleira', 38.7963, -9.3961],
      ], photos: [['palace', '11:15', 38.7880, -9.3900, 'Pena in the fog, then not']] },
      { label: 'Cascais & the coast', acts: [
        ['10:00', '13:00', 'Beach morning', 'Praia da Rainha', 38.6967, -9.4196],
        ['15:00', '16:00', 'Boca do Inferno', 'Boca do Inferno', 38.6914, -9.4318],
      ], photos: [['cliffs', '15:20', 38.6916, -9.4310, null]] },
      { label: 'Last day', acts: [
        ['10:00', '12:00', 'LX Factory bookshop', 'LX Factory', 38.7034, -9.1784],
        ['13:00', '14:00', 'Praça do Comércio', 'Praça do Comércio', 38.7075, -9.1364],
      ], photos: [['rooftops', '12:40', 38.7090, -9.1400, 'Rooftops from the viewpoint']] },
    ],
    lodging: { name: 'Pensão Azulejo Azul', address: 'Rua dos Remédios, Alfama, Lisbon', lat: 38.7115, lng: -9.1288 },
    transport: [
      ['flight', 'New York (JFK)', 'Lisbon (LIS)', [-1, '19:05'], [0, '07:10'], 'TAP Air Portugal', 'QXR7LM'],
      ['train', 'Lisbon Rossio', 'Sintra', [2, '08:41'], [2, '09:20'], 'CP Urban', null],
      ['flight', 'Lisbon (LIS)', 'New York (JFK)', [5, '11:40'], [5, '14:25'], 'TAP Air Portugal', 'QXR7LM'],
    ],
    weather: [[27, 18, 0], [28, 19, 1], [22, 16, 3], [25, 18, 1], [26, 17, 0]],
  },
  {
    id: 'trip-kyoto', name: 'Kyoto in the fall', destination: 'Kyoto, Japan',
    lat: 35.0116, lng: 135.7681, country: 'JP', start: 23, nights: 4, created: -20,
    notes: 'Maples should be turning. Book the tea ceremony early.',
    days: [
      { label: 'Higashiyama', acts: [
        ['09:00', '11:00', 'Kiyomizu-dera', 'Kiyomizu-dera', 34.9949, 135.7850],
        ['11:30', '13:00', 'Sannenzaka & Ninenzaka', 'Sannenzaka', 34.9963, 135.7808],
        ['16:00', '17:30', 'Yasaka Shrine at dusk', 'Yasaka Shrine', 35.0037, 135.7785],
      ] },
      { label: 'Fushimi Inari', acts: [
        ['07:00', '10:00', 'Climb the torii gates early', 'Fushimi Inari Taisha', 34.9671, 135.7727],
        ['12:30', '14:00', 'Nishiki Market lunch', 'Nishiki Market', 35.0050, 135.7649],
      ] },
      { label: 'Arashiyama', acts: [
        ['08:00', '09:30', 'Bamboo grove', 'Arashiyama Bamboo Grove', 35.0170, 135.6713],
        ['10:00', '11:30', 'Tenryū-ji gardens', 'Tenryū-ji', 35.0156, 135.6738],
      ] },
      { label: 'Golden Pavilion', acts: [
        ['09:00', '10:30', 'Kinkaku-ji', 'Kinkaku-ji', 35.0394, 135.7292],
        ['14:00', '15:30', 'Tea ceremony', 'Gion', 35.0036, 135.7750],
      ] },
    ],
    lodging: { name: 'Machiya Hanare', address: 'Higashiyama, Kyoto', lat: 34.9990, lng: 135.7790 },
    transport: [
      ['flight', 'New York (JFK)', 'Osaka (KIX)', [-1, '13:30'], [0, '17:05'], 'Japan Airlines', 'JL6K2P'],
      ['train', 'Kansai Airport', 'Kyoto', [0, '18:16'], [0, '19:31'], 'Haruka Express', null],
    ],
  },
  {
    id: 'trip-iceland', name: 'Iceland, south coast', destination: 'Vík, Iceland',
    lat: 63.4186, lng: -19.0060, country: 'IS', start: -480, nights: 2, created: -540,
    notes: 'Rental car, rain jackets, waterfalls every twenty minutes.',
    days: [
      { label: 'Waterfalls', acts: [
        ['10:00', '11:00', 'Seljalandsfoss', 'Seljalandsfoss', 63.6156, -19.9886],
        ['12:30', '13:30', 'Skógafoss', 'Skógafoss', 63.5321, -19.5114],
      ], photos: [['waterfall', '12:50', 63.5325, -19.5120, null]] },
      { label: 'Black sand', acts: [
        ['09:30', '11:30', 'Reynisfjara', 'Reynisfjara', 63.4044, -19.0447],
      ], photos: [['blacksand', '10:10', 63.4050, -19.0440, 'Basalt and surf']] },
    ],
    lodging: { name: 'Guesthouse Lundi', address: 'Vík í Mýrdal', lat: 63.4194, lng: -19.0090 },
    transport: [['car', 'Reykjavík', 'Vík', [0, '08:00'], [0, '12:00'], 'Rental car', null]],
    weather: [[11, 6, 61], [12, 7, 3]],
  },
];

const stmts = [];
const run = (sql, args = []) => stmts.push({ sql, args });

// Children first; trip/user cascades would cover most, but explicit is honest.
for (const t of ['photo', 'activity', 'day', 'lodging', 'transport', 'dayWeather', 'tripMember', 'countryVisit', 'trip', 'user']) {
  run(`DELETE FROM "${t}"`);
}

run('INSERT INTO "user" (id, name, email) VALUES (?, ?, ?)', [USER.id, USER.name, USER.email]);

for (const t of TRIPS) {
  const end = t.start + t.nights;
  run(
    `INSERT INTO trip (id, name, destination, startDate, endDate, kind, notes, destinationLat, destinationLng,
       destinationCountry, geocodedAt, ownerId, createdAt)
     VALUES (?, ?, ?, ?, ?, 'trip', ?, ?, ?, ?, ?, ?, ?)`,
    [t.id, t.name, t.destination, isoDate(t.start), isoDate(end), t.notes, t.lat, t.lng, t.country,
      ms(t.created, '12:00'), USER.id, ms(t.created, '12:00')],
  );
  run(
    `INSERT INTO tripMember (id, tripId, userId, email, role, invitedAt, acceptedAt)
     VALUES (?, ?, ?, ?, 'owner', ?, ?)`,
    [`${t.id}-owner`, t.id, USER.id, USER.email, ms(t.created, '12:00'), ms(t.created, '12:00')],
  );

  t.days.forEach((d, i) => {
    const dayId = `${t.id}-day-${i + 1}`;
    run('INSERT INTO day (id, tripId, date, label, sortOrder) VALUES (?, ?, ?, ?, ?)',
      [dayId, t.id, isoDate(t.start + i), d.label, i]);
    d.acts.forEach(([s, e, title, place, lat, lng], k) => {
      run(
        `INSERT INTO activity (id, tripId, dayId, title, startTime, endTime, placeName, lat, lng, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`${dayId}-act-${k + 1}`, t.id, dayId, title, s, e, place, lat, lng, k],
      );
    });
    (d.photos ?? []).forEach(([file, hhmm, lat, lng, caption], k) => {
      run(
        `INSERT INTO photo (id, tripId, dayId, url, thumbUrl, takenAt, lat, lng, caption, uploadedById, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`${dayId}-photo-${k + 1}`, t.id, dayId, `/uploads/demo/${file}.jpg`, `/uploads/demo/${file}-thumb.jpg`,
          ms(t.start + i, hhmm), lat, lng, caption, USER.id, ms(t.start + i, '23:00')],
      );
    });
    const w = t.weather?.[i];
    if (w) {
      run(
        `INSERT INTO dayWeather (id, tripId, date, source, tempHighC, tempLowC, weatherCode, lat, lng, fetchedAt)
         VALUES (?, ?, ?, 'observed', ?, ?, ?, ?, ?, ?)`,
        [`${dayId}-wx`, t.id, isoDate(t.start + i), w[0], w[1], w[2], t.lat, t.lng, ms(t.start + i, '23:30')],
      );
    }
  });

  const l = t.lodging;
  run(
    `INSERT INTO lodging (id, tripId, name, address, checkIn, checkOut, checkInTime, checkOutTime, placeName, lat, lng, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?, '15:00', '11:00', ?, ?, ?, 0)`,
    [`${t.id}-stay`, t.id, l.name, l.address, isoDate(t.start), isoDate(end), l.name, l.lat, l.lng],
  );

  t.transport.forEach(([type, from, to, [dOff, dT], [aOff, aT], carrier, conf], k) => {
    run(
      `INSERT INTO transport (id, tripId, type, fromLabel, toLabel, departAt, arriveAt, carrier, confirmation, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`${t.id}-leg-${k + 1}`, t.id, type, from, to, at(t.start + dOff, dT), at(t.start + aOff, aT), carrier, conf, k],
    );
  });
}

// A few earlier countries, so the world map on the home page is not three dots.
for (const [code, offset] of [['FR', -900], ['IT', -760], ['MX', -620], ['CA', -300]]) {
  run('INSERT INTO countryVisit (id, userId, countryCode, startDate, createdAt) VALUES (?, ?, ?, ?, ?)',
    [`visit-${code}`, USER.id, code, isoDate(offset), ms(offset, '12:00')]);
}

await db.batch(stmts, 'write');

for (const t of ['trip', 'day', 'activity', 'photo', 'lodging', 'transport', 'countryVisit']) {
  const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
  console.log(`  ${t}: ${rows[0].n}`);
}
const { rows: stray } = await db.execute(`SELECT COUNT(*) AS n FROM photo WHERE url NOT LIKE '/uploads/demo/%'`);
if (Number(stray[0].n) !== 0) throw new Error('a photo row points somewhere other than the local drawings');
console.log(`seeded ${url}; drawings in ${outDir}`);
