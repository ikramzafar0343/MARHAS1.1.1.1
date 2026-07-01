import { useEffect, useId, useRef, useState } from 'react';
import AdminModal from '../admin/AdminModal';
import { SUPPORT_EMAIL } from '../../constants/contact';

const OTP_LENGTH = 6;

const AdminOtpModal = ({ open, challengeId, onClose, onVerify, onResend, loading, error, devOtp = '' }) => {
  const inputId = useId();
  const inputRef = useRef(null);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!open) {
      void Promise.resolve().then(() => setOtp(''));
      return undefined;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open, challengeId]);

  const handleChange = (event) => {
    const next = event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (otp.length !== OTP_LENGTH || !challengeId) {
      return;
    }

    onVerify({ challengeId, otp });
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Verify Admin Access"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            form="admin-otp-form"
            className="luxury-button-accent admin-product-btn"
            disabled={loading || otp.length !== OTP_LENGTH}
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
        </>
      }
    >
      <form id="admin-otp-form" className="admin-otp-form" onSubmit={handleSubmit}>
        <p className="admin-otp-copy">
          Enter the 6-digit code sent to <strong>{SUPPORT_EMAIL}</strong> to complete admin sign-in.
        </p>

        <label className="auth-field auth-field--full" htmlFor={inputId}>
          <span className="checkout-label">Verification Code</span>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={handleChange}
            placeholder="000000"
            className="auth-input admin-otp-input"
            required
          />
        </label>

        {devOtp && (
          <p className="admin-login-seed">
            Development code: <strong>{devOtp}</strong>
          </p>
        )}

        {error && <p className="admin-login-error">{error}</p>}

        <button
          type="button"
          className="admin-otp-resend"
          onClick={onResend}
          disabled={loading}
        >
          Resend code
        </button>
      </form>
    </AdminModal>
  );
};

export default AdminOtpModal;
