#!/usr/bin/env node
/**
 * Gera os PNGs de ícone, adaptativo, monocromático, splash e favicon a partir
 * de `brand/source/mark.svg`.
 *
 * Uso: node scripts/build-icons.mjs
 *
 * O SVG é a fonte da verdade. `sharp` só roda no desenvolvimento (devDependency)
 * e remove metadados na exportação; os PNGs resultantes vão para
 * `assets/images/` e são commitados.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imagesDir = path.join(root, 'assets/images');

const PINK = '#FF8FA3';
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const markSource = await readFile(
  path.join(root, 'brand/source/mark.svg'),
  'utf8',
);

const monoSource = await readFile(
  path.join(root, 'brand/source/mark-mono.svg'),
  'utf8',
);

async function renderMark(svg, size) {
  // Rasteriza já no tamanho final: redimensionar depois mistura o RGB dos
  // pixels transparentes e deixa um halo claro no contorno.
  const density = (72 * size) / 512;

  return sharp(Buffer.from(svg), { density })
    .resize(size, size, { background: TRANSPARENT, fit: 'contain' })
    .png()
    .toBuffer();
}

async function compose(file, { size, background = TRANSPARENT, scale, svg }) {
  const mark = await renderMark(svg, Math.round(size * scale));

  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ gravity: 'center', input: mark }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(imagesDir, file));

  console.log(`${file} — ${size}px`);
}

async function solid(file, { size, background }) {
  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .png({ compressionLevel: 9 })
    .toFile(path.join(imagesDir, file));

  console.log(`${file} — ${size}px`);
}

const monochrome = monoSource;

await compose('icon.png', {
  background: PINK,
  scale: 0.86,
  size: 1024,
  svg: markSource,
});

await solid('android-icon-background.png', { background: PINK, size: 1024 });

await compose('android-icon-foreground.png', {
  scale: 0.8,
  size: 1024,
  svg: markSource,
});

await compose('android-icon-monochrome.png', {
  scale: 0.8,
  size: 1024,
  svg: monochrome,
});

await compose('splash-icon.png', {
  scale: 0.9,
  size: 768,
  svg: markSource,
});

await compose('favicon.png', {
  background: PINK,
  scale: 0.8,
  size: 64,
  svg: markSource,
});
