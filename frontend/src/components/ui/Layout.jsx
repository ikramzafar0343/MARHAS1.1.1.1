import React from 'react';

/**
 * Layout components for consistent page structure and spacing.
 */

export const Container = ({ children, className = '', fluid = false }) => (
  <div className={`${fluid ? 'w-full' : 'max-w-[1600px] mx-auto'} px-6 md:px-20 ${className}`}>
    {children}
  </div>
);

export const Section = ({ children, className = '', spacing = 'lg', id }) => {
  const spacingStyles = {
    none: 'py-0',
    sm: 'py-12',
    md: 'py-20',
    lg: 'py-32',
    xl: 'py-48'
  };

  return (
    <section 
      id={id}
      className={`${spacingStyles[spacing] || spacingStyles.lg} ${className}`}
    >
      {children}
    </section>
  );
};

export const Grid = ({ children, className = '', cols = 1, gap = 'md' }) => {
  const gapStyles = {
    none: 'gap-0',
    sm: 'gap-4',
    md: 'gap-8',
    lg: 'gap-16',
    xl: 'gap-24'
  };

  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    12: 'grid-cols-1 md:grid-cols-12'
  };

  return (
    <div className={`grid ${colStyles[cols] || colStyles[1]} ${gapStyles[gap] || gapStyles.md} ${className}`}>
      {children}
    </div>
  );
};

export const Stack = ({ children, className = '', direction = 'col', gap = 'md', align = 'start', justify = 'start' }) => {
  const gapStyles = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  const directionStyles = {
    row: 'flex-row',
    col: 'flex-col'
  };

  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  };

  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  return (
    <div className={`flex ${directionStyles[direction]} ${gapStyles[gap]} ${alignStyles[align] || alignStyles.start} ${justifyStyles[justify] || justifyStyles.start} ${className}`}>
      {children}
    </div>
  );
};

