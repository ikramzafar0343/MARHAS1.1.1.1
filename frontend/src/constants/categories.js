import { DEFAULT_CUSTOMER_CONTENT } from './customerContentDefaults';
import { getCollectionHeroFromContent } from '../utils/customerContentHelpers';

export const SHOWCASE_CATEGORIES = DEFAULT_CUSTOMER_CONTENT.showcase.categories;

export const getCollectionHero = (slug = 'all') =>
  getCollectionHeroFromContent(DEFAULT_CUSTOMER_CONTENT, slug);
