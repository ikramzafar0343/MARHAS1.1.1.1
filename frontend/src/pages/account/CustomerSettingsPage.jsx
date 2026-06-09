import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../../context/GlobalContext';
import { CustomerSettingsPanel } from '../../components/customer/CustomerDashboardSections';

const CustomerSettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout, uploadAvatar } = useGlobalContext();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const handleAvatarUpload = async (file) => {
    setAvatarUploading(true);
    setAvatarError('');

    const result = await uploadAvatar(file);

    if (!result.success) {
      setAvatarError(result.message || 'Unable to upload profile photo.');
    }

    setAvatarUploading(false);
    return result;
  };

  return (
    <CustomerSettingsPanel
      user={user}
      onSignOut={handleSignOut}
      onAvatarUpload={handleAvatarUpload}
      avatarUploading={avatarUploading}
      avatarError={avatarError}
    />
  );
};

export default CustomerSettingsPage;
