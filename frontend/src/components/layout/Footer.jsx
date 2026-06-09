import React from 'react';
import { Link } from 'react-router-dom';
import NewsletterSignupForm from '../newsletter/NewsletterSignupForm';
import Logo from '../ui/Logo';
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaPinterestP,
  FaYoutube,
  FaCaretRight,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaChevronUp
} from 'react-icons/fa';
import { useCustomerContent } from '../../context/CustomerContentContext';

const FOOTER_SOCIAL_ICONS = {
  facebook: FaFacebookF,
  twitter: FaTwitter,
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  pinterest: FaPinterestP,
  youtube: FaYoutube
};

const quickLinksLeft = [
  { name: 'Home', path: '/' },
  { name: 'New Arrivals', path: '/collections/new' },
  { name: 'About Us', path: '/about-us' }
];

const quickLinksRight = [
  { name: 'Collections', path: '/collections/all' },
  { name: 'Contact Us', path: '/contact' },
  { name: 'Size Guide', path: '#' }
];

const FooterLink = ({ name, path }) => {
  const className = 'footer-link group';

  if (path.startsWith('/') && path !== '#') {
    return (
      <Link to={path} className={className}>
        <FaCaretRight className="footer-link-arrow" size={10} />
        {name}
      </Link>
    );
  }

  return (
    <a href={path} className={className}>
      <FaCaretRight className="footer-link-arrow" size={10} />
      {name}
    </a>
  );
};

const Footer = () => {
  const { footerSocialLinks } = useCustomerContent();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
      <footer id="site-footer" className="site-footer">
        <div className="max-w-[1600px] mx-auto px-6 md:px-20">
          <div className="footer-brand-row">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link to="/" className="footer-brand-link" aria-label="MARHAS home">
                <Logo size="md" theme="light" priority={false} />
              </Link>
              <div className="hidden sm:block h-5 w-px bg-white/25" />
              <p className="footer-brand-tagline">/ Simply Luxury Fashion</p>
            </div>

            {footerSocialLinks.length > 0 && (
              <div className="flex flex-wrap gap-4 sm:gap-5">
                {footerSocialLinks.map(({ id, label, href }) => {
                  const Icon = FOOTER_SOCIAL_ICONS[id];

                  if (!Icon) {
                    return null;
                  }

                  return (
                    <a
                      key={id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-social-link"
                      aria-label={label}
                    >
                      <Icon size={14} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16 mb-12">
            <div>
              <p className="footer-column-title">Quick Links</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="space-y-3">
                  {quickLinksLeft.map((link) => (
                    <FooterLink key={link.name} {...link} />
                  ))}
                </div>
                <div className="space-y-3">
                  {quickLinksRight.map((link) => (
                    <FooterLink key={link.name} {...link} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="footer-column-title">Contact Us</p>
              <div className="space-y-4">
                <div className="footer-contact-item">
                  <FaMapMarkerAlt className="footer-contact-icon" size={13} />
                  <span>
                    123 Fashion Avenue, Gulberg III,
                    <br />
                    Lahore, Pakistan 54000
                  </span>
                </div>
                <div className="footer-contact-item">
                  <FaPhoneAlt className="footer-contact-icon" size={12} />
                  <span>+92 300 123 4567</span>
                </div>
                <div className="footer-contact-item">
                  <FaEnvelope className="footer-contact-icon" size={12} />
                  <a href="mailto:contact@marhas.com" className="hover:text-brand-accent transition-colors">
                    contact@marhas.com
                  </a>
                </div>
              </div>
            </div>

            <div className="w-full">
              <p className="footer-column-title">Remain Updated</p>
              <NewsletterSignupForm variant="footer" />
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© 2026. All rights reserved.</p>
            <button
              type="button"
              onClick={scrollToTop}
              className="footer-scroll-top"
              aria-label="Scroll to top"
            >
              <FaChevronUp size={14} />
            </button>
          </div>
        </div>
      </footer>
  );
};

export default Footer;
