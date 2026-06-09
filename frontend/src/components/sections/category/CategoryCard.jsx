import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { HiOutlineShoppingBag } from 'react-icons/hi';
import { resolveImageAsset } from '../../../utils/customerContentHelpers';

const CategoryCard = ({ category, index, totalCards }) => {
  const image = resolveImageAsset(category.image);
  const titleId = `category-title-${category.id}`;
  const editorialLayout = category.layout?.startsWith('editorial-') ? category.layout : null;
  const isEditorial = Boolean(editorialLayout);

  return (
    <article
      className={`category-card${editorialLayout ? ` category-card--${editorialLayout}` : ''}`}
      style={{ '--category-index': index + 1 }}
      aria-labelledby={titleId}
    >
      <div
        className="category-card-sticky"
        style={{
          '--category-image-position': category.image?.objectPosition || 'center center'
        }}
      >
        <div className="category-card-inner">
          <picture className="category-card-picture">
            {image.webp && (
              <source srcSet={image.webp} type="image/webp" />
            )}
            <img
              src={image.jpg}
              alt={image.alt}
              className="category-card-image"
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'auto'}
            />
          </picture>

          <div className="category-card-overlay" aria-hidden="true" />

          <div
            className={`category-card-content${
              editorialLayout ? ` category-card-content--${editorialLayout}` : ''
            }`}
          >
            {category.label && <p className="category-card-label">{category.label}</p>}
            <h2 id={titleId} className="category-card-title">
              {category.title}
            </h2>
            <p className="category-card-description">{category.description}</p>
            <Link
              to={category.link}
              className={`category-shop-btn${isEditorial ? ' category-shop-btn--dark' : ''}`}
            >
              {isEditorial && <HiOutlineShoppingBag size={17} strokeWidth={1.6} aria-hidden="true" />}
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {index === totalCards - 1 && <div className="category-card-spacer" aria-hidden="true" />}
    </article>
  );
};

CategoryCard.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    layout: PropTypes.string,
    label: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    image: PropTypes.shape({
      jpg: PropTypes.string.isRequired,
      webp: PropTypes.string,
      blur: PropTypes.string,
      alt: PropTypes.string.isRequired
    }).isRequired
  }).isRequired,
  index: PropTypes.number.isRequired,
  totalCards: PropTypes.number.isRequired
};

export default CategoryCard;
