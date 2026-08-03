#!/usr/bin/env node
// Rasterises an SVG at a given square size with a transparent background.
//
// There is no rsvg-convert, Inkscape or ImageMagick on this machine, and sharp
// refuses SVGs that use oklch() colours. Chromium is already here for the tour
// recorder and renders SVG correctly, so it does the job.
//
//   node svg2png.mjs <in.svg> <out.png> [size=512]

import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const [input, output, sizeArg] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node svg2png.mjs <in.svg> <out.png> [size]');
  process.exit(1);
}
const size = Number(sizeArg ?? 512);

const svg = await readFile(path.resolve(input), 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: size, height: size },
  deviceScaleFactor: 1,
});

// The SVG is inlined rather than loaded via file:// so it cannot pull in
// anything external, and the page is left transparent so omitBackground works.
await page.setContent(
  `<style>html,body{margin:0;padding:0;background:transparent}
   svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  { waitUntil: 'load' },
);
await page.waitForTimeout(150);
await page.screenshot({ path: path.resolve(output), omitBackground: true });

await browser.close();
console.log(`${output} <- ${input} at ${size}x${size}`);
