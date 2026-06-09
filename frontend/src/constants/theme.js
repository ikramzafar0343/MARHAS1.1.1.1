export const COLORS = {
  SOFT_IVORY: '#F5F5F4',
  CHARCOAL_BLACK: '#1F1F1F',
  WARM_BEIGE: '#D6C6B8',
  SOFT_GOLD: '#C9A86A',
  WHITE: '#FFFFFF',
};

export const FONTS = {
  HEADING: '"Playfair Display", serif',
  BODY: '"Poppins", sans-serif',
};

export const BREAKPOINTS = {
  MOBILE: '640px',
  TABLET: '768px',
  DESKTOP: '1024px',
  LARGE: '1280px',
};

export const ANIMATION_VARIANTS = {
  FADE_IN: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 1 },
  },
  SLIDE_UP: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};
