import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AiFillStar } from 'react-icons/ai';
import product11 from '../../assets/images/product1.1.jpg';
import product21 from '../../assets/images/product2.1.jpg';
import newArrival from '../../assets/images/newArrival.jpg';
import summer from '../../assets/images/summer.jpg';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';
import { replaceBrandInText } from '../../utils/brandText';

const AUTO_PLAY_MS = 5000;
const MANUAL_PAUSE_MS = 8000;

const PRODUCT_TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah K.',
    quote:
      'I recently ordered a ready-to-wear outfit from MARHAS, and the quality exceeded my expectations. The fabric feels premium, the stitching is flawless, and the fit was perfect. I received so many compliments. Highly recommended!',
    image: product11
  },
  {
    id: 2,
    name: 'Ayesha R.',
    quote:
      'The embroidery detail is breathtaking and the silhouette feels modern yet timeless. MARHAS has become my first choice for festive occasions.',
    image: newArrival
  },
  {
    id: 3,
    name: 'Zara M.',
    quote:
      'From fabric to finish, everything feels thoughtfully made. The drape, the comfort, and the elegance — all worth every rupee.',
    image: summer
  },
  {
    id: 4,
    name: 'Fatima A.',
    quote:
      'Beautiful packaging, premium quality, and styles that feel luxurious without being overdone. Truly a refined shopping experience.',
    image: product21
  }
];

const ProductTestimonialSlide = ({ testimonial }) => (
  <div className="product-testimonial-showcase">
    <div className="product-testimonial-image-col">
      <div className="product-testimonial-blob">
        <img src={testimonial.image} alt={testimonial.name} loading="lazy" />
      </div>
    </div>

    <div className="product-testimonial-content-col">
      <div className="product-testimonial-stars" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }).map((_, index) => (
          <AiFillStar key={index} />
        ))}
      </div>

      <blockquote className="product-testimonial-quote">
        {replaceBrandInText(testimonial.quote)}
      </blockquote>

      <p className="product-testimonial-name">— {testimonial.name}</p>
    </div>
  </div>
);

const ProductTestimonials = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const pauseUntilRef = useRef(0);

  const pauseAutoplay = useCallback((durationMs = MANUAL_PAUSE_MS) => {
    pauseUntilRef.current = Date.now() + durationMs;
  }, []);

  const selectSlide = useCallback(
    (index) => {
      setActiveIndex(index);
      pauseAutoplay();
    },
    [pauseAutoplay]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isHovered || Date.now() < pauseUntilRef.current) {
        return;
      }

      setActiveIndex((current) => (current + 1) % PRODUCT_TESTIMONIALS.length);
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
  }, [isHovered]);

  const active = PRODUCT_TESTIMONIALS[activeIndex];

  return (
    <section className="product-testimonial-section" aria-label="Client reviews">
      <div
        className="product-testimonial-slider"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className="w-full"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -18 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductTestimonialSlide testimonial={active} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="product-testimonial-dots">
        {PRODUCT_TESTIMONIALS.map((testimonial, index) => (
          <button
            key={testimonial.id}
            type="button"
            aria-label={`Show review from ${testimonial.name}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => selectSlide(index)}
            className={`product-testimonial-dot ${
              index === activeIndex ? 'product-testimonial-dot-active' : ''
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductTestimonials;
