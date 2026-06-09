import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGlobalContext } from '../../context/GlobalContext';

const CustomerRoute = ({ children }) => {
  const { isLoggedIn } = useGlobalContext();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default CustomerRoute;
