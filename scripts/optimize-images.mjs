// Turns the originals in media-src/ into responsive AVIF + WebP files in public/media/
// and writes src/media.json (intrinsic sizes, so every <img> reserves its space and
// nothing shifts while loading). Re-run after adding or replacing a photo:
//   npm run images
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'media-src';
const OUT = 'public/media';
const WIDTHS = [480, 960, 1600];

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
const manifest = {};

for (const file of files) {
  const { name } = parse(file);
  const input = sharp(join(SRC, file)).rotate();
  const meta = await input.metadata();
  const widths = WIDTHS.filter((w) => w < meta.width);
  widths.push(Math.min(meta.width, 2000));
  const unique = [...new Set(widths)].sort((a, b) => a - b);
  for (const w of unique) {
    const base = input.clone().resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 74 }).toFile(join(OUT, `${name}-${w}.webp`));
  }
  // small blurred-free placeholder colour: the image's dominant tone
  const { dominant } = await input.clone().stats();
  manifest[name] = {
    w: meta.width,
    h: meta.height,
    sizes: unique,
    tone: `rgb(${dominant.r} ${dominant.g} ${dominant.b})`,
  };
  console.log(`${name}: ${meta.width}x${meta.height} -> ${unique.join(', ')}`);
}

await writeFile('src/media.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${files.length} images written to ${OUT}, manifest in src/media.json`);
