import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import { Container } from '../components/ui/Layout';
import SectionIntro from '../components/ui/SectionIntro';
import BrandWordmark from '../components/ui/BrandWordmark';

const contactDetails = [
  {
    Icon: FaMapMarkerAlt,
    label: 'Visit',
    value: (
      <>
        123 Fashion Avenue, Gulberg III,
        <br />
        Lahore, Pakistan 54000
      </>
    )
  },
  {
    Icon: FaPhoneAlt,
    label: 'Call',
    value: (
      <a href="tel:+923001234567" className="info-page-link">
        +92 300 123 4567
      </a>
    )
  },
  {
    Icon: FaEnvelope,
    label: 'Email',
    value: (
      <a href="mailto:contact@marhas.com" className="info-page-link">
        contact@marhas.com
      </a>
    )
  }
];

const ContactUs = () => (
  <div className="info-page">
    <Container>
      <SectionIntro
        eyebrow="Get in Touch"
        title="Contact Us"
        description="We would love to hear from you — whether you have a question about an order, a collection, or a bespoke request."
      />

      <div className="info-page-content">
        <ul className="info-page-contact-list">
          {contactDetails.map(({ Icon, label, value }) => (
            <li key={label} className="info-page-contact-item">
              <Icon className="info-page-contact-icon" size={14} aria-hidden="true" />
              <div>
                <p className="info-page-contact-label">{label}</p>
                <p className="info-page-contact-value">{value}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="info-page-note">
          Our client care team responds within one business day, Monday through Saturday.
        </p>

        <div className="info-page-actions">
          <Link
            to="/about-us"
            className="luxury-button-outline brand-wordmark-btn text-sm tracking-[0.15em]"
            aria-label="About MARHAS"
          >
            <span>About</span>
            <BrandWordmark context="button" priority={false} />
          </Link>
        </div>
      </div>
    </Container>
  </div>
);

export default ContactUs;
