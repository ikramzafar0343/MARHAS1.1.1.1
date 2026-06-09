import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  HiMenu,
  HiOutlineHeart,
  HiOutlineSearch,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiX
} from 'react-icons/hi';
import { useCustomerContent } from '../context/CustomerContentContext';
import { useGlobalContext } from '../context/GlobalContext';
import CustomerProfileMenu from './customer/CustomerProfileMenu';
import SearchModal from './search/SearchModal';
import Logo from './ui/Logo';

const formatBadgeCount = (count) => (count > 9 ? '9+' : count);

const HeaderIconLink = ({ to, label, count, children, className = '' }) => (
  <Link
    to={to}
    className={`site-header-icon-wrap site-header-icon-btn ${className}`.trim()}
    aria-label={count > 0 ? `${label}, ${count} items` : label}
  >
    {children}
    {count > 0 && (
      <span className="site-header-icon-badge">{formatBadgeCount(count)}</span>
    )}
  </Link>
);

const isNavItemActive = (pathname, item) => {
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

const HeaderNavItem = ({ item, active, toneClass, indicatorClass, onClick }) => {
  const content = (
    <>
      {item.label}
      <span
        className={`absolute -bottom-1 left-0 h-px transition-all duration-300 ${
          active ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
        } ${indicatorClass}`}
      />
    </>
  );

  return (
    <Link to={item.path} className={`site-header-link group ${toneClass}`} onClick={onClick}>
      {content}
    </Link>
  );
};

const Header = () => {
  const location = useLocation();
  const { navItems } = useCustomerContent();
  const { wishlistCount, cartCount, isLoggedIn } = useGlobalContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isHomePage = location.pathname === '/';
  const isDarkHeaderPage =
    location.pathname.startsWith('/collections') ||
    location.pathname.startsWith('/product/') ||
    location.pathname.startsWith('/wishlist') ||
    location.pathname.startsWith('/cart') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/order-confirmation') ||
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/about-us') ||
    location.pathname.startsWith('/contact');
  const headerToneClass = isDarkHeaderPage ? 'site-header-dark' : 'site-header-light';
  const headerIndicatorClass = isDarkHeaderPage ? 'bg-brand-primary' : 'bg-white';

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  return (
    <motion.header
      initial={isHomePage ? false : { y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: isHomePage ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="site-header site-header-transparent"
    >
      <div className="site-header-shell">
        <div className="min-w-0 flex-1">
          <Link to="/" className="site-header-brand-link" aria-label="MARHAS home">
            <Logo
              size="md"
              theme={isDarkHeaderPage ? 'dark' : 'light'}
            />
          </Link>
        </div>

        <nav className="site-header-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <HeaderNavItem
              key={item.id}
              item={item}
              active={isNavItemActive(location.pathname, item)}
              toneClass={headerToneClass}
              indicatorClass={headerIndicatorClass}
            />
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
          <div className={`site-header-icons ${headerToneClass}`}>
            <button
              type="button"
              className="site-header-icon-btn"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
            >
              <HiOutlineSearch size={19} strokeWidth={1.6} />
            </button>
            <HeaderIconLink
              to="/wishlist"
              label="Wishlist"
              count={wishlistCount}
              className="hidden sm:inline-flex"
            >
              <HiOutlineHeart size={19} strokeWidth={1.6} />
            </HeaderIconLink>
            <Link
              to={isLoggedIn ? '/account' : '/login'}
              className="site-header-icon-btn sm:hidden"
              aria-label={isLoggedIn ? 'Account' : 'Sign in'}
            >
              <HiOutlineUser size={19} strokeWidth={1.6} />
            </Link>
            {isLoggedIn ? (
              <div className="hidden sm:block">
                <CustomerProfileMenu toneClass={headerToneClass} />
              </div>
            ) : (
              <Link
                to="/login"
                className="site-header-icon-btn hidden sm:inline-flex"
                aria-label="Sign in"
              >
                <HiOutlineUser size={19} strokeWidth={1.6} />
              </Link>
            )}
            <HeaderIconLink to="/cart" label="Cart" count={cartCount}>
              <HiOutlineShoppingBag size={19} strokeWidth={1.6} />
            </HeaderIconLink>
          </div>

          <button
            type="button"
            className={`site-header-mobile-toggle lg:hidden ${headerToneClass}`}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <HiX size={21} /> : <HiMenu size={21} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="site-header-mobile-menu lg:hidden"
          >
            <nav className="flex flex-col gap-5" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <HeaderNavItem
                  key={item.id}
                  item={item}
                  active={isNavItemActive(location.pathname, item)}
                  toneClass="site-header-dark"
                  indicatorClass="bg-brand-primary"
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.header>
  );
};

export default Header;
