import React from 'react';

/**
 * Typography components for consistent text hierarchy.
 */
export const DisplayHero = ({ children, className = '', as: Component = 'h1' }) => (
  <Component className={`display-hero text-text-main ${className}`}>{children}</Component>
);

export const DisplayLarge = ({ children, className = '', as: Component = 'h2' }) => (
  <Component className={`display-large text-text-main ${className}`}>{children}</Component>
);

export const HeadingXL = ({ children, className = '', as: Component = 'h2' }) => (
  <Component className={`heading-xl text-text-main ${className}`}>{children}</Component>
);

export const HeadingL = ({ children, className = '', as: Component = 'h3' }) => (
  <Component className={`heading-l text-text-main ${className}`}>{children}</Component>
);

export const HeadingM = ({ children, className = '', as: Component = 'h4' }) => (
  <Component className={`heading-m text-text-main ${className}`}>{children}</Component>
);

export const BodyLarge = ({ children, className = '', as: Component = 'p' }) => (
  <Component className={`body-large text-text-sub ${className}`}>{children}</Component>
);

export const BodyMedium = ({ children, className = '', as: Component = 'p' }) => (
  <Component className={`body-medium text-text-sub ${className}`}>{children}</Component>
);

export const Caption = ({ children, className = '', as: Component = 'span' }) => (
  <Component className={`caption text-text-muted ${className}`}>{children}</Component>
);

