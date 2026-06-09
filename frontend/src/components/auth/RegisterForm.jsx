import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../../context/GlobalContext';
import BrandWordmark from '../ui/BrandWordmark';
import AuthGoogleButton from './AuthGoogleButton';
import AuthPasswordField from './AuthPasswordField';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, loading } = useGlobalContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword
    });

    if (!result.success) {
      setError(result.message || 'Unable to create account.');
      return;
    }

    navigate('/account');
  };

  const handleGuest = () => {
    navigate('/collections/all');
  };

  const passwordsMismatch =
    password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="auth-form-panel">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">Member Access</span>
        <h2 className="auth-form-title">Create Account</h2>
        <p className="auth-form-subtitle">
          Join <BrandWordmark context="copy" priority={false} /> to save wishlists, track orders, and
          unlock exclusive collections
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="sr-only">Full Name</span>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full Name"
            autoComplete="name"
            required
            className="auth-input"
          />
        </label>

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
          autoComplete="new-password"
          minLength={8}
          required
        />

        <AuthPasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm Password"
          autoComplete="new-password"
          required
        />

        {passwordsMismatch && (
          <p className="auth-form-error">Passwords do not match.</p>
        )}

        {error && <p className="auth-form-error">{error}</p>}

        <button
          type="submit"
          className="auth-btn auth-btn-primary luxury-button-solid"
          disabled={passwordsMismatch || loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
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
        Already have an account?{' '}
        <Link to="/login" className="auth-switch-link">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;
