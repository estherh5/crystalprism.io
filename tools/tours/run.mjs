#!/usr/bin/env node
// Records one app tour end to end.
//
//   node run.mjs space
//
// Each tour module default-exports an async function that mints its own session,
// stands up a cookie proxy, and returns the path of the finished mp4.
// The app server itself is expected to already be running — see README.md.

const [name] = process.argv.slice(2);

if (!name) {
  console.error('usage: node run.mjs <space|nexus|savor>');
  process.exit(1);
}

const mod = await import(`./tours/${name}.mjs`);
console.log(`recording ${name}...`);
const out = await mod.default();
console.log(`\ndone: ${out}`);
