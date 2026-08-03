// Mints an Auth.js session cookie for a fake demo user, so a tour can record an
// authenticated app without anyone typing real credentials.
//
// Two things here are load-bearing and were both learned the hard way:
//
// 1. The token MUST be encoded by the TARGET APP'S OWN next-auth. A copy of
//    @auth/core installed alongside this rig produces a token the app silently
//    rejects (302 to /login, no error) because the bundled versions disagree on
//    the JWE format. So we shell out with cwd set to the app directory.
//
// 2. The salt passed to encode() must equal the cookie NAME — Auth.js derives
//    the key via HKDF(AUTH_SECRET, cookieName). And because tours record the
//    production build, NODE_ENV=production, which means the name carries the
//    `__Secure-` prefix. See <app>/lib/session-cookie.ts.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';

const execFileAsync = promisify(execFile);

/** Cookie name the crystalprism SSO ring uses under a production build. */
export const RING_COOKIE_SECURE = '__Secure-crystalprism.session-token';
/** ...and under a dev build. */
export const RING_COOKIE_DEV = 'crystalprism.session-token';

/** Reads a KEY=value out of an app's env file without loading it into process.env. */
export async function readEnvVar(envPath, key) {
  let text;
  try {
    text = await readFile(envPath, 'utf8');
  } catch {
    return undefined;
  }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && m[1] === key) return m[2].trim().replace(/^["']|["']$/g, '');
  }
  return undefined;
}

const MINT_SCRIPT = `
import { encode } from 'next-auth/jwt';
const [secret, salt, sub, email, name, extra] = process.argv.slice(1);
const now = Math.floor(Date.now() / 1000);
const token = await encode({
  token: { sub, id: sub, email, name, iat: now, exp: now + 86400, ...JSON.parse(extra) },
  secret,
  salt,
});
process.stdout.write(token);
`;

/**
 * @param {object} opts
 * @param {string} opts.appDir      Directory holding the app's package.json + node_modules.
 * @param {string} opts.secret      The app's AUTH_SECRET.
 * @param {string} opts.userId
 * @param {string} opts.email
 * @param {string} [opts.name]
 * @param {string} [opts.cookieName]
 * @returns {Promise<{name: string, value: string}>}
 */
export async function mintRingSession({
  appDir,
  secret,
  userId,
  email,
  name = 'Demo',
  cookieName = RING_COOKIE_SECURE,
  extraClaims = {},
}) {
  if (!secret) throw new Error('mintRingSession: AUTH_SECRET is required');
  if (!appDir) throw new Error('mintRingSession: appDir is required');

  const { stdout } = await execFileAsync(
    process.execPath,
    [
      '--input-type=module', '-e', MINT_SCRIPT, '--',
      secret, cookieName, userId, email, name, JSON.stringify(extraClaims),
    ],
    { cwd: appDir },
  );

  const value = stdout.trim();
  if (!value) throw new Error('mintRingSession: app produced an empty token');
  return { name: cookieName, value };
}
