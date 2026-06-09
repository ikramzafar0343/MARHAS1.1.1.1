import { storefrontRepository } from './storefront.repository.js';
import { STOREFRONT_DEFAULTS } from '../../constants/storefrontDefaults.js';
import { AppError } from '../../utils/AppError.js';
import { decodeHtmlEntitiesDeep } from '../../utils/htmlEntities.js';

const STOREFRONT_KEY = 'default';

const normalizeStorefrontDoc = (doc) => {
  if (!doc) {
    return null;
  }

  if (typeof doc.toObject === 'function') {
    return doc.toObject({ flattenMaps: true, virtuals: false });
  }

  const content = { ...doc };

  if (content.collectionHeroes instanceof Map) {
    content.collectionHeroes = Object.fromEntries(content.collectionHeroes);
  }

  return content;
};

const serializeContent = (doc) => {
  const content = normalizeStorefrontDoc(doc);

  if (!content) {
    return null;
  }

  return decodeHtmlEntitiesDeep({
    navigation: content.navigation,
    heroSlides: content.heroSlides,
    showcase: content.showcase,
    collectionHeroes: content.collectionHeroes,
    shopTheLook: content.shopTheLook,
    footerSocial: content.footerSocial,
    authPages: content.authPages,
    commerceSettings: content.commerceSettings,
    isPublished: content.isPublished,
    publishedAt: content.publishedAt,
    updatedAt: content.updatedAt
  });
};

export class StorefrontService {
  constructor(repository = storefrontRepository) {
    this.repository = repository;
  }

  getDefaults() {
    return STOREFRONT_DEFAULTS;
  }

  async getPublic() {
    const content = await this.repository.findPublished(STOREFRONT_KEY);

    if (!content) {
      throw new AppError('Published storefront content not found', 404);
    }

    return serializeContent(content);
  }

  async getAdmin() {
    let content = await this.repository.findByKey(STOREFRONT_KEY, { lean: true });

    if (!content) {
      const created = await this.repository.resetToDefaults(STOREFRONT_DEFAULTS, {
        key: STOFRONT_KEY,
        isPublished: false
      });
      content = normalizeStorefrontDoc(created);
    }

    return serializeContent(content);
  }

  async update(data, userId) {
    const existing = await this.repository.findByKey(STOREFRONT_KEY, { lean: true });
    const current = existing || {};

    const payload = {
      navigation: data.navigation ?? current.navigation,
      heroSlides: data.heroSlides ?? current.heroSlides,
      showcase: data.showcase ?? current.showcase,
      collectionHeroes: data.collectionHeroes ?? current.collectionHeroes,
      shopTheLook: data.shopTheLook ?? current.shopTheLook,
      footerSocial: data.footerSocial ?? current.footerSocial,
      authPages: data.authPages ?? current.authPages,
      commerceSettings: data.commerceSettings ?? current.commerceSettings,
      isPublished: data.isPublished ?? current.isPublished ?? true
    };

    const updated = await this.repository.upsertByKey(STOREFRONT_KEY, payload, {
      updatedBy: userId
    });

    return serializeContent(updated);
  }

  async resetDefaults(userId) {
    const reset = await this.repository.resetToDefaults(STOREFRONT_DEFAULTS, {
      key: STOREFRONT_KEY,
      isPublished: true,
      updatedBy: userId
    });

    return serializeContent(reset);
  }
}

export const storefrontService = new StorefrontService();
