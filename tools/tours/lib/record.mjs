// Shared harness for recording a short, silent product tour of a fleet app.
//
// Output must match the videos already on the crystalprism.io projects page:
// 1280x720, H.264 mp4, ~15s (see index.html video containers + main.js loadVideos).
// Those players are click-to-play with no poster, so the FIRST FRAME is the
// thumbnail a visitor sees. Tours should therefore open on a finished, populated
// screen rather than a blank or loading one.

import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const RAW_DIR = path.join(ROOT, 'raw');
const OUT_DIR = path.join(ROOT, 'out');

export const WIDTH = 1280;
export const HEIGHT = 720;
export const TARGET_SECONDS = 15;

/** Pause for a beat. Tours are paced by these, not by a wall clock. */
export const beat = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Move the mouse to an element's centre along a short arc, so the synthetic
 * cursor glides instead of teleporting, then optionally click it.
 */
export async function glideTo(page, selector, { click = false, steps = 18 } = {}) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) throw new Error(`no bounding box for ${selector}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps });
  await beat(260);
  if (click) {
    await page.mouse.down();
    await beat(70);
    await page.mouse.up();
  }
  return { x, y };
}

/** Smooth wheel scroll, so motion in the video reads as deliberate. */
export async function glideScroll(page, distance, { steps = 26, pause = 22 } = {}) {
  const step = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await beat(pause);
  }
}

/**
 * Record one tour.
 *
 * @param {object} opts
 * @param {string} opts.name        Output basename; must equal the data-project
 *                                  value in crystalprism.io/index.html.
 * @param {string} opts.baseURL     Origin of the locally running app.
 * @param {Array}  [opts.cookies]   Session cookies to seed before first paint.
 * @param {string} [opts.colorScheme]
 * @param {{width: number, height: number}} [opts.viewport]
 *   CSS viewport to lay the app out at. The video is ALWAYS 1280x720; a smaller
 *   viewport is scaled up into it, which is the only lever these tours have on
 *   legibility — the players on the projects page are 345px wide at their widest,
 *   so a text-dense app recorded at 1280 CSS pixels is unreadable there. Keep the
 *   aspect ratio at 16:9 or ffmpeg letterboxes the result.
 * @param {(page: import('playwright').Page) => Promise<void>} opts.tour
 */
export async function recordTour({
  name,
  baseURL,
  cookies = [],
  colorScheme = 'dark',
  viewport = { width: WIDTH, height: HEIGHT },
  tour,
}) {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const rawDir = path.join(RAW_DIR, name);
  await rm(rawDir, { recursive: true, force: true });
  await mkdir(rawDir, { recursive: true });

  const cursorSource = await readFile(path.join(HERE, 'cursor.js'), 'utf8');

  const browser = await chromium.launch({
    args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
  });

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    colorScheme,
    reducedMotion: 'no-preference',
    // Recorded at the VIEWPORT's own size, not at 1280x720. Playwright only ever
    // scales a page DOWN into `size` — asking for a frame larger than the viewport
    // parks the page in the top-left corner of a grey 1280x720 canvas. ffmpeg does
    // the upscale below instead, where it is a plain scale of the whole picture.
    recordVideo: { dir: rawDir, size: viewport },
  });

  if (cookies.length) await context.addCookies(cookies);
  await context.addInitScript(cursorSource);

  // Capture starts the moment the page exists, so the head of every recording is
  // blank-then-loading. We timestamp the handover to tour() and cut everything
  // before it, which matters more than it sounds: the players on the projects
  // page are click-to-play with no poster, so frame 1 IS the thumbnail.
  const page = await context.newPage();
  const started = Date.now();
  let tourStart = started;

  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    // Let fonts settle and any entrance animation finish before the first frame
    // that matters.
    await page.evaluate(() => document.fonts?.ready);
    await beat(600);
    tourStart = Date.now();
    await tour(page);
  } finally {
    const elapsed = (Date.now() - started) / 1000;
    await context.close();
    await browser.close();
    console.log(`  tour ran ${elapsed.toFixed(1)}s of source footage`);
  }

  const trimStart = Math.max(0, (tourStart - started) / 1000);

  const files = (await readdir(rawDir)).filter((f) => f.endsWith('.webm'));
  if (!files.length) throw new Error(`playwright wrote no video for ${name}`);
  const webm = path.join(rawDir, files[0]);
  const mp4 = path.join(OUT_DIR, `${name}.mp4`);

  // Playwright's webm is variable-frame-rate; -vsync cfr + an explicit fps
  // gives a clean 30fps H.264 that Safari and Chrome both scrub reliably.
  console.log(`  trimming ${trimStart.toFixed(1)}s of page load off the head`);

  await execFileAsync('ffmpeg', [
    '-y',
    // -ss before -i seeks fast; the webm is short enough that accuracy holds.
    '-ss', trimStart.toFixed(3),
    '-i', webm,
    '-t', String(TARGET_SECONDS),
    // lanczos is a no-op when the source is already 1280x720 and is what keeps
    // text crisp for a tour recorded at a smaller viewport (see `viewport` above).
    '-vf', `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2,fps=30`,
    '-vsync', 'cfr',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-crf', '23',
    '-preset', 'slow',
    '-movflags', '+faststart',
    '-an',
    mp4,
  ]);

  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    mp4,
  ]);
  const [w, h, dur] = stdout.trim().split('\n');
  console.log(`  ${name}.mp4 -> ${w}x${h}, ${Number(dur).toFixed(2)}s`);

  if (Number(dur) < TARGET_SECONDS - 0.75) {
    console.warn(
      `  WARNING: ${name} is ${Number(dur).toFixed(1)}s, short of the ${TARGET_SECONDS}s target. Add beats to the tour.`,
    );
  }

  return mp4;
}
