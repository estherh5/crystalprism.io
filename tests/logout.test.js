// Drives the REAL account menu, sign-in page and common.js in headless
// Chromium with the API mocked: Sign Out is a POST made by the menu's click,
// no URL signs anyone out, and a sign-out the server never confirmed leaves
// the visitor signed in and says so.
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

// Mock the site and API. `logout` answers /api/logout: a status code, 'abort'
// for a network error, or 'hang' for a request that never answers (or an
// array of those, one per request). The
// session is `session` until a 2xx logout ends it.
async function openPage(url, { logout = 200, session = true, username = 'esther' } = {}) {
  const page = await browser.newPage();
  const calls = [];
  let live = session;
  await page.route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
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
      calls.push(req.method() + ' ' + endpoint);
      if (endpoint === '/logout') {
        const answer = Array.isArray(logout) ? logout.shift() : logout;
        if (answer === 'hang') return;
        if (answer === 'abort') return route.abort();
        if (answer < 300) live = false;
        return route.fulfill({ status: answer, body: '' });
      }
      if (endpoint === '/user/verify') {
        return live
          ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username }) })
          : route.fulfill({ status: 401, body: '' });
      }
      if (endpoint === '/ping') return route.fulfill({ status: 200, body: 'Success' });
      return route.fulfill({ status: 401, body: '' });
    }
    return route.abort();
  });
  await page.goto(url);
  return { page, calls };
}

async function state(page) {
  await page.waitForFunction(() => ['Sign In', 'Sign Out']
    .includes(document.querySelector('#sign-in-link')?.textContent));
  // Let a redirect to My Account start, if one is coming
  await page.waitForTimeout(200);
  return page.evaluate(() => ({
    path: location.pathname,
    signedOut: getComputedStyle(document.getElementById('logout')).display,
    failed: getComputedStyle(document.getElementById('logout-failed')).display,
    menu: document.querySelector('#sign-in-link').textContent,
  }));
}

// Click Sign Out in the menu of an ordinary app page, signed in
async function signOut(logout) {
  const { page, calls } = await openPage(SITE + '/canvashare/', { logout });
  await page.waitForFunction(() => document.querySelector('#sign-in-link')?.textContent === 'Sign Out');
  await page.evaluate(() => localStorage.setItem('username', 'esther'));
  await Promise.all([page.waitForURL('**/user/sign-in/?signed-out'), page.click('#sign-in-link')]);
  return { page, calls, s: await state(page) };
}

test('Sign Out POSTs the logout from the menu, then confirms it', async () => {
  const { page, calls, s } = await signOut(200);
  assert.ok(calls.includes('POST /logout'), calls.join());
  assert.strictEqual(s.signedOut, 'block');
  assert.strictEqual(s.failed, 'none');
  assert.strictEqual(s.menu, 'Sign In');
  assert.strictEqual(s.path, '/user/sign-in/');
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('username')), null);
  await page.close();
});

test('a network error keeps the visitor signed in and warns them', async () => {
  const { page, s } = await signOut('abort');
  assert.strictEqual(s.failed, 'block');
  assert.strictEqual(s.signedOut, 'none');
  assert.strictEqual(s.menu, 'Sign Out');
  // Stays put so the warning is read, rather than bouncing to My Account
  assert.strictEqual(s.path, '/user/sign-in/');
  await page.close();
});

test('a server error keeps the visitor signed in and warns them', async () => {
  const { page, s } = await signOut(500);
  assert.strictEqual(s.failed, 'block');
  assert.strictEqual(s.menu, 'Sign Out');
  assert.strictEqual(s.path, '/user/sign-in/');
  await page.close();
});

test('a stalled logout is abandoned and reported as failed', async () => {
  const { page, s } = await signOut('hang');
  assert.strictEqual(s.failed, 'block');
  assert.strictEqual(s.menu, 'Sign Out');
  await page.close();
});

test('Sign Out on the failure banner tries again', async () => {
  const { page, calls } = await signOut([500, 200]);
  await Promise.all([page.waitForURL('**/user/sign-in/?signed-out'), page.click('#sign-in-link')]);
  // Same URL, so wait for the reloaded page's banner rather than the URL
  await page.waitForFunction(() => getComputedStyle(document.getElementById('logout')).display === 'block');
  const s = await state(page);
  assert.strictEqual(calls.filter((c) => c === 'POST /logout').length, 2);
  assert.strictEqual(s.failed, 'none');
  assert.strictEqual(s.menu, 'Sign In');
  await page.close();
});

// Logout CSRF: any site can link or redirect a visitor to these URLs
for (const query of ['?request=logout', '?signed-out', '?request=logout&signed-out']) {
  test(`opening sign-in/${query} does not sign the visitor out`, async () => {
    const { page, calls } = await openPage(SITE + '/user/sign-in/' + query);
    if (!query.includes('signed-out')) {
      // Still signed in, so it goes on to My Account as any signed-in visit does
      await page.waitForURL('**/user/my-account/');
      assert.ok(!calls.some((c) => c.endsWith('/logout')), calls.join());
      await page.close();
      return;
    }
    const s = await state(page);
    assert.ok(!calls.some((c) => c.endsWith('/logout')), calls.join());
    // Still signed in, so it says so rather than claiming a sign-out
    assert.strictEqual(s.failed, 'block');
    assert.strictEqual(s.signedOut, 'none');
    await page.close();
  });
}

test('the menu Sign Out is no longer a sign-out URL', async () => {
  const { page } = await openPage(SITE + '/canvashare/');
  await page.waitForFunction(() => document.querySelector('#sign-in-link')?.textContent === 'Sign Out');
  assert.strictEqual(await page.$eval('#sign-in-link', (a) => a.getAttribute('href')),
    SITE + '/user/sign-in/');
  await page.close();
});
