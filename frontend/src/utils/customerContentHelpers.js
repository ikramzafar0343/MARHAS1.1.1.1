import { resolveAssetUrl, normalizeStorefrontAssetPath } from './assetUrl';
import { resolveCommerceSettings } from '../constants/commerceDefaults';
import {
  CUSTOMER_CONTENT_STORAGE_KEY,
  DEFAULT_CUSTOMER_CONTENT,
  FOOTER_SOCIAL_PLATFORMS
} from '../constants/customerContentDefaults';
import { DEFAULT_FOOTER_SOCIAL } from '../constants/footerSocial';

const clone = (value) => JSON.parse(JSON.stringify(value));

const normalizeImageAsset = (image = {}) => ({
  jpg: normalizeStorefrontAssetPath(image.jpg) || '',
  webp: image.webp ? normalizeStorefrontAssetPath(image.webp) : null,
  blur: image.blur ? normalizeStorefrontAssetPath(image.blur) : null,
  alt: image.alt || ''
});

export const normalizeStorefrontContent = (content) => {
  if (!content) {
    return content;
  }

  return {
    ...content,
    footerSocial: normalizeFooterSocial(content.footerSocial),
    heroSlides: (content.heroSlides || []).map((slide) => ({
      ...slide,
      image: normalizeStorefrontAssetPath(slide.image) || slide.image
    })),
    showcase: {
      ...content.showcase,
      categories: (content.showcase?.categories || []).map((category) => ({
        ...category,
        image: normalizeImageAsset(category.image)
      }))
    },
    shopTheLook: {
      ...content.shopTheLook,
      items: (content.shopTheLook?.items || []).map((item) => ({
        ...item,
        image: item.image ? normalizeStorefrontAssetPath(item.image) : null,
        video: item.video ? normalizeStorefrontAssetPath(item.video) : null
      }))
    },
    authPages: Object.fromEntries(
      Object.keys(DEFAULT_CUSTOMER_CONTENT.authPages).map((key) => [
        key,
        {
          ...DEFAULT_CUSTOMER_CONTENT.authPages[key],
          ...(content.authPages?.[key] || {}),
          image: normalizeImageAsset({
            ...DEFAULT_CUSTOMER_CONTENT.authPages[key]?.image,
            ...(content.authPages?.[key]?.image || {})
          })
        }
      ])
    )
  };
};

export const resolveMediaUrl = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'object') {
    if (typeof value.jpg === 'string') {
      return resolveAssetUrl(value.jpg);
    }
    return '';
  }

  return resolveAssetUrl(value);
};

export const resolveImageAsset = (image = {}) => ({
  jpg: resolveMediaUrl(image.jpg),
  webp: image.webp ? resolveMediaUrl(image.webp) : null,
  blur: image.blur ? resolveMediaUrl(image.blur) : null,
  alt: image.alt || ''
});

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const loadStoredContent = () => {
  try {
    const raw = localStorage.getItem(CUSTOMER_CONTENT_STORAGE_KEY);
    if (!raw) {
      return clone(DEFAULT_CUSTOMER_CONTENT);
    }

    const parsed = JSON.parse(raw);
    return mergeCustomerContent(DEFAULT_CUSTOMER_CONTENT, parsed);
  } catch {
    return clone(DEFAULT_CUSTOMER_CONTENT);
  }
};

export const saveStoredContent = (content) => {
  localStorage.setItem(CUSTOMER_CONTENT_STORAGE_KEY, JSON.stringify(content));
};

const normalizeFooterSocial = (social = {}) => ({
  ...DEFAULT_FOOTER_SOCIAL,
  ...Object.fromEntries(
    FOOTER_SOCIAL_PLATFORMS.map(({ id }) => [id, (social[id] || '').trim()])
  )
});

