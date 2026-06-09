import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  LOGO_ASPECT_RATIO,
  LOGO_INTRINSIC_HEIGHT,
  LOGO_INTRINSIC_WIDTH,
  LOGO_SRC,
  LOGO_SRC_2X,
  LOGO_SRC_SET
} from '../../constants/logo';

const SIZE_CLASS = {
  sm: 'brand-logo--sm',
  md: 'brand-logo--md',
  lg: 'brand-logo--lg'
};

const SIZE_IMG_CLASS = {
  sm: 'brand-logo-img--sm',
  md: 'brand-logo-img--md',
  lg: 'brand-logo-img--lg'
};

const NAV_LINK_FONT_PX = 13.12;
const DISPLAY_HEIGHT = {
  sm: 10,
  md: Math.round(NAV_LINK_FONT_PX * 1.5),
  lg: 34
};

const toDisplayWidth = (height) =>
  Math.round((LOGO_INTRINSIC_WIDTH / LOGO_INTRINSIC_HEIGHT) * height);

const THEME_CLASS = {
  light: 'brand-logo--light',
  dark: 'brand-logo--dark'
};

const LOGO_DEBUG_ENABLED = import.meta.env.VITE_LOGO_DEBUG === 'true';

const Logo = ({
  size = 'md',
  theme = 'dark',
  className = '',
  debug = LOGO_DEBUG_ENABLED,
  alt = 'MARHAS',
  priority = true,
  ...imgProps
}) => {
  const handleLoad = useCallback(
    (event) => {
      if (!debug) {
        return;
      }

      const image = event.currentTarget;
      const container = image.parentElement;

      console.info('[Logo debug]', {
        source: {
          intrinsicWidth: image.naturalWidth,
          intrinsicHeight: image.naturalHeight,
          aspectRatio: Number((image.naturalWidth / image.naturalHeight).toFixed(3))
        },
        rendered: {
          imageWidth: image.clientWidth,
          imageHeight: image.clientHeight,
          containerWidth: container?.clientWidth ?? null,
          containerHeight: container?.clientHeight ?? null
        },
        expectedAspectRatio: LOGO_ASPECT_RATIO,
        size,
        theme
      });
    },
    [debug, size, theme]
  );

  const rootClassName = [
    'brand-logo',
    SIZE_CLASS[size],
    THEME_CLASS[theme],
    debug ? 'brand-logo--debug' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const displayHeight = DISPLAY_HEIGHT[size];
  const displayWidth = toDisplayWidth(displayHeight);

  return (
    <span className={rootClassName} aria-hidden={alt ? undefined : true}>
      <img
        src={LOGO_SRC}
        srcSet={LOGO_SRC_SET}
        alt={alt}
        width={displayWidth}
        height={displayHeight}
        className={['brand-logo-img', SIZE_IMG_CLASS[size]].join(' ')}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        {...imgProps}
      />
    </span>
  );
};

Logo.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  theme: PropTypes.oneOf(['light', 'dark']),
  className: PropTypes.string,
  debug: PropTypes.bool,
  alt: PropTypes.string,
  priority: PropTypes.bool
};

export default Logo;
