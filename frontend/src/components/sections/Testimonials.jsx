import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiFillStar } from 'react-icons/ai';
import { MARHAS_IMAGE } from '../../constants/images';
import { Section, Container } from '../ui/Layout';
import { PageHeader } from '../ui/PageSections';
import { replaceBrandInText } from '../../utils/brandText';

const AUTO_PLAY_MS = 5500;

const testimonials = [
  {
    id: 1,
    name: 'Aisha Khan',
    quote: 'The quality and craftsmanship are absolutely exceptional. Every piece feels like a work of art.',
    image: MARHAS_IMAGE
  },
  {
    id: 2,
    name: 'Zara Ahmed',
    quote: 'MARHAS has redefined luxury eastern wear. The attention to detail is unmatched.',
    image: MARHAS_IMAGE
  },
  {
    id: 3,
    name: 'Fatima Ali',
    quote: 'Finally, a brand that understands the modern woman who values tradition and elegance.',
    image: MARHAS_IMAGE
  },
  {
    id: 4,
    name: 'Sana Malik',
    quote: 'From fabric to finish, every order feels thoughtfully curated. Truly a luxury experience.',
    image: MARHAS_IMAGE
  },
  {
    id: 5,
    name: 'Hira Sheikh',
    quote: 'Elegant silhouettes with impeccable stitching — MARHAS is my go-to for special occasions.',
    image: MARHAS_IMAGE
  },
  {
    id: 6,
    name: 'Mehwish Raza',
    quote: 'Beautiful packaging, premium quality, and styles that feel timeless yet contemporary.',
    image: MARHAS_IMAGE
  }
];

const TestimonialSeal = () => (
  <svg
    className="testimonial-seal"
    viewBox="0 0 100 100"
    aria-hidden="true"
  >
    <defs>
      <path
        id="testimonialSealPath"
        d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0"
      />
    </defs>
    <text className="testimonial-seal-text">
      <textPath href="#testimonialSealPath" startOffset="0%">
        TIMELESS ELEGANCE SINCE • TIMELESS ELEGANCE SINCE •
      </textPath>
    </text>
    <path
      d="M50 42 L52.5 48 L59 48 L54 52 L56 58 L50 54 L44 58 L46 52 L41 48 L47.5 48 Z"
      fill="var(--color-brand-accent)"
      opacity="0.9"
    />
  </svg>
);

const TestimonialShowcase = ({ testimonial }) => (
  <div className="testimonial-showcase">
    <div className="testimonial-image-col">
      <div className="testimonial-oval-wrap">
        <TestimonialSeal />
        <div className="testimonial-oval-frame">
          <img
            src={testimonial.image}
            alt={testimonial.name}
            loading="lazy"
          />
        </div>
        <div className="testimonial-oval-shadow" aria-hidden="true" />
      </div>
    </div>

    <div className="testimonial-content-col">
      <div className="testimonial-stars" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <AiFillStar key={i} className="text-brand-accent text-sm" />
        ))}
      </div>

      <blockquote className="testimonial-quote">
        <span className="testimonial-quote-mark">&ldquo;</span>
        {replaceBrandInText(testimonial.quote)}
        <span className="testimonial-quote-mark">&rdquo;</span>
      </blockquote>

      <div className="testimonial-divider" aria-hidden="true" />

      <p className="testimonial-name">{testimonial.name}</p>
    </div>
  </div>
);

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = setInterval(advance, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, advance]);

  const active = testimonials[activeIndex];

  return (
    <Section spacing="lg" className="testimonials-section">
      <Container>
        <PageHeader title="What Our Clients Say" />

        <div
          className="testimonials-slider"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              className="w-full"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <TestimonialShowcase testimonial={active} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2.5 mt-12 md:mt-14">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.id}
              type="button"
              aria-label={`Show testimonial from ${testimonial.name}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => setActiveIndex(index)}
              className={`testimonial-dot ${index === activeIndex ? 'testimonial-dot-active' : ''}`}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default Testimonials;
