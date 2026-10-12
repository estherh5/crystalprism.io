// Drives the REAL account pages (served as https://account.crystalprism.io/)
// with the API mocked: ?next= / ?request=logout handoffs and absolute links
// into the other app subdomains.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const API = 'https://api.crystalprism.io/api';
const DIRS = {
  account: 'user', canvashare: 'canvashare', 'thought-writer': 'thought-writer',
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

const jwt = (username) => 'x.' + Buffer.from(JSON.stringify({ username })).toString('base64') + '.y';

const DRAWINGS = [{ drawing_id: 7, title: 'Sunset', url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  views: 1, like_count: 0, likers: [] }];
const POSTS = [{ post_id: 42, title: 'Hello', content: 'x', created: '2020-01-01T00:00:00Z',
  comment_count: 0 }];
const INFO = { username: 'esther', about: '', first_name: 'E', last_name: 'H', email: 'e@x.io',
  background_color: 'ffffff', icon_color: '000000', created: '2020-01-01T00:00:00Z',
  shapes_high_score: 0, rhythm_high_score: 0 };

// Open `url` as `session` (a username, or null for signed out)
async function open(url, { session = null, logout = 200 } = {}) {
  const page = await browser.newPage();
  const calls = [];
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.href === 'https://auth.crystalprism.io/api/legacy-token') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ token: 'ring', username: 'esther' }) });
    }
    if (u.href === API + '/session') return route.fulfill({ status: 200, body: '' });
    if (u.origin === 'https://api.crystalprism.io') {
      const ep = u.pathname.replace(/^\/api/, '');
      calls.push(ep);
      const json = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      if (ep === '/login') return route.fulfill({ status: 200, body: jwt('esther') });
      if (ep === '/logout') return route.fulfill({ status: logout, body: '' });
      if (ep === '/user/verify') return session ? json({ username: session }) : route.fulfill({ status: 401, body: '' });
      if (ep === '/ping') return route.fulfill({ status: 200, body: 'Success' });
      if (/^\/canvashare\/(drawings|drawing-likes\/user)\//.test(ep)) return json(DRAWINGS);
      if (ep.startsWith('/thought-writer/posts/')) return json(POSTS);
      if (ep.startsWith('/user/')) return json(INFO);
      return route.fulfill({ status: 401, body: '' });
    }
    // Third-party libraries: minimal stand-ins for what the pages call
    if (u.hostname === 'cdnjs.cloudflare.com' && u.pathname.includes('moment')) {
      return route.fulfill({ contentType: 'text/javascript',
        body: 'window.moment=function(){return{format:function(){return ""},fromNow:function(){return ""}}}' });
    }
    if (u.hostname === 'cdnjs.cloudflare.com' && u.pathname.includes('dompurify')) {
      return route.fulfill({ contentType: 'text/javascript',
        body: 'window.DOMPurify={sanitize:function(h){return h}}' });
    }
    const m = u.hostname.match(/^([a-z-]+)\.crystalprism\.io$/);
    if (u.protocol === 'https:' && m && DIRS[m[1]]) {
      const own = path.join(root, DIRS[m[1]], u.pathname);
      const fromApp = fs.existsSync(own) && !(fs.statSync(own).isDirectory() && u.pathname === '/');
      return serve(route, fromApp || u.pathname === '/' ? own : path.join(root, u.pathname));
    }
    return route.abort();
  });
  if (session) {
    await page.goto('https://account.crystalprism.io/robots.txt');
    await page.evaluate((n) => localStorage.setItem('username', n), session);
  }
  await page.goto(url);
  return { page, calls };
}

async function signIn(next) {
  const url = 'https://account.crystalprism.io/sign-in/' + (next ? '?next=' + encodeURIComponent(next) : '');
  const { page } = await open(url);
  await page.waitForSelector('#username-input');
  await page.fill('#username-input', 'esther');
  await page.fill('#password-input', 'pw');
  await Promise.all([
    page.waitForURL((u) => !u.href.startsWith('https://account.crystalprism.io/sign-in/')),
    page.click('#submit'),
  ]);
  const landed = page.url();
  await page.close();
  return landed;
}

test('sign-in with a Crystal Prism ?next= lands there', async () => {
  const next = 'https://canvashare.crystalprism.io/easel/';
  assert.strictEqual(await signIn(next), next);
});

