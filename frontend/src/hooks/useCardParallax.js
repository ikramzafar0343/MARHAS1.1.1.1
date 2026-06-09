import { useEffect, useState } from 'react';

const useCardParallax = (ref, enabled = true) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!enabled || !ref.current) {
      return undefined;
    }

    let frameId = 0;

    const updateOffset = () => {
      const element = ref.current;

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = Math.min(Math.max(1 - rect.top / viewportHeight, 0), 1);

      setOffset((progress - 0.5) * 48);
    };

    const handleScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateOffset);
    };

    updateOffset();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [ref, enabled]);

  return offset;
};

export default useCardParallax;
