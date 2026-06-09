import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '../src/assets/images/marhas-logo.png');
const outDir = path.join(__dirname, '../public');

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192.png', size: 192 },
  { name: 'favicon-512.png', size: 512 }
];

const logo = sharp(logoPath).trim({ threshold: 12 }).ensureAlpha();
const meta = await logo.metadata();
const logoBuffer = await logo.png().toBuffer();

for (const { name, size } of sizes) {
  const padding = Math.round(size * 0.18);
  const maxLogoWidth = size - padding * 2;
  const maxLogoHeight = size - padding * 2;
  const scale = Math.min(maxLogoWidth / meta.width, maxLogoHeight / meta.height);
  const width = Math.max(1, Math.round(meta.width * scale));
  const height = Math.max(1, Math.round(meta.height * scale));
  const left = Math.round((size - width) / 2);
  const top = Math.round((size - height) / 2);

  const resized = await sharp(logoBuffer)
    .resize(width, height, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 245, g: 245, b: 244, alpha: 1 }
    }
  })
    .composite([{ input: resized, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, name));
}

console.log('Favicons generated in public/');
