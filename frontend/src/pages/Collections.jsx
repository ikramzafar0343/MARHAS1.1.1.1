import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useCustomerContent } from '../context/CustomerContentContext';
import { useProducts } from '../context/ProductsContext';
import { resolveImageAsset } from '../utils/customerContentHelpers';
import { ProductCard } from '../components/ui/Cards';
import { Section, Container, Grid } from '../components/ui/Layout';
import { BodyMedium } from '../components/ui/Typography';

const BANNER_SPLIT_INDEX = 6;

const CollectionBanner = ({ bannerImage, resolvedImage, activeCategory }) => (
  <motion.div
    key={`${activeCategory}-banner`}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.65, ease: 'easeOut' }}
    className={`collection-banner collection-banner--${activeCategory}`}
    aria-label={resolvedImage.alt}
  >
    <picture className="collection-banner-picture">
      {resolvedImage.webp && <source srcSet={resolvedImage.webp} type="image/webp" />}
      <img
        src={resolvedImage.jpg}
        className="collection-banner-img"
        style={{ objectPosition: bannerImage.objectPosition }}
        alt={resolvedImage.alt}
        loading="lazy"
      />
    </picture>
  </motion.div>
);

const ProductGrid = ({ products }) => (
  <Grid cols={3} gap="lg">
    <AnimatePresence mode="popLayout">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6 }}
        >
          <ProductCard product={product} index={index} />
        </motion.div>
      ))}
    </AnimatePresence>
  </Grid>
);

const Collections = () => {
  const { category: activeCategory = 'all' } = useParams();
  const { getCollectionHero, getCollectionHeroTitle } = useCustomerContent();
  const { getProductsByCategory, loading } = useProducts();

  const heroImage = getCollectionHero(activeCategory);
  const heroVisible = heroImage.visible !== false;
  const heroData = {
    title: getCollectionHeroTitle(activeCategory),
    image: heroImage
  };
  const bannerImage = getCollectionHero(activeCategory === 'all' ? 'all' : activeCategory);
  const resolvedBanner = resolveImageAsset(bannerImage);
  const resolvedHero = resolveImageAsset(heroData.image);

  const filteredProducts = getProductsByCategory(activeCategory);

  const splitIndex = Math.min(BANNER_SPLIT_INDEX, filteredProducts.length);
  const productsBeforeBanner = filteredProducts.slice(0, splitIndex);
  const productsAfterBanner = filteredProducts.slice(splitIndex);
  const showBanner = filteredProducts.length > 0;

  return (
    <div className="bg-brand-bg min-h-screen">
      {heroVisible && (
      <section className={`collection-hero collection-hero--${activeCategory}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-bg`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="collection-hero-bg"
          >
            <picture className="collection-hero-picture">
              {resolvedHero.webp && (
                <source srcSet={resolvedHero.webp} type="image/webp" />
              )}
              <img
                src={resolvedHero.jpg}
                className="collection-hero-bg-image"
                style={{ objectPosition: heroData.image.objectPosition }}
                alt={resolvedHero.alt}
              />
            </picture>
            <div className="collection-hero-bg-gradient" aria-hidden="true" />
          </motion.div>
        </AnimatePresence>

        <div className="collection-hero-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <h1 className="collection-hero-title">
                {heroData.title.first}{' '}
                <span className="collection-hero-title-accent">{heroData.title.second}</span>
              </h1>
            </motion.div>
          </AnimatePresence>
          <div className="collection-hero-divider" aria-hidden="true" />
        </div>
      </section>
      )}

      <Section spacing="md">
        <Container>
          {productsBeforeBanner.length > 0 && <ProductGrid products={productsBeforeBanner} />}

          {showBanner && heroVisible && (
            <CollectionBanner
              bannerImage={bannerImage}
              resolvedImage={resolvedBanner}
              activeCategory={activeCategory}
            />
          )}

          {productsAfterBanner.length > 0 && <ProductGrid products={productsAfterBanner} />}

          {loading && filteredProducts.length === 0 && (
            <div className="py-40 text-center">
              <BodyMedium className="italic text-xl text-text-muted">
                Loading collection...
              </BodyMedium>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="py-40 text-center">
              <BodyMedium className="italic text-xl text-text-muted">
                Discovering more pieces soon...
              </BodyMedium>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
};

export default Collections;
