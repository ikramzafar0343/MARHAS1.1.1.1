import React from 'react';
import { resolveAssetUrl } from '../../utils/assetUrl';

const CustomerAvatar = ({ user, className = '', imageClassName = '' }) => {
  const avatarSrc = user?.avatarUrl ? resolveAssetUrl(user.avatarUrl) : null;
  const initial = (user?.name || 'M').charAt(0).toUpperCase();

  if (avatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt=""
        className={`customer-avatar-image ${imageClassName}`.trim()}
      />
    );
  }

  return <span className={className}>{initial}</span>;
};

export default CustomerAvatar;
