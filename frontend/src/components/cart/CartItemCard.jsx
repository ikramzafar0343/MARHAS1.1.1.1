import React from 'react';
import { Link } from 'react-router-dom';
import { HiHeart, HiOutlineMinus, HiOutlinePlus } from 'react-icons/hi';
import { CATEGORY_LABELS } from '../../constants/products';
import BrandWordmark from '../ui/BrandWordmark';

const formatPrice = (amount) => `PKR ${amount?.toLocaleString()}`;

const CartItemCard = ({
  product,
  item,
  onQuantityChange,
  onRemove,
  onMoveToWishlist
}) => {
  const categoryLabel = (CATEGORY_LABELS[product.category] || 'Collection').toUpperCase();
  const description = product.description?.intro || (
    <>
      Premium <BrandWordmark context="copy" priority={false} /> craftsmanship with refined finishing
      and elegant appeal.
    </>
  );
  const lineTotal = product.price * item.quantity;

  return (
    <article className="cart-item-card">
      <Link to={`/product/${product.id}`} className="cart-item-media">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="cart-item-image"
        />
      </Link>

      <div className="cart-item-body">
        <div className="cart-item-top">
          <div className="cart-item-details">
            <span className="cart-item-category">{categoryLabel}</span>
            <Link to={`/product/${product.id}`} className="cart-item-name">
              {product.name}
            </Link>
            <p className="cart-item-desc">{description}</p>

            <div className="cart-item-meta">
              <span className="cart-item-color">
                <span
                  className="cart-item-swatch"
                  style={{ backgroundColor: item.colorHex }}
                  aria-hidden="true"
                />
                {item.color}
              </span>
              <span className="cart-item-size">Size: {item.size}</span>
            </div>
          </div>

          <div className="cart-item-side">
            <div className="cart-item-qty" aria-label="Quantity">
              <button
                type="button"
                className="cart-item-qty-btn"
                aria-label="Decrease quantity"
                onClick={() => onQuantityChange(item.lineId, item.quantity - 1)}
              >
                <HiOutlineMinus size={14} />
              </button>
              <span className="cart-item-qty-value">{item.quantity}</span>
              <button
                type="button"
                className="cart-item-qty-btn"
                aria-label="Increase quantity"
                onClick={() => onQuantityChange(item.lineId, item.quantity + 1)}
              >
                <HiOutlinePlus size={14} />
              </button>
            </div>
            <p className="cart-item-price">{formatPrice(lineTotal)}</p>
          </div>
        </div>

        <div className="cart-item-actions">
          <button type="button" className="cart-item-action" onClick={() => onRemove(item.lineId)}>
            Remove
          </button>
          <span className="cart-item-action-divider" aria-hidden="true" />
          <button
            type="button"
            className="cart-item-action cart-item-action--wishlist"
            onClick={() => onMoveToWishlist(item.lineId, product.id)}
          >
            <HiHeart size={13} />
            Move to Wishlist
          </button>
        </div>
      </div>
    </article>
  );
};

export default CartItemCard;
