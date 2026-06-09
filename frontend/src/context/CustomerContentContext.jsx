import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_CUSTOMER_CONTENT } from '../constants/customerContentDefaults';
import { getApiErrorMessage } from '../services/api';
import { getAdminToken, setAdminToken } from '../services/tokenStorage';
import { storefrontService } from '../services/marhasApi';
import {
  addCategoryToContent,
  addNavToContent,
  createHeroSlide,
  createNavItem,
  createShopLookItem,
  createShowcaseCategory,
  getAuthPageBannerFromContent,
  getCollectionHeroFromContent,
  getCollectionHeroTitle,
  getVisibleHeroSlides,
  getVisibleNavItems,
  getVisibleFooterSocialLinks,
  getVisibleShopLookItems,
  getVisibleShowcaseCategories,
  mergeCustomerContent,
  normalizeStorefrontContent,
  prepareStorefrontContent,
  removeCategoryFromContent,
  removeNavFromContent,
  syncCategoryAcrossContent,
  syncCollectionHeroImageToCategory,
  updateNavInContent
} from '../utils/customerContentHelpers';

const CustomerContentContext = createContext(null);
const SAVE_DEBOUNCE_MS = 600;

const toEditableContent = (apiContent = {}) =>
  prepareStorefrontContent(DEFAULT_CUSTOMER_CONTENT, apiContent);

const isAdminStorefrontRoute = (pathname = '') =>
  pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

const fetchStorefrontContent = async (pathname = window.location.pathname) => {
  if (isAdminStorefrontRoute(pathname) && getAdminToken()) {
    try {
      return await storefrontService.getAdmin();
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        setAdminToken(null);
        window.dispatchEvent(new CustomEvent('marhas:admin-session-expired'));
      } else if (status === 500) {
        return storefrontService.getPublic();
      } else {
        throw err;
      }
    }
  }

  return storefrontService.getPublic();
};

const createInitialContent = () => prepareStorefrontContent(DEFAULT_CUSTOMER_CONTENT, {});

