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

test('every app, hidden ones too, has its 512px icon file', () => {
  for (const a of apps) {
    const file = path.join(root, 'images', `${a.key}-icon.png`);
    assert.ok(fs.existsSync(file), `${a.key} icon`);
    const png = fs.readFileSync(file);
    assert.strictEqual(png.toString('latin1', 1, 4), 'PNG', `${a.key} is a PNG`);
  }
});

test('ration is hidden; almanac and hearsay are listed', () => {
  const by = Object.fromEntries(apps.map((a) => [a.key, a]));
  assert.strictEqual(by.ration.status, 'hidden');
  assert.ok(by.almanac && by.hearsay);
});

test('/apps.json answers cross-origin reads (fleet apps fetch it from their own hosts)', () => {
  const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
  const block = headers.split(/\n(?=\S)/).find((b) => b.split('\n')[0].trim() === '/apps.json');
  assert.ok(block, 'no /apps.json block in _headers');
  assert.match(block, /^\s+Access-Control-Allow-Origin: \*$/m);
});
