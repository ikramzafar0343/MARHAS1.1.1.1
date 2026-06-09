import { connectDatabase, disconnectDatabase } from './connection.js';
import { logger } from '../utils/logger.js';
import { Product } from '../modules/products/product.model.js';
import { STOREFRONT_DEFAULTS } from '../constants/storefrontDefaults.js';
import { storefrontRepository } from '../modules/storefront/storefront.repository.js';

const PRODUCT_GALLERY = [
  ['/assets/images/product1.1.jpg', '/assets/images/product1.2.jpg'],
  ['/assets/images/product2.1.jpg', '/assets/images/product2.2.jpg'],
  ['/assets/images/product3.jpg'],
  ['/assets/images/product4.1.jpg', '/assets/images/product4.2.jpg']
];

const usesUploadPath = (value = '') =>
  typeof value === 'string' && value.includes('/uploads/');

const productUsesUploads = (product) => {
  const imagePaths = (product.images || []).map((image) => image.url);
  const variantPaths = (product.variants || []).flatMap((variant) =>
    (variant.images || []).map((image) => image.url)
  );

  return [...imagePaths, ...variantPaths].some(usesUploadPath);
};

export const resetStorefrontContent = async () => {
  await storefrontRepository.resetToDefaults(STOREFRONT_DEFAULTS, {
    key: 'default',
    isPublished: true
  });

  logger.info('Storefront content reset to bundled /assets/images defaults');
};

export const resetBrokenProductImages = async () => {
  const products = await Product.find({}).sort({ sku: 1 });
  let updated = 0;

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];

    if (!productUsesUploads(product)) {
      continue;
    }

    const gallery = PRODUCT_GALLERY[index % PRODUCT_GALLERY.length];
    const images = gallery.map((url, order) => ({
      url,
      alt: product.title,
      order
    }));

    const variants = (product.variants || []).map((variant) => {
      const plain = typeof variant.toObject === 'function' ? variant.toObject() : { ...variant };

      return {
        ...plain,
        images: images.slice(0, 2).map((image) => ({
          url: image.url,
          alt: image.alt
        }))
      };
    });

    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          images,
          variants
        }
      }
    );

    updated += 1;
    logger.info({ sku: product.sku }, 'Product images reset to bundled assets');
  }

  logger.info({ updated }, 'Broken product image reset complete');
};

export const resetBrokenMedia = async () => {
  await resetStorefrontContent();
  await resetBrokenProductImages();
};

const runCli = async () => {
  await connectDatabase();
  await resetBrokenMedia();
  await disconnectDatabase();
  logger.info('Content reset completed successfully');
};

const isDirectRun = process.argv[1]?.endsWith('resetContent.js');

if (isDirectRun) {
  runCli()
    .then(() => process.exit(0))
    .catch(async (error) => {
      logger.error({ err: error }, 'Content reset failed');
      await disconnectDatabase();
      process.exit(1);
    });
}
