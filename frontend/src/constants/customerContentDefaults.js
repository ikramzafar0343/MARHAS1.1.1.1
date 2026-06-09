import { DEFAULT_COMMERCE_SETTINGS } from './commerceDefaults';
import { DEFAULT_FOOTER_SOCIAL } from './footerSocial';

export { DEFAULT_FOOTER_SOCIAL, FOOTER_SOCIAL_PLATFORMS } from './footerSocial';
export { DEFAULT_COMMERCE_SETTINGS } from './commerceDefaults';

export const CONTENT_LAYOUT_OPTIONS = [
  { value: 'editorial-right', label: 'Right center' },
  { value: 'editorial-left', label: 'Top left' },
  { value: 'editorial-left-center', label: 'Left center' },
  { value: 'editorial-center', label: 'Center' }
];

export const CONTENT_OBJECT_POSITIONS = [
  { value: 'left center', label: 'Left' },
  { value: 'center center', label: 'Center' },
  { value: 'right center', label: 'Right' },
  { value: 'center top', label: 'Top' },
  { value: 'center bottom', label: 'Bottom' }
];

export const SHOP_LOOK_AREAS = [
  'main',
  'topSq',
  'topLand',
  'oval',
  'botSq',
  'botLand',
  'portrait',
  'circle'
];

export const SHOP_LOOK_SHAPES = [
  'main',
  'square',
  'landscape-sm',
  'oval',
  'pill',
  'landscape-xs',
  'circle'
];

export const SHOP_LOOK_PLATFORMS = ['instagram', 'pinterest', 'facebook', 'youtube'];

export const AUTH_PAGE_KEYS = [
  { id: 'login', label: 'Customer Login', path: '/login' },
  { id: 'register', label: 'Customer Register', path: '/register' },
  { id: 'adminLogin', label: 'Admin Login', path: '/admin/login' }
];

const makeImage = (jpg, webp, blur, alt) => ({
  jpg,
  webp: webp || null,
  blur: blur || null,
  alt
});

