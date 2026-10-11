// Every legacy app is served from its own subdomain by host-conditioned
// rewrites in the generated `_redirects`. This suite does NOT trust the
// generator: it parses `_redirects` itself, routes URLs the way Netlify does
// (first match wins, host-qualified rules only for that host, :splat, query
// carried through), and checks that every asset and link an app page reaches
// lands on a real file in this repo. A stylesheet that 404s on a subdomain
// fails here, not in production.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const REDIRECTS = path.join(root, '_redirects');

// Host label -> repo directory (the plan's Global Constraints, written out
// here independently of common.js and the generator)
const HOSTS = {
  'timespace': 'timespace',
  'vicarious': 'vicarious',
  'canvashare': 'canvashare',
  'thought-writer': 'thought-writer',
  'shapes-in-rain': 'shapes-in-rain',
  'rhythm-of-life': 'rhythm-of-life',
  'account': 'user',
};

function readRules() {
  return fs.readFileSync(REDIRECTS, 'utf8').split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status, ...rest] = line.split(/\s+/);
      assert.strictEqual(rest.length, 0, `unexpected fields in: ${line}`);
      assert.match(status, /^(200|301)!$/, `status must be forced: ${line}`);
      let host = null;
      let fromPath = from;
      if (/^https?:\/\//.test(from)) {
        const u = new URL(from.replace(/\*$/, 'SPLAT'));
        host = u.host;
        fromPath = u.pathname.replace(/SPLAT$/, '*');
      }
      return { host, fromPath, to, status: Number(status.replace('!', '')) };
    });
}

// Netlify matching: a literal path matches with or without a trailing slash
// (documented). `/a/*` also matching `/a` itself is an ASSUMPTION from
// forum behavior, not a documented guarantee; on the apex it changes nothing,
// because if it did not match, Netlify's own slash 301 would yield `/a/`,
// which does, and the chain still converges (see follow()).
function matchPath(pattern, pathname) {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    if (pathname === base) return '';
    if (pathname.startsWith(base + '/')) return pathname.slice(base.length + 1);
    return null;
  }
  const strip = (p) => (p.length > 1 ? p.replace(/\/$/, '') : p);
  return strip(pattern) === strip(pathname) ? '' : null;
}

function route(url, rules = readRules()) {
  const u = new URL(url);
  for (const rule of rules) {
    if (rule.host && rule.host !== u.host) continue;
    const splat = matchPath(rule.fromPath, u.pathname);
    if (splat === null) continue;
    let target = rule.to.replace(':splat', splat);
    if (u.search) target += u.search;
    return { status: rule.status, target };
  }
  return null;
}

// The internal path a request on `url` is served from: route() for a 200,
// the request path itself when no rule matches; asserts no redirect
function servedPath(url) {
  const routed = route(url);
  if (!routed) return new URL(url).pathname;
  assert.strictEqual(routed.status, 200, `${url} redirects, expected a page`);
  return new URL(routed.target, 'https://x.invalid').pathname;
}

const isDir = (pathname) => {
  const p = path.join(root, decodeURIComponent(pathname));
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
};

// A folder asked for without its slash is served its index.html as a 200,
// with NO slash 301: measured live 2026-10-11 (`curl -sIL
// https://canvashare.crystalprism.io/easel` is a plain 200), so the page's
// relative refs resolve one level up until /slash.js adds the slash.
function fileFor(pathname) {
  let file = path.join(root, decodeURIComponent(pathname));
  if (pathname.endsWith('/') || isDir(pathname)) file = path.join(file, 'index.html');
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

// The repo file a request on `url` is served from, or null for a 404
function serve(url) {
  return fileFor(servedPath(url));
}

// Runs the repo's slash.js against `url` with a stand-in location; returns
// the URL it location.replace()s to, or null when it leaves the page alone
const vm = require('node:vm');
function runSlash(url) {
  const u = new URL(url);
  let replaced = null;
  const location = {
    pathname: u.pathname, search: u.search, hash: u.hash,
    replace(to) { replaced = new URL(to, url).href; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'slash.js'), 'utf8'), { location });
  return replaced;
}

// The first <script> inside <head>, as written
function firstHeadScript(html) {
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  const m = head.match(/<script\b[^>]*\bsrc\s*=\s*["']([^"']*)["'][^>]*>/i);
  return m ? { src: m[1], before: head.slice(0, m.index), tag: m[0] } : null;
}

