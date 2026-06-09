import React, { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

const CustomerModal = ({ open, onClose, title, children, footer }) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="customer-modal-root" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
      <button type="button" className="customer-modal-overlay" aria-label="Close modal" onClick={onClose} />
      <div className="customer-modal-panel">
        <header className="customer-modal-header">
          <h2 id="customer-modal-title" className="customer-modal-title">
            {title}
          </h2>
          <button type="button" className="customer-modal-close" aria-label="Close" onClick={onClose}>
            <HiX size={20} strokeWidth={1.6} />
          </button>
        </header>

        <div className="customer-modal-body">{children}</div>

        {footer && <footer className="customer-modal-footer">{footer}</footer>}
      </div>
    </div>
  );
};

export default CustomerModal;
