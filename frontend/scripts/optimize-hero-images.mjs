import { readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '../src/assets/images');
const MAX_WIDTH = 2560;
const JPEG_QUALITY = 80;
const HERO_PATTERN = /^hero\d+\.jpg$/i;

const formatSize = (bytes) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
};

const optimizeImage = async (filePath) => {
  const fileName = path.basename(filePath);
  const beforeBytes = (await stat(filePath)).size;
  const metadata = await sharp(filePath).metadata();

  let pipeline = sharp(filePath).rotate();

  if ((metadata.width ?? 0) > MAX_WIDTH) {
    pipeline = pipeline.resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
      fit: 'inside'
    });
  }

  const output = await pipeline
    .jpeg({
      quality: JPEG_QUALITY,
      mozjpeg: true
    })
    .toBuffer({ resolveWithObject: true });

  const tempPath = `${filePath}.optimized.tmp`;

  await writeFile(tempPath, output.data);

  try {
    await unlink(filePath);
  } catch {
    // Original may already be gone or locked; rename will surface a clear error.
  }

  await rename(tempPath, filePath);

  const afterBytes = output.data.length;
  const { width, height } = output.info;

  return {
    fileName,
    beforeBytes,
    afterBytes,
    width,
    height,
    savedPercent: Math.round((1 - afterBytes / beforeBytes) * 100)
  };
};

const run = async () => {
  const entries = await readdir(IMAGES_DIR);
  const heroFiles = entries.filter((name) => HERO_PATTERN.test(name)).sort();

  if (heroFiles.length === 0) {
    console.log('No hero images found in src/assets/images');
    return;
  }

  console.log(`Optimizing ${heroFiles.length} hero image(s)...\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const fileName of heroFiles) {
    const filePath = path.join(IMAGES_DIR, fileName);
    const result = await optimizeImage(filePath);

    totalBefore += result.beforeBytes;
    totalAfter += result.afterBytes;

    console.log(
      `${result.fileName}: ${result.width}x${result.height}, ${formatSize(result.beforeBytes)} -> ${formatSize(result.afterBytes)} (${result.savedPercent}% smaller)`
    );
  }

  const totalSaved = Math.round((1 - totalAfter / totalBefore) * 100);

  console.log(
    `\nDone. Total: ${formatSize(totalBefore)} -> ${formatSize(totalAfter)} (${totalSaved}% smaller)`
  );
};

run().catch((error) => {
  console.error('Hero image optimization failed:', error);
  process.exit(1);
});
