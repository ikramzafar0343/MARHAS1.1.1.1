import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_ADMIN_EMAIL } from '../../constants/adminSeed';
import { useAdminContext } from '../../context/AdminContext';
import BrandWordmark from '../ui/BrandWordmark';
import AuthPasswordField from './AuthPasswordField';
import AdminOtpModal from './AdminOtpModal';

const AdminLoginForm = () => {
  const navigate = useNavigate();
  const { adminRequestLogin, adminVerifyOtp } = useAdminContext();
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await adminRequestLogin({ email, password });

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setChallengeId(result.challengeId);
    setDevOtp(result.devOtp || '');
    setOtpError('');
    setOtpOpen(true);
  };

  const handleVerifyOtp = async ({ challengeId: activeChallengeId, otp }) => {
    setOtpError('');
    setOtpLoading(true);

    const result = await adminVerifyOtp({ challengeId: activeChallengeId, otp });

    setOtpLoading(false);

    if (!result.success) {
      setOtpError(result.message);
      return;
    }

    setOtpOpen(false);
    navigate('/admin', { replace: true });
  };

  const handleResendOtp = async () => {
    setOtpError('');
    setOtpLoading(true);

    const result = await adminRequestLogin({ email, password });

    setOtpLoading(false);

    if (!result.success) {
      setOtpError(result.message);
      return;
    }

    setChallengeId(result.challengeId);
    setDevOtp(result.devOtp || '');
  };

  const handleCloseOtp = () => {
    if (otpLoading) {
      return;
    }

    setOtpOpen(false);
    setOtpError('');
  };

  return (
    <>
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
            {loading ? 'Sending Code...' : 'Continue to Verification'}
          </button>
        </form>
      </div>

      <AdminOtpModal
        open={otpOpen}
        challengeId={challengeId}
        onClose={handleCloseOtp}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        loading={otpLoading}
        error={otpError}
        devOtp={devOtp}
      />
    </>
  );
};

export default AdminLoginForm;
