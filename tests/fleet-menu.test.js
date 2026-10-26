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

// Scrollbars shown, so a classic one can take layout space
test.before(async () => { browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] }); });
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

test('signed in: prism on the trigger, label + rows in order before every app', async () => {
  const page = await mount(signedIn, { signOut: true });
  assert.deepStrictEqual(await page.$eval('.fleet-trigger', (b) => [b.textContent, b.querySelectorAll('svg path').length]), ['', 2]);
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

test('signed out with a Sign in row: prism glyph trigger, Sign in only', async () => {
  const page = await mount({ ...base, rows: [{ label: 'Sign in', href: '/sign-in/' }] });
  assert.strictEqual(await page.$eval('.fleet-trigger', (b) => b.getAttribute('aria-label')), 'Apps and sign in');
  assert.strictEqual(await page.$$eval('.fleet-trigger svg path', (c) => c.length), 2);
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

// A Sign out row with a busyLabel; window.land / window.fail settle its action
async function mountBusy() {
  const page = await mount(signedIn);
  await page.evaluate(() => {
    window.menu.setUser({ label: 'esther' }, [{ label: 'Sign out', busyLabel: 'Signing out…', failLabel: 'Couldn’t sign out.',
      onSelect: () => { window.signedOut++; return new Promise((res, rej) => { window.land = res; window.fail = rej; }); } }]);
  });
  await open(page);
  return page;
}

test('a busyLabel row stays open reading its busyLabel until the action lands, then closes', async () => {
  const page = await mountBusy();
  await page.click('text=Sign out');
  const row = await page.$eval('.fleet-account .fleet-row', (r) => [r.textContent, r.getAttribute('aria-disabled'),
    r.querySelector('.fleet-spinner')?.getAttribute('aria-hidden'), document.activeElement === r]);
  assert.deepStrictEqual(row, ['Signing out…', 'true', 'true', true]);
  await page.click('.fleet-account .fleet-row', { force: true });
  await page.dispatchEvent('main', 'pointerdown');
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  assert.strictEqual(await page.evaluate(() => window.signedOut), 1);
  assert.ok(await page.$('.fleet-panel'));
  await page.evaluate(() => window.land());
  await page.waitForSelector('.fleet-panel', { state: 'detached' });
  assert.strictEqual(await page.evaluate(() => document.activeElement.className), 'fleet-trigger');
  await page.close();
});

test('a rejected busyLabel row keeps the menu open with its failLabel alert and retries', async () => {
  const page = await mountBusy();
  await page.click('text=Sign out');
  await page.evaluate(() => window.fail(new Error('offline')));
  await page.waitForSelector('[role="alert"]');
  assert.strictEqual(await page.$eval('[role="alert"]', (a) => a.className + ':' + a.textContent), 'fleet-alert:Couldn’t sign out.');
  assert.deepStrictEqual(await page.$eval('.fleet-account .fleet-row', (r) => [r.textContent, r.getAttribute('aria-disabled')]), ['Sign out', null]);
  await page.click('text=Sign out');
  assert.strictEqual(await page.evaluate(() => window.signedOut), 2);
  assert.strictEqual(await page.$('[role="alert"]'), null);
  await page.keyboard.press('Escape');
  await open(page);
  assert.strictEqual(await page.$('[role="alert"]'), null);
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

// A styled ::-webkit-scrollbar takes layout space, like a classic desktop one
const CLASSIC_SCROLLBAR = 'html{overflow-y:scroll}::-webkit-scrollbar{width:15px}';

test('a classic scrollbar: the popover right edge meets the trigger, the sheet spans the page', async () => {
  const page = await mount(base);
  await page.addStyleTag({ content: CLASSIC_SCROLLBAR + '#slot{position:fixed;top:12px;right:16px}' });
  await open(page);
  const pop = await page.evaluate(() => [document.querySelector('.fleet-trigger').getBoundingClientRect().right,
    document.querySelector('.fleet-panel').getBoundingClientRect().right, document.documentElement.clientWidth]);
  assert.ok(pop[2] < 1280, 'scrollbar takes layout space: clientWidth ' + pop[2]);
  assert.strictEqual(pop[1], pop[0]);
  await page.close();
  const phone = await mount(base, { width: 400 });
  await phone.addStyleTag({ content: CLASSIC_SCROLLBAR });
  await open(phone);
  const sheet = await phone.evaluate(() => [document.querySelector('.fleet-panel').getBoundingClientRect().width, document.documentElement.clientWidth]);
  assert.strictEqual(sheet[0], sheet[1]);
  await phone.close();
});

test('320px phone sheet: every live app name wraps between words, never inside one', async () => {
  const live = JSON.parse(fs.readFileSync(path.join(root, 'apps.json'), 'utf8')).filter((a) => a.status === 'live');
  const page = await mount({ ...base, apps: live }, { width: 320 });
  // A wide face, as an app's own --fleet-font can be; the default serif hides the break
  await page.addStyleTag({ content: ':root{--fleet-font:Verdana,system-ui,sans-serif}' });
  await open(page);
  const broken = await page.evaluate(() => [...document.querySelectorAll('.fleet-app span')].flatMap((s) => {
    const t = s.firstChild;
    let i = 0;
    return t.data.split(' ').filter((word) => {
      const r = document.createRange();
      r.setStart(t, i); r.setEnd(t, i + word.length); i += word.length + 1;
      return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size > 1;
    });
  }));
  assert.deepStrictEqual(broken, []);
  await page.close();
});

test('a blank or whitespace label: prism glyph, no dangling comma, no email line, rows kept', async () => {
  for (const label of ['', '   ']) {
    const page = await mount({ ...signedIn, user: { label } });
    assert.deepStrictEqual(await page.$eval('.fleet-trigger', (t) => [t.getAttribute('aria-label'), t.textContent, !!t.querySelector('svg')]),
      ['Apps and account', '', true]);
    await open(page);
    assert.strictEqual(await page.$('.fleet-email'), null);
    assert.deepStrictEqual(await page.$$eval('.fleet-account .fleet-row', (r) => r.map((n) => n.textContent)), ['Settings']);
    await page.close();
  }
  const page = await mount({ ...signedIn, user: { label: ' esther ' } });
  assert.deepStrictEqual(await page.$eval('.fleet-trigger', (t) => [t.getAttribute('aria-label'), t.textContent]), ['Apps and account, esther', '']);
  await page.close();
});

test('triggerClass joins the kit class and outranks the kit look', async () => {
  const page = await mount({ ...base, triggerClass: 'appbtn' });
  await page.addStyleTag({ content: '.appbtn { border: 3px solid rgb(1, 2, 3); }' });
  assert.deepStrictEqual(await page.$eval('.fleet-trigger', (t) => [t.className, getComputedStyle(t).borderTopWidth, getComputedStyle(t).borderTopColor]),
    ['fleet-trigger appbtn', '3px', 'rgb(1, 2, 3)']);
  await page.close();
  const plain = await mount(base);
  assert.strictEqual(await plain.$eval('.fleet-trigger', (t) => t.className), 'fleet-trigger');
  await plain.close();
});

// The kit's look (radius, fill, transition, press) is for a bare trigger only: with an app
// class on it, a property that class leaves unset must not fall through to the kit's value.
test('the kit look stays off a classed trigger and on a bare one', async () => {
  const look = async (page) => {
    const b = await page.$eval('.fleet-trigger', (t) => { const r = t.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    const rest = await page.$eval('.fleet-trigger', (t) => [getComputedStyle(t).borderTopLeftRadius, getComputedStyle(t).transitionDuration, getComputedStyle(t).inlineSize]);
    await page.mouse.move(b[0], b[1]);
    await page.mouse.down();
    await page.waitForTimeout(250);
    const pressed = await page.$eval('.fleet-trigger', (t) => getComputedStyle(t).transform);
    await page.mouse.up();
    return [...rest, pressed];
  };
  const page = await mount({ ...base, triggerClass: 'appbtn' });
  await page.addStyleTag({ content: '.appbtn { border: 3px solid rgb(1, 2, 3); }' });
  assert.deepStrictEqual(await look(page), ['0px', '0s', '44px', 'none']);
  await page.close();
  const plain = await mount(base);
  assert.deepStrictEqual(await look(plain), ['999px', '0.12s', '44px', 'matrix(0.94, 0, 0, 0.94, 0, 0)']);
  await plain.close();
});

test('app icons load eagerly and decode off the main thread', async () => {
  const page = await mount(base);
  await open(page);
  assert.deepStrictEqual(await page.$$eval('.fleet-app img', (i) => [...new Set(i.map((n) => n.getAttribute('loading') + '/' + n.decoding))]), ['eager/async']);
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
  assert.strictEqual(await page.$eval('.fleet-trigger', (b) => b.getAttribute('aria-label')), 'Apps and account, zed');
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

test('renderFooter appends the kit footer with only the Crystal Prism link', async () => {
  const page = await mount(base);
  const f = await page.evaluate(() => {
    FleetKit.renderFooter(document.body);
    const el = document.body.lastElementChild;
    return { tag: el.tagName, cls: el.className, links: [...el.querySelectorAll('a')].map((a) => [a.textContent, a.href]),
      sep: el.querySelector('span[aria-hidden="true"]'), text: el.textContent };
  });
  const year = new Date().getFullYear();
  assert.deepStrictEqual(f, { tag: 'FOOTER', cls: 'fleet-footer', sep: null, text: '© 2017–' + year + ' Crystal Prism', links: [
    ['© 2017–' + year + ' Crystal Prism', 'https://crystalprism.io/']] });
  await page.close();
});

test('fleet.css is byte-identical to the React kit copy', () => {
  const kit = path.join(process.env.HOME, 'Developer/giftme/web/components/fleet.css');
  if (!fs.existsSync(kit)) return; // only checkable on a machine with the fleet checked out
  assert.ok(fs.readFileSync(path.join(root, 'fleet.css')).equals(fs.readFileSync(kit)));
});
