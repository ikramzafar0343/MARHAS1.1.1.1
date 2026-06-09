import React from 'react';
import PropTypes from 'prop-types';
import Logo from './Logo';

const CONTEXT_CLASS = {
  button: 'inline-brand-logo--button',
  heading: 'inline-brand-logo--heading',
  loader: 'inline-brand-logo--loader',
  copyright: 'inline-brand-logo--copyright',
  invoice: 'inline-brand-logo--invoice',
  copy: 'inline-brand-logo--copy'
};

const BrandWordmark = ({
  context = 'heading',
  theme = 'dark',
  className = '',
  priority,
  ...props
}) => (
  <Logo
    size="sm"
    theme={theme}
    className={['inline-brand-logo', CONTEXT_CLASS[context], className].filter(Boolean).join(' ')}
    alt=""
    priority={priority ?? context === 'loader'}
    {...props}
  />
);

BrandWordmark.propTypes = {
  context: PropTypes.oneOf(['button', 'heading', 'loader', 'copyright', 'invoice', 'copy']),
  theme: PropTypes.oneOf(['light', 'dark']),
  className: PropTypes.string,
  priority: PropTypes.bool
};

export default BrandWordmark;
