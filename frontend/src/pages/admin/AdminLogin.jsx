import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel';
import AuthPageLogo from '../../components/auth/AuthPageLogo';
import AdminLoginForm from '../../components/auth/AdminLoginForm';
import hero1 from '../../assets/images/hero1.jpg';
import { useAdminContext } from '../../context/AdminContext';
import { useCustomerContent } from '../../context/CustomerContentContext';

const AdminLogin = () => {
  const { isAdminLoggedIn } = useAdminContext();
  const { getAuthPageBanner } = useCustomerContent();
  const banner = getAuthPageBanner('adminLogin');

  if (isAdminLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="auth-page admin-auth-page">
      <AuthPageLogo />
      <div className="auth-layout">
        <AuthBrandPanel image={banner.jpg || hero1} imageAlt={banner.alt} />
        <AdminLoginForm />
      </div>
    </div>
  );
};

export default AdminLogin;