export const CustomerContentProvider = ({ children }) => {
  const [content, setContent] = useState(() => createInitialContent());
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const saveTimerRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const contentRef = useRef(createInitialContent());
  const loadRequestIdRef = useRef(0);
  const contentRevisionRef = useRef(0);
  const pendingStorefrontReloadRef = useRef(false);

  const applyContent = useCallback((nextContent) => {
    contentRef.current = nextContent;
    setContent(nextContent);
  }, []);

  const loadContent = useCallback(async (options = {}) => {
    const { force = false, pathname = window.location.pathname } = options;
    const requestId = ++loadRequestIdRef.current;
    const revisionAtLoadStart = contentRevisionRef.current;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchStorefrontContent(pathname);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      if (!force && revisionAtLoadStart !== contentRevisionRef.current) {
        return;
      }

      applyContent(toEditableContent(data));
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      if (!force && revisionAtLoadStart !== contentRevisionRef.current) {
        return;
      }

      setError(getApiErrorMessage(err) || 'Unable to load storefront content');
      applyContent(createInitialContent());
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [applyContent]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const persistLatestContent = useCallback(async () => {
    if (!getAdminToken()) {
      setError('Your admin session expired. Sign in again to save changes.');
      window.dispatchEvent(new CustomEvent('marhas:admin-session-expired'));
      return false;
    }

    const revisionAtSave = contentRevisionRef.current;
    setSaving(true);
    setError(null);

    try {
      const normalized = normalizeStorefrontContent(contentRef.current);
      const saved = await storefrontService.update({
        navigation: normalized.navigation,
        heroSlides: normalized.heroSlides,
        showcase: normalized.showcase,
        collectionHeroes: normalized.collectionHeroes,
        shopTheLook: normalized.shopTheLook,
        footerSocial: normalized.footerSocial,
        commerceSettings: normalized.commerceSettings,
        isPublished: true
      });

      if (contentRevisionRef.current !== revisionAtSave) {
        await persistLatestContent();
        return true;
      }

      applyContent(toEditableContent(saved));
      setDraftSavedAt(new Date().toISOString());
      return true;
    } catch (err) {
      if (err?.response?.status === 401) {
        setAdminToken(null);
        window.dispatchEvent(new CustomEvent('marhas:admin-session-expired'));
      }

      setError(getApiErrorMessage(err) || 'Unable to save storefront content');
      await loadContent({ force: true, pathname: window.location.pathname });
      return false;
    } finally {
      setSaving(false);
    }
  }, [applyContent, loadContent]);

  const enqueueSave = useCallback(() => {
    const nextSave = saveQueueRef.current.then(() => persistLatestContent());
    saveQueueRef.current = nextSave.catch(() => false);
    return nextSave;
  }, [persistLatestContent]);

  const queuePersist = useCallback(
    (options = {}) => {
      const { immediate = false } = options;

      if (!getAdminToken()) {
        setError('Your admin session expired. Sign in again to save changes.');
        window.dispatchEvent(new CustomEvent('marhas:admin-session-expired'));
        return Promise.resolve(false);
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      if (immediate) {
        return enqueueSave();
      }

      return new Promise((resolve) => {
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null;
          enqueueSave().then(resolve);
        }, SAVE_DEBOUNCE_MS);
      });
    },
    [enqueueSave]
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    },
    []
  );

  const updateContent = useCallback(
    (updater, options = {}) => {
      const { immediate = false, requireAuth = true } = options;

      if (requireAuth && isAdminStorefrontRoute(window.location.pathname) && !getAdminToken()) {
        setError('Your admin session expired. Sign in again to save changes.');
        window.dispatchEvent(new CustomEvent('marhas:admin-session-expired'));
        return Promise.resolve(false);
      }

      const current = contentRef.current;
      const next = typeof updater === 'function' ? updater(current) : updater;

      contentRef.current = next;
      contentRevisionRef.current += 1;
      setContent(next);
      return queuePersist({ immediate });
    },
    [queuePersist]
  );

  const resetToDefaults = useCallback(async () => {
    if (getAdminToken()) {
      setSaving(true);
      try {
        const saved = await storefrontService.reset();
        applyContent(toEditableContent(saved));
        contentRevisionRef.current += 1;
        setDraftSavedAt(new Date().toISOString());
        setError(null);
      } catch (err) {
        setError(getApiErrorMessage(err) || 'Unable to reset storefront content');
      } finally {
        setSaving(false);
      }
      return;
    }

    applyContent(createInitialContent());
  }, [applyContent]);

  const updateNavigation = useCallback(
    (navId, updates) => {
      updateContent((current) => updateNavInContent(current, navId, updates), { immediate: true });
    },
    [updateContent]
  );

  const addNavigationItem = useCallback(
    (item = {}) => {
      updateContent((current) => addNavToContent(current, createNavItem(item)), { immediate: true });
    },
    [updateContent]
  );

  const deleteNavigationItem = useCallback(
    (navId) =>
      updateContent((current) => removeNavFromContent(current, navId), {
        immediate: true
      }),
    [updateContent]
  );

  const updateShowcaseHeading = useCallback(
    (heading) => {
      updateContent((current) => ({
        ...current,
        showcase: { ...current.showcase, heading }
      }));
    },
    [updateContent]
  );

  const updateShowcaseCategory = useCallback(
    (categoryId, updates) => {
      updateContent((current) => syncCategoryAcrossContent(current, categoryId, updates));
    },
    [updateContent]
  );

  const addShowcaseCategory = useCallback(
    (category = {}) => {
      updateContent((current) => addCategoryToContent(current, createShowcaseCategory(category)));
    },
    [updateContent]
  );

  const deleteShowcaseCategory = useCallback(
    (categoryId) => {
      updateContent((current) => removeCategoryFromContent(current, categoryId), { immediate: true });
    },
    [updateContent]
  );

  const updateCollectionHero = useCallback(
    (slug, updates) =>
      updateContent(
        (current) => {
          const next = {
            ...current,
            collectionHeroes: {
              ...current.collectionHeroes,
              [slug]: { ...current.collectionHeroes[slug], ...updates }
            }
          };

          return updates.image?.jpg
            ? syncCollectionHeroImageToCategory(next, slug, updates.image)
            : next;
        },
        { immediate: true }
      ),
    [updateContent]
  );

  const toggleCollectionHeroVisibility = useCallback(
    (slug) =>
      updateContent(
        (current) => ({
          ...current,
          collectionHeroes: {
            ...current.collectionHeroes,
            [slug]: {
              ...current.collectionHeroes[slug],
              visible: current.collectionHeroes[slug]?.visible === false
            }
          }
        }),
        { immediate: true }
      ),
    [updateContent]
  );

  const updateHeroSlide = useCallback(
    (slideId, updates) =>
      updateContent(
        (current) => ({
          ...current,
          heroSlides: current.heroSlides.map((slide) =>
            slide.id === slideId ? { ...slide, ...updates } : slide
          )
        }),
        { immediate: true }
      ),
    [updateContent]
  );

  const toggleHeroSlideVisibility = useCallback(
    (slideId) =>
      updateContent(
        (current) => ({
          ...current,
          heroSlides: current.heroSlides.map((slide) =>
            slide.id === slideId
              ? { ...slide, visible: slide.visible === false }
              : slide
          )
        }),
        { immediate: true }
      ),
    [updateContent]
  );

  const addHeroSlide = useCallback(
    () =>
      updateContent(
        (current) => ({
          ...current,
          heroSlides: [...current.heroSlides, createHeroSlide()]
        }),
        { immediate: true }
      ),
    [updateContent]
  );

  const deleteHeroSlide = useCallback(
    (slideId) => {
      updateContent(
        (current) => ({
          ...current,
          heroSlides: current.heroSlides.filter((slide) => slide.id !== slideId)
        }),
        { immediate: true }
      );
    },
    [updateContent]
  );

  const updateShopTheLookMeta = useCallback(
    (updates) => {
      updateContent((current) => ({
        ...current,
        shopTheLook: { ...current.shopTheLook, ...updates }
      }));
    },
    [updateContent]
  );

  const updateShopLookItem = useCallback(
    (itemId, updates) => {
      updateContent((current) => ({
        ...current,
        shopTheLook: {
          ...current.shopTheLook,
          items: current.shopTheLook.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          )
        }
      }));
    },
    [updateContent]
  );

  const addShopLookItem = useCallback(() => {
    updateContent((current) => ({
      ...current,
      shopTheLook: {
        ...current.shopTheLook,
        items: [...current.shopTheLook.items, createShopLookItem()]
      }
    }));
  }, [updateContent]);

  const deleteShopLookItem = useCallback(
    (itemId) => {
      updateContent(
        (current) => ({
          ...current,
          shopTheLook: {
            ...current.shopTheLook,
            items: current.shopTheLook.items.filter((item) => item.id !== itemId)
          }
        }),
        { immediate: true }
      );
    },
    [updateContent]
  );

  const updateAuthPageBanner = useCallback(
    (pageKey, updates) =>
      updateContent(
        (current) => ({
          ...current,
          authPages: {
            ...current.authPages,
            [pageKey]: {
              ...current.authPages[pageKey],
              ...updates
            }
          }
        }),
        { immediate: true }
      ),
    [updateContent]
  );

  const updateFooterSocial = useCallback(
    (updates) => {
      updateContent((current) => ({
        ...current,
        footerSocial: { ...current.footerSocial, ...updates }
      }));
    },
    [updateContent]
  );

  const updateCommerceSettings = useCallback(
    (updates) => {
      updateContent((current) => ({
        ...current,
        commerceSettings: { ...current.commerceSettings, ...updates }
      }));
    },
    [updateContent]
  );

  const derived = useMemo(
    () => ({
      commerceSettings: content.commerceSettings,
      navItems: getVisibleNavItems(content),
      heroSlides: getVisibleHeroSlides(content),
      showcaseCategories: getVisibleShowcaseCategories(content),
      showcaseHeading: content.showcase.heading,
      shopLookItems: getVisibleShopLookItems(content),
      shopLookRowItems: getVisibleShopLookItems(content).slice(0, 6),
      shopLookHeading: content.shopTheLook.heading,
      shopLookRowSubtitle: content.shopTheLook.rowSubtitle,
      footerSocialLinks: getVisibleFooterSocialLinks(content),
      getCollectionHero: (slug) => getCollectionHeroFromContent(content, slug),
      getCollectionHeroTitle: (slug) => getCollectionHeroTitle(content, slug),
      getAuthPageBanner: (pageKey) => getAuthPageBannerFromContent(content, pageKey)
    }),
    [content]
  );

  const value = useMemo(
    () => ({
      content,
      draftSavedAt,
      loading,
      saving,
      error,
      reloadContent: loadContent,
      ...derived,
      updateContent,
      resetToDefaults,
      updateNavigation,
      addNavigationItem,
      deleteNavigationItem,
      updateShowcaseHeading,
      updateShowcaseCategory,
      addShowcaseCategory,
      deleteShowcaseCategory,
      updateCollectionHero,
      toggleCollectionHeroVisibility,
      updateHeroSlide,
      toggleHeroSlideVisibility,
      addHeroSlide,
      deleteHeroSlide,
      updateShopTheLookMeta,
      updateShopLookItem,
      addShopLookItem,
      deleteShopLookItem,
      updateAuthPageBanner,
      updateFooterSocial,
      updateCommerceSettings
    }),
    [
      content,
      draftSavedAt,
      loading,
      saving,
      error,
      loadContent,
      derived,
      updateContent,
      resetToDefaults,
      updateNavigation,
      addNavigationItem,
      deleteNavigationItem,
      updateShowcaseHeading,
      updateShowcaseCategory,
      addShowcaseCategory,
      deleteShowcaseCategory,
      updateCollectionHero,
      toggleCollectionHeroVisibility,
      updateHeroSlide,
      toggleHeroSlideVisibility,
      addHeroSlide,
      deleteHeroSlide,
      updateShopTheLookMeta,
      updateShopLookItem,
      addShopLookItem,
      deleteShopLookItem,
      updateAuthPageBanner,
      updateFooterSocial,
      updateCommerceSettings
    ]
  );

  return (
    <CustomerContentContext.Provider value={value}>
      <CustomerContentRouteSync
        loadContent={loadContent}
        saving={saving}
        pendingStorefrontReloadRef={pendingStorefrontReloadRef}
      />
      {children}
    </CustomerContentContext.Provider>
  );
};

