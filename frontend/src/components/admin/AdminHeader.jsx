import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { getBrandAwareInitial, replaceBrandInText } from '../../utils/brandText';

const AdminHeader = ({ adminUser, onLogout, brandHref = '/admin' }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const displayName = adminUser?.name || 'MARHAS Admin';
  const initial = getBrandAwareInitial(displayName, 'Admin');

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = () => {
    setMenuOpen(false);
    onLogout?.();
  };

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="site-header site-header-transparent admin-header"
    >
      <div className="site-header-shell">
        <div className="min-w-0 flex-1">
          <Link to={brandHref} className="admin-header-brand-link" aria-label="MARHAS admin home">
            <Logo size="md" theme="dark" />
          </Link>
        </div>

        <div className="admin-header-profile-wrap" ref={profileRef}>
          <button
            type="button"
            className="admin-header-avatar-btn"
            aria-label={`${displayName} profile`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="admin-header-avatar" aria-hidden="true">
              {initial}
            </span>
          </button>

          {menuOpen && onLogout && (
            <div className="admin-header-profile-menu">
              <p className="admin-header-profile-name">{replaceBrandInText(displayName)}</p>
              {adminUser?.email && (
                <p className="admin-header-profile-email">{adminUser.email}</p>
              )}
              <button type="button" className="admin-header-signout" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default AdminHeader;
