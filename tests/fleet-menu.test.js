// The vanilla fleet kit (fleet-menu.js) must behave exactly like the React kit
// in ~/Developer/giftme/web/components/FleetMenu.tsx; these mirror
// FleetMenu.test.tsx, run against the real script in headless Chromium.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const KIT = fs.readFileSync(path.join(root, 'fleet-menu.js'), 'utf8');
const CSS = fs.readFileSync(path.join(root, 'fleet.css'), 'utf8');
let browser;

test.before(async () => { browser = await chromium.launch(); });
test.after(async () => { await browser.close(); });

const APPS = [
  { key: 'giftme', name: 'GiftMe', url: 'https://giftme.crystalprism.io/', icon: '/i.png', tagline: 't', status: 'live', current: true },
  { key: 'nexus', name: 'Nexus', url: 'https://nexus.crystalprism.io/', icon: '/i.png', tagline: 't', status: 'live', current: false },
];

// A page with the kit loaded and a menu mounted into #slot. `opts` is the
// mountMenu options minus functions; `signOut` adds a Sign out row whose
// onSelect counts calls in window.signedOut
async function mount(opts, { signOut = false, width = 1280, height = 800 } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent('<!doctype html><header><div id="slot"></div></header><main>body</main>');
  await page.addStyleTag({ content: CSS });
  await page.addScriptTag({ content: KIT });
  await page.evaluate(({ opts, signOut }) => {
    window.signedOut = 0;
    if (signOut) opts.rows = opts.rows.concat([{ label: 'Sign out', onSelect: function () { window.signedOut++; } }]);
    window.menu = window.FleetKit.mountMenu(document.getElementById('slot'), opts);
  }, { opts, signOut });
  return page;
}

const base = { apps: APPS, user: null, rows: [], placement: 'down-end' };
const signedIn = { ...base, user: { label: 'esther' }, rows: [{ label: 'Settings', href: '/settings' }] };
const rowTexts = (page) => page.$$eval('.fleet-account .fleet-row', (n) => n.map((x) => x.textContent));
const open = (page) => page.click('.fleet-trigger');

test('signed in: initial on the trigger, label + rows in order before every app', async () => {
  const page = await mount(signedIn, { signOut: true });
  assert.strictEqual(await page.$eval('.fleet-trigger', (b) => b.textContent), 'E');
  assert.strictEqual(await page.$eval('.fleet-trigger', (b) => b.getAttribute('aria-label')), 'Apps and account, esther');
  await open(page);
  assert.strictEqual(await page.$eval('.fleet-email', (p) => p.textContent), 'esther');
  assert.deepStrictEqual(await rowTexts(page), ['Settings', 'Sign out']);
  assert.strictEqual(await page.$eval('.fleet-row', (a) => a.tagName), 'A');
  assert.strictEqual(await page.$eval('.fleet-row:last-child', (b) => b.tagName + ':' + b.type), 'BUTTON:button');
  assert.ok(await page.evaluate(() => {
    const last = document.querySelector('.fleet-account .fleet-row:last-child');
    const firstApp = document.querySelector('.fleet-app');
    return !!(last.compareDocumentPosition(firstApp) & Node.DOCUMENT_POSITION_FOLLOWING);
  }));
  await page.close();
});

test('signed out with a Sign in row: grid glyph trigger, Sign in only', async () => {
  const page = await mount({ ...base, rows: [{ label: 'Sign in', href: '/sign-in/' }] });
  assert.strictEqual(await page.$eval('.fleet-trigger', (b) => b.getAttribute('aria-label')), 'Apps and sign in');
  assert.strictEqual(await page.$$eval('.fleet-trigger svg circle', (c) => c.length), 9);
  await open(page);
  assert.deepStrictEqual(await rowTexts(page), ['Sign in']);
  assert.strictEqual(await page.$('.fleet-email'), null);
  await page.close();
});

test('no user and no rows: no account block at all', async () => {
  const page = await mount(base);
  await open(page);
  assert.strictEqual(await page.$('.fleet-account'), null);
  assert.strictEqual(await page.$$eval('.fleet-app', (a) => a.length), 2);
  await page.close();
});

test('marks the current app; icons are 40x40 with empty alt', async () => {
  const page = await mount(base);
  await open(page);
  const apps = await page.$$eval('.fleet-app', (as) => as.map((a) => [a.textContent, a.getAttribute('aria-current'), a.href]));
  assert.deepStrictEqual(apps, [['GiftMe', 'page', 'https://giftme.crystalprism.io/'], ['Nexus', null, 'https://nexus.crystalprism.io/']]);
  assert.deepStrictEqual(await page.$eval('.fleet-app img', (i) => [i.getAttribute('alt'), i.getAttribute('width'), i.getAttribute('height')]), ['', '40', '40']);
  await page.close();
});