export const mergeCustomerContent = (defaults, saved) => ({
  commerceSettings: resolveCommerceSettings(saved.commerceSettings ?? defaults.commerceSettings),
  footerSocial: normalizeFooterSocial(saved.footerSocial ?? defaults.footerSocial),
  navigation: Array.isArray(saved.navigation) ? saved.navigation : defaults.navigation,
  heroSlides: Array.isArray(saved.heroSlides) ? saved.heroSlides : defaults.heroSlides,
  showcase: {
    heading: saved.showcase?.heading ?? defaults.showcase.heading,
    categories: saved.showcase?.categories?.length
      ? saved.showcase.categories
      : defaults.showcase.categories
  },
  collectionHeroes: {
    ...defaults.collectionHeroes,
    ...(saved.collectionHeroes || {})
  },
  shopTheLook: {
    heading: saved.shopTheLook?.heading ?? defaults.shopTheLook.heading,
    rowSubtitle: saved.shopTheLook?.rowSubtitle ?? defaults.shopTheLook.rowSubtitle,
    items: saved.shopTheLook?.items?.length ? saved.shopTheLook.items : defaults.shopTheLook.items
  },
  authPages: Object.fromEntries(
    Object.keys(defaults.authPages).map((key) => [
      key,
      {
        ...defaults.authPages[key],
        ...(saved.authPages?.[key] || {}),
        image: normalizeImageAsset({
          ...defaults.authPages[key]?.image,
          ...(saved.authPages?.[key]?.image || {})
        })
      }
    ])
  )
});

export const prepareStorefrontContent = (defaults, saved) =>
  normalizeStorefrontContent(mergeCustomerContent(defaults, saved));

export const getVisibleNavItems = (content) =>
  content.navigation.filter((item) => item.visible !== false);

export const getVisibleShowcaseCategories = (content) =>
  content.showcase.categories.filter((category) => category.visible !== false);

export const getVisibleHeroSlides = (content) =>
  content.heroSlides.filter((slide) => slide.visible !== false);

export const getVisibleShopLookItems = (content) =>
  content.shopTheLook.items.filter((item) => item.visible !== false);

export const getVisibleFooterSocialLinks = (content) => {
  const social = normalizeFooterSocial(content.footerSocial);

  return FOOTER_SOCIAL_PLATFORMS.map(({ id, label }) => ({
    id,
    label,
    href: social[id]
  })).filter((item) => item.href);
};

const resolveCollectionHeroImage = (heroConfig, category, fallback) => {
  if (heroConfig?.image?.jpg) {
    return resolveImageAsset(heroConfig.image);
  }

  if (category?.image?.jpg) {
    return resolveImageAsset(category.image);
  }

  return resolveImageAsset(fallback);
};

export const getCollectionHeroFromContent = (content, slug = 'all') => {
  const categories = content.showcase.categories;
  const fallback = categories[0]?.image || DEFAULT_CUSTOMER_CONTENT.showcase.categories[0].image;
  const heroConfig = content.collectionHeroes[slug] || content.collectionHeroes.all;
  const objectPosition = heroConfig?.objectPosition || 'center center';
  const visible = heroConfig?.visible !== false;
  const category = slug === 'all' ? null : categories.find((item) => item.slug === slug);

  return {
    ...resolveCollectionHeroImage(heroConfig, category, fallback),
    objectPosition,
    visible
  };
};

export const getAuthPageBannerFromContent = (content, pageKey = 'login') => {
  const fallback = DEFAULT_CUSTOMER_CONTENT.authPages[pageKey];
  const page = content.authPages?.[pageKey] || fallback;

  return resolveImageAsset(page?.image || fallback?.image);
};

export const getCollectionHeroTitle = (content, slug = 'all') => {
  const heroConfig = content.collectionHeroes[slug] || content.collectionHeroes.all;
  return {
    first: heroConfig?.titleFirst || 'Our',
    second: heroConfig?.titleSecond || 'Collections'
  };
};

export const slugFromNavPath = (path) => {
  const match = path.match(/^\/collections\/([^/]+)$/i);
  return match ? match[1].toLowerCase() : null;
};

export const normalizeNavSlug = (slug = '') => slug.trim().toLowerCase().replace(/\s+/g, '-');

