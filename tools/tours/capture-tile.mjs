#!/usr/bin/env node
// Captures the projects-page tile image for an app.
//
// The tile grid centres each item in its flex row, so an image whose aspect
// ratio differs from its neighbours' sits with visible gaps above and below.
// 17 of the 21 tiles are exactly 458x376, so that is the house size and every
// new one must match it. Capturing at 1374x1128 (the same 1.218 ratio, 3x up)
// and scaling down keeps the text crisp instead of squashing a widescreen shot.
//
//   node capture-tile.mjs <app>

import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { mintRingSession, readEnvVar, RING_COOKIE_SECURE } from './lib/session.mjs';
import { startCookieProxy } from './lib/cookie-proxy.mjs';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMAGES = path.resolve(HERE, '../../images');

export const TILE_W = 458;
export const TILE_H = 376;
const CAPTURE_W = TILE_W * 3;
const CAPTURE_H = TILE_H * 3;

const APPS = {
  space: {
    dir: 'Developer/space/web', appPort: 3210, proxyPort: 3211,
    userId: 'demo-user-space', route: '/board', wait: '.sq',
  },
  nexus: {
    dir: 'Developer/nexus/web', appPort: 3220, proxyPort: 3221,
    userId: 'demo-user-nexus', route: '/sky', wait: '.sky-node',
  },
  savor: {
    dir: 'Developer/savor', appPort: 3230, proxyPort: 3231,
    userId: 'demo-user-savor', route: '/', wait: '.nav-item',
  },
  giftme: {
    dir: 'Developer/giftme/web', appPort: 3240, proxyPort: 3241,
    userId: 'demo-user-giftme', route: '/', wait: '.nav-link',
  },
  vitals: {
    dir: 'Developer/vitals', appPort: 3250, proxyPort: 3251,
    userId: 'demo-user-vitals', route: '/p/demo-patient/labs', wait: 'svg',
    cookieName: 'authjs.session-token',
    extraClaims: { role: 'admin', checkedAt: Date.now() },
  },
  vantage: {
    dir: 'Developer/vantage/web', appPort: 3270, proxyPort: 3271,
    userId: 'demo-user-vantage', route: '/a/river', wait: '.wall-cell img',
  },
};

const name = process.argv[2];
const cfg = APPS[name];
if (!cfg) {
  console.error(`usage: node capture-tile.mjs <${Object.keys(APPS).join('|')}>`);
  process.exit(1);
}

const appDir = path.join(os.homedir(), cfg.dir);
// vantage keeps its secret only in .env.production.local, so all three are tried.
const secret =
  (await readEnvVar(path.join(appDir, '.env.local'), 'AUTH_SECRET')) ??
  (await readEnvVar(path.join(appDir, '.env'), 'AUTH_SECRET')) ??
  (await readEnvVar(path.join(appDir, '.env.production.local'), 'AUTH_SECRET'));

const cookie = await mintRingSession({
  appDir,
  secret,
  userId: cfg.userId,
  email: 'demo@crystalprism.io',
  name: 'Demo',
  cookieName: cfg.cookieName ?? RING_COOKIE_SECURE,
  extraClaims: cfg.extraClaims ?? {},
});

const proxy = await startCookieProxy({
  listenPort: cfg.proxyPort,
  targetPort: cfg.appPort,
  cookieName: cookie.name,
  cookieValue: cookie.value,
});

const browser = await chromium.launch({ args: ['--hide-scrollbars'] });
const context = await browser.newContext({
  viewport: { width: CAPTURE_W, height: CAPTURE_H },
  deviceScaleFactor: 1,
  colorScheme: name === 'nexus' || name === 'vantage' ? 'dark' : 'light',
});
const page = await context.newPage();

const raw = path.join(HERE, 'raw', `tile-${name}.png`);
await page.goto(`http://localhost:${cfg.proxyPort}${cfg.route}`, { waitUntil: 'networkidle' });
await page.waitForSelector(cfg.wait, { timeout: 15000 });
await page.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: raw });

await browser.close();
await proxy.close();

const out = path.join(IMAGES, `${name}.png`);
await execFileAsync('ffmpeg', ['-y', '-i', raw, '-vf', `scale=${TILE_W}:${TILE_H}:flags=lanczos`, out]);

const { stdout } = await execFileAsync('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height', '-of', 'csv=p=0', out,
]);
console.log(`${name}.png -> ${stdout.trim()}`);
