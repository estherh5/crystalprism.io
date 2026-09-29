// Drives the REAL profile page, common.js and user/main.js in headless
// Chromium with the API mocked: a profile loaded once must still show its
// owner's name on a later visit made while the API is unreachable, which
// only works if user/main.js#loadPersonalInfo writes the same localStorage
// key it reads.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const SITE = 'http://site.test';
const API = 'http://localhost:5000/api';
let browser;

test.before(async () => { browser = await chromium.launch(); });
test.after(async () => { await browser.close(); });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };

// Visit alice's profile with the API either answering or unreachable
async function visitProfile(context, { online }) {
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.addInitScript(() => {
    window.$ = () => ({ tooltip() {}, modal() {}, on() {} });
    window.moment = () => ({ format: () => '01/01/2020' });
  });
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(SITE)) {
      let file = path.join(root, new URL(url).pathname);
      if (file.endsWith('/')) file += 'index.html';
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({
        contentType: types[path.extname(file)] || 'application/octet-stream',
        body: fs.readFileSync(file),
      });
    }
    if (url.startsWith(API) && online) {
      if (url === API + '/user/alice') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            username: 'alice', about: 'Hello', first_name: '', last_name: '', email: '',
            background_color: '#ffffff', icon_color: '#000000', created: '2020-01-01',
            shapes_high_score: 0, rhythm_high_score: 0,
          }),
        });
      }
      return route.fulfill({ status: 401, body: '' });
    }
    return route.abort();
  });
  await page.goto(SITE + '/user/?username=alice');
  return page;
}

test('a profile loaded once is shown from cache when the API is down', async () => {
  const context = await browser.newContext();
  const first = await visitProfile(context, { online: true });
  await first.waitForFunction(() => localStorage.getItem('alice-profile') !== null);
  await first.close();

  const second = await visitProfile(context, { online: false });
  await second.waitForFunction(
    () => document.getElementById('profile-title').textContent !== '');
  assert.strictEqual(await second.textContent('#profile-title'), 'alice');
  assert.strictEqual(await second.textContent('#about-blurb'), 'Hello');
  // The failed fetch must not also reach the success handler
  await second.waitForTimeout(500);
  assert.deepStrictEqual(second.errors, []);
  await context.close();
});
