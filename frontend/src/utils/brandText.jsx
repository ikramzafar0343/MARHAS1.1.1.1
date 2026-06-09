import React from 'react';
import BrandWordmark from '../components/ui/BrandWordmark';

const BRAND_PATTERN = /(MARHAS)/g;

export const replaceBrandInText = (text, context = 'copy') => {
  if (!text || typeof text !== 'string' || !text.includes('MARHAS')) {
    return text;
  }

  return text.split(BRAND_PATTERN).map((part, index) =>
    part === 'MARHAS' ? (
      <BrandWordmark key={`brand-${index}`} context={context} priority={false} />
    ) : (
      part
    )
  );
};

export const getBrandAwareInitial = (name, fallback = 'Member') => {
  const label = (name || fallback).replace(/^MARHAS\s+/i, '').trim() || fallback;
  return label.charAt(0).toUpperCase();
};