const CustomerContentRouteSync = ({ loadContent, saving, pendingStorefrontReloadRef }) => {
  const location = useLocation();
  const previousPathRef = useRef(null);
  const visibilityReloadTimerRef = useRef(null);

  const refreshStorefrontContent = useCallback(() => {
    loadContent({ force: true, pathname: location.pathname });
  }, [loadContent, location.pathname]);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const nextPath = location.pathname;
    previousPathRef.current = nextPath;

    const isInitialAdminLoad =
      previousPath === null && isAdminStorefrontRoute(nextPath);
    const leftAdmin =
      previousPath?.startsWith('/admin') && !nextPath.startsWith('/admin');
    const enteredAdmin =
      previousPath !== null &&
      !previousPath.startsWith('/admin') &&
      isAdminStorefrontRoute(nextPath);

    if (!isInitialAdminLoad && !leftAdmin && !enteredAdmin) {
      return;
    }

    pendingStorefrontReloadRef.current = true;

    if (!saving) {
      pendingStorefrontReloadRef.current = false;
      refreshStorefrontContent();
    }
  }, [location.pathname, saving, refreshStorefrontContent, pendingStorefrontReloadRef]);

  useEffect(() => {
    if (!saving && pendingStorefrontReloadRef.current) {
      pendingStorefrontReloadRef.current = false;
      refreshStorefrontContent();
    }
  }, [saving, refreshStorefrontContent, pendingStorefrontReloadRef]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || location.pathname.startsWith('/admin')) {
        return;
      }

      if (visibilityReloadTimerRef.current) {
        clearTimeout(visibilityReloadTimerRef.current);
      }

      visibilityReloadTimerRef.current = setTimeout(() => {
        refreshStorefrontContent();
      }, 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityReloadTimerRef.current) {
        clearTimeout(visibilityReloadTimerRef.current);
      }
    };
  }, [location.pathname, refreshStorefrontContent]);

  return null;
};

export const useCustomerContent = () => {
  const context = useContext(CustomerContentContext);

  if (!context) {
    throw new Error('useCustomerContent must be used within CustomerContentProvider');
  }

  return context;
};
