import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService, getApiErrorMessage } from '../services/authService';
import { getAdminToken, setAdminToken } from '../services/tokenStorage';

const AdminContext = createContext();
const ADMIN_AUTH_STORAGE_KEY = 'marhas-admin-auth';

const loadAdminUser = () => {
  try {
    const stored = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AdminProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    const storedUser = loadAdminUser();
    if (storedUser && !getAdminToken()) {
      return null;
    }
    return storedUser;
  });

  useEffect(() => {
    const handleSessionExpired = () => {
      setAdminUser(null);
    };

    window.addEventListener('marhas:admin-session-expired', handleSessionExpired);
    return () => window.removeEventListener('marhas:admin-session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    if (adminUser && !getAdminToken()) {
      setAdminUser(null);
    }
  }, [adminUser]);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(adminUser));
      return;
    }

    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  }, [adminUser]);

  const isAdminLoggedIn = Boolean(adminUser);

  const adminLogin = useCallback(async ({ email, password }) => {
    try {
      const data = await authService.adminLogin({ email, password });
      setAdminUser({
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        name: data.user.name
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error)
      };
    }
  }, []);

  const adminLogout = useCallback(async () => {
    try {
      await authService.adminLogout();
    } catch {
      setAdminToken(null);
    }
    setAdminUser(null);
  }, []);

  const value = useMemo(
    () => ({
      adminUser,
      isAdminLoggedIn,
      adminLogin,
      adminLogout
    }),
    [adminUser, isAdminLoggedIn, adminLogin, adminLogout]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }

  return context;
};
