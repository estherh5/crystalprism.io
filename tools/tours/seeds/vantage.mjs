// Prepares a throwaway demo DB for vantage from the nightly backup.
//
// Unlike the other seeds, this one does NOT invent data. Vantage is a photo
// archive — one fixed viewpoint of a river, shot thousands of times — and an
// archive of fabricated tiles demonstrates nothing. So the real dump is
// restored and then de-identified: the photographs and their capture metadata
// are genuine, the account around them is not.
//
// What changes:
//   - photo URLs are repointed from the R2 public bucket to local /demo/ paths,
//     so nothing is fetched from Cloudflare during a recording;
//   - rows whose image files are missing from the backup are dropped, since a
//     hole in the mosaic is worse than a smaller archive;
//   - the real owner and the share invite are replaced by a single demo user;
//   - feedback threads are cleared — they are correspondence, not archive
//     content, and have no place in a demo.
//
// Requires: seeds are applied to a DB already restored from
// ~/blob-backups/db/vantage.sql. See README.md.

import { createClient } from '@libsql/client';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const url = process.env.TURSO_DATABASE_URL;
if (!url || !url.startsWith('file:')) {
  throw new Error(`refusing to seed: TURSO_DATABASE_URL must be a file: URL, got ${url}`);
}

const PHOTO_ROOT = path.join(os.homedir(), 'blob-backups/vantage/photos');
if (!existsSync(PHOTO_ROOT)) {
  throw new Error(`photo backup not found at ${PHOTO_ROOT}`);
}

const db = createClient({ url });

const USER = { id: 'demo-user-vantage', email: 'demo@crystalprism.io', name: 'Demo' };

// ORDER MATTERS. `archives.ownerUserId` cascades on delete and `photos.archiveId`
// cascades in turn, so clearing `users` first silently takes the entire archive
// and all 5,000 photographs with it — the seed reports success and the DB is
// empty. Create the demo owner, move the archive onto it, and only then remove
// the real accounts.
await db.execute('DELETE FROM feedback_messages');
await db.execute('DELETE FROM feedback');
await db.execute('DELETE FROM archive_shares');

const { rows: userCols } = await db.execute('PRAGMA table_info(users)');
const hasName = userCols.some((c) => c.name === 'name');
await db.execute({
  sql: hasName
    ? 'INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)'
    : 'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)',
  args: hasName
    ? [USER.id, USER.email, USER.name, Date.now()]
    : [USER.id, USER.email, Date.now()],
});

await db.execute({ sql: 'UPDATE archives SET owner_user_id = ?', args: [USER.id] });
await db.execute({ sql: 'DELETE FROM users WHERE id != ?', args: [USER.id] });

const { rows: survived } = await db.execute('SELECT COUNT(*) AS n FROM photos');
if (Number(survived[0].n) === 0) {
  throw new Error('the archive was emptied by a cascade — restore the dump and check delete order');
}

// Repoint every image at the local mirror. `photos.displayUrl`/`thumbUrl` are
// plain text columns rendered verbatim — there is no signing step — and a
// leading-slash path bypasses next.config.ts's R2-only remotePatterns, so this
// works on the <img> screens and the next/image ones alike.
const { rows: photos } = await db.execute('SELECT sha256 FROM photos');
let missing = 0;
const updates = [];

for (const { sha256 } of photos) {
  if (!existsSync(path.join(PHOTO_ROOT, sha256, 'display.jpg'))) {
    missing++;
    updates.push({ sql: 'DELETE FROM photos WHERE sha256 = ?', args: [sha256] });
    continue;
  }
  updates.push({
    sql: 'UPDATE photos SET display_url = ?, thumb_url = ? WHERE sha256 = ?',
    args: [`/demo/${sha256}/display.jpg`, `/demo/${sha256}/thumb.jpg`, sha256],
  });
}

// Chunked: a single batch of ~5k statements is slow enough to look hung.
for (let i = 0; i < updates.length; i += 500) {
  await db.batch(updates.slice(i, i + 500), 'write');
}

const { rows: left } = await db.execute(
  'SELECT COUNT(*) AS n, MIN(year) AS y0, MAX(year) AS y1 FROM photos',
);
const { rows: stragglers } = await db.execute(
  "SELECT COUNT(*) AS n FROM photos WHERE display_url NOT LIKE '/demo/%'",
);
if (Number(stragglers[0].n) !== 0) {
  throw new Error(`${stragglers[0].n} photo rows still point off-box — recording would hit R2`);
}

console.log(`  photos: ${left[0].n} (${left[0].y0}-${left[0].y1}), ${missing} dropped for missing files`);
console.log('  all photo URLs are local (offline guard OK)');
console.log(`seeded ${url}`);
