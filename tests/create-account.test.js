// Drives the REAL create-account page, common.js and its main.js in headless
// Chromium with the API mocked: once POST /user has created the account,
// every answer from the sign-in that follows must move the visitor on, never
// leave the Create button disabled. The page only stays up (rather than
// redirecting to auth.crystalprism.io) right after an account deletion, which
// is the one way a visitor reaches this form now.
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

// Create an account, with `login` answering the sign-in that follows: a
// status code, or 'abort' for a network error
async function createAccount({ login }) {
  const page = await browser.newPage();
  const dialogs = [];
  const visited = [];
  page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
  page.on('request', (r) => {
    if (r.isNavigationRequest()) visited.push(new URL(r.url()).pathname);
  });
  // jQuery and Bootstrap come from a CDN, which the route below refuses
  await page.addInitScript(() => {
    window.$ = () => ({ tooltip() {}, modal() {}, on() {} });
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
    if (url.startsWith(API)) {
      const endpoint = url.slice(API.length);
      if (endpoint === '/user') return route.fulfill({ status: 201, body: '' });
      if (endpoint === '/login') {
        return login === 'abort' ? route.abort() : route.fulfill({ status: login, body: '' });
      }
      if (endpoint === '/ping') return route.fulfill({ status: 200, body: 'Success' });
      return route.fulfill({ status: 401, body: '' });
    }
    return route.abort();
  });

  // What My Account's Delete leaves behind before navigating here
  await page.goto(SITE + '/robots.txt');
  await page.evaluate(() => sessionStorage.setItem('account-request', 'delete'));
  await page.goto(SITE + '/user/create-account/');
  visited.length = 0;
  await page.fill('#username-input', 'newuser');
  await page.fill('#password-input', 'longenough');
  await page.fill('#confirm-password-input', 'longenough');
  await page.click('#submit');

  // Wait for the page to leave, or give up and report that it is stuck
  await page.waitForEvent('request', { predicate: (r) => r.isNavigationRequest(), timeout: 3000 })
    .catch(() => {});
  const state = {
    path: visited[0],
    dialogs,
    submitDisabled: visited.length ? null : await page.$eval('#submit', (b) => b.disabled),
  };
  await page.close();
  return state;
}

test('a signed-in new account lands on My Account', async () => {
  const s = await createAccount({ login: 200 });
  assert.strictEqual(s.path, '/user/my-account/');
  assert.deepStrictEqual(s.dialogs, []);
});

test('a throttled sign-in sends the new account to Sign In', async () => {
  const s = await createAccount({ login: 429 });
  assert.strictEqual(s.path, '/user/sign-in/');
  assert.deepStrictEqual(s.dialogs, ['Too many attempts. Try again later.']);
});

for (const login of [500, 401, 'abort']) {
  test(`a sign-in answering ${login} sends the new account to Sign In`, async () => {
    const s = await createAccount({ login });
    assert.strictEqual(s.path, '/user/sign-in/');
    assert.deepStrictEqual(s.dialogs,
      ['Your account was created, but signing in did not go through. Please sign in.']);
  });
}
