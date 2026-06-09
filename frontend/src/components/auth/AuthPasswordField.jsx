import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const AuthPasswordField = ({
  label,
  showLabel = false,
  labelClassName = 'sr-only',
  className = '',
  inputClassName = '',
  ...inputProps
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <label className={`auth-field ${className}`.trim()}>
      <span className={showLabel ? labelClassName || 'checkout-label' : 'sr-only'}>{label}</span>
      <div className="auth-password-field">
        <input
          {...inputProps}
          type={visible ? 'text' : 'password'}
          className={`auth-input auth-password-input ${inputClassName}`.trim()}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <HiOutlineEyeOff size={18} strokeWidth={1.6} /> : <HiOutlineEye size={18} strokeWidth={1.6} />}
        </button>
      </div>
    </label>
  );
};

AuthPasswordField.propTypes = {
  label: PropTypes.string.isRequired,
  showLabel: PropTypes.bool,
  labelClassName: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string
};

export default AuthPasswordField;