test('the panel is a labeled modal dialog portaled to body, outside the trigger container', async () => {
  const page = await mount(base);
  await open(page);
  const d = await page.evaluate(() => {
    const p = document.querySelector('.fleet-panel');
    const t = document.querySelector('.fleet-trigger');
    return { parent: p.parentNode === document.body, inSlot: document.getElementById('slot').contains(p),
      role: p.getAttribute('role'), modal: p.getAttribute('aria-modal'), label: p.getAttribute('aria-label'),
      expanded: t.getAttribute('aria-expanded'), controls: t.getAttribute('aria-controls') === p.id,
      scrim: !!document.querySelector('body > .fleet-scrim[aria-hidden="true"]') };
  });
  assert.deepStrictEqual(d, { parent: true, inSlot: false, role: 'dialog', modal: 'true',
    label: 'Crystal Prism apps and account', expanded: 'true', controls: true, scrim: true });
  await page.close();
});

test('app names render as text, never markup', async () => {
  const evil = [{ ...APPS[0], name: '<img src=x onerror="window.pwned=1">' }];
  const page = await mount({ ...base, apps: evil, user: { label: '<b>x</b>' }, rows: [] });
  await open(page);
  assert.strictEqual(await page.$eval('.fleet-app span', (s) => s.textContent), '<img src=x onerror="window.pwned=1">');
  assert.strictEqual(await page.$eval('.fleet-email', (s) => s.textContent), '<b>x</b>');
  assert.strictEqual(await page.$$eval('.fleet-panel img', (i) => i.length), 1);
  assert.strictEqual(await page.evaluate(() => window.pwned), undefined);
  await page.close();
});

test('opening focuses the first row', async () => {
  const page = await mount(signedIn);
  await open(page);
  assert.strictEqual(await page.evaluate(() => document.activeElement.textContent), 'Settings');
  await page.close();
});

test('Tab wraps last to first and Shift+Tab first to last', async () => {
  const page = await mount(signedIn);
  await open(page);
  await page.evaluate(() => document.querySelectorAll('.fleet-app')[1].focus());
  await page.keyboard.press('Tab');
  assert.strictEqual(await page.evaluate(() => document.activeElement.textContent), 'Settings');
  await page.keyboard.press('Shift+Tab');
  assert.strictEqual(await page.evaluate(() => document.activeElement.textContent), 'Nexus');
  await page.close();
});

test('Escape closes and returns focus to the trigger', async () => {
  const page = await mount(base);
  await open(page);
  await page.keyboard.press('Escape');
  assert.strictEqual(await page.$('.fleet-panel'), null);
  assert.strictEqual(await page.$('.fleet-scrim'), null);
  assert.strictEqual(await page.evaluate(() => document.activeElement.className), 'fleet-trigger');
  assert.strictEqual(await page.$eval('.fleet-trigger', (b) => b.getAttribute('aria-expanded')), 'false');
  await page.close();
});

test('outside pointerdown closes; inside does not', async () => {
  const page = await mount(base);
  await open(page);
  await page.dispatchEvent('.fleet-panel', 'pointerdown');
  assert.ok(await page.$('.fleet-panel'));
  await page.dispatchEvent('main', 'pointerdown');
  assert.strictEqual(await page.$('.fleet-panel'), null);
  assert.strictEqual(await page.evaluate(() => document.activeElement.className), 'fleet-trigger');
  await page.close();
});

