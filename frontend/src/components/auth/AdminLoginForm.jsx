import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEED_ADMIN } from '../../constants/adminSeed';
import { useAdminContext } from '../../context/AdminContext';
import BrandWordmark from '../ui/BrandWordmark';
import AuthPasswordField from './AuthPasswordField';

const AdminLoginForm = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdminContext();
  const [email, setEmail] = useState(SEED_ADMIN.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await adminLogin({ email, password });

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate('/admin', { replace: true });
  };

  return (
    <div className="auth-form-panel admin-login-panel">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">Admin Portal</span>
        <h2 className="auth-form-title">Sign In</h2>
        <p className="auth-form-subtitle">
          Access the <BrandWordmark context="copy" priority={false} /> admin dashboard to manage your
          store.
        </p>
      </div>

      <form className="auth-form admin-login-form" onSubmit={handleSubmit}>
        <label className="auth-field auth-field--full">
          <span className="checkout-label">Email</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Admin Email"
            autoComplete="email"
            required
            className="auth-input"
          />
        </label>

        <AuthPasswordField
          label="Password"
          showLabel
          labelClassName="checkout-label"
          className="auth-field--full"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
        />

        {error && <p className="admin-login-error">{error}</p>}

        <button
          type="submit"
          className="auth-btn auth-btn-primary luxury-button-solid"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In to Admin'}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginForm;