export const normalizeNavPath = (path = '', slug = '') => {
  const normalizedSlug = normalizeNavSlug(slug || slugFromNavPath(path) || 'new-category');
  return `/collections/${normalizedSlug}`;
};

export const normalizeNavItem = (item = {}) => {
  const slug = normalizeNavSlug(item.slug || slugFromNavPath(item.path) || 'new-category');
  const path = normalizeNavPath(item.path, slug);

  return {
    id: item.id || `nav-${Date.now()}`,
    label: (item.label || 'New Category').trim(),
    path,
    slug,
    visible: typeof item.visible === 'boolean' ? item.visible : true
  };
};

export const createNavItem = (overrides = {}) => normalizeNavItem({
  label: 'New Category',
  path: '/collections/new-category',
  slug: 'new-category',
  visible: true,
  ...overrides
});

export const createShowcaseCategory = (overrides = {}) => ({
  id: `category-${Date.now()}`,
  slug: 'new-category',
  layout: 'editorial-center',
  label: null,
  title: 'New Category',
  description: 'Describe this collection',
  link: '/collections/new-category',
  visible: true,
  image: {
    jpg: '/assets/images/newArrival.jpg',
    webp: null,
    blur: null,
    alt: 'MARHAS collection'
  },
  ...overrides
});

export const createHeroSlide = (overrides = {}) => ({
  id: `hero-${Date.now()}`,
  image: '/assets/images/hero1.jpg',
  alt: 'MARHAS hero banner',
  visible: true,
  ...overrides
});

export const createShopLookItem = (overrides = {}) => ({
  id: `look-${Date.now()}`,
  area: 'main',
  shape: 'main',
  platform: 'instagram',
  mediaType: 'image',
  image: '/assets/images/product1.1.jpg',
  video: null,
  link: 'https://www.instagram.com/',
  visible: true,
  ...overrides
});

export const syncCategoryAcrossContent = (content, categoryId, updates) => {
  const next = clone(content);
  const categoryIndex = next.showcase.categories.findIndex((item) => item.id === categoryId);

  if (categoryIndex === -1) {
    return next;
  }

  const current = next.showcase.categories[categoryIndex];
  const merged = { ...current, ...updates };
  next.showcase.categories[categoryIndex] = merged;

  const slug = merged.slug;
  const navIndex = next.navigation.findIndex((item) => item.slug === slug);

  if (navIndex !== -1) {
    next.navigation[navIndex] = {
      ...next.navigation[navIndex],
      label: merged.title,
      path: merged.link,
      slug: merged.slug,
      visible: typeof merged.visible === 'boolean' ? merged.visible : next.navigation[navIndex].visible
    };
  }

  if (next.collectionHeroes[slug]) {
    const titleParts = merged.title.split(' ');
    next.collectionHeroes[slug] = {
      ...next.collectionHeroes[slug],
      titleFirst: titleParts[0] || merged.title,
      titleSecond: titleParts.slice(1).join(' ') || merged.title
    };
  }

  return next;
};

export const addCategoryToContent = (content, category) => {
  const next = clone(content);
  next.showcase.categories.push(category);
  next.navigation.push(
    createNavItem({
      label: category.title,
      path: category.link,
      slug: category.slug
    })
  );
  next.collectionHeroes[category.slug] = {
    titleFirst: category.title.split(' ')[0] || category.title,
    titleSecond: category.title.split(' ').slice(1).join(' ') || 'Collection',
    objectPosition: 'center center',
    visible: true,
    image: category.image ? normalizeImageAsset(category.image) : null
  };
  return next;
};

export const removeCategoryFromContent = (content, categoryId) => {
  const next = clone(content);
  const category = next.showcase.categories.find((item) => item.id === categoryId);
  next.showcase.categories = next.showcase.categories.filter((item) => item.id !== categoryId);

  if (category) {
    next.navigation = next.navigation.filter((item) => item.slug !== category.slug);
    delete next.collectionHeroes[category.slug];
  }

  return next;
};

