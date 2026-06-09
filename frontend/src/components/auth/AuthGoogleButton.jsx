import React from 'react';
import { FcGoogle } from 'react-icons/fc';

const AuthGoogleButton = () => (
  <button type="button" className="auth-google-btn" aria-label="Continue with Google">
    <span className="auth-google-btn-icon" aria-hidden="true">
      <FcGoogle size={18} />
    </span>
    <span className="auth-google-btn-label">Continue with Google</span>
  </button>
);

export default AuthGoogleButton;
