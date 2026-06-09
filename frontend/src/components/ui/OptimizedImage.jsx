import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const OptimizedImage = ({
  jpg,
  webp,
  blur,
  alt,
  priority = false,
  className = '',
  imageClassName = '',
  sizes = '100vw'
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (priority || isVisible) {
      return undefined;
    }

    const node = containerRef.current;

    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [priority, isVisible]);

  return (
    <div ref={containerRef} className={`optimized-image ${className}`.trim()} aria-hidden={alt ? undefined : true}>
      {blur && (
        <img
          src={blur}
          alt=""
          aria-hidden="true"
          className={`optimized-image-blur${isLoaded ? ' optimized-image-blur-hidden' : ''}`}
          decoding="async"
        />
      )}

      {isVisible && (
        <picture className="optimized-image-picture">
          {webp && <source srcSet={webp} type="image/webp" sizes={sizes} />}
          <img
            src={jpg}
            alt={alt}
            className={`optimized-image-main${isLoaded ? ' is-loaded' : ''} ${imageClassName}`.trim()}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            sizes={sizes}
            onLoad={() => setIsLoaded(true)}
          />
        </picture>
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  jpg: PropTypes.string.isRequired,
  webp: PropTypes.string,
  blur: PropTypes.string,
  alt: PropTypes.string.isRequired,
  priority: PropTypes.bool,
  className: PropTypes.string,
  imageClassName: PropTypes.string,
  sizes: PropTypes.string
};

export default OptimizedImage;
