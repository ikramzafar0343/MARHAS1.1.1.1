import React, { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

const AdminModal = ({ open, onClose, title, children, footer, wide = false }) => {
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
    <div className="admin-modal-root" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
      <button type="button" className="admin-modal-overlay" aria-label="Close modal" onClick={onClose} />
      <div className={`admin-modal-panel ${wide ? 'admin-modal-panel--wide' : ''}`}>
        <header className="admin-modal-header">
          <h2 id="admin-modal-title" className="admin-modal-title">
            {title}
          </h2>
          <button type="button" className="admin-modal-close" aria-label="Close" onClick={onClose}>
            <HiX size={20} strokeWidth={1.6} />
          </button>
        </header>

        <div className="admin-modal-body">{children}</div>

        {footer && <footer className="admin-modal-footer">{footer}</footer>}
      </div>
    </div>
  );
};

export default AdminModal;
