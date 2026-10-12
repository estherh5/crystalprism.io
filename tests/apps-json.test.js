const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const apps = JSON.parse(fs.readFileSync(path.join(root, 'apps.json'), 'utf8'));

test('apps.json entries are well-formed and unique', () => {
  assert.ok(Array.isArray(apps) && apps.length >= 20);
  const keys = new Set();
  for (const a of apps) {
    assert.match(a.key, /^[a-z0-9-]+$/);
    assert.ok(!keys.has(a.key), `duplicate ${a.key}`); keys.add(a.key);
    assert.ok(a.name && a.tagline, `${a.key} name/tagline`);
    assert.match(a.url, /^https:\/\/[a-z0-9.-]+\/$/);
    assert.ok(['live', 'hidden'].includes(a.status), `${a.key} status`);
    assert.strictEqual(a.icon, `https://crystalprism.io/images/${a.key}-icon.png`);
  }
});

test('every live app has its icon file', () => {
  for (const a of apps.filter((x) => x.status === 'live')) {
    assert.ok(fs.existsSync(path.join(root, 'images', `${a.key}-icon.png`)), `${a.key} icon`);
  }
});

test('ration is hidden; almanac and hearsay are listed', () => {
  const by = Object.fromEntries(apps.map((a) => [a.key, a]));
  assert.strictEqual(by.ration.status, 'hidden');
  assert.ok(by.almanac && by.hearsay);
});
