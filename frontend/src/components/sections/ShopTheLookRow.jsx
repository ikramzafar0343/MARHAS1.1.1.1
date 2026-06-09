import React from 'react';
import { motion } from 'framer-motion';
import {
  FaInstagram,
  FaPinterestP,
  FaFacebookF,
  FaYoutube
} from 'react-icons/fa';
import { SHOP_LOOK_PLATFORM_CONFIG } from '../../constants/shopTheLook';
import { useCustomerContent } from '../../context/CustomerContentContext';
import { resolveMediaUrl } from '../../utils/customerContentHelpers';

const platformIcons = {
  instagram: FaInstagram,
  pinterest: FaPinterestP,
  facebook: FaFacebookF,
  youtube: FaYoutube
};

const ShopTheLookTile = ({ item, index }) => {
  const Icon = platformIcons[item.platform];
  const { label } = SHOP_LOOK_PLATFORM_CONFIG[item.platform];
  const isVideo = item.mediaType === 'video' && item.video;

  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="shop-look-row-item group"
      aria-label={`${label} — shop the look ${item.id}`}
    >
      {isVideo ? (
        <video
          src={resolveMediaUrl(item.video)}
          poster={resolveMediaUrl(item.image)}
          autoPlay
          muted
          loop
          playsInline
          className="shop-look-row-image"
        />
      ) : (
        <img
          src={resolveMediaUrl(item.image)}
          alt={`Shop the look ${item.id}`}
          loading="lazy"
          decoding="async"
          className="shop-look-row-image"
        />
      )}

      <div className="look-social-overlay" aria-hidden="true">
        <div className="look-social-icon">
          <Icon size={18} />
        </div>
        <span className="look-social-label">{label}</span>
      </div>
    </motion.a>
  );
};

const ShopTheLookRow = ({ className = '' }) => {
  const { shopLookRowItems, shopLookHeading, shopLookRowSubtitle } = useCustomerContent();

  if (!shopLookRowItems.length) {
    return null;
  }

  return (
    <section className={`shop-look-row-section ${className}`.trim()}>
      <div className="shop-look-row-header">
        <h2 className="shop-look-row-title">{shopLookHeading}</h2>
        <p className="shop-look-row-subtitle">{shopLookRowSubtitle}</p>
      </div>

      <div className="shop-look-row-grid">
        {shopLookRowItems.map((item, index) => (
          <ShopTheLookTile key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
};

export default ShopTheLookRow;
