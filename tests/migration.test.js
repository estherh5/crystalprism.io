// Drives the REAL My Account and Thought Writer editor pages in headless
// Chromium with the API mocked: a visitor still holding a pre-cookie token in
// localStorage must get every data request AFTER the one-time /session
// exchange has set the cookie, or their first page loads blank.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const SITE = 'http://site.test';
const API = 'http://localhost:5000/api';
const SESSION_ENDPOINTS = ['/session', '/user/verify', '/ping', '/logout'];
let browser;

test.before(async () => { browser = await chromium.launch(); });
test.after(async () => { await browser.close(); });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };

// Open `pagePath` as a migrating visitor. The /session exchange answers
// slowly; until it has answered there is no cookie, so every other endpoint
// is 401. Returns the order of API calls and whether each had the cookie.
async function visit(pagePath, { username = 'esther', postId = null } = {}) {
  const page = await browser.newPage();
  const calls = [];
  let cookie = false;
  await page.route('**/*', async (route) => {
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
      const endpoint = new URL(url).pathname.slice('/api'.length);
      calls.push({ endpoint, cookie });
      if (endpoint === '/session') {
        await new Promise((r) => setTimeout(r, 400));
        cookie = true;
        return route.fulfill({ status: 200, body: '' });
      }
      if (endpoint === '/ping') return route.fulfill({ status: 200, body: 'Success' });
      if (!cookie) return route.fulfill({ status: 401, body: '' });
      if (endpoint === '/user/verify') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username: 'esther' }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.abort();
  });

  await page.goto(SITE + '/robots.txt');
  await page.evaluate(({ u, id }) => {
    localStorage.setItem('token', 'legacy.jwt.token');
    if (u) localStorage.setItem('username', u);
    if (id) sessionStorage.setItem('post-id', id);
  }, { u: username, id: postId });

  const visited = [];
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) visited.push(new URL(f.url()).pathname); });
  await page.goto(SITE + pagePath);
  await page.waitForFunction(() => document.querySelector('#sign-in-link')?.textContent === 'Sign Out');
  await page.waitForTimeout(300);

  const state = await page.evaluate(() => ({
    path: location.pathname,
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
  }));
  await page.close();
  return { ...state, visited, calls, data: calls.filter((c) => !SESSION_ENDPOINTS.includes(c.endpoint)) };
}

test('My Account requests its data only after the token exchange', async () => {
  const s = await visit('/user/my-account/');
  assert.strictEqual(s.path, '/user/my-account/');
  assert.strictEqual(s.token, null);
  assert.ok(s.data.some((c) => c.endpoint === '/user/esther'), JSON.stringify(s.calls));
  assert.deepStrictEqual(s.data.filter((c) => !c.cookie), []);
});

test('My Account keeps a migrating visitor whose username hint is missing', async () => {
  const s = await visit('/user/my-account/', { username: null });
  // No detour through Sign In and back
  assert.deepStrictEqual(s.visited, ['/user/my-account/']);
  assert.strictEqual(s.username, 'esther');
  assert.ok(s.data.some((c) => c.endpoint === '/user/esther'), JSON.stringify(s.calls));
  assert.deepStrictEqual(s.data.filter((c) => !c.cookie), []);
});

test('the editor requests posts only after the token exchange', async () => {
  const s = await visit('/thought-writer/editor/', { postId: '7' });
  assert.ok(s.data.some((c) => c.endpoint.startsWith('/thought-writer/posts/esther')), JSON.stringify(s.calls));
  assert.ok(s.data.some((c) => c.endpoint === '/thought-writer/post/7'), JSON.stringify(s.calls));
  assert.deepStrictEqual(s.data.filter((c) => !c.cookie), []);
});
