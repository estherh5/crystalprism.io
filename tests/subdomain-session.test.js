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
// `data` maps an API pathname to the JSON body it answers with
// `verifyDelay` holds the verify answer back (ms), so other API calls answer first
// `verifyRaw` replaces the verify answer with this raw fulfill (e.g. a non-JSON 200)
async function open(url, { session = null, localUsername = null, header = true, data = {}, verifyDelay = 0, verifyRaw = null } = {}) {
  const page = await browser.newPage();
  const apiCalls = [];
  await page.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.origin === 'https://api.crystalprism.io' || u.origin === 'http://localhost:5000') {
      apiCalls.push(route.request().url());
      if (u.pathname === '/api/user/verify') {
        if (verifyDelay) await new Promise((r) => setTimeout(r, verifyDelay));
        if (verifyRaw) return route.fulfill(verifyRaw);
        return session
          ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username: session }) })
          : route.fulfill({ status: 401, body: '' });
      }
      if (u.pathname === '/api/ping') return route.fulfill({ status: 200, body: 'Success' });
      if (Object.hasOwn(data, u.pathname)) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data[u.pathname]) });
      }
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

const POST_7 = {
  post_id: 7, title: 'Seven', content: '<p>Body of seven</p>', public: true,
  username: 'esther', created: '2026-01-01T00:00:00Z', modified: '2026-01-01T00:00:00Z', comment_count: 0,
};

test('the editor opens the post named by ?post=', async () => {
  const { page } = await open('https://thought-writer.crystalprism.io/editor/?post=7', {
    session: 'esther', data: { '/api/thought-writer/post/7': POST_7 },
  });
  await page.waitForFunction(() => postTitle.value === 'Seven');
  assert.strictEqual(await page.evaluate(() => post.dataset.postid), '7');
  assert.match(await page.evaluate(() => post.innerHTML), /Body of seven/);
  await page.close();
});

test('the Edit button on an own post hands off by ?post=', async () => {
  const { page } = await open('https://thought-writer.crystalprism.io/post/?post=7', {
    session: 'esther', localUsername: 'esther',
    data: { '/api/thought-writer/post/7': POST_7, '/api/thought-writer/comments/post/7': [] },
  });
  await page.waitForSelector('#edit:not(.hidden)');
  await Promise.all([page.waitForURL('**/editor/**'), page.click('#edit')]);
  assert.strictEqual(page.url(), 'https://thought-writer.crystalprism.io/editor/?post=7');
  await page.close();
});

test('writer and artist names link to the account host profile', async () => {
  const board = await open('https://thought-writer.crystalprism.io/', {
    data: { '/api/thought-writer/posts': [POST_7] },
  });
  await board.page.waitForSelector('.post-info a[href*="username="]', { state: 'attached' });
  assert.strictEqual(await board.page.$eval('.post-info a[href*="username="]', (a) => a.href),
    'https://account.crystalprism.io/?username=esther');
  await board.page.close();

  const gallery = await open('https://canvashare.crystalprism.io/', {
    data: { '/api/canvashare/drawings': [{
      drawing_id: 4, title: 'Four', url: 'https://crystalprism.io/favicon.ico',
      like_count: 0, likers: [], views: 0, username: 'esther',
    }] },
  });
  await gallery.page.waitForSelector('.drawing-artist a', { state: 'attached' });
  assert.strictEqual(await gallery.page.$eval('.drawing-artist a', (a) => a.href),
    'https://account.crystalprism.io/?username=esther');
  await gallery.page.close();
});


const COMMENT_9 = {
  comment_id: 9, post_id: 7, content: 'Nine', username: 'esther',
  created: '2026-01-02T00:00:00Z', modified: '2026-01-02T00:00:00Z',
};
const COMMENT_10 = { ...COMMENT_9, comment_id: 10, content: 'Ten', username: 'a b' };

