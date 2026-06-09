import React from 'react';
import { ProductCard } from '../ui/Cards';
import { Section, Container, Grid } from '../ui/Layout';
import { useProducts } from '../../context/ProductsContext';

const BestSellers = () => {
  const { bestSellers, loading } = useProducts();

  return (
    <Section spacing="lg" className="bg-brand-bg">
      <Container>
        <h2 className="category-showcase-heading mb-12 text-center md:mb-16">
          Best Sellers
        </h2>

        {loading && bestSellers.length === 0 ? (
          <p className="text-center text-text-muted">Loading best sellers...</p>
        ) : (
          <Grid cols={4} gap="sm" className="gap-4 md:gap-5">
            {bestSellers.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </Grid>
        )}
      </Container>
    </Section>
  );
};

export default BestSellers;
