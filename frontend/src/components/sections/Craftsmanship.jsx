import React from 'react';
import { Link } from 'react-router-dom';
import { MARHAS_IMAGE } from '../../constants/images';
import { Section, Container } from '../ui/Layout';
import BrandWordmark from '../ui/BrandWordmark';

const Craftsmanship = () => {
  return (
    <Section spacing="lg" className="bg-brand-bg">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="w-full min-w-0">
            <img
              src={MARHAS_IMAGE}
              alt="Handmade embroidery craftsmanship"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          <div className="w-full min-w-0 lg:pl-4 xl:pl-8">
            <h2 className="brand-heading text-3xl md:text-4xl normal-case tracking-tight mb-6">
              Crafted With Grace
            </h2>

            <p className="w-full font-body text-sm md:text-base text-text-sub leading-relaxed mb-8">
              Every <BrandWordmark context="copy" priority={false} /> piece is a testament to exceptional
              craftsmanship and timeless elegance. We blend traditional artistry with contemporary design,
              creating garments that celebrate the modern woman while honoring heritage and culture.
            </p>

            <Link
              to="/about-us"
              className="luxury-button-outline brand-wordmark-btn text-sm tracking-[0.15em]"
              aria-label="Discover MARHAS"
            >
              <span>Discover</span>
              <BrandWordmark context="button" priority={false} />
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Craftsmanship;
