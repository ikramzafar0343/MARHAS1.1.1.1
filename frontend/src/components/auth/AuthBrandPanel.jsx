import React from 'react';

const AuthBrandPanel = ({ image, imageAlt = 'MARHAS collection' }) => (
  <aside className="auth-brand-panel" aria-label="MARHAS brand">
    <img src={image} alt={imageAlt} className="auth-brand-image" loading="eager" decoding="async" />
    <div className="auth-brand-overlay" aria-hidden="true" />
  </aside>
);

export default AuthBrandPanel;
