import React from 'react';
import {
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineTruck
} from 'react-icons/hi';
import BrandWordmark from '../ui/BrandWordmark';
import { Container } from '../ui/Layout';

const PREMIUM_QUALITY_DESCRIPTION = (
  <>
    Finest fabrics and <BrandWordmark context="copy" priority={false} /> craftsmanship in every piece.
  </>
);

export const TRUST_BADGE_ITEMS = [
  {
    title: 'Secure Checkout',
    description: 'Encrypted payments and protected transactions on every order.',
    icon: HiOutlineShieldCheck
  },
  {
    title: 'Nationwide Delivery',
    description: 'Swift delivery across Pakistan within 3–5 working days.',
    icon: HiOutlineTruck
  },
  {
    title: 'Easy Exchange',
    description: '14-day exchange policy for unworn items with original tags.',
    icon: HiOutlineRefresh
  },
  {
    title: 'Premium Quality',
    description: PREMIUM_QUALITY_DESCRIPTION,
    icon: HiOutlineSparkles
  }
];

const TrustBadges = ({ items = TRUST_BADGE_ITEMS, className = '' }) => (
  <section className={`trust-badges-section ${className}`.trim()} aria-label="Shopping assurances">
    <Container>
      <ul className="trust-badges-grid">
        {items.map((item) => (
          <li key={item.title} className="trust-badge-item">
            <item.icon className="trust-badge-icon" strokeWidth={1.2} aria-hidden="true" />
            <h3 className="trust-badge-title">{item.title}</h3>
            <p className="trust-badge-desc">{item.description}</p>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

export default TrustBadges;