// Follows a request the way a browser on Netlify would: forced 301 rules,
// then the served page (a slashless folder is a 200 of its index.html, see
// fileFor), then that page's own /slash.js hop when it loads it first.
// Returns the final URL, the file served there, and the hop count.
const MAX_HOPS = 5;
function follow(start) {
  let url = start;
  const seen = new Set();
  for (let hops = 0; hops <= MAX_HOPS; hops++) {
    assert.ok(!seen.has(url), `redirect loop at ${url} (from ${start})`);
    seen.add(url);
    const u = new URL(url);
    const routed = route(url);
    if (routed && routed.status === 301) {
      url = new URL(routed.target, url).href;
      continue;
    }
    const internal = routed ? new URL(routed.target, 'https://x.invalid').pathname : u.pathname;
    const file = fileFor(internal);
    const first = file && file.endsWith('.html') && firstHeadScript(fs.readFileSync(file, 'utf8'));
    const next = first && first.src === '/slash.js' ? runSlash(url) : null;
    if (next) {
      url = next;
      continue;
    }
    return { url, file, hops };
  }
  assert.fail(`more than ${MAX_HOPS} redirects from ${start}`);
}

function walk(dir, ext) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, ext));
    else if (ext.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

// The URL a repo file is served at on its app's subdomain
function subdomainUrl(host, dir, file) {
  const rel = path.relative(path.join(root, dir), file).split(path.sep).join('/');
  return `https://${host}.crystalprism.io/` + rel.replace(/(^|\/)index\.html$/, '$1');
}

const SKIP = /^(https?:|data:|#|mailto:|javascript:|tel:|\/\/)/i;

function htmlRefs(text) {
  return [...text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]);
}
function cssRefs(text) {
  return [...text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((m) => m[1]);
}
// Relative navigations written as string literals in an app's scripts, e.g.
// window.location = '../my-account/'
function jsRefs(text) {
  return [...text.matchAll(/['"](\.\.?\/[^'"\s]*)['"]/g)].map((m) => m[1]);
}

// Every local reference reachable from every page, script and stylesheet
// of every app, resolved on that app's subdomain; CSS reached on the
// subdomain (the shared common.css included) is followed for its url()s
function collectRefs() {
  const refs = [];
  for (const [host, dir] of Object.entries(HOSTS)) {
    const files = walk(path.join(root, dir), ['.html', '.css', '.js']);
    assert.ok(files.some((f) => f.endsWith('.html')), `${dir} has no pages`);
    const seenCss = new Set();
    const queue = files.map((file) => ({ file, base: subdomainUrl(host, dir, file) }));
    while (queue.length) {
      const { file, base } = queue.shift();
      const text = fs.readFileSync(file, 'utf8');
      const ext = path.extname(file);
      const found = ext === '.html' ? htmlRefs(text).concat(cssRefs(text))
        : ext === '.css' ? cssRefs(text) : jsRefs(text);
      for (const ref of found) {
        if (!ref || SKIP.test(ref)) continue;
        const url = new URL(ref, base);
        url.hash = '';
        refs.push({ from: path.relative(root, file), ref, url: url.href });
        if (url.pathname.endsWith('.css') && !seenCss.has(url.href)) {
          seenCss.add(url.href);
          const served = serve(url.href);
          if (served && !served.startsWith(path.join(root, dir) + path.sep)) {
            queue.push({ file: served, base: url.href });
          }
        }
      }
    }
  }
  return refs;
}

test('_redirects is the generator output, checked in', async () => {
  const { buildRedirects } = await import('../tools/subdomains/build-redirects.mjs');
  assert.strictEqual(fs.readFileSync(REDIRECTS, 'utf8'), buildRedirects());
});

test('_redirects carries the generated-file header', () => {
  assert.ok(fs.readFileSync(REDIRECTS, 'utf8').startsWith(
    '# Generated by tools/subdomains/build-redirects.mjs — do not edit by hand.'));
});

test('every src/href/url() in every app resolves to a real file on its subdomain', () => {
  const refs = collectRefs();
  // Guard against a vacuous pass: the shared files must actually be covered
  const urls = new Set(refs.map((r) => r.url));
  for (const host of Object.keys(HOSTS)) {
    assert.ok(urls.has(`https://${host}.crystalprism.io/common.js`), `${host} common.js not seen`);
    assert.ok(urls.has(`https://${host}.crystalprism.io/common.css`), `${host} common.css not seen`);
  }
  assert.ok(refs.length >= 90, `only ${refs.length} refs collected`);
  const broken = refs.filter((r) => !serve(r.url))
    .map((r) => `${r.from}: ${r.ref} -> ${r.url} -> ${JSON.stringify(route(r.url))}`);
  assert.deepStrictEqual(broken, []);
});

test('shared root files are served from the repo root on every subdomain', () => {
  for (const host of Object.keys(HOSTS)) {
    assert.strictEqual(serve(`https://${host}.crystalprism.io/common.js`), path.join(root, 'common.js'));
    assert.strictEqual(serve(`https://${host}.crystalprism.io/common.css`), path.join(root, 'common.css'));
  }
  assert.strictEqual(serve('https://timespace.crystalprism.io/audio-embed.js'), path.join(root, 'audio-embed.js'));
  for (const host of Object.keys(HOSTS)) {
    assert.strictEqual(serve(`https://${host}.crystalprism.io/slash.js`), path.join(root, 'slash.js'), host);
  }
  assert.strictEqual(serve('https://account.crystalprism.io/favicon.ico'), path.join(root, 'favicon.ico'));
});

test('every app page is served at its own subdomain URL', () => {
  for (const [host, dir] of Object.entries(HOSTS)) {
    for (const file of walk(path.join(root, dir), ['.html'])) {
      const url = subdomainUrl(host, dir, file);
      assert.strictEqual(serve(url), file, url);
    }
  }
  assert.strictEqual(serve('https://canvashare.crystalprism.io/easel/'),
    path.join(root, 'canvashare/easel/index.html'));
  assert.strictEqual(serve('https://account.crystalprism.io/'), path.join(root, 'user/index.html'));
});

test('an app-owned file wins over the root file of the same name', () => {
  assert.ok(fs.existsSync(path.join(root, 'thought-writer/favicon.ico')));
  assert.deepStrictEqual(route('https://thought-writer.crystalprism.io/favicon.ico'),
    { status: 200, target: '/thought-writer/favicon.ico' });
  assert.deepStrictEqual(route('https://canvashare.crystalprism.io/style.css'),
    { status: 200, target: '/canvashare/style.css' });
});

test('old single-site URLs 301 to the new host with the query intact', () => {
  assert.deepStrictEqual(route('https://crystalprism.io/thought-writer/post/?post=12'),
    { status: 301, target: 'https://thought-writer.crystalprism.io/post/?post=12' });
  assert.deepStrictEqual(route('https://www.crystalprism.io/user/?username=x'),
    { status: 301, target: 'https://account.crystalprism.io/?username=x' });
  assert.deepStrictEqual(route('https://www.crystalprism.io/user/'),
    { status: 301, target: 'https://account.crystalprism.io/' });
  assert.deepStrictEqual(route('https://crystalprism.io/canvashare/easel/?drawing=1'),
    { status: 301, target: 'https://canvashare.crystalprism.io/easel/?drawing=1' });
  for (const [host, dir] of Object.entries(HOSTS)) {
    for (const apex of ['crystalprism.io', 'www.crystalprism.io']) {
      assert.deepStrictEqual(route(`https://${apex}/${dir}/`),
        { status: 301, target: `https://${host}.crystalprism.io/` });
    }
  }
});

test('the portfolio and privacy page are untouched', () => {
  for (const url of ['https://crystalprism.io/', 'https://crystalprism.io/privacy/',
    'https://crystalprism.io/common.js', 'https://crystalprism.io/index.html',
    'https://www.crystalprism.io/', 'https://crystalprism.netlify.app/canvashare/']) {
    assert.strictEqual(route(url), null, url);
  }
});

test('local dev and previews keep the directory layout (no bare-path rules)', () => {
  assert.deepStrictEqual(readRules().filter((r) => !r.host), []);
});

// Every app page below its app's root, as [host, dir, sub] with sub like
// `easel` or `post` (found on disk, not listed)
function subPages() {
  const out = [];
  for (const [host, dir] of Object.entries(HOSTS)) {
    for (const file of walk(path.join(root, dir), ['.html'])) {
      const rel = path.relative(path.join(root, dir), file).split(path.sep).join('/');
      const m = rel.match(/^(.+)\/index\.html$/);
      if (m) out.push([host, dir, m[1], file]);
    }
  }
  return out;
}

test('a folder URL without its slash settles on that folder page, on every host', () => {
  const pages = subPages();
  assert.ok(pages.length >= 6, `only ${pages.length} sub-pages found`);
  for (const [host, dir, sub, file] of pages) {
    for (const start of [`https://${host}.crystalprism.io/${sub}`,
      `https://crystalprism.io/${dir}/${sub}`,
      `https://www.crystalprism.io/${dir}/${sub}`]) {
      const end = follow(start);
      assert.strictEqual(end.url, `https://${host}.crystalprism.io/${sub}/`, start);
      assert.strictEqual(end.file, file, start);
    }
  }
});

test('the query and hash survive the slash redirects', () => {
  assert.deepStrictEqual(follow('https://thought-writer.crystalprism.io/post?post=12#c3').url,
    'https://thought-writer.crystalprism.io/post/?post=12#c3');
  assert.deepStrictEqual(follow('https://crystalprism.io/canvashare/easel?drawing=1').url,
    'https://canvashare.crystalprism.io/easel/?drawing=1');
  assert.deepStrictEqual(follow('https://canvashare.crystalprism.io/easel?drawing=1').url,
    'https://canvashare.crystalprism.io/easel/?drawing=1');
  assert.deepStrictEqual(follow('https://account.crystalprism.io/sign-in').url,
    'https://account.crystalprism.io/sign-in/');
});

test('an old app root without its slash settles on the app host', () => {
  for (const [host, dir] of Object.entries(HOSTS)) {
    const end = follow(`https://crystalprism.io/${dir}`);
    assert.strictEqual(end.url, `https://${host}.crystalprism.io/`);
    assert.strictEqual(end.file, path.join(root, dir, 'index.html'));
  }
});

test('the slash guards are exact paths, never a wildcard (a splat guard loops)', () => {
  const appHosts = new Set(Object.keys(HOSTS).map((h) => `${h}.crystalprism.io`));
  const guards = readRules().filter((r) => r.status === 301 && appHosts.has(r.host));
  assert.strictEqual(guards.length, subPages().length, 'one guard per folder page');
  for (const r of guards) {
    assert.ok(!r.fromPath.includes('*'), `wildcard guard: ${r.host}${r.fromPath}`);
    assert.ok(r.to.endsWith('/'), `guard target must carry its slash: ${r.to}`);
  }
});

// The extraction regexes above are the generator's too, so a ref form both
// miss is invisible to both. Anchor them with plain substring counting: every
// `src=`/`href=` written in a page must be one the regex picked up.
test('the HTML ref regex misses no src=/href= attribute (non-regex anchor)', () => {
  const count = (text, needle) => text.split(needle).length - 1;
  for (const dir of Object.values(HOSTS)) {
    for (const file of walk(path.join(root, dir), ['.html'])) {
      const text = fs.readFileSync(file, 'utf8').toLowerCase();
      assert.strictEqual(htmlRefs(text).length, count(text, 'src=') + count(text, 'href='),
        path.relative(root, file));
    }
  }
});

// The six folder pages a slashless URL reaches (see fileFor). Each must load
// /slash.js, absolute and synchronous, before anything that loads a relative
// resource, or that resource is fetched from one level up first.
const SLASH_PAGES = ['canvashare/easel', 'thought-writer/post', 'thought-writer/editor',
  'user/my-account', 'user/create-account', 'user/sign-in'];

test('every folder page loads /slash.js first, synchronously', () => {
  const onDisk = subPages().map(([, dir, sub]) => `${dir}/${sub}`).sort();
  assert.deepStrictEqual(onDisk, [...SLASH_PAGES].sort(), 'folder pages changed; update SLASH_PAGES');
  for (const page of SLASH_PAGES) {
    const html = fs.readFileSync(path.join(root, page, 'index.html'), 'utf8');
    const first = firstHeadScript(html);
    assert.ok(first, `${page}: no script in <head>`);
    assert.strictEqual(first.src, '/slash.js', page);
    assert.ok(!/\b(defer|async|type\s*=\s*["']module)/i.test(first.tag), `${page}: ${first.tag}`);
    assert.ok(!/\b(src|href)\s*=/i.test(first.before), `${page}: a resource loads before slash.js`);
  }
});

test('slash.js adds the slash to a slashless folder URL, query and hash kept', () => {
  assert.strictEqual(runSlash('https://canvashare.crystalprism.io/easel'),
    'https://canvashare.crystalprism.io/easel/');
  assert.strictEqual(runSlash('https://canvashare.crystalprism.io/easel?drawing=1#top'),
    'https://canvashare.crystalprism.io/easel/?drawing=1#top');
  assert.strictEqual(runSlash('http://localhost:8000/user/sign-in?next=x'),
    'http://localhost:8000/user/sign-in/?next=x');
});

test('slash.js leaves slashed, root and file URLs alone', () => {
  for (const url of ['https://canvashare.crystalprism.io/easel/',
    'https://canvashare.crystalprism.io/easel/?drawing=1',
    'https://canvashare.crystalprism.io/', 'https://crystalprism.io/x.html',
    'https://account.crystalprism.io/sign-in/index.html']) {
    assert.strictEqual(runSlash(url), null, url);
  }
});
