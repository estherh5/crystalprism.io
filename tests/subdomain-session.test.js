// Drives the REAL common.js on per-app subdomains (and the dev host) in
// headless Chromium with the API mocked and the production rewrite mirrored:
// https://<app>.crystalprism.io/<path> serves repo file <dir>/<path>, and
// shared root files (common.js, favicon.ico, ...) fall through to the root.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const DEV = 'http://site.test';
const DIRS = {
  timespace: 'timespace', vicarious: 'vicarious', canvashare: 'canvashare',
  'thought-writer': 'thought-writer', 'shapes-in-rain': 'shapes-in-rain',
  'rhythm-of-life': 'rhythm-of-life', account: 'user',
};
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain', '.svg': 'image/svg+xml' };
let browser;

test.before(async () => { browser = await chromium.launch(); });
test.after(async () => { await browser.close(); });

function serve(route, file) {
  if (file.endsWith('/') || (fs.existsSync(file) && fs.statSync(file).isDirectory())) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({
    contentType: types[path.extname(file)] || 'application/octet-stream',
    body: fs.readFileSync(file),
  });
}

// Open `url`; `session` is the /user/verify answer (username or null)
async function open(url, { session = null, localUsername = null, header = true } = {}) {
  const page = await browser.newPage();
  const apiCalls = [];
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.origin === 'https://api.crystalprism.io' || u.origin === 'http://localhost:5000') {
      apiCalls.push(route.request().url());
      if (u.pathname === '/api/user/verify') {
        return session
          ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username: session }) })
          : route.fulfill({ status: 401, body: '' });
      }
      if (u.pathname === '/api/ping') return route.fulfill({ status: 200, body: 'Success' });
      return route.fulfill({ status: 401, body: '' });
    }
    const m = u.hostname.match(/^([a-z-]+)\.crystalprism\.io$/);
    if (u.protocol === 'https:' && m && DIRS[m[1]]) {
      const own = path.join(root, DIRS[m[1]], u.pathname);
      const fromApp = fs.existsSync(own) && !(fs.statSync(own).isDirectory() && u.pathname === '/');
      return serve(route, fromApp || u.pathname === '/' ? own : path.join(root, u.pathname));
    }
    if (u.origin === 'https://crystalprism.io' || u.origin === DEV) {
      return serve(route, path.join(root, u.pathname));
    }
    return route.abort();
  });
  // Seed the username hint on the app's own origin, if asked
  if (localUsername) {
    await page.goto(new URL(url).origin + '/robots.txt');
    await page.evaluate((n) => localStorage.setItem('username', n), localUsername);
  }
  await page.goto(url);
  if (!header) return { page, apiCalls };
  await page.waitForSelector('#sign-in-link', { state: 'attached' });
  if (session) await page.waitForFunction(() => document.querySelector('#sign-in-link').textContent === 'Sign Out');
  else await page.waitForFunction(() => document.querySelector('#sign-in-link').textContent === 'Sign In');
  return { page, apiCalls };
}

const href = (page, id) => page.$eval('#' + id, (a) => a.href);
const menu = (page) => page.$$eval('.site-menu-row', (rows) =>
  Object.fromEntries(rows.map((r) => [r.querySelector('.site-menu-text').textContent, r.dataset.link])));

test('signed in on a subdomain with an empty localStorage: header, links, not the homepage', async () => {
  const { page } = await open('https://canvashare.crystalprism.io/', { session: 'esther' });
  assert.strictEqual(await page.$eval('#profile-link', (a) => a.textContent), 'esther');
  assert.strictEqual(await href(page, 'profile-link'), 'https://account.crystalprism.io/?username=esther');
  assert.strictEqual(await href(page, 'account-link'), 'https://account.crystalprism.io/my-account/');
  // currentPath == domain would move the theme toggle into the header
  assert.strictEqual(await page.evaluate(() => currentPath), 'canvashare');
  assert.strictEqual(await page.$('#header-container #theme-container'), null);
  await page.close();
});

test('signed out: Sign In carries the current page as ?next=', async () => {
  const url = 'https://thought-writer.crystalprism.io/post/?post=3';
  const { page } = await open(url);
  assert.strictEqual(await href(page, 'sign-in-link'),
    'https://account.crystalprism.io/sign-in/?next=' + encodeURIComponent(url));
  await page.close();
});

test('signed in: Sign Out goes to sign-in with request=logout', async () => {
  const { page } = await open('https://canvashare.crystalprism.io/', { session: 'esther' });
  assert.strictEqual(await href(page, 'sign-in-link'), 'https://account.crystalprism.io/sign-in/?request=logout');
  await page.close();
});

test('site menu points at each app subdomain', async () => {
  const { page } = await open('https://canvashare.crystalprism.io/');
  const m = await menu(page);
  assert.strictEqual(m['CanvaShare'], 'https://canvashare.crystalprism.io/');
  assert.strictEqual(m['Timespace'], 'https://timespace.crystalprism.io/');
  assert.strictEqual(m['Home'], 'https://crystalprism.io/');
  assert.strictEqual(m['Account'], 'https://account.crystalprism.io/sign-in/');
  await page.close();
});

test('the API base on a crystalprism.io host is api.crystalprism.io', async () => {
  const { page, apiCalls } = await open('https://timespace.crystalprism.io/');
  assert.ok(apiCalls.includes('https://api.crystalprism.io/api/user/verify'), apiCalls.join());
  await page.close();
});

test('safeNext allows Crystal Prism https pages only', async () => {
  const { page } = await open('https://canvashare.crystalprism.io/');
  const out = await page.evaluate(() => ({
    ok1: safeNext('https://crystalprism.io/x'),
    ok2: safeNext('https://canvashare.crystalprism.io/easel/?drawing=1'),
    bad: ['https://evil.com', '//evil.com', 'javascript:alert(1)',
      'https://crystalprism.io.evil.com/', 'http://canvashare.crystalprism.io/',
      null, ''].map((u) => safeNext(u)),
  }));
  assert.strictEqual(out.ok1, 'https://crystalprism.io/x');
  assert.strictEqual(out.ok2, 'https://canvashare.crystalprism.io/easel/?drawing=1');
  assert.deepStrictEqual(out.bad, new Array(7).fill(null));
  await page.close();
});

test('dev host keeps the single-site layout', async () => {
  const { page } = await open(DEV + '/canvashare/');
  assert.strictEqual(await page.evaluate(() => appUrl('account', '?username=a')), DEV + '/user/?username=a');
  assert.strictEqual((await menu(page))['CanvaShare'], DEV + '/canvashare/');
  assert.strictEqual(await page.evaluate(() => currentPath), 'canvashare');
  await page.close();
});

test('currentPath matches the old href-based value on the dev host', async () => {
  const cases = [
    ['/', null, DEV.replace('http://', '')],
    ['/canvashare/easel/?drawing=1', null, 'easel'],
    ['/user/?username=x', null, 'user'],
    ['/user/my-account/', 'esther', 'my-account'],
  ];
  for (const [p, session, expected] of cases) {
    const { page } = await open(DEV + p, { session, header: false });
    // common.js is a classic script: its globals exist once the page loads
    const got = await page.evaluate(() => ({
      now: currentPath,
      old: window.location.href.split('/').slice(-2)[0],
    }));
    assert.strictEqual(got.now, expected, p);
    assert.strictEqual(got.now, got.old, p);
    await page.close();
  }
});
