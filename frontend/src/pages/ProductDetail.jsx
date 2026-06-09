import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiHeart,
  HiOutlineHeart,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineShieldCheck,
  HiOutlineTruck
} from 'react-icons/hi';
import InstagramGrid from '../components/sections/InstagramGrid';
import { Container, Grid } from '../components/ui/Layout';
import { ProductCard } from '../components/ui/Cards';
import Logo from '../components/ui/Logo';
import { replaceBrandInText } from '../utils/brandText';
import { CATEGORY_LABELS, getCategoryPath, buildCraftsmanshipFeature } from '../constants/products';
import { useProducts } from '../context/ProductsContext';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import useProductGalleryAutoplay, {
  buildProductGalleryImages
} from '../hooks/useProductGalleryAutoplay';
import { useGlobalContext } from '../context/GlobalContext';

const DEFAULT_COLORS = [
  { name: 'Ivory Gold', hex: '#EAE0D5' },
  { name: 'Soft Sand', hex: '#C9A86A' },
  { name: 'Deep Charcoal', hex: '#4A4238' }
];

const ProductDetail = () => {
  const { id } = useParams();
  const { isInWishlist, toggleWishlist, addToCart, addRecentlyViewed } = useGlobalContext();
  const { getProductById, fetchProductById, products, loading: catalogLoading } = useProducts();
  const [catalogProduct, setCatalogProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [activeTab, setActiveTab] = useState('Description');

  useEffect(() => {
    setQuantity(1);
    setSelectedColor(0);
    setSelectedSize('M');
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      setLoadingProduct(true);
      const cached = getProductById(id);

      if (cached) {
        if (active) {
          setCatalogProduct(cached);
          setLoadingProduct(false);
        }
        return;
      }

      const product = await fetchProductById(id);
      if (active) {
        setCatalogProduct(product);
        setLoadingProduct(false);
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [id, getProductById, fetchProductById]);

  useEffect(() => {
    if (catalogProduct?.id) {
      addRecentlyViewed(catalogProduct.id);
    }
  }, [catalogProduct?.id, addRecentlyViewed]);

  const productImages = useMemo(
    () => buildProductGalleryImages(catalogProduct),
    [catalogProduct]
  );

  const { activeIndex: activeImg, selectImage } = useProductGalleryAutoplay(productImages, {
    enabled: productImages.length > 1
  });

  const relatedProducts = useMemo(
    () => products.filter((item) => String(item.id) !== String(catalogProduct?.id)).slice(0, 4),
    [products, catalogProduct]
  );

  const suggestedProducts = relatedProducts;

  if (loadingProduct || catalogLoading) {
    return (
      <div className="product-detail-page">
        <Container>
          <div className="py-40 text-center">
            <p className="product-title mb-4">Loading product...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (!catalogProduct) {
    return (
      <div className="product-detail-page">
        <Container>
          <div className="py-40 text-center">
            <p className="product-title mb-4">Product not found</p>
            <Link to="/collections/all" className="product-size-guide">
              Back to Collections
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const product = {
    ...catalogProduct,
    brand: 'MARHAS',
    sku: catalogProduct.sku || `M.${String(catalogProduct.id).slice(-4)}`,
    images: productImages,
    colors: DEFAULT_COLORS,
    sizes: catalogProduct.sizes?.length ? catalogProduct.sizes : ['XS', 'S', 'M', 'L', 'XL']
  };

  const categoryLabel = CATEGORY_LABELS[product.category] || 'Collections';
  const categoryPath = getCategoryPath(product.category);
  const craftsmanshipFeature = buildCraftsmanshipFeature(product);

  const tabContent = {
    Description: (
      <div className="product-tab-prose">
        <p>{replaceBrandInText(product.description.intro)}</p>
        <p>{replaceBrandInText(product.description.detail)}</p>
        <ul className="product-tab-list">
          {product.description.highlights.map((item) => (
            <li key={item}>{replaceBrandInText(item)}</li>
          ))}
        </ul>
      </div>
    ),
    Specifications: (
      <div className="product-tab-details">
        <p>
          <strong className="text-brand-primary">Composition:</strong>{' '}
          {product.specifications.composition}
        </p>
        <p>
          <strong className="text-brand-primary">Care:</strong> {product.specifications.care}
        </p>
        <p>
          <strong className="text-brand-primary">Includes:</strong>{' '}
          {product.specifications.includes}
        </p>
      </div>
    ),
    'Return Policy': (
      <div className="product-tab-details">
        <p>14-day exchange policy for unworn items with original tags intact.</p>
        <p>Nationwide delivery within 3–5 working days. Free shipping on orders above PKR 15,000.</p>
        <p>Secure checkout with encrypted payment processing.</p>
      </div>
    )
  };

  const tabs = ['Description', 'Specifications', 'Return Policy'];
  const featureImage = product.images[1] || product.images[0];

  return (
    <div className="product-detail-page">
      <Container>
        <nav className="product-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/collections/all">Collections</Link>
          <span>/</span>
          <Link to={categoryPath}>{categoryLabel}</Link>
          <span>/</span>
          <span className="text-text-sub">{product.name}</span>
        </nav>

        <div className="product-hero">
          {product.images.length > 1 && (
            <div className="product-thumbs">
              {product.images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => selectImage(idx)}
                  className={`product-thumb ${activeImg === idx ? 'product-thumb-active' : ''}`}
                >
                  <img src={img} className="product-thumb-image" alt={`View ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          <div className={`product-main-image${product.images.length <= 1 ? ' product-main-image--solo' : ''}`}>
            <motion.img
              key={`${product.id}-${activeImg}`}
              initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
              src={product.images[activeImg]}
              alt={product.name}
            />
          </div>

          <div className="product-info">
            <div className="product-info-head">
              <Logo
                size="sm"
                theme="dark"
                className="product-brand"
                alt=""
                priority={false}
              />
              <h1 className="product-title">{product.name}</h1>
              <p className="product-sku">{product.sku}</p>
              <p className="product-price">PKR {product.price.toLocaleString()}</p>
            </div>

            <div className="product-option">
              <span className="product-option-label">Color</span>
              <div className="product-color-swatches">
                {product.colors.map((color, idx) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(idx)}
                    className={`product-color-swatch ${
                      selectedColor === idx ? 'product-color-swatch-active' : ''
                    }`}
                    aria-label={color.name}
                  >
                    <span style={{ backgroundColor: color.hex }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="product-option">
              <span className="product-option-label">Size</span>
              <div className="product-size-list">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`product-size-btn ${
                      selectedSize === size ? 'product-size-btn-active' : 'product-size-btn-inactive'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-option">
              <span className="product-option-label">Quantity</span>
              <div className="product-qty">
                <button
                  type="button"
                  className="product-qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  <HiOutlineMinus size={14} />
                </button>
                <span className="product-qty-value">{quantity}</span>
                <button
                  type="button"
                  className="product-qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <HiOutlinePlus size={14} />
                </button>
              </div>
            </div>

            <div className="product-actions">
              <button
                type="button"
                className="product-btn-cart"
                onClick={() =>
                  addToCart(catalogProduct.id, {
                    quantity,
                    size: selectedSize,
                    color: product.colors[selectedColor].name,
                    colorHex: product.colors[selectedColor].hex
                  })
                }
              >
                Add To Cart
              </button>
              <button type="button" className="product-btn-buy">
                Buy It Now
              </button>
              <button
                type="button"
                className="product-wishlist-btn"
                onClick={() => toggleWishlist(catalogProduct.id)}
              >
                {isInWishlist(catalogProduct.id) ? (
                  <HiHeart size={16} />
                ) : (
                  <HiOutlineHeart size={16} />
                )}
                {isInWishlist(catalogProduct.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            <div className="product-trust-row">
              <div className="product-trust-item">
                <HiOutlineTruck size={14} />
                Free Shipping
              </div>
              <div className="product-trust-item">
                <HiOutlineShieldCheck size={14} />
                Easy Returns
              </div>
              <div className="product-trust-item">
                <HiOutlineShieldCheck size={14} />
                Secure Payment
              </div>
            </div>
          </div>
        </div>

        <div className="product-tabs-wrap">
          <div className="product-tabs-nav">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`product-tab-btn ${
                  activeTab === tab ? 'product-tab-btn-active' : 'product-tab-btn-inactive'
                }`}
              >
                {tab}
                {activeTab === tab && <span className="product-tab-indicator" />}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="product-tab-panel"
          >
            <div className="product-tab-content">{tabContent[activeTab]}</div>
          </motion.div>
        </div>

        <div className="product-feature-grid">
          <div className="product-feature-image">
            <img src={featureImage} alt={`${product.name} detail`} loading="lazy" />
          </div>
          <div className="px-2 lg:px-6">
            <p className="product-feature-label">{craftsmanshipFeature.label}</p>
            <h2 className="product-feature-title">
              {craftsmanshipFeature.titlePrimary}
              {craftsmanshipFeature.titleAccent && (
                <>
                  {' '}
                  <span className="product-feature-title-accent">
                    {craftsmanshipFeature.titleAccent}
                  </span>
                </>
              )}
            </h2>
            <p className="product-feature-desc">{craftsmanshipFeature.description}</p>
          </div>
        </div>

        <section className="product-carousel-section">
          <h2 className="product-section-title">
            Complete <span className="product-section-title-accent">The Look</span>
          </h2>
          <Grid cols={4} gap="md" className="grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </Grid>
        </section>
      </Container>

      <InstagramGrid />

      <Container>
        <section className="product-carousel-section product-carousel-section--last">
          <h2 className="product-section-title">You May Also Like</h2>
          <Grid cols={4} gap="md" className="grid-cols-2 lg:grid-cols-4">
            {suggestedProducts.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </Grid>
        </section>
      </Container>
    </div>
  );
};

export default ProductDetail;
