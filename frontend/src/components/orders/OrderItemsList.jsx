import React from 'react';
import PropTypes from 'prop-types';
import { lookupProduct } from '../../utils/productLookup';

const formatItemMeta = (item) =>
  [item.color, item.size ? `Size ${item.size}` : null, `Qty ${item.quantity || 1}`]
    .filter(Boolean)
    .join(' · ');

const getItemImage = (item) => {
  if (item.image) {
    return item.image;
  }

  if (item.productId) {
    const product = lookupProduct(item.productId);
    return product?.image || product?.images?.[0] || '';
  }

  return '';
};

const getItemKey = (item, index) =>
  `${item.productId || item.name}-${item.size || 'na'}-${item.color || 'na'}-${index}`;

const OrderItemsList = ({
  items = [],
  formatPrice,
  label = 'Items',
  listClassName = 'order-item-list',
  itemClassName = 'order-item-row',
  labelClassName = 'order-item-list-label'
}) => {
  if (!items.length) {
    return null;
  }

  return (
    <div className="order-item-list-wrap">
      {label ? <p className={labelClassName}>{label}</p> : null}
      <ul className={listClassName}>
        {items.map((item, index) => {
          const image = getItemImage(item);
          const lineTotal = (item.price || 0) * (item.quantity || 1);

          return (
            <li key={getItemKey(item, index)} className={itemClassName}>
              <div className="order-item-thumb">
                {image ? (
                  <img src={image} alt={item.name} loading="lazy" decoding="async" />
                ) : (
                  <span className="order-item-thumb-fallback" aria-hidden="true">
                    {item.name?.charAt(0) || 'M'}
                  </span>
                )}
              </div>

              <div className="order-item-body">
                <p className="order-item-name">{item.name}</p>
                <p className="order-item-meta">{formatItemMeta(item)}</p>
              </div>

              <span className="order-item-price">{formatPrice(lineTotal)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

OrderItemsList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  formatPrice: PropTypes.func.isRequired,
  label: PropTypes.string,
  listClassName: PropTypes.string,
  itemClassName: PropTypes.string,
  labelClassName: PropTypes.string
};

export default OrderItemsList;
