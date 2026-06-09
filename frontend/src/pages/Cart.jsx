import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import BrandWordmark from '../components/ui/BrandWordmark';
import { Container } from '../components/ui/Layout';
import SectionIntro from '../components/ui/SectionIntro';
import CartItemCard from '../components/cart/CartItemCard';
import OrderSummary from '../components/cart/OrderSummary';
import RecentlyViewedSection from '../components/sections/RecentlyViewedSection';
import TrustBadges from '../components/sections/TrustBadges';
import { useGlobalContext } from '../context/GlobalContext';
import { resolveCartItems } from '../utils/cart';

const CartEmpty = () => (
  <div className="cart-empty">
    <span className="section-intro-eyebrow">Shopping Bag</span>
    <h1 className="cart-empty-title">Your Bag Is Empty</h1>
    <p className="cart-empty-description">
      Discover <BrandWordmark context="copy" priority={false} /> pieces crafted for elegance, and add
      your favorites to begin checkout.
    </p>

    <div className="cart-empty-actions">
      <Link to="/collections/all" className="luxury-button-solid">
        Continue Shopping
      </Link>
      <Link to="/collections/new" className="luxury-button-outline">
        Explore New Arrivals
      </Link>
    </div>
  </div>
);

const Cart = () => {
  const {
    cartItems,
    cartCount,
    cartSubtotal,
    recentlyViewedIds,
    updateCartQuantity,
    removeFromCart,
    moveCartItemToWishlist
  } = useGlobalContext();

  const resolvedItems = useMemo(() => resolveCartItems(cartItems), [cartItems]);

  const cartProductIds = useMemo(
    () => cartItems.map((item) => item.productId),
    [cartItems]
  );

  return (
    <div className={`cart-page${cartCount === 0 ? ' cart-page--empty' : ''}`}>
      <Container>
        {cartCount === 0 ? (
          <>
            <CartEmpty />
            <RecentlyViewedSection
              productIds={recentlyViewedIds}
              className="cart-recently-viewed cart-recently-viewed--empty"
            />
          </>
        ) : (
          <>
            <SectionIntro
              className="cart-page-intro"
              eyebrow="Shopping Bag"
              title="Your Selected Pieces"
              description="Review your curated selection before checkout."
            />

            <div className="cart-layout">
              <div className="cart-items-list">
                {resolvedItems.map(({ item, product }) => (
                  <CartItemCard
                    key={item.lineId}
                    product={product}
                    item={item}
                    onQuantityChange={updateCartQuantity}
                    onRemove={removeFromCart}
                    onMoveToWishlist={moveCartItemToWishlist}
                  />
                ))}
              </div>

              <OrderSummary subtotal={cartSubtotal} itemCount={cartCount} />
            </div>

            <RecentlyViewedSection
              productIds={recentlyViewedIds}
              excludeIds={cartProductIds}
              className="cart-recently-viewed"
            />
          </>
        )}
      </Container>

      {cartCount > 0 && <TrustBadges className="cart-trust-badges" />}
    </div>
  );
};

export default Cart;
