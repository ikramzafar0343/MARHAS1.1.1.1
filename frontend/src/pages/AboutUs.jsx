import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Layout';
import SectionIntro from '../components/ui/SectionIntro';
import BrandWordmark from '../components/ui/BrandWordmark';

const AboutUs = () => (
  <div className="info-page">
    <Container>
      <SectionIntro
        eyebrow="The Maison"
        title={
          <span className="inline-brand-heading">
            About <BrandWordmark context="heading" />
          </span>
        }
        description="Simply luxury fashion — crafted for the modern woman who values grace, quality, and timeless elegance."
      />

      <div className="info-page-content">
        <p>
          <BrandWordmark context="copy" priority={false} /> was founded on a simple belief: luxury
          should feel effortless. Every collection blends refined silhouettes with artisanal detail,
          honoring heritage while speaking to contemporary life.
        </p>
        <p>
          From ready-to-wear pret to unstitched fabrics, each piece is designed to celebrate
          individuality — so you can create a wardrobe that feels distinctly yours.
        </p>

        <div className="info-page-actions">
          <Link to="/collections/all" className="luxury-button-outline">
            Explore Collections
          </Link>
          <Link to="/contact" className="luxury-button-solid">
            Contact Us
          </Link>
        </div>
      </div>
    </Container>
  </div>
);

export default AboutUs;