test('sign-in with a foreign ?next= lands on My Account', async () => {
  assert.strictEqual(await signIn('https://evil.com/'), 'https://account.crystalprism.io/my-account/');
});

// The Google round trip leaves the account origin and comes back to
// /sign-in/?via=google with no ?next=; sessionStorage is what carries it
async function googleReturn({ next, stored }) {
  const { page } = await open('https://account.crystalprism.io/sign-in/' +
    (next ? '?next=' + encodeURIComponent(next) : ''));
  await page.waitForSelector('#username-input');
  if (stored) await page.evaluate((v) => sessionStorage.setItem('sign-in-next', v), stored);
  await Promise.all([
    page.waitForURL((u) => !u.href.startsWith('https://account.crystalprism.io/sign-in/')),
    page.goto('https://account.crystalprism.io/sign-in/?via=google').catch(() => {}),
  ]);
  const landed = page.url();
  const left = await page.evaluate(() => sessionStorage.getItem('sign-in-next')).catch(() => null);
  await page.close();
  return { landed, left };
}

test('a Google sign-in round trip still lands on ?next=', async () => {
  const next = 'https://canvashare.crystalprism.io/easel/';
  const r = await googleReturn({ next });
  assert.strictEqual(r.landed, next);
});

test('an already signed-in visitor with ?next= goes back to next', async () => {
  const next = 'https://canvashare.crystalprism.io/easel/';
  const { page } = await open('https://account.crystalprism.io/sign-in/?next=' + encodeURIComponent(next),
    { session: 'esther' });
  await page.waitForURL((u) => !u.href.startsWith('https://account.crystalprism.io/sign-in/'));
  assert.strictEqual(page.url(), next);
  await page.close();
});

test('a hostile stored next is ignored after the Google round trip', async () => {
  const r = await googleReturn({ stored: 'https://evil.com/' });
  assert.strictEqual(r.landed, 'https://account.crystalprism.io/my-account/');
});

test('Sign Out on an app subdomain signs out, then lands on account sign-in', async () => {
  const { page, calls } = await open('https://canvashare.crystalprism.io/', { session: 'esther' });
  await page.waitForFunction(() => document.getElementById('header')?.dataset.session === 'signed-in');
  await page.click('.fleet-trigger');
  await Promise.all([page.waitForURL('https://account.crystalprism.io/sign-in/?signed-out'),
    page.click('.fleet-account button.fleet-row:has-text("Sign out")')]);
  assert.ok(calls.includes('/logout'), calls.join());
  await page.close();
});

test('?request=logout no longer signs the visitor out', async () => {
  const { page, calls } = await open('https://account.crystalprism.io/sign-in/?request=logout', { session: 'esther' });
  await page.waitForURL('https://account.crystalprism.io/my-account/');
  assert.ok(!calls.includes('/logout'), calls.join());
  await page.close();
});

test('My Account links into the app subdomains', async () => {
  const { page } = await open('https://account.crystalprism.io/my-account/', { session: 'esther' });
  await page.waitForSelector('.drawing-title');
  await page.waitForSelector('.post-title');
  assert.strictEqual(await page.$eval('.drawing-title', (a) => a.href),
    'https://canvashare.crystalprism.io/easel/?drawing=7');
  const nav = page.waitForURL('https://thought-writer.crystalprism.io/editor/?post=42');
  await page.click('.post-title');
  await nav;
  assert.strictEqual(await page.evaluate(() => sessionStorage.getItem('post-id')), null);
  await page.close();
});

test('profile page links into the app subdomains', async () => {
  const { page } = await open('https://account.crystalprism.io/?username=esther');
  await page.waitForSelector('.drawing-title');
  await page.click('#posts');
  await page.waitForSelector('a.post-title');
  assert.strictEqual(await page.$eval('.drawing-title', (a) => a.href),
    'https://canvashare.crystalprism.io/easel/?drawing=7');
  assert.strictEqual(await page.$eval('a.post-title', (a) => a.href),
    'https://thought-writer.crystalprism.io/post/?post=42');
  const hrefs = await page.$$eval('a', (as) => as.map((a) => a.href));
  assert.ok(hrefs.includes('https://rhythm-of-life.crystalprism.io/'));
  assert.ok(hrefs.includes('https://shapes-in-rain.crystalprism.io/'));
  await page.close();
});
