import { useCallback, useEffect, useRef, useState } from 'react';

export const PRODUCT_GALLERY_AUTOPLAY_MS = 4000;
const MANUAL_PAUSE_MS = 10000;

export const buildProductGalleryImages = (product) => {
  if (!product) {
    return [];
  }

  const candidates = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
    product.hoverImage
  ].filter(Boolean);

  return [...new Set(candidates)];
};

const useProductGalleryAutoplay = (
  images,
  { enabled = true, intervalMs = PRODUCT_GALLERY_AUTOPLAY_MS } = {}
) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const pauseUntilRef = useRef(0);
  const intervalRef = useRef(null);
  const galleryKey = images.join('\u0000');

  const clearAutoplay = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pauseAutoplay = useCallback((durationMs = MANUAL_PAUSE_MS) => {
    pauseUntilRef.current = Date.now() + durationMs;
  }, []);

  const selectImage = useCallback(
    (index) => {
      if (index < 0 || index >= images.length) {
        return;
      }

      setActiveIndex(index);
      pauseAutoplay();
    },
    [images.length, pauseAutoplay]
  );

  useEffect(() => {
    setActiveIndex(0);
    pauseUntilRef.current = 0;
  }, [galleryKey]);

  useEffect(() => {
    clearAutoplay();

    if (!enabled || images.length <= 1) {
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) {
        return;
      }

      setActiveIndex((current) => (current + 1) % images.length);
    }, intervalMs);

    return clearAutoplay;
  }, [clearAutoplay, enabled, galleryKey, images.length, intervalMs]);

  return { activeIndex, selectImage, pauseAutoplay };
};

export default useProductGalleryAutoplay;
