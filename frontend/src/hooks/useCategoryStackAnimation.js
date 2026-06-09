import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const useCategoryStackAnimation = (stackRef, cardCount) => {
  useLayoutEffect(() => {
    if (!stackRef.current || cardCount < 2) {
      return undefined;
    }

    let context = null;

    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = gsap.utils.toArray('.category-card', stackRef.current);

      if (cards.length < 2) {
        return undefined;
      }

      context = gsap.context(() => {
        cards.forEach((card, index) => {
          if (index === cards.length - 1) {
            return;
          }

          const inner = card.querySelector('.category-card-inner');

          if (!inner) {
            return;
          }

          gsap.fromTo(
            inner,
            {
              scale: 1,
              opacity: 1,
              filter: 'brightness(1)'
            },
            {
              scale: 0.935,
              opacity: 0.62,
              filter: 'brightness(0.76)',
              ease: 'none',
              scrollTrigger: {
                trigger: cards[index + 1],
                start: 'top bottom',
                end: 'top top',
                scrub: 0.65,
                invalidateOnRefresh: true
              }
            }
          );
        });

        ScrollTrigger.refresh();
      }, stackRef);
    });

    const handleRefresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', handleRefresh);
    window.addEventListener('resize', handleRefresh);

    return () => {
      window.removeEventListener('load', handleRefresh);
      window.removeEventListener('resize', handleRefresh);
      context?.revert();
      media.revert();
    };
  }, [stackRef, cardCount]);
};

export default useCategoryStackAnimation;
