import React from 'react';
import { HiOutlineSparkles, HiOutlineCube, HiOutlineShieldCheck, HiOutlineTruck } from 'react-icons/hi';
import { Container } from '../ui/Layout';

const features = [
  {
    title: 'Premium Fabrics',
    description: 'Only the finest materials sourced globally',
    icon: HiOutlineSparkles
  },
  {
    title: 'Timeless Designs',
    description: 'Contemporary elegance meets classic beauty',
    icon: HiOutlineCube
  },
  {
    title: 'Secure Shopping',
    description: 'Safe and protected transactions',
    icon: HiOutlineShieldCheck
  },
  {
    title: 'Nationwide Delivery',
    description: 'Swift delivery across Pakistan',
    icon: HiOutlineTruck
  }
];

const Features = () => {
  return (
    <section className="features-section" aria-label="Brand highlights">
      <Container>
        <ul className="features-grid">
          {features.map((feature) => (
            <li key={feature.title} className="feature-item">
              <feature.icon className="feature-icon" strokeWidth={1.1} aria-hidden="true" />
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
};

export default Features;