test('clicking the trigger spot again closes it (the scrim takes the click)', async () => {
  const page = await mount(base);
  await open(page);
  const b = await page.$eval('.fleet-trigger', (t) => { const r = t.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await page.mouse.click(b[0], b[1]);
  assert.strictEqual(await page.$('.fleet-panel'), null);
  await page.close();
});

test('scroll and resize close the panel', async () => {
  const page = await mount(base);
  await open(page);
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  assert.strictEqual(await page.$('.fleet-panel'), null);
  await open(page);
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  assert.strictEqual(await page.$('.fleet-panel'), null);
  await page.close();
});

test('an onSelect row closes the panel and runs its action', async () => {
  const page = await mount(signedIn, { signOut: true });
  await open(page);
  await page.click('text=Sign out');
  assert.strictEqual(await page.evaluate(() => window.signedOut), 1);
  assert.strictEqual(await page.$('.fleet-panel'), null);
  await page.close();
});

test('down-end: below the trigger, right-aligned, height capped to the room below', async () => {
  const page = await mount(base, { height: 420 });
  await page.addStyleTag({ content: '#slot{position:fixed;top:12px;right:36px}' });
  await open(page);
  const s = await page.$eval('.fleet-panel', (p) => [p.style.top, p.style.right, p.style.maxBlockSize]);
  assert.deepStrictEqual(s, ['64px', '36px', (420 - 56 - 24) + 'px']);
  await page.close();
});

test('up-start: above the trigger, left-aligned', async () => {
  const page = await mount({ ...base, placement: 'up-start' });
  await page.addStyleTag({ content: '#slot{position:fixed;bottom:20px;left:40px}' });
  await open(page);
  const s = await page.$eval('.fleet-panel', (p) => [p.style.bottom, p.style.left]);
  assert.deepStrictEqual(s, ['72px', '40px']);
  await page.close();
});

test('setApps and setUser update the trigger and an open panel', async () => {
  const page = await mount(base);
  await open(page);
  await page.evaluate(() => {
    window.menu.setUser({ label: 'zed' }, [{ label: 'Settings', href: '/s' }]);
    window.menu.setApps([{ key: 'x', name: 'Only', url: 'https://x.crystalprism.io/', icon: '/i.png', tagline: 't', status: 'live', current: false }]);
  });
  assert.strictEqual(await page.$eval('.fleet-trigger', (b) => b.textContent), 'Z');
  assert.deepStrictEqual(await rowTexts(page), ['Settings']);
  assert.deepStrictEqual(await page.$$eval('.fleet-app', (a) => a.map((x) => x.textContent)), ['Only']);
  await page.evaluate(() => window.menu.close());
  assert.strictEqual(await page.$('.fleet-panel'), null);
  await page.close();
});

test('shapeFleet: valid hosted list wins, hidden skipped unless current', async () => {
  const page = await mount(base);
  const r = await page.evaluate(() => {
    const raw = [
      { key: 'a', name: 'A', url: 'u', icon: 'i', tagline: 't', status: 'live' },
      { key: 'h', name: 'H', url: 'u', icon: 'i', tagline: 't', status: 'hidden' },
      { key: 'bad', name: 3 },
    ];
    const fb = [{ key: 'f', name: 'F', url: 'u', icon: 'i', tagline: 't', status: 'live' }];
    return {
      live: FleetKit.shapeFleet(raw, 'zz', fb).map((x) => x.key + ':' + x.current),
      current: FleetKit.shapeFleet(raw, 'h', fb).map((x) => x.key + ':' + x.current),
      fallback: FleetKit.shapeFleet({ nope: 1 }, 'f', fb).map((x) => x.key + ':' + x.current),
      empty: FleetKit.shapeFleet([], 'zz', fb).map((x) => x.key),
    };
  });
  assert.deepStrictEqual(r, { live: ['a:false'], current: ['a:false', 'h:true'], fallback: ['f:true'], empty: ['f'] });
  await page.close();
});

test('getFleetApps never rejects: 500, bad JSON, network error and timeout fall back', async () => {
  const page = await browser.newPage();
  const hosted = [{ key: 'live1', name: 'L', url: 'u', icon: 'i', tagline: 't', status: 'live' }];
  await page.route('**/*', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/ok.json') return route.fulfill({ contentType: 'application/json', body: JSON.stringify(hosted) });
    if (p === '/500.json') return route.fulfill({ status: 500, body: '' });
    if (p === '/bad.json') return route.fulfill({ contentType: 'application/json', body: '<html>' });
    if (p === '/hang.json') return; // never answers
    if (p === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><p>x</p>' });
    return route.abort();
  });
  await page.goto('http://kit.test/');
  await page.addScriptTag({ content: KIT });
  const r = await page.evaluate(async () => {
    const fb = [{ key: 'fb', name: 'F', url: 'u', icon: 'i', tagline: 't', status: 'live' }];
    const keys = async (url) => (await FleetKit.getFleetApps('x', { url, fallback: fb })).map((a) => a.key).join();
    const t0 = Date.now();
    const hang = await keys('/hang.json');
    return { ok: await keys('/ok.json'), e500: await keys('/500.json'), bad: await keys('/bad.json'),
      net: await keys('http://nowhere.test/x.json'), hang, waited: Date.now() - t0,
      defaultUrl: FleetKit.FLEET_URL };
  });
  assert.strictEqual(r.ok, 'live1');
  assert.strictEqual(r.e500, 'fb');
  assert.strictEqual(r.bad, 'fb');
  assert.strictEqual(r.net, 'fb');
  assert.strictEqual(r.hang, 'fb');
  assert.ok(r.waited >= 2900 && r.waited < 6000, 'timeout ~3s, got ' + r.waited);
  assert.strictEqual(r.defaultUrl, 'https://crystalprism.io/apps.json');
  await page.close();
});

test('renderFooter appends the kit footer with both links', async () => {
  const page = await mount(base);
  const f = await page.evaluate(() => {
    FleetKit.renderFooter(document.body);
    const el = document.body.lastElementChild;
    return { tag: el.tagName, cls: el.className, links: [...el.querySelectorAll('a')].map((a) => [a.textContent, a.href]),
      sep: el.querySelector('span[aria-hidden="true"]').textContent };
  });
  const year = new Date().getFullYear();
  assert.deepStrictEqual(f, { tag: 'FOOTER', cls: 'fleet-footer', sep: '·', links: [
    ['© 2017–' + year + ' Crystal Prism', 'https://crystalprism.io/'],
    ['All apps', 'https://crystalprism.io/#projects']] });
  await page.close();
});

test('fleet.css is byte-identical to the React kit copy', () => {
  const kit = path.join(process.env.HOME, 'Developer/giftme/web/components/fleet.css');
  if (!fs.existsSync(kit)) return; // only checkable on a machine with the fleet checked out
  assert.ok(fs.readFileSync(path.join(root, 'fleet.css')).equals(fs.readFileSync(kit)));
});
