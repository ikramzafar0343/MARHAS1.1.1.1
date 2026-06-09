import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../../context/GlobalContext';
import AuthGoogleButton from './AuthGoogleButton';
import AuthPasswordField from './AuthPasswordField';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading } = useGlobalContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const result = await login({ email: email.trim(), password });

    if (!result.success) {
      setError(result.message || 'Unable to sign in.');
      return;
    }

    navigate('/account');
  };

  const handleGuest = () => {
    navigate('/collections/all');
  };

  return (
    <div className="auth-form-panel">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">Member Access</span>
        <h2 className="auth-form-title">Welcome Back</h2>
        <p className="auth-form-subtitle">
          Access your orders, wishlist, and exclusive collections
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="sr-only">Email Address</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email Address"
            autoComplete="email"
            required
            className="auth-input"
          />
        </label>

        <AuthPasswordField
          label="Password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
        />

        <div className="auth-form-meta">
          <Link to="/login" className="auth-link">
            Forgot Password?
          </Link>
        </div>

        {error && <p className="auth-form-error">{error}</p>}

        <button
          type="submit"
          className="auth-btn auth-btn-primary luxury-button-solid"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <button type="button" className="auth-btn auth-btn-outline luxury-button-outline" onClick={handleGuest}>
          Continue As Guest
        </button>
      </form>

      <div className="auth-divider">
        <span>Or</span>
      </div>

      <AuthGoogleButton />

      <p className="auth-switch">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="auth-switch-link">
          Create Account
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
