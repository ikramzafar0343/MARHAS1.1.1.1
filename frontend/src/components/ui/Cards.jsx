import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiHeart,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineShare,
  HiOutlineTrash
} from 'react-icons/hi';
import { BodyMedium, Caption } from '../ui/Typography';
import { useGlobalContext } from '../../context/GlobalContext';
import { CATEGORY_LABELS } from '../../constants/products';
import useProductImageCycle from '../../hooks/useProductImageCycle';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';
import Logo from './Logo';

/**
 * Shared Card components.
 */

export const ProductCard = ({ product, index }) => {
  const { addToCart, isInWishlist, toggleWishlist } = useGlobalContext();
  const inWishlist = isInWishlist(product.id);
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasSale = Boolean(product.originalPrice && product.originalPrice > product.price);

  const galleryImages = useMemo(() => {
    if (product.images?.length) {
      return product.images;
    }

    return [product.image, product.hoverImage].filter(Boolean);
  }, [product.images, product.image, product.hoverImage]);

  const hasGallery = galleryImages.length > 1;
  const enableGalleryHover =
    hasGallery && (galleryImages.length === 2 || !prefersReducedMotion);
  const [isHovered, setIsHovered] = useState(false);
  const { activeIndex, startCycle, stopCycle } = useProductImageCycle(
    galleryImages,
    enableGalleryHover
  );

  const handleGalleryEnter = () => {
    if (!hasGallery) {
      return;
    }

    setIsHovered(true);
    startCycle();
  };

  const handleGalleryLeave = () => {
    if (!hasGallery) {
      return;
    }

    setIsHovered(false);
    stopCycle();
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const formatPrice = (amount) => `PKR ${amount?.toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className={`product-card group flex flex-col border border-brand-border bg-brand-white overflow-hidden${
        hasGallery ? ' product-card--gallery' : ''
      }${isHovered ? ' is-hovered' : ''}`}
    >
      <div
        className="relative aspect-[2/3] overflow-hidden"
        onMouseEnter={handleGalleryEnter}
        onMouseLeave={handleGalleryLeave}
      >
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <div className="product-card-media">
            {galleryImages.map((imageSrc, imageIndex) => (
              <img
                key={`${product.id}-${imageIndex}`}
                src={imageSrc}
                alt={imageIndex === 0 ? product.name : ''}
                aria-hidden={imageIndex !== 0}
                loading="eager"
                decoding="async"
                className={`product-card-image${
                  hasGallery && imageIndex === activeIndex ? ' is-active' : ''
                }`}
              />
            ))}
          </div>
        </Link>

        {hasGallery && (
          <div
            className="product-card-media-overlay pointer-events-none"
            aria-hidden="true"
          />
        )}

        <div className="product-card-topbar">
          <Logo
            size="sm"
            theme="light"
            className="product-card-brand"
            alt=""
            priority={false}
          />

          <button
            type="button"
            className={`product-card-wishlist${inWishlist ? ' is-active' : ''}`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={inWishlist}
            onClick={handleWishlistToggle}
          >
            {inWishlist ? (
              <HiHeart size={17} />
            ) : (
              <HiOutlineHeart size={17} strokeWidth={1.6} />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleQuickAdd}
          className="product-quick-add"
          aria-label="Quick add to cart"
        >
          +
        </button>
      </div>

      <Link
        to={`/product/${product.id}`}
        className="product-card-details"
      >
        <p className="product-card-name">{product.name}</p>
        <div className="product-card-pricing">
          {hasSale && (
            <span className="product-card-price-original">{formatPrice(product.originalPrice)}</span>
          )}
          <span className={`product-card-price${hasSale ? ' product-card-price--sale' : ''}`}>
            {formatPrice(product.price)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export const WishlistCard = ({ product, index }) => {
  const { addToCart, toggleWishlist } = useGlobalContext();
  const hasSale = Boolean(product.originalPrice && product.originalPrice > product.price);
  const categoryLabel = (CATEGORY_LABELS[product.category] || 'Collection').toUpperCase();

  const galleryImages = useMemo(() => {
    if (product.images?.length) {
      return product.images;
    }

    return [product.image, product.hoverImage].filter(Boolean);
  }, [product.images, product.image, product.hoverImage]);

  const coverImage = galleryImages[0];
  const formatPrice = (amount) => `PKR ${amount?.toLocaleString()}`;

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleMoveToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/product/${product.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch {
        return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      className="wishlist-card group"
    >
      <div className="wishlist-card-media">
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={coverImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="wishlist-card-image"
          />
        </Link>

        <div className="card-gradient-overlay" aria-hidden="true" />

        <div className="wishlist-card-tools">
          <button
            type="button"
            className="wishlist-card-tool-btn is-active"
            aria-label="Remove from wishlist"
            onClick={handleRemove}
          >
            <HiHeart size={15} />
          </button>
          <Link
            to={`/product/${product.id}`}
            className="wishlist-card-tool-btn"
            aria-label="Quick view"
          >
            <HiOutlineEye size={16} strokeWidth={1.6} />
          </Link>
        </div>

        <Link to={`/product/${product.id}`} className="wishlist-card-info">
          <span className="wishlist-card-category">{categoryLabel}</span>
          <h3 className="wishlist-card-name">{product.name}</h3>
          <div className="wishlist-card-pricing">
            {hasSale && (
              <span className="wishlist-card-price-original">{formatPrice(product.originalPrice)}</span>
            )}
            <span className="wishlist-card-price">{formatPrice(product.price)}</span>
          </div>
        </Link>
      </div>

      <div className="wishlist-card-actions">
        <button
          type="button"
          className="wishlist-card-action-btn"
          aria-label="Add to cart"
          onClick={handleMoveToCart}
        >
          +
        </button>
        <button
          type="button"
          className="wishlist-card-action-btn"
          aria-label="Share product"
          onClick={handleShare}
        >
          <HiOutlineShare size={15} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          className="wishlist-card-action-btn"
          aria-label="Remove from wishlist"
          onClick={handleRemove}
        >
          <HiOutlineTrash size={15} strokeWidth={1.6} />
        </button>
      </div>
    </motion.article>
  );
};

export const EditorialCard = ({ title, category, description, image, link }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 1 }}
    className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden border border-brand-border"
  >
    <div className="aspect-[16/9] md:aspect-auto overflow-hidden">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3000ms]"
      />
    </div>
    <div className="bg-brand-bg flex items-center p-12 md:p-24">
      <div className="max-w-sm">
        <Caption className="text-brand-accent mb-6 block">{category}</Caption>
        <h3 className="heading-m mb-8 text-text-main">{title}</h3>
        <BodyMedium className="text-text-sub mb-12">
          {description}
        </BodyMedium>
        <Link to={link} className="text-link text-text-main">
          Read Story
        </Link>
      </div>
    </div>
  </motion.div>
);
