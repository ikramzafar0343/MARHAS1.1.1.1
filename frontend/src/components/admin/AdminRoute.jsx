import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminContext } from '../../context/AdminContext';
import { getAdminToken } from '../../services/tokenStorage';

const AdminRoute = ({ children }) => {
  const { isAdminLoggedIn } = useAdminContext();

  if (!isAdminLoggedIn || !getAdminToken()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
