// Loads the REAL common.js, user/main.js and DOMPurify (the same version the
// pages load from cdnjs, pinned in package.json) into headless Chromium.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const purify = require.resolve('dompurify/dist/purify.min.js');
const SITE = 'http://site.test';
let browser;

test.before(async () => { browser = await chromium.launch(); });
test.after(async () => { await browser.close(); });

// A page on a fake origin; every request except the page itself is aborted
async function open(url, html) {
  const page = await browser.newPage();
  await page.route('**/*', (route) => route.request().url().startsWith(SITE)
    ? route.fulfill({ contentType: 'text/html', body: html })
    : route.abort());
  await page.goto(url);
  return page;
}

async function sanitised(html) {
  const page = await open(SITE + '/', '<body></body>');
  await page.addScriptTag({ path: purify });
  await page.addScriptTag({ path: path.join(root, 'common.js') });
  const out = await page.evaluate((h) => {
    const el = document.createElement('div');
    setRichText(el, h);
    return el.innerHTML;
  }, html);
  await page.close();
  return out;
}

const img = (src) => '<img src="' + src + '">';

test('rich text drops data:image/svg+xml', async () => {
  assert.doesNotMatch(await sanitised(img('data:image/svg+xml;base64,PHN2Zz4=')), /src=/);
  assert.doesNotMatch(await sanitised(img('data:image/svg+xml,<svg onload=alert(1)>')), /src=/);
});

test('rich text drops javascript: and non-image data: srcs', async () => {
  assert.doesNotMatch(await sanitised(img('javascript:alert(1)')), /src=/);
  assert.doesNotMatch(await sanitised(img('data:text/html,<script>alert(1)</script>')), /src=/);
  assert.doesNotMatch(await sanitised('<a href="javascript:alert(1)">x</a>'), /href=/);
});

test('rich text keeps https: and data:image/png srcs', async () => {
  assert.match(await sanitised(img('https://example.com/a.png')), /src="https:\/\/example\.com\/a\.png"/);
  assert.match(await sanitised(img('data:image/png;base64,iVBORw0KGgo=')), /src="data:image\/png;base64/);
});

async function profile(query) {
  const html = '<body><div id="header"></div><div id="footer"></div>' +
    '<h1 id="profile-title"></h1></body>';
  const page = await open(SITE + '/user/' + query, html);
  await page.addScriptTag({ path: path.join(root, 'common.js') });
  await page.addScriptTag({ path: path.join(root, 'user', 'main.js') });
  // The load event already fired, so run the page's own onload handler
  // (a valid profile needs the full page DOM, so its onload may throw here)
  await page.evaluate(() => { try { window.onload(); } catch (e) {} });
  const username = await page.evaluate(() => username);
  const title = await page.textContent('#profile-title');
  await page.close();
  return { username, title };
}

test('profile page accepts a valid username', async () => {
  assert.strictEqual((await profile('?username=Esther_h-5')).username, 'Esther_h-5');
});

test('profile page rejects invalid or missing usernames', async () => {
  for (const q of ['', '?username=', '?username=a/b', '?username=..%2Fx',
    '?username=a%20b', '?username=a&username=b%3Cscript%3E', '?username=%3Cimg%3E']) {
    const { username: got, title } = await profile(q);
    // "a&username=b<script>" reads the first value, "a", which is valid
    if (q.startsWith('?username=a&')) assert.strictEqual(got, 'a');
    else {
      assert.strictEqual(got, null, q);
      assert.strictEqual(title, 'User does not exist', q);
    }
  }
});
