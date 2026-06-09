import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const AuthPageLogo = () => (
  <Link to="/" className="auth-page-logo" aria-label="MARHAS home">
    <Logo size="sm" theme="light" className="auth-page-logo-mark" alt="" priority />
  </Link>
);

export default AuthPageLogo;
