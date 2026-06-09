import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import AuthPageLogo from '../components/auth/AuthPageLogo';
import LoginForm from '../components/auth/LoginForm';
import readyToWear from '../assets/images/readyToWear.jpg';
import { useGlobalContext } from '../context/GlobalContext';
import { useCustomerContent } from '../context/CustomerContentContext';

const Login = () => {
  const { isLoggedIn } = useGlobalContext();
  const { getAuthPageBanner } = useCustomerContent();
  const banner = getAuthPageBanner('login');

  if (isLoggedIn) {
    return <Navigate to="/account" replace />;
  }

  return (
    <div className="auth-page">
      <AuthPageLogo />
      <div className="auth-layout">
        <AuthBrandPanel image={banner.jpg || readyToWear} imageAlt={banner.alt} />
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