// First visit to a subdomain: no stored username, and the post answers before verify
test('own post and comment show Edit/Delete on a first subdomain visit', async () => {
  const { page } = await open('https://thought-writer.crystalprism.io/post/?post=7', {
    session: 'esther', verifyDelay: 400,
    data: { '/api/thought-writer/post/7': POST_7,
      '/api/thought-writer/comments/post/7': [COMMENT_9, COMMENT_10] },
  });
  await page.waitForSelector('#post-content', { state: 'attached' });
  await page.waitForSelector('#comment10', { state: 'attached' });
  assert.strictEqual(await page.$eval('#edit', (b) => b.classList.contains('hidden')), false);
  assert.strictEqual(await page.$eval('#delete', (b) => b.classList.contains('hidden')), false);
  assert.ok(await page.$('#comment9 .modify-button'), 'own comment has Modify');
  assert.ok(await page.$('#comment9 .delete-button'), 'own comment has Delete');
  assert.strictEqual(await page.$('#comment10 .modify-button'), null);
  // Writer and commenter names link to the account host profile
  assert.strictEqual(await href(page, 'post-writer'), 'https://account.crystalprism.io/?username=esther');
  assert.strictEqual(await page.$eval('#comment10 .commenter', (a) => a.href),
    'https://account.crystalprism.io/?username=a%20b');
  await page.close();
});

test('own likes show as liked on a first canvashare visit', async () => {
  const { page } = await open('https://canvashare.crystalprism.io/', {
    session: 'esther', verifyDelay: 400,
    data: { '/api/canvashare/drawings': [{
      drawing_id: 4, title: 'Four', url: 'https://crystalprism.io/favicon.ico',
      like_count: 1, likers: [{ username: 'esther', drawing_like_id: 12 }], views: 0, username: 'a',
    }] },
  });
  await page.waitForSelector('[data-drawing="likes4"]', { state: 'attached' });
  assert.ok(await page.$('.fas.fa-heart[data-drawinglike="12"]'), 'liked heart shown');
  assert.strictEqual(await page.$('.far.fa-heart'), null);
  await page.close();
});

test('the Account menu row follows the verified session on a first visit', async () => {
  const { page } = await open('https://canvashare.crystalprism.io/', { session: 'esther', verifyDelay: 200 });
  assert.strictEqual((await menu(page))['Account'], 'https://account.crystalprism.io/my-account/');
  await page.close();
});

test('leaderboard names link to the account host profile', async () => {
  const leaders = [{ username: 'a b', score: 5 }];
  const want = 'https://account.crystalprism.io/?username=a%20b';
  const shapes = await open('https://shapes-in-rain.crystalprism.io/', {
    header: false, data: { '/api/shapes-in-rain/scores': leaders },
  });
  await shapes.page.waitForSelector('a[href*="username="]', { state: 'attached' });
  assert.deepStrictEqual(await shapes.page.$$eval('a[href*="username="]', (as) => as.map((a) => a.href)), [want]);
  await shapes.page.close();

  /* Rhythm of Life's onload stops at Snap.svg (a CDN script the harness
  blocks) before it loads leaders, so render the leaderboard directly */
  const rhythm = await open('https://rhythm-of-life.crystalprism.io/', { header: false });
  const got = await rhythm.page.evaluate((l) => {
    displayLeaders(l);
    return [...document.querySelectorAll('a[href*="username="]')].map((a) => a.href);
  }, leaders);
  assert.deepStrictEqual(got, [want]);
  await rhythm.page.close();
});

// A visitor who is not signed in, or whose verify answer is not JSON (a
// captive portal, an HTML page from an intermediary), still sees the post
const POST_PAGE_DATA = { '/api/thought-writer/post/7': POST_7,
  '/api/thought-writer/comments/post/7': [COMMENT_10] };
for (const [name, verifyRaw] of [
  ['signed out (401)', null],
  ['verify answers 200 text/html', { status: 200, contentType: 'text/html', body: '<html>' }],
]) {
  test(`post page renders without Edit when ${name}`, async () => {
    const { page } = await open('https://thought-writer.crystalprism.io/post/?post=7', {
      verifyRaw, data: POST_PAGE_DATA,
    });
    await page.waitForSelector('#post-content', { state: 'attached', timeout: 5000 });
    await page.waitForSelector('#comment10', { state: 'attached', timeout: 5000 });
    assert.strictEqual(await page.$eval('#edit', (b) => b.classList.contains('hidden')), true);
    assert.strictEqual(await page.$eval('#sign-in-link', (a) => a.textContent), 'Sign In');
    await page.close();
  });
}
