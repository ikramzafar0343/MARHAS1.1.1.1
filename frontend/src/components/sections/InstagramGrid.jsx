import React from 'react';
import { motion } from 'framer-motion';
import {
  FaInstagram,
  FaPinterestP,
  FaFacebookF,
  FaYoutube
} from 'react-icons/fa';
import { Section, Container } from '../ui/Layout';
import { PageHeader } from '../ui/PageSections';
import { SHOP_LOOK_AREA_CLASSES, SHOP_LOOK_PLATFORM_CONFIG } from '../../constants/shopTheLook';
import { useCustomerContent } from '../../context/CustomerContentContext';
import { resolveMediaUrl } from '../../utils/customerContentHelpers';
import Logo from '../ui/Logo';

const platformIcons = {
  instagram: FaInstagram,
  pinterest: FaPinterestP,
  facebook: FaFacebookF,
  youtube: FaYoutube
};

const LookFrame = ({ item, index }) => {
  const Icon = platformIcons[item.platform];
  const { label } = SHOP_LOOK_PLATFORM_CONFIG[item.platform];
  const isVideo = item.mediaType === 'video' && item.video;

  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.07 }}
      className={[
        'look-frame group',
        SHOP_LOOK_AREA_CLASSES[item.area],
        `look-shape-${item.shape}`
      ].join(' ')}
      aria-label={`${label} — shop the look ${item.id}`}
    >
      <div className="look-frame-inner">
        <div className="look-frame-media">
          {isVideo ? (
            <video
              src={resolveMediaUrl(item.video)}
              poster={resolveMediaUrl(item.image)}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={resolveMediaUrl(item.image)}
              alt={`Shop the look ${item.id}`}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        <Logo
          size="sm"
          theme="light"
          className="look-frame-brand"
          alt=""
          priority={false}
        />

        <div className="look-social-overlay" aria-hidden="true">
          <div className="look-social-icon">
            <Icon size={20} />
          </div>
          <span className="look-social-label">{label}</span>
        </div>
      </div>
    </motion.a>
  );
};

const InstagramGrid = () => {
  const { shopLookItems, shopLookHeading } = useCustomerContent();

  if (!shopLookItems.length) {
    return null;
  }

  return (
    <Section spacing="lg" className="shop-look-section">
      <Container>
        <PageHeader title={shopLookHeading} />

        <div className="shop-look-grid grid grid-cols-2 md:grid-cols-none gap-3 md:gap-4">
          {shopLookItems.map((item, index) => (
            <LookFrame key={item.id} item={item} index={index} />
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default InstagramGrid;
