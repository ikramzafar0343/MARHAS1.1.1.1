import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = process.argv[2];
const OUT_DIR = path.join(__dirname, '../src/assets/images');

if (!SOURCE) {
  console.error('Usage: node scripts/optimize-logo.mjs <source-image>');
  process.exit(1);
}

const original = await sharp(SOURCE).metadata();
const trimmed = await sharp(SOURCE).trim({ threshold: 12 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = new Uint8ClampedArray(trimmed.data);

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];

  if (r > 235 && g > 235 && b > 235) {
    pixels[i + 3] = 0;
  }
}

const base = await sharp(Buffer.from(pixels), {
  raw: {
    width: trimmed.info.width,
    height: trimmed.info.height,
    channels: 4
  }
})
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer({ resolveWithObject: true });

const retina = await sharp(base.data)
  .resize({
    width: trimmed.info.width * 2,
    height: trimmed.info.height * 2,
    kernel: sharp.kernel.lanczos3
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

await mkdir(OUT_DIR, { recursive: true });
await writeFile(path.join(OUT_DIR, 'marhas-logo.png'), base.data);
await writeFile(path.join(OUT_DIR, 'marhas-logo@2x.png'), retina);

console.log(
  JSON.stringify(
    {
      original: { width: original.width, height: original.height },
      cropped: {
        width: trimmed.info.width,
        height: trimmed.info.height,
        aspectRatio: Number((trimmed.info.width / trimmed.info.height).toFixed(3))
      },
      output: ['marhas-logo.png', 'marhas-logo@2x.png']
    },
    null,
    2
  )
);
