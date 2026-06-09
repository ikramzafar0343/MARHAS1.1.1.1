import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { ROLES } from '../src/constants/roles.js';
import { StorefrontContent } from '../src/modules/storefront/storefront.model.js';
import { User } from '../src/modules/users/user.model.js';
import { STOREFRONT_DEFAULTS } from '../src/constants/storefrontDefaults.js';

describe('Storefront API', () => {
  const app = createApp();

  beforeEach(async () => {
    const passwordHash = await User.hashPassword(env.SEED_ADMIN_PASSWORD);
    await User.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      isEmailVerified: true
    });

    await StorefrontContent.create({
      key: 'default',
      isPublished: true,
      navigation: STOREFRONT_DEFAULTS.navigation,
      heroSlides: [
        {
          id: 'hero-1',
          image: '&#x2F;assets&#x2F;images&#x2F;hero1.jpg',
          alt: 'Hero',
          visible: true
        }
      ],
      showcase: STOREFRONT_DEFAULTS.showcase,
      collectionHeroes: STOREFRONT_DEFAULTS.collectionHeroes,
      shopTheLook: STOREFRONT_DEFAULTS.shopTheLook,
      commerceSettings: STOREFRONT_DEFAULTS.commerceSettings,
      publishedAt: new Date()
    });
  });

  const loginAdmin = async () => {
    const login = await request(app).post('/api/v1/auth/admin/login').send({
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD
    });

    expect(login.status).toBe(200);
    return login.body.data.accessToken;
  };

  it('returns decoded image paths from public storefront content', async () => {
    const response = await request(app).get('/api/v1/content/storefront');

    expect(response.status).toBe(200);
    expect(response.body.data.heroSlides[0].image).toBe('/assets/images/hero1.jpg');
  });

  it('returns admin storefront content for authenticated admin users', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .get('/api/v1/content/admin/storefront')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.navigation).toHaveLength(STOREFRONT_DEFAULTS.navigation.length);
    expect(response.body.data.publishedAt).toBeTruthy();
  });

  it('updates storefront content without crashing the admin API', async () => {
    const token = await loginAdmin();
    const nextNavigation = STOREFRONT_DEFAULTS.navigation.filter((item) => item.slug !== 'summer');

    const response = await request(app)
      .put('/api/v1/content/admin/storefront')
      .set('Authorization', `Bearer ${token}`)
      .send({
        navigation: nextNavigation,
        heroSlides: STOREFRONT_DEFAULTS.heroSlides,
        showcase: STOREFRONT_DEFAULTS.showcase,
        collectionHeroes: STOREFRONT_DEFAULTS.collectionHeroes,
        shopTheLook: STOREFRONT_DEFAULTS.shopTheLook,
        footerSocial: STOREFRONT_DEFAULTS.footerSocial,
        authPages: STOREFRONT_DEFAULTS.authPages,
        commerceSettings: STOREFRONT_DEFAULTS.commerceSettings,
        isPublished: true
      });

    expect(response.status).toBe(200);
    expect(response.body.data.navigation).toHaveLength(nextNavigation.length);
    expect(response.body.data.navigation.some((item) => item.slug === 'summer')).toBe(false);
  });

  it('persists collection hero visibility and image overrides', async () => {
    const token = await loginAdmin();
    const nextCollectionHeroes = {
      ...STOREFRONT_DEFAULTS.collectionHeroes,
      summer: {
        ...STOREFRONT_DEFAULTS.collectionHeroes.summer,
        visible: false,
        image: {
          jpg: '/assets/images/summer-hero.jpg',
          webp: null,
          blur: null,
          alt: 'Summer hero override'
        }
      }
    };

    const response = await request(app)
      .put('/api/v1/content/admin/storefront')
      .set('Authorization', `Bearer ${token}`)
      .send({
        navigation: STOREFRONT_DEFAULTS.navigation,
        heroSlides: STOREFRONT_DEFAULTS.heroSlides,
        showcase: STOREFRONT_DEFAULTS.showcase,
        collectionHeroes: nextCollectionHeroes,
        shopTheLook: STOREFRONT_DEFAULTS.shopTheLook,
        footerSocial: STOREFRONT_DEFAULTS.footerSocial,
        authPages: STOREFRONT_DEFAULTS.authPages,
        commerceSettings: STOREFRONT_DEFAULTS.commerceSettings,
        isPublished: true
      });

    expect(response.status).toBe(200);
    expect(response.body.data.collectionHeroes.summer.visible).toBe(false);
    expect(response.body.data.collectionHeroes.summer.image.jpg).toBe('/assets/images/summer-hero.jpg');
  });

  it('persists auth page banner images', async () => {
    const token = await loginAdmin();
    const nextAuthPages = {
      ...STOREFRONT_DEFAULTS.authPages,
      login: {
        image: {
          jpg: '/assets/images/custom-login.jpg',
          webp: null,
          blur: null,
          alt: 'Custom login banner'
        }
      }
    };

    const response = await request(app)
      .put('/api/v1/content/admin/storefront')
      .set('Authorization', `Bearer ${token}`)
      .send({
        navigation: STOREFRONT_DEFAULTS.navigation,
        heroSlides: STOREFRONT_DEFAULTS.heroSlides,
        showcase: STOREFRONT_DEFAULTS.showcase,
        collectionHeroes: STOREFRONT_DEFAULTS.collectionHeroes,
        shopTheLook: STOREFRONT_DEFAULTS.shopTheLook,
        footerSocial: STOREFRONT_DEFAULTS.footerSocial,
        authPages: nextAuthPages,
        commerceSettings: STOREFRONT_DEFAULTS.commerceSettings,
        isPublished: true
      });

    expect(response.status).toBe(200);
    expect(response.body.data.authPages.login.image.jpg).toBe('/assets/images/custom-login.jpg');
    expect(response.body.data.authPages.login.image.alt).toBe('Custom login banner');
  });
});
