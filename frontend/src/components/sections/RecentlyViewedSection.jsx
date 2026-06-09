import React, { useMemo } from 'react';
import { Grid } from '../ui/Layout';
import { ProductCard } from '../ui/Cards';
import { useProducts } from '../../context/ProductsContext';

const RecentlyViewedSection = ({
  productIds,
  excludeIds = [],
  limit = 4,
  className = ''
}) => {
  const { getProductById } = useProducts();

  const products = useMemo(() => {
    const excluded = new Set(excludeIds.map(String));

    return productIds
      .map(String)
      .filter((id) => id && !excluded.has(id))
      .slice(0, limit)
      .map(getProductById)
      .filter(Boolean);
  }, [productIds, excludeIds, limit, getProductById]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`recently-viewed-section ${className}`.trim()}>
      <h2 className="recently-viewed-title">
        Recently <span className="recently-viewed-title-accent">Viewed</span>
      </h2>

      <Grid cols={4} gap="md" className="grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </Grid>
    </section>
  );
};

export default RecentlyViewedSection;
