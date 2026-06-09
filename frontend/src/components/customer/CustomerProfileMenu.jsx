import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../../context/GlobalContext';
import CustomerAvatar from './CustomerAvatar';
import { replaceBrandInText } from '../../utils/brandText';

const CustomerProfileMenu = ({ toneClass = 'site-header-dark' }) => {
  const navigate = useNavigate();
  const { user, logout } = useGlobalContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.name || 'MARHAS Member';

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="site-header-profile-wrap" ref={menuRef}>
      <button
        type="button"
        className={`site-header-profile-btn ${toneClass}`}
        aria-label={`${displayName} account menu`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="site-header-profile-avatar">
          <CustomerAvatar
            user={user}
            className="site-header-profile-initial"
            imageClassName="site-header-profile-image"
          />
        </span>
      </button>

      {menuOpen && (
        <div className="site-header-profile-menu">
          <p className="site-header-profile-menu-name">{replaceBrandInText(displayName)}</p>
          {user?.email && <p className="site-header-profile-menu-email">{user.email}</p>}

          <nav className="site-header-profile-links" aria-label="Account menu">
            <Link to="/account" className="site-header-profile-link" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            <Link
              to="/account/orders"
              className="site-header-profile-link"
              onClick={() => setMenuOpen(false)}
            >
              My Orders
            </Link>
            <Link to="/wishlist" className="site-header-profile-link" onClick={() => setMenuOpen(false)}>
              Wishlist
            </Link>
            <Link
              to="/account/settings"
              className="site-header-profile-link"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
          </nav>

          <button type="button" className="site-header-profile-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerProfileMenu;
