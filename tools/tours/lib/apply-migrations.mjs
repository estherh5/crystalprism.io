// Applies a directory of Drizzle .sql migrations to a LOCAL sqlite file.
//
// Used for apps that have no db:migrate script (nexus, savor) — their real
// migrations are applied out-of-band via the Turso CLI, which is not something
// a tour should ever go near.
//
// Statements are split on Drizzle's `--> statement-breakpoint` marker rather
// than on `;`, because splitting on semicolons mangles triggers and any literal
// containing one. Files without the marker fall back to a semicolon split.
//
// Usage: node lib/apply-migrations.mjs <migrationsDir> <file:...> [--from N] [--to N]
//
// --from/--to select a numeric slice of the migration list. Needed where a repo
// has schema drift: giftme's 0004 deliberately omits three `feedback` ALTERs
// because those columns already existed in prod, which leaves 0005's backfill
// referencing a column a fresh database never got. Applying 0000-0004, patching
// the drift by hand, then applying 0005+ reproduces the real prod schema.

import { createClient } from '@libsql/client';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const argv = process.argv.slice(2);
const [dir, url] = argv;
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : Number(argv[i + 1]);
};
const from = flag('--from') ?? -Infinity;
const to = flag('--to') ?? Infinity;

if (!url?.startsWith('file:')) {
  throw new Error(`refusing to migrate: target must be a file: URL, got ${url}`);
}

const db = createClient({ url });

const files = (await readdir(dir))
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .filter((f) => {
    const n = Number(f.slice(0, 4));
    return Number.isNaN(n) ? true : n >= from && n <= to;
  });
console.log(`applying ${files.length} migrations to ${url}`);

let applied = 0;
let skipped = 0;

for (const file of files) {
  const sql = await readFile(path.join(dir, file), 'utf8');
  // Prefer Drizzle's explicit marker. Only when a file lacks it do we fall back
  // to splitting on `;` — and then comments must be stripped FIRST, because
  // vitals 0002 contains prose semicolons inside a `--` block that would
  // otherwise be cut into fragments like `claiming on it would make...`.
  const statements = (
    sql.includes('--> statement-breakpoint')
      ? sql.split('--> statement-breakpoint')
      : sql.replace(/^\s*--.*$/gm, '').split(';')
  )
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    // Some migrations are pure commentary (vitals 0002 documents why a column is
    // nullable and does nothing else). libsql rejects a comment-only statement
    // with a baffling "SQLITE_UNKNOWN_0: not an error", so drop those first.
    // The stripped copy is only used for this emptiness test; the original text
    // is what actually executes, so a `--` inside a string literal is untouched.
    const executable = stmt.replace(/^\s*--.*$/gm, '').trim();
    if (!executable) {
      skipped++;
      continue;
    }
    try {
      await db.execute(stmt);
      applied++;
    } catch (err) {
      // Re-runs and additive migrations that reference an existing object are
      // expected; anything else is a real failure and should surface.
      const msg = String(err.message ?? err);
      if (/already exists|duplicate column/i.test(msg)) {
        skipped++;
        continue;
      }
      throw new Error(`${file}: ${msg}\n---\n${stmt.slice(0, 200)}`);
    }
  }
}

const { rows } = await db.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
);
console.log(`  ${applied} statements applied, ${skipped} already present`);
console.log(`  ${rows.length} tables: ${rows.map((r) => r.name).join(', ')}`);
