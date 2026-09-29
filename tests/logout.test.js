// Drives the REAL sign-in page, common.js and user/main.js in headless
// Chromium with the API mocked: a sign-out the server never confirmed must
// leave the visitor signed in and say so.
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

// Open the sign-in page after the header's Sign Out link, with `logout`
// answering /api/logout: a status code, or 'abort' for a network error.
// `session` is whether the cookie is still valid after that answer.
async function signOut({ logout, session, username = 'esther' }) {
  const page = await browser.newPage();
  const calls = [];
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
      calls.push(endpoint);
      if (endpoint === '/logout') {
        return logout === 'abort' ? route.abort() : route.fulfill({ status: logout, body: '' });
      }
      if (endpoint === '/user/verify') {
        return session
          ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username }) })
          : route.fulfill({ status: 401, body: '' });
      }
      if (endpoint === '/ping') return route.fulfill({ status: 200, body: 'Success' });
      return route.fulfill({ status: 401, body: '' });
    }
    return route.abort();
  });

  // What the header's Sign Out link leaves behind before navigating here
  await page.goto(SITE + '/robots.txt');
  await page.evaluate((u) => {
    if (u) localStorage.setItem('username', u);
    sessionStorage.setItem('account-request', 'logout');
  }, username);

  await page.goto(SITE + '/user/sign-in/');
  await page.waitForFunction(() => ['Sign In', 'Sign Out']
    .includes(document.querySelector('#sign-in-link')?.textContent));
  // Let a redirect to My Account start, if one is coming
  await page.waitForTimeout(200);

  const state = await page.evaluate(() => ({
    path: location.pathname,
    signedOut: getComputedStyle(document.getElementById('logout')).display,
    failed: getComputedStyle(document.getElementById('logout-failed')).display,
    username: localStorage.getItem('username'),
    menu: document.querySelector('#sign-in-link').textContent,
    request: sessionStorage.getItem('account-request'),
  }));
  await page.close();
  return { ...state, calls };
}

test('a confirmed sign-out clears the username and says so', async () => {
  const s = await signOut({ logout: 200, session: false });
  assert.strictEqual(s.signedOut, 'block');
  assert.strictEqual(s.failed, 'none');
  assert.strictEqual(s.username, null);
  assert.strictEqual(s.menu, 'Sign In');
  assert.strictEqual(s.request, null);
});

test('a network error keeps the visitor signed in and warns them', async () => {
  const s = await signOut({ logout: 'abort', session: true });
  assert.strictEqual(s.failed, 'block');
  assert.strictEqual(s.signedOut, 'none');
  assert.strictEqual(s.username, 'esther');
  assert.strictEqual(s.menu, 'Sign Out');
  // Stays put so the warning is read, rather than bouncing to My Account
  assert.strictEqual(s.path, '/user/sign-in/');
  assert.strictEqual(s.request, null);
});

test('a server error keeps the visitor signed in and warns them', async () => {
  const s = await signOut({ logout: 500, session: true });
  assert.strictEqual(s.failed, 'block');
  assert.strictEqual(s.username, 'esther');
  assert.strictEqual(s.menu, 'Sign Out');
  assert.strictEqual(s.path, '/user/sign-in/');
});

test('the session check waits for the logout to settle', async () => {
  const s = await signOut({ logout: 200, session: false });
  assert.ok(s.calls.indexOf('/logout') >= 0);
  assert.ok(!s.calls.includes('/user/verify') ||
    s.calls.indexOf('/logout') < s.calls.indexOf('/user/verify'));
});

test('a failed request after the session was already rejected still reads as signed out', async () => {
  // My Account's 401 path removes the username before sending the visitor here
  const s = await signOut({ logout: 'abort', session: false, username: null });
  assert.strictEqual(s.signedOut, 'block');
  assert.strictEqual(s.failed, 'none');
});