const ensureCollectionHero = (content, slug, label) => {
  if (!content.collectionHeroes[slug]) {
    const titleParts = label.split(' ');
    content.collectionHeroes[slug] = {
      titleFirst: titleParts[0] || label,
      titleSecond: titleParts.slice(1).join(' ') || 'Collection',
      objectPosition: 'center center',
      visible: true,
      image: null
    };
  }
};

export const syncCollectionHeroImageToCategory = (content, slug, image) => {
  if (!image?.jpg || slug === 'all') {
    return content;
  }

  const categoryIndex = content.showcase.categories.findIndex((item) => item.slug === slug);

  if (categoryIndex === -1) {
    return content;
  }

  const next = clone(content);
  next.showcase.categories[categoryIndex] = {
    ...next.showcase.categories[categoryIndex],
    image: normalizeImageAsset(image)
  };
  return next;
};

const ensureShowcaseCategoryForNav = (content, navItem) => {
  const existing = content.showcase.categories.find((item) => item.slug === navItem.slug);

  if (existing) {
    const index = content.showcase.categories.indexOf(existing);
    content.showcase.categories[index] = {
      ...existing,
      title: navItem.label,
      link: navItem.path,
      slug: navItem.slug,
      visible: navItem.visible
    };
    return;
  }

  content.showcase.categories.push(
    createShowcaseCategory({
      slug: navItem.slug,
      title: navItem.label,
      link: navItem.path,
      visible: navItem.visible
    })
  );
};

export const addNavToContent = (content, navItem) => {
  const next = clone(content);
  const normalized = normalizeNavItem(navItem);

  if (next.navigation.some((item) => item.id === normalized.id)) {
    return updateNavInContent(next, normalized.id, normalized);
  }

  next.navigation.push(normalized);
  ensureShowcaseCategoryForNav(next, normalized);
  ensureCollectionHero(next, normalized.slug, normalized.label);
  return next;
};

export const updateNavInContent = (content, navId, updates) => {
  const next = clone(content);
  const navIndex = next.navigation.findIndex((item) => item.id === navId);

  if (navIndex === -1) {
    return next;
  }

  const previous = next.navigation[navIndex];
  const normalized = normalizeNavItem({ ...previous, ...updates, id: navId });
  const previousSlug = previous.slug;

  next.navigation[navIndex] = normalized;

  const categoryIndex = next.showcase.categories.findIndex(
    (item) => item.slug === previousSlug || item.slug === normalized.slug
  );

  if (categoryIndex !== -1) {
    const category = next.showcase.categories[categoryIndex];
    next.showcase.categories[categoryIndex] = {
      ...category,
      title: normalized.label,
      link: normalized.path,
      slug: normalized.slug,
      visible: normalized.visible
    };
  } else {
    ensureShowcaseCategoryForNav(next, normalized);
  }

  if (previousSlug !== normalized.slug) {
    if (next.collectionHeroes[previousSlug]) {
      next.collectionHeroes[normalized.slug] = {
        ...next.collectionHeroes[previousSlug],
        titleFirst: normalized.label.split(' ')[0] || normalized.label,
        titleSecond: normalized.label.split(' ').slice(1).join(' ') || 'Collection'
      };
      delete next.collectionHeroes[previousSlug];
    } else {
      ensureCollectionHero(next, normalized.slug, normalized.label);
    }
  } else if (next.collectionHeroes[normalized.slug]) {
    const titleParts = normalized.label.split(' ');
    next.collectionHeroes[normalized.slug] = {
      ...next.collectionHeroes[normalized.slug],
      titleFirst: titleParts[0] || normalized.label,
      titleSecond: titleParts.slice(1).join(' ') || 'Collection'
    };
  } else {
    ensureCollectionHero(next, normalized.slug, normalized.label);
  }

  return next;
};

export const removeNavFromContent = (content, navId) => {
  const next = clone(content);
  const navItem = next.navigation.find((item) => item.id === navId);

  if (!navItem) {
    return next;
  }

  next.navigation = next.navigation.filter((item) => item.id !== navId);
  next.showcase.categories = next.showcase.categories.filter((item) => item.slug !== navItem.slug);
  delete next.collectionHeroes[navItem.slug];

  return next;
};
