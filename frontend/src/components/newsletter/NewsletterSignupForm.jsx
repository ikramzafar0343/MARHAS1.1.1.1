import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { newsletterService } from '../../services/marhasApi';
import { getApiErrorMessage } from '../../services/api';

const VARIANTS = {
  footer: {
    form: 'footer-newsletter-form flex flex-col gap-0',
    input: 'footer-newsletter-input',
    button: 'footer-newsletter-btn',
    message: 'footer-newsletter-message',
    placeholder: 'Your email address',
    buttonLabel: 'Sign up',
    buttonLoadingLabel: 'Signing up...',
    source: 'footer'
  },
  section: {
    form: 'newsletter-form',
    input: 'newsletter-input',
    button: 'newsletter-submit',
    message: 'newsletter-message',
    placeholder: 'Enter your email address',
    buttonLabel: 'Subscribe',
    buttonLoadingLabel: 'Subscribing...',
    source: 'other'
  }
};

const NewsletterSignupForm = ({ variant = 'footer', className = '' }) => {
  const styles = VARIANTS[variant] || VARIANTS.footer;
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      await newsletterService.subscribe({
        email: trimmedEmail,
        source: styles.source
      });
      setEmail('');
      setStatus('success');
      setMessage('You are subscribed. Thank you!');
    } catch (error) {
      setStatus('error');
      setMessage(getApiErrorMessage(error));
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === 'success' || status === 'error') {
              setStatus('idle');
              setMessage('');
            }
          }}
          placeholder={styles.placeholder}
          className={styles.input}
          autoComplete="email"
          aria-label="Email address"
          required
          disabled={isLoading}
        />
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? styles.buttonLoadingLabel : styles.buttonLabel}
        </button>
      </form>

      {message && (
        <p
          className={`${styles.message} ${
            status === 'success' ? `${styles.message}--success` : `${styles.message}--error`
          }`}
          role={status === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
};

NewsletterSignupForm.propTypes = {
  variant: PropTypes.oneOf(['footer', 'section']),
  className: PropTypes.string
};

export default NewsletterSignupForm;
