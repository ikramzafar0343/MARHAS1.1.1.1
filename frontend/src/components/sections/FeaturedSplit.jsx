import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MARHAS_IMAGE } from '../../constants/images';
import { Section, Container } from '../ui/Layout';

const sideImages = [
  {
    image: MARHAS_IMAGE,
    link: '/collections/rtw'
  },
  {
    image: MARHAS_IMAGE,
    link: '/collections/unstitched'
  },
  {
    image: MARHAS_IMAGE,
    link: '/collections/summer'
  }
];

const FeaturedSplit = () => {
  return (
    <Section spacing="lg" className="bg-brand-bg">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative overflow-hidden border border-brand-border aspect-[3/4] lg:aspect-auto lg:min-h-[600px]"
          >
            <Link to="/collections/summer" className="block w-full h-full">
              <img
                src={MARHAS_IMAGE}
                alt="Summer Collection Feature"
                className="w-full h-full object-cover transition-transform duration-[3000ms] hover:scale-105"
              />
            </Link>
          </motion.div>

          <div className="flex flex-col gap-4 md:gap-6">
            {sideImages.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.15 }}
                className="relative overflow-hidden border border-brand-border flex-1 min-h-[180px] md:min-h-[190px]"
              >
                <Link to={item.link} className="block w-full h-full">
                  <img
                    src={item.image}
                    alt={`Featured look ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-[3000ms] hover:scale-105"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default FeaturedSplit;
