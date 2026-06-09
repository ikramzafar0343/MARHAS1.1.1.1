import React, { useRef } from 'react';
import { useCustomerContent } from '../../context/CustomerContentContext';
import CategoryCard from './category/CategoryCard';
import useCategoryStackAnimation from '../../hooks/useCategoryStackAnimation';

const CategoryShowcase = () => {
  const { showcaseCategories, showcaseHeading } = useCustomerContent();
  const stackRef = useRef(null);

  useCategoryStackAnimation(stackRef, showcaseCategories.length);

  if (!showcaseCategories.length) {
    return null;
  }

  return (
    <section className="category-showcase" aria-label="Featured collections">
      <div className="category-showcase-intro">
        <h2 className="category-showcase-heading">{showcaseHeading}</h2>
      </div>

      <div ref={stackRef} className="category-showcase-stack">
        {showcaseCategories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={index}
            totalCards={showcaseCategories.length}
          />
        ))}
      </div>
    </section>
  );
};

export default CategoryShowcase;
