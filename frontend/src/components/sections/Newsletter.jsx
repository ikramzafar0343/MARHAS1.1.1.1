import React from 'react';
import { motion } from 'framer-motion';
import NewsletterSignupForm from '../newsletter/NewsletterSignupForm';
import { Section, Container } from '../ui/Layout';
import BrandWordmark from '../ui/BrandWordmark';

const Newsletter = () => {
  return (
    <Section spacing="lg" className="newsletter-section">
      <Container>
        <motion.div
          className="newsletter-inner"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span className="newsletter-eyebrow">Stay Connected</span>

          <h2 className="newsletter-heading">
            <span className="inline-brand-heading">
              Join The <BrandWordmark context="heading" /> Community
            </span>
          </h2>
          <span className="newsletter-divider" aria-hidden="true" />

          <p className="newsletter-desc">
            Subscribe to receive exclusive updates, styling tips, and early access to new collections.
          </p>

          <NewsletterSignupForm variant="section" />

          <p className="newsletter-disclaimer">
            By subscribing, you agree to our Privacy Policy
          </p>
        </motion.div>
      </Container>
    </Section>
  );
};

export default Newsletter;
