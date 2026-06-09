import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import {
  buildCartLineId,
  DEFAULT_CART_OPTIONS,
  getCartItemCount,
  getCartSubtotal,
  getOrderTotal
} from '../utils/cart';
import { mapCheckoutOrder } from '../utils/apiMappers';
import { authService, getApiErrorMessage } from '../services/authService';
import { ordersService } from '../services/marhasApi';
import { setCustomerToken, getCustomerToken } from '../services/tokenStorage';

const GlobalContext = createContext();
const WISHLIST_STORAGE_KEY = 'marhas-wishlist';
const CART_STORAGE_KEY = 'marhas-cart';
const RECENTLY_VIEWED_STORAGE_KEY = 'marhas-recently-viewed';
const AUTH_STORAGE_KEY = 'marhas-auth';
const LAST_ORDER_STORAGE_KEY = 'marhas-last-order';
const MAX_RECENTLY_VIEWED = 8;

const mapAuthUser = (profile) => ({
  id: profile.id || profile._id,
  email: profile.email,
  name: profile.name,
  role: profile.role,
  avatarUrl: profile.avatarUrl || null
});

const normalizeId = (value) => String(value);

const loadWishlistIds = () => {
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeId).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const loadCartItems = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadRecentlyViewedIds = () => {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeId).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const loadAuthUser = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const loadLastOrder = () => {
  try {
    const stored = localStorage.getItem(LAST_ORDER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const GlobalProvider = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(loadWishlistIds);
  const [cartItems, setCartItems] = useState(loadCartItems);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(loadRecentlyViewedIds);
  const [user, setUser] = useState(loadAuthUser);
  const [lastOrder, setLastOrder] = useState(loadLastOrder);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [user]);

  useEffect(() => {
    if (lastOrder) {
      localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(lastOrder));
    }
  }, [lastOrder]);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      const token = getCustomerToken();
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const profile = await authService.getMe();
        if (!active) {
          return;
        }

        setUser(mapAuthUser(profile));
      } catch {
        if (active) {
          setCustomerToken(null);
          setUser(null);
        }
      }
    };

    bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  const isLoggedIn = Boolean(user);

  const cartCount = useMemo(() => getCartItemCount(cartItems), [cartItems]);
  const cartSubtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems]);

  const isInWishlist = useCallback(
    (productId) => wishlistIds.includes(normalizeId(productId)),
    [wishlistIds]
  );

  const toggleWishlist = useCallback((productId) => {
    const id = normalizeId(productId);

    setWishlistIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  const addToCart = useCallback((productId, options = {}) => {
    const id = normalizeId(productId);
    const {
      quantity = DEFAULT_CART_OPTIONS.quantity,
      size = DEFAULT_CART_OPTIONS.size,
      color = DEFAULT_CART_OPTIONS.color,
      colorHex = DEFAULT_CART_OPTIONS.colorHex
    } = options;
    const lineId = buildCartLineId(id, size, color);

    setCartItems((prev) => {
      const existing = prev.find((item) => item.lineId === lineId);

      if (existing) {
        return prev.map((item) =>
          item.lineId === lineId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...prev,
        {
          lineId,
          productId: id,
          quantity,
          size,
          color,
          colorHex
        }
      ];
    });
  }, []);

  const updateCartQuantity = useCallback((lineId, quantity) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.lineId !== lineId));
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => (item.lineId === lineId ? { ...item, quantity } : item))
    );
  }, []);

  const removeFromCart = useCallback((lineId) => {
    setCartItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const moveCartItemToWishlist = useCallback(
    (lineId, productId) => {
      if (!isInWishlist(productId)) {
        toggleWishlist(productId);
      }

      removeFromCart(lineId);
    },
    [isInWishlist, toggleWishlist, removeFromCart]
  );

  const addRecentlyViewed = useCallback((productId) => {
    const id = normalizeId(productId);
    if (!id) {
      return;
    }

    setRecentlyViewedIds((prev) => [id, ...prev.filter((itemId) => itemId !== id)].slice(0, MAX_RECENTLY_VIEWED));
  }, []);

  const login = useCallback(async (credentials) => {
    setAuthError(null);
    setLoading(true);

    try {
      const data = await authService.login(credentials);
      setUser(mapAuthUser(data.user));
      return { success: true };
    } catch (error) {
      const message = getApiErrorMessage(error);
      setAuthError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials) => {
    setAuthError(null);
    setLoading(true);

    try {
      const data = await authService.register(credentials);
      setUser(mapAuthUser(data.user));
      return { success: true };
    } catch (error) {
      const message = getApiErrorMessage(error);
      setAuthError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      setCustomerToken(null);
    }
    setUser(null);
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    setAuthError(null);

    try {
      const profile = await authService.uploadAvatar(file);
      setUser(mapAuthUser(profile));
      return { success: true };
    } catch (error) {
      const message = getApiErrorMessage(error);
      setAuthError(message);
      return { success: false, message };
    }
  }, []);

  const placeOrder = useCallback(
    async (formData = {}) => {
      const payload = {
        email: formData.email || user?.email || '',
        phone: formData.phone,
        fullName: formData.fullName,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        paymentMethod: formData.paymentMethod || 'cod',
        items: cartItems.map((item) => ({
          productId: String(item.productId),
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          colorHex: item.colorHex
        }))
      };

      const order = await ordersService.checkout(payload);
      const mapped = mapCheckoutOrder(order, cartItems);
      setLastOrder(mapped);
      return mapped.id;
    },
    [cartItems, user]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const value = useMemo(
    () => ({
      isMenuOpen,
      setIsMenuOpen,
      loading,
      setLoading,
      user,
      isLoggedIn,
      authError,
      login,
      register,
      logout,
      uploadAvatar,
      wishlistIds,
      wishlistCount: wishlistIds.length,
      isInWishlist,
      toggleWishlist,
      cartItems,
      cartCount,
      cartSubtotal,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      moveCartItemToWishlist,
      recentlyViewedIds,
      addRecentlyViewed,
      lastOrder,
      placeOrder,
      clearCart
    }),
    [
      isMenuOpen,
      loading,
      user,
      isLoggedIn,
      authError,
      login,
      register,
      logout,
      uploadAvatar,
      wishlistIds,
      isInWishlist,
      toggleWishlist,
      cartItems,
      cartCount,
      cartSubtotal,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      moveCartItemToWishlist,
      recentlyViewedIds,
      addRecentlyViewed,
      lastOrder,
      placeOrder,
      clearCart
    ]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};
