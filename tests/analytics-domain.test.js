// Each app subdomain reports to its own Plausible site, so a page's
// data-domain must be the host that serves it. Pages outside an app
// directory are served from the apex and report to crystalprism.io.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// Repo directory -> host label, written out independently of the generator
const DIR_HOSTS = {
  'timespace': 'timespace',
  'vicarious': 'vicarious',
  'canvashare': 'canvashare',
  'thought-writer': 'thought-writer',
  'shapes-in-rain': 'shapes-in-rain',
  'rhythm-of-life': 'rhythm-of-life',
  'user': 'account',
};
const SKIP = new Set(['node_modules', '.git', 'tools', 'tests', 'docs']);

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

const pages = htmlFiles(root);

test('finds the pages that load Plausible', () => {
  const tagged = pages.filter((p) => fs.readFileSync(p, 'utf8').includes('plausible.crystalprism.io/js/'));
  assert.strictEqual(tagged.length, 15, tagged.map((p) => path.relative(root, p)).join('\n'));
});

for (const page of pages) {
  const rel = path.relative(root, page);
  const text = fs.readFileSync(page, 'utf8');
  const tags = [...text.matchAll(/<script\b[^>]*plausible\.crystalprism\.io[^>]*>/g)].map((m) => m[0]);
  if (!tags.length) continue;
  const label = DIR_HOSTS[rel.split(path.sep)[0]];
  const expected = label ? `${label}.crystalprism.io` : 'crystalprism.io';
  test(`${rel} reports to ${expected}`, () => {
    assert.strictEqual(tags.length, 1, 'exactly one Plausible tag');
    const domain = tags[0].match(/\bdata-domain="([^"]*)"/);
    assert.ok(domain, 'tag has a data-domain');
    assert.strictEqual(domain[1], expected);
  });
}
