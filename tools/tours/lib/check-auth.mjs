// Smoke test: does a self-minted ring cookie actually authenticate?
// Usage: node lib/check-auth.mjs <envPath> <baseURL> <path>

import { mintRingSession, readEnvVar } from './session.mjs';

const [envPath, baseURL, probePath = '/'] = process.argv.slice(2);

const secret = await readEnvVar(envPath, 'AUTH_SECRET');
if (!secret) throw new Error(`no AUTH_SECRET in ${envPath}`);

const [cookie] = await mintRingSession({
  secret,
  userId: 'demo-user',
  email: 'demo@crystalprism.io',
  name: 'Demo',
});

const res = await fetch(new URL(probePath, baseURL), {
  headers: { cookie: `${cookie.name}=${cookie.value}` },
  redirect: 'manual',
});

console.log(`${probePath} -> ${res.status}${res.headers.get('location') ? ` -> ${res.headers.get('location')}` : ''}`);
if (res.status === 200) {
  const html = await res.text();
  console.log(`  ${html.length} bytes`);
  const titles = [...html.matchAll(/class="[^"]*\bt\b[^"]*"[^>]*>([^<]{3,60})</g)].slice(0, 5);
  if (titles.length) console.log('  sample text:', titles.map((m) => m[1].trim()).join(' | '));
}