export const DEFAULT_CUSTOMER_CONTENT = {
  commerceSettings: { ...DEFAULT_COMMERCE_SETTINGS },
  footerSocial: { ...DEFAULT_FOOTER_SOCIAL },
  navigation: [
    { id: 'nav-new', label: 'New Arrivals', path: '/collections/new', slug: 'new', visible: true },
    { id: 'nav-all', label: 'Collections', path: '/collections/all', slug: 'all', visible: true },
    { id: 'nav-summer', label: 'Summer', path: '/collections/summer', slug: 'summer', visible: true },
    { id: 'nav-rtw', label: 'Ready To Wear', path: '/collections/rtw', slug: 'rtw', visible: true },
    {
      id: 'nav-unstitched',
      label: 'Unstitched',
      path: '/collections/unstitched',
      slug: 'unstitched',
      visible: true
    }
  ],
  heroSlides: [
    {
      id: 'hero-1',
      image: '/assets/images/hero1.jpg',
      alt: 'MARHAS luxury womenswear editorial look 1',
      visible: true
    },
    {
      id: 'hero-2',
      image: '/assets/images/hero2.jpg',
      alt: 'MARHAS luxury womenswear editorial look 2',
      visible: true
    },
    {
      id: 'hero-3',
      image: '/assets/images/hero3.jpg',
      alt: 'MARHAS luxury womenswear editorial look 3',
      visible: true
    },
    {
      id: 'hero-4',
      image: '/assets/images/hero4.jpg',
      alt: 'MARHAS luxury womenswear editorial look 4',
      visible: true
    }
  ],
  showcase: {
    heading: 'Explore Our Collections',
    categories: [
      {
        id: 'new-arrival',
        slug: 'new',
        layout: 'editorial-right',
        label: null,
        title: 'New Arrivals',
        description: 'Fresh perspectives on elegance',
        link: '/collections/new',
        visible: true,
        image: makeImage(
          '/assets/images/newArrival.jpg',
          '/assets/images/newArrival.webp',
          '/assets/images/newArrival-blur.jpg',
          'MARHAS new arrival luxury womenswear collection'
        )
      },
      {
        id: 'summer-collection',
        slug: 'summer',
        layout: 'editorial-left',
        label: null,
        title: 'Summer',
        description: 'Light fabrics, timeless grace',
        link: '/collections/summer',
        visible: true,
        image: makeImage(
          '/assets/images/summer.jpg',
          '/assets/images/summer.webp',
          '/assets/images/summer-blur.jpg',
          'MARHAS summer collection editorial fashion'
        )
      },
      {
        id: 'ready-to-wear',
        slug: 'rtw',
        layout: 'editorial-left-center',
        label: null,
        title: 'Ready To Wear',
        description: 'Effortless fashion for every occasion',
        link: '/collections/rtw',
        visible: true,
        image: makeImage(
          '/assets/images/readyToWear.jpg',
          '/assets/images/readyToWear.webp',
          '/assets/images/readyToWear-blur.jpg',
          'MARHAS ready to wear luxury pret collection'
        )
      },
      {
        id: 'unstitched-collection',
        slug: 'unstitched',
        layout: 'editorial-center',
        label: null,
        title: 'Unstitched',
        description: 'Create your signature look',
        link: '/collections/unstitched',
        visible: true,
        image: makeImage(
          '/assets/images/unstiched.jpg',
          '/assets/images/unstiched.webp',
          '/assets/images/unstiched-blur.jpg',
          'MARHAS unstitched premium fabric collection'
        )
      }
    ]
  },
  collectionHeroes: {
    all: {
      titleFirst: 'Our',
      titleSecond: 'Collections',
      objectPosition: 'left center',
      visible: true,
      image: null
    },
    new: {
      titleFirst: 'New',
      titleSecond: 'Arrivals',
      objectPosition: 'left center',
      visible: true,
      image: null
    },
    summer: {
      titleFirst: 'Summer',
      titleSecond: 'Collection',
      objectPosition: 'center center',
      visible: true,
      image: null
    },
    rtw: {
      titleFirst: 'Ready',
      titleSecond: 'To Wear',
      objectPosition: 'right center',
      visible: true,
      image: null
    },
    unstitched: {
      titleFirst: 'Unstitched',
      titleSecond: 'Series',
      objectPosition: 'center center',
      visible: true,
      image: null
    }
  },
  shopTheLook: {
    heading: 'Shop The Look',
    rowSubtitle: 'Get inspired by our fashion community',
    items: [
      {
        id: 'look-1',
        area: 'main',
        shape: 'main',
        platform: 'instagram',
        mediaType: 'image',
        image: '/assets/images/product1.1.jpg',
        video: null,
        link: 'https://www.instagram.com/p/C8marhas01/',
        visible: true
      },
      {
        id: 'look-2',
        area: 'topSq',
        shape: 'square',
        platform: 'instagram',
        mediaType: 'image',
        image: '/assets/images/product1.2.jpg',
        video: null,
        link: 'https://www.instagram.com/p/C8marhas02/',
        visible: true
      },
      {
        id: 'look-3',
        area: 'topLand',
        shape: 'landscape-sm',
        platform: 'pinterest',
        mediaType: 'image',
        image: '/assets/images/summer.jpg',
        video: null,
        link: 'https://www.pinterest.com/pin/marhas-look-03/',
        visible: true
      },
      {
        id: 'look-4',
        area: 'oval',
        shape: 'oval',
        platform: 'instagram',
        mediaType: 'image',
        image: '/assets/images/product2.2.jpg',
        video: null,
        link: 'https://www.instagram.com/p/C8marhas04/',
        visible: true
      },
      {
        id: 'look-5',
        area: 'botSq',
        shape: 'square',
        platform: 'facebook',
        mediaType: 'image',
        image: '/assets/images/product3.jpg',
        video: null,
        link: 'https://www.facebook.com/marhas/posts/look05',
        visible: true
      },
      {
        id: 'look-6',
        area: 'botLand',
        shape: 'pill',
        platform: 'instagram',
        mediaType: 'image',
        image: '/assets/images/product4.1.jpg',
        video: null,
        link: 'https://www.instagram.com/p/C8marhas06/',
        visible: true
      },
      {
        id: 'look-7',
        area: 'portrait',
        shape: 'landscape-xs',
        platform: 'youtube',
        mediaType: 'video',
        image: '/assets/images/readyToWear.jpg',
        video: null,
        link: 'https://www.youtube.com/watch?v=marhas07',
        visible: true
      },
      {
        id: 'look-8',
        area: 'circle',
        shape: 'circle',
        platform: 'pinterest',
        mediaType: 'image',
        image: '/assets/images/newArrival.jpg',
        video: null,
        link: 'https://www.pinterest.com/pin/marhas-look-08/',
        visible: true
      }
    ]
  },
  authPages: {
    login: {
      image: makeImage(
        '/assets/images/readyToWear.jpg',
        '/assets/images/readyToWear.webp',
        '/assets/images/readyToWear-blur.jpg',
        'MARHAS ready to wear collection'
      )
    },
    register: {
      image: makeImage(
        '/assets/images/newArrival.jpg',
        '/assets/images/newArrival.webp',
        '/assets/images/newArrival-blur.jpg',
        'MARHAS new arrivals collection'
      )
    },
    adminLogin: {
      image: makeImage(
        '/assets/images/hero1.jpg',
        '/assets/images/hero1.webp',
        '/assets/images/hero1-blur.jpg',
        'MARHAS admin portal'
      )
    }
  }
};

export const CUSTOMER_CONTENT_STORAGE_KEY = 'marhas-customer-content';
