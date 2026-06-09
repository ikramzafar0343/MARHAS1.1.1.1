import React from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingBag, HiOutlineSearch, HiOutlineUser, HiOutlineHeart } from 'react-icons/hi';
import useLuxuryScroll from '../../hooks/useLuxuryScroll';
import Logo from '../ui/Logo';

const Navbar = () => {
  const isScrolled = useLuxuryScroll(50);
  const location = useLocation();
  const navigate = useNavigate();
  const { category: activeCategory = 'all' } = useParams();

  const isCollectionsPage = location.pathname.startsWith('/collections');
  const isProductDetailPage = location.pathname.startsWith('/product/');
  const isHomePage = location.pathname === '/';
  const isBlendedHero = (isHomePage || isCollectionsPage) && !isScrolled;
  const isSolidNav = isScrolled || isProductDetailPage;
  const utilityColor = isSolidNav ? 'text-brand-primary' : 'text-white';
  const navToneClass = isSolidNav ? 'site-nav-link-solid' : 'site-nav-link-transparent';
  const logoTheme = isSolidNav ? 'dark' : 'light';

  const navItems = [
    { name: 'New Arrivals', path: '/collections/new' },
    { name: 'Collections', path: '/collections/all' },
    { name: 'Summer', path: '/collections/summer' },
    { name: 'Ready To Wear', path: '/collections/rtw' },
    { name: 'Unstitched', path: '/collections/unstitched' }
  ];
  
  const collectionCategories = [
    { id: 'new', name: 'New Arrivals' },
    { id: 'all', name: 'Collections' },
    { id: 'summer', name: 'Summer' },
    { id: 'rtw', name: 'Ready To Wear' },
    { id: 'unstitched', name: 'Unstitched' }
  ];

  const navLinkClass = (isActive) =>
    `site-nav-link ${navToneClass} group ${isActive ? 'opacity-100' : ''}`;

  const NavUnderline = ({ isActive }) => (
    <span
      className={`absolute -bottom-1 left-0 h-px bg-brand-accent transition-all duration-500 ease-out ${
        isActive ? 'w-full' : 'w-0 group-hover:w-full'
      }`}
    />
  );

  return (
    <nav
      className={`site-nav ${isBlendedHero ? 'site-nav-transparent' : isSolidNav ? 'site-nav-solid' : 'site-nav-transparent'}`}
    >
      <div className="site-nav-shell">
        <div className="min-w-[11rem] flex-1">
          <Link to="/" className="site-nav-brand-link" aria-label="MARHAS home">
            <Logo size="md" theme={logoTheme} />
          </Link>
        </div>

        <div className="flex-1 justify-center">
          {isCollectionsPage ? (
            <div className="site-nav-links">
              {collectionCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/collections/${cat.id}`)}
                  className={navLinkClass(activeCategory === cat.id)}
                >
                  {cat.name}
                  {activeCategory === cat.id ? (
                    <motion.span
                      layoutId="activeNavBar"
                      className="absolute -bottom-1 left-0 h-px w-full bg-brand-accent"
                    />
                  ) : (
                    <NavUnderline isActive={false} />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="site-nav-links">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`${navLinkClass(isActive)} whitespace-nowrap`}
                  >
                    {item.name}
                    {isActive ? (
                      <motion.span
                        layoutId="activeNavBar"
                        className="absolute -bottom-1 left-0 h-px w-full bg-brand-accent"
                      />
                    ) : (
                      <NavUnderline isActive={false} />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className={`min-w-[11rem] flex-1 transition-colors duration-700 ${utilityColor}`}>
          <div className="site-nav-icon-row">
            <button className="site-nav-icon-btn" aria-label="Search">
              <HiOutlineSearch size={20} strokeWidth={1.5} />
            </button>
            <button className="site-nav-icon-btn" aria-label="Wishlist">
              <HiOutlineHeart size={20} strokeWidth={1.5} />
            </button>
            <button className="site-nav-icon-btn" aria-label="Account">
              <HiOutlineUser size={20} strokeWidth={1.5} />
            </button>
            <Link to="/cart" className="site-nav-icon-btn" aria-label="Cart">
              <HiOutlineShoppingBag size={20} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
