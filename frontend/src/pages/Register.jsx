import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import AuthPageLogo from '../components/auth/AuthPageLogo';
import RegisterForm from '../components/auth/RegisterForm';
import newArrival from '../assets/images/newArrival.jpg';
import { useGlobalContext } from '../context/GlobalContext';
import { useCustomerContent } from '../context/CustomerContentContext';

const Register = () => {
  const { isLoggedIn } = useGlobalContext();
  const { getAuthPageBanner } = useCustomerContent();
  const banner = getAuthPageBanner('register');

  if (isLoggedIn) {
    return <Navigate to="/account" replace />;
  }

  return (
    <div className="auth-page">
      <AuthPageLogo />
      <div className="auth-layout">
        <AuthBrandPanel image={banner.jpg || newArrival} imageAlt={banner.alt} />
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
