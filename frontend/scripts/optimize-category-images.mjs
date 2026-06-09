import { rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '../src/assets/images');
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 80;
const BLUR_WIDTH = 40;

const CATEGORY_FILES = [
  'newArrival.jpg',
  'summer.jpg',
  'readyToWear.jpg',
  'unstiched.jpg'
];

const formatSize = (bytes) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
};

const writeOptimized = async (filePath, buffer) => {
  const tempPath = `${filePath}.optimized.tmp`;

  await writeFile(tempPath, buffer);

  try {
    await unlink(filePath);
  } catch {
    // Ignore if original is locked; rename will fail with a clear error.
  }

  await rename(tempPath, filePath);
};

const optimizeCategoryImage = async (fileName) => {
  const filePath = path.join(IMAGES_DIR, fileName);
  const baseName = path.basename(fileName, path.extname(fileName));
  const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);
  const blurPath = path.join(IMAGES_DIR, `${baseName}-blur.jpg`);

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

  const jpegOutput = await pipeline
    .clone()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  await writeOptimized(filePath, jpegOutput.data);

  const webpOutput = await sharp(jpegOutput.data)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  await writeFile(webpPath, webpOutput);

  const blurOutput = await sharp(jpegOutput.data)
    .resize(BLUR_WIDTH, null, { withoutEnlargement: true })
    .blur(3)
    .jpeg({ quality: 55, mozjpeg: true })
    .toBuffer();

  await writeFile(blurPath, blurOutput);

  return {
    fileName,
    width: jpegOutput.info.width,
    height: jpegOutput.info.height,
    beforeBytes,
    afterBytes: jpegOutput.data.length,
    webpBytes: webpOutput.length,
    blurBytes: blurOutput.length
  };
};

const run = async () => {
  console.log(`Optimizing ${CATEGORY_FILES.length} category image(s)...\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const fileName of CATEGORY_FILES) {
    const result = await optimizeCategoryImage(fileName);

    totalBefore += result.beforeBytes;
    totalAfter += result.afterBytes;

    console.log(
      `${result.fileName}: ${result.width}x${result.height}, ${formatSize(result.beforeBytes)} -> ${formatSize(result.afterBytes)}`
    );
    console.log(
      `  + ${path.basename(fileName, path.extname(fileName))}.webp (${formatSize(result.webpBytes)}), blur (${formatSize(result.blurBytes)})`
    );
  }

  const totalSaved = Math.round((1 - totalAfter / totalBefore) * 100);

  console.log(
    `\nDone. JPEG total: ${formatSize(totalBefore)} -> ${formatSize(totalAfter)} (${totalSaved}% smaller)`
  );
};

run().catch((error) => {
  console.error('Category image optimization failed:', error);
  process.exit(1);
});
