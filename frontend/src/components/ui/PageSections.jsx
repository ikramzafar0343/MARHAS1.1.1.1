import React from 'react';
import { motion } from 'framer-motion';
import { Caption } from './Typography';
import Button from './Button';

/**
 * Standardized Header and Hero components.
 */

export const PageHeader = ({ title, subtitle, centered = true }) => (
  <div className={`mb-16 md:mb-20 ${centered ? 'text-center' : ''}`}>
    {subtitle && (
      <Caption className="text-brand-accent mb-4 block">
        {subtitle}
      </Caption>
    )}
    <h2 className="section-heading mb-6">
      {title}
    </h2>
    <div className={`w-12 h-[1px] bg-brand-accent ${centered ? 'mx-auto' : ''}`} />
  </div>
);

export const PageHero = ({ 
  title, 
  subtitle, 
  image, 
  ctaText, 
  ctaLink, 
  ctaVariant = 'primary',
  overlay = true,
  height = 'screen' 
}) => {
  const heightStyles = {
    screen: 'min-h-screen',
    large: 'h-[80vh]',
    medium: 'h-[60vh]',
    small: 'h-[40vh]'
  };

  return (
    <section className={`relative w-full flex items-center justify-center overflow-hidden ${heightStyles[height] || heightStyles.screen}`}>
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        {overlay && <div className="absolute inset-0 bg-black/20" />}
      </motion.div>

      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {subtitle && (
            <Caption className="text-white mb-6 block drop-shadow-sm">
              {subtitle}
            </Caption>
          )}
          <h1 className="heading-l text-white text-5xl md:text-7xl mb-12 drop-shadow-lg">
            {title}
          </h1>
          {ctaText && (
            <Button 
              variant={ctaVariant}
              onClick={() => window.location.href = ctaLink}
              className={ctaVariant === 'primary' ? 'bg-white text-brand-primary border-white hover:bg-brand-accent hover:border-brand-accent hover:text-white' : ''}
            >
              {ctaText}
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  );
};
