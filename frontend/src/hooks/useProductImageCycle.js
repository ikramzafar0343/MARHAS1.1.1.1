import { useCallback, useEffect, useRef, useState } from 'react';

const HOVER_DELAY_MS = 280;
const CYCLE_MS = 1800;

const useProductImageCycle = (images, enabled) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const delayRef = useRef(null);
  const intervalRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (delayRef.current) {
      window.clearTimeout(delayRef.current);
      delayRef.current = null;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopCycle = useCallback(() => {
    clearTimers();
    setActiveIndex(0);
  }, [clearTimers]);

  const startCycle = useCallback(() => {
    if (!enabled || images.length <= 1) {
      return;
    }

    clearTimers();

    delayRef.current = window.setTimeout(() => {
      if (images.length === 2) {
        setActiveIndex(1);
        return;
      }

      setActiveIndex(1);

      intervalRef.current = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % images.length);
      }, CYCLE_MS);
    }, HOVER_DELAY_MS);
  }, [clearTimers, enabled, images.length]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { activeIndex, startCycle, stopCycle };
};

export default useProductImageCycle;
