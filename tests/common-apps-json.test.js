// common.js's fleet menu reads /apps.json (same-origin on every host) and
// falls back to its own FLEET_FALLBACK copy when that fetch fails, stalls or
// answers something that is not an app list. Drives the real common.js +
// fleet-menu.js on canvashare.crystalprism.io in headless Chromium.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const HOSTED = [
  { key: 'canvashare', name: 'CanvaShare', url: 'https://canvashare.crystalprism.io/', icon: 'https://crystalprism.io/images/canvashare-icon.png', tagline: 't', status: 'live' },
  { key: 'newapp', name: 'Brand New', url: 'https://newapp.crystalprism.io/', icon: 'https://crystalprism.io/images/newapp-icon.png', tagline: 't', status: 'live' },
  { key: 'secret', name: 'Secret', url: 'https://secret.crystalprism.io/', icon: 'https://crystalprism.io/images/secret-icon.png', tagline: 't', status: 'hidden' },
];
let browser;

test.before(async () => { browser = await chromium.launch(); });
test.after(async () => { await browser.close(); });

// `appsJson` answers /apps.json: a fulfill object, or 'hang' (never answers)
async function open(appsJson) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.origin === 'https://api.crystalprism.io') return route.fulfill({ status: 401, body: '' });
    if (u.pathname === '/apps.json') {
      if (appsJson === 'hang') return;
      return route.fulfill(appsJson);
    }
    if (u.hostname === 'canvashare.crystalprism.io') {
      let file = path.join(root, 'canvashare', u.pathname);
      if (!fs.existsSync(file)) file = path.join(root, u.pathname);
      if (fs.statSync(file, { throwIfNoEntry: false })?.isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ contentType: types[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
    }
    return route.abort();
  });
  await page.goto('https://canvashare.crystalprism.io/');
  await page.waitForSelector('.fleet-trigger');
  return { page, errors };
}

async function appNames(page) {
  await page.click('.fleet-trigger');
  const names = await page.$$eval('.fleet-app', (as) => as.map((a) => a.textContent));
  await page.keyboard.press('Escape');
  return names;
}

const FALLBACK_NAMES = ['Methods', 'GiftMe', 'Passage', 'Restock', 'Nexus', 'Space', 'Savor',
  'i dream of neon', 'Vantage', 'Vitals', 'Tide', 'flare', 'Glimpse', 'Menagerie', 'Toile',
  'Timespace', 'Shapes In Rain', 'Rhythm of Life', 'CanvaShare', 'Thought Writer', 'Vicarious',
  'Hacker News Stats', 'Pause', 'Marian', 'Vroom'];

test('the fallback copy lists every live app in apps.json, in order', () => {
  const live = JSON.parse(fs.readFileSync(path.join(root, 'apps.json'), 'utf8'))
    .filter((a) => a.status === 'live').map((a) => a.name);
  assert.deepStrictEqual(FALLBACK_NAMES, live);
});

test('the menu shows the fetched live apps, hidden ones skipped', async () => {
  const { page, errors } = await open({ contentType: 'application/json', body: JSON.stringify(HOSTED) });
  await page.waitForTimeout(300);
  assert.deepStrictEqual(await appNames(page), ['CanvaShare', 'Brand New']);
  assert.deepStrictEqual(errors, []);
  await page.close();
});

for (const [name, answer] of [
  ['a 500', { status: 500, body: '' }],
  ['bad JSON', { contentType: 'application/json', body: '<html>not json' }],
  ['a non-list', { contentType: 'application/json', body: '{"apps":[]}' }],
  ['an empty list', { contentType: 'application/json', body: '[]' }],
]) {
  test(`on ${name} the menu shows the fallback list`, async () => {
    const { page, errors } = await open(answer);
    await page.waitForTimeout(300);
    assert.deepStrictEqual(await appNames(page), FALLBACK_NAMES);
    assert.deepStrictEqual(errors, []);
    await page.close();
  });
}

test('on a stalled fetch the fallback shows at once and stays after the 3s timeout', async () => {
  const { page, errors } = await open('hang');
  assert.deepStrictEqual(await appNames(page), FALLBACK_NAMES);
  await page.waitForTimeout(3300);
  assert.deepStrictEqual(await appNames(page), FALLBACK_NAMES);
  assert.deepStrictEqual(errors, []);
  await page.close();
});
