import React from 'react';

/**
 * Button component following the MARHAS design system.
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  className = '', 
  ...props 
}) => {
  const luxuryVariants = ['primary', 'secondary', 'outline', 'dark', 'light', 'accent', 'white'];

  const variants = {
    primary: 'luxury-button-solid',
    secondary: 'luxury-button-outline',
    outline: 'luxury-button-outline',
    ghost: 'inline-flex items-center justify-center px-6 py-3 text-[11px] tracking-[0.2em] uppercase font-medium font-body transition-all duration-300 hover:text-brand-accent text-text-main',
    dark: 'luxury-button-solid',
    light: 'luxury-button-solid bg-brand-bg text-brand-primary border-brand-border hover:bg-brand-surface hover:text-brand-primary',
    accent: 'luxury-button-accent',
    white: 'luxury-button-solid bg-brand-white text-brand-primary border-brand-white hover:bg-brand-bg hover:text-brand-primary'
  };

  const sizes = {
    small: 'px-6 py-3 text-[10px]',
    medium: 'px-10 py-4 text-[11px]',
    large: 'px-14 py-5 text-[12px]'
  };

  const isLuxury = luxuryVariants.includes(variant);
  const baseStyles = variants[variant] || variants.primary;
  const sizeStyles = isLuxury ? '' : (sizes[size] || sizes.medium);

  return (
    <button 
      className={`${baseStyles} ${sizeStyles} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
