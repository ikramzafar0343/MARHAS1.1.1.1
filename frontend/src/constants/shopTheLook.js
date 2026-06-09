import product11 from '../assets/images/product1.1.jpg';
import product12 from '../assets/images/product1.2.jpg';
import product21 from '../assets/images/product2.1.jpg';
import product22 from '../assets/images/product2.2.jpg';
import product3 from '../assets/images/product3.jpg';
import product41 from '../assets/images/product4.1.jpg';
import summer from '../assets/images/summer.jpg';
import newArrival from '../assets/images/newArrival.jpg';
import readyToWear from '../assets/images/readyToWear.jpg';

export const SHOP_LOOK_PLATFORM_CONFIG = {
  instagram: { label: 'View on Instagram' },
  pinterest: { label: 'View on Pinterest' },
  facebook: { label: 'View on Facebook' },
  youtube: { label: 'View on YouTube' }
};

export const SHOP_LOOK_ITEMS = [
  {
    id: 1,
    area: 'main',
    shape: 'main',
    platform: 'instagram',
    image: product11,
    link: 'https://www.instagram.com/p/C8marhas01/'
  },
  {
    id: 2,
    area: 'topSq',
    shape: 'square',
    platform: 'instagram',
    image: product12,
    link: 'https://www.instagram.com/p/C8marhas02/'
  },
  {
    id: 3,
    area: 'topLand',
    shape: 'landscape-sm',
    platform: 'pinterest',
    image: summer,
    link: 'https://www.pinterest.com/pin/marhas-look-03/'
  },
  {
    id: 4,
    area: 'oval',
    shape: 'oval',
    platform: 'instagram',
    image: product22,
    link: 'https://www.instagram.com/p/C8marhas04/'
  },
  {
    id: 5,
    area: 'botSq',
    shape: 'square',
    platform: 'facebook',
    image: product3,
    link: 'https://www.facebook.com/marhas/posts/look05'
  },
  {
    id: 6,
    area: 'botLand',
    shape: 'pill',
    platform: 'instagram',
    image: product41,
    link: 'https://www.instagram.com/p/C8marhas06/'
  },
  {
    id: 7,
    area: 'portrait',
    shape: 'landscape-xs',
    platform: 'youtube',
    image: readyToWear,
    link: 'https://www.youtube.com/watch?v=marhas07'
  },
  {
    id: 8,
    area: 'circle',
    shape: 'circle',
    platform: 'pinterest',
    image: newArrival,
    link: 'https://www.pinterest.com/pin/marhas-look-08/'
  }
];

export const SHOP_LOOK_ROW_ITEMS = SHOP_LOOK_ITEMS.slice(0, 6);

export const SHOP_LOOK_AREA_CLASSES = {
  main: 'col-span-2 md:[grid-area:main]',
  topSq: 'md:[grid-area:topSq]',
  topLand: 'md:[grid-area:topLand]',
  oval: 'col-span-2 sm:col-span-1 md:[grid-area:oval]',
  botSq: 'md:[grid-area:botSq]',
  botLand: 'md:[grid-area:botLand]',
  portrait: 'md:[grid-area:portrait]',
  circle: 'md:[grid-area:circle]'
};
