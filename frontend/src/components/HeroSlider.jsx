import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCustomerContent } from '../context/CustomerContentContext';
import { resolveMediaUrl } from '../utils/customerContentHelpers';

const AUTO_PLAY_DELAY = 5000;
const SWIPE_THRESHOLD = 50;

const HeroSlider = () => {
  const { heroSlides: slides } = useCustomerContent();

  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState(() => new Set());
  const touchStartX = useRef(null);

  const markSlideLoaded = useCallback((slideId) => {
    setLoadedSlides((current) => {
      if (current.has(slideId)) {
        return current;
      }

      const next = new Set(current);
      next.add(slideId);
      return next;
    });
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) {
      return;
    }

    slides.forEach((slide) => {
      const img = new Image();
      img.onload = () => markSlideLoaded(slide.id);
      img.src = resolveMediaUrl(slide.image);
    });
  }, [slides, markSlideLoaded]);

  const isFirstSlideReady = slides.length > 0 && loadedSlides.has(slides[0].id);

  useEffect(() => {
    if (!isFirstSlideReady) {
      return undefined;
    }

    const intervalId = window.setInterval(goToNext, AUTO_PLAY_DELAY);
    return () => window.clearInterval(intervalId);
  }, [goToNext, isFirstSlideReady]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = touchStartX.current - touchEndX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartX.current = null;
  };

  if (!slides.length) {
    return null;
  }

  return (
    <section
      className="lux-hero"
      aria-label="Featured fashion highlights"
      aria-roledescription="carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="lux-hero-media" aria-hidden="true">
        <div
          className="lux-hero-track"
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="lux-hero-slide">
              <img
                src={resolveMediaUrl(slide.image)}
                alt={slide.alt}
                className={`lux-hero-slide-image${loadedSlides.has(slide.id) ? ' is-loaded' : ''}`}
                loading="eager"
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                onLoad={() => markSlideLoaded(slide.id)}
              />
            </div>
          ))}
        </div>
        <div className="lux-hero-overlay" />
      </div>
    </section>
  );
};

export default HeroSlider;
