import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MARHAS_IMAGE } from '../../constants/images';
import { Section, Container, Grid } from '../ui/Layout';

const categories = [
  { title: 'New Arrival', link: '/collections/new' },
  { title: 'Ready To Wear', link: '/collections/rtw' },
  { title: 'Summer', link: '/collections/summer' },
  { title: 'Unstitched', link: '/collections/unstitched' }
];

const CategoryGrid = () => {
  return (
    <Section spacing="lg" className="bg-brand-bg">
      <Container>
        <Grid cols={2} gap="sm" className="gap-3 md:gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="relative group overflow-hidden"
            >
              <Link to={category.link} className="block relative overflow-hidden">
                <img
                  src={MARHAS_IMAGE}
                  alt={category.title}
                  className="w-full aspect-[16/10] object-cover transition-transform duration-[2500ms] ease-out group-hover:scale-105"
                />

                <div className="card-gradient-overlay" />

                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                  <h3 className="text-brand-white text-lg md:text-xl font-body font-semibold italic tracking-wide">
                    {category.title}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </Grid>
      </Container>
    </Section>
  );
};

export default CategoryGrid;
