import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import BrandWordmark from '../components/ui/BrandWordmark';
import { AnimatePresence } from 'framer-motion';
import { Container, Grid } from '../components/ui/Layout';
import { ProductCard, WishlistCard } from '../components/ui/Cards';
import ShopTheLookRow from '../components/sections/ShopTheLookRow';
import { useGlobalContext } from '../context/GlobalContext';
import { useProducts } from '../context/ProductsContext';

const getCompleteLookProducts = (allProducts, wishlistIds, limit = 4) => {
  const wishlistSet = new Set(wishlistIds.map(String));
  const savedCategories = new Set(
    allProducts.filter((product) => wishlistSet.has(String(product.id))).map((product) => product.category)
  );

  const available = allProducts.filter((product) => !wishlistSet.has(String(product.id)));
  const sameCategory = available.filter((product) => savedCategories.has(product.category));
  const otherCategory = available.filter((product) => !savedCategories.has(product.category));

  return [...sameCategory, ...otherCategory].slice(0, limit);
};

const WishlistEmpty = () => (
  <div className="wishlist-empty">
    <span className="wishlist-eyebrow">Your Collection</span>
    <h1 className="wishlist-title">Saved Pieces You Love</h1>
    <p className="wishlist-description">
      Curate your personal fashion wardrobe and revisit your favorite{' '}
      <BrandWordmark context="copy" priority={false} /> pieces anytime.
    </p>

    <div className="wishlist-actions">
      <Link to="/collections/all" className="luxury-button-solid">
        Continue Shopping
      </Link>
      <Link to="/collections/new" className="luxury-button-outline">
        Explore New Arrivals
      </Link>
    </div>
  </div>
);

const WishlistFilled = ({ products, wishlistCount, completeLookProducts }) => (
  <>
    <div className="wishlist-header">
      <span className="wishlist-eyebrow">Your Collection</span>
      <h1 className="wishlist-title wishlist-title--compact">Saved Pieces You Love</h1>
      <p className="wishlist-description">
        {wishlistCount} {wishlistCount === 1 ? 'piece' : 'pieces'} saved to your wishlist.
      </p>
    </div>

    <div className="wishlist-grid-wrap">
      <Grid cols={4} gap="md">
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <WishlistCard key={product.id} product={product} index={index} />
          ))}
        </AnimatePresence>
      </Grid>
    </div>

    {completeLookProducts.length > 0 && (
      <section className="wishlist-complete-section">
        <h2 className="product-section-title">
          Complete <span className="product-section-title-accent">The Look</span>
        </h2>
        <Grid cols={4} gap="md" className="grid-cols-2 lg:grid-cols-4">
          {completeLookProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </Grid>
      </section>
    )}

    <ShopTheLookRow className="wishlist-shop-look-section" />
  </>
);

const Wishlist = () => {
  const { wishlistIds, wishlistCount } = useGlobalContext();
  const { products } = useProducts();

  const savedProducts = useMemo(
    () => products.filter((product) => wishlistIds.includes(String(product.id))),
    [products, wishlistIds]
  );

  const completeLookProducts = useMemo(
    () => (wishlistCount > 0 ? getCompleteLookProducts(products, wishlistIds) : []),
    [products, wishlistIds, wishlistCount]
  );

  return (
    <div className="wishlist-page">
      <Container>
        {wishlistCount === 0 ? (
          <WishlistEmpty />
        ) : (
          <WishlistFilled
            products={savedProducts}
            wishlistCount={wishlistCount}
            completeLookProducts={completeLookProducts}
          />
        )}
      </Container>
    </div>
  );
};

export default Wishlist;
