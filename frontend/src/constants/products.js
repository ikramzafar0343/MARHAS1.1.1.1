import product11 from '../assets/images/product1.1.jpg';
import product12 from '../assets/images/product1.2.jpg';
import product21 from '../assets/images/product2.1.jpg';
import product22 from '../assets/images/product2.2.jpg';
import product3 from '../assets/images/product3.jpg';
import product41 from '../assets/images/product4.1.jpg';
import product42 from '../assets/images/product4.2.jpg';

export const PRODUCT_GALLERY = [
  { images: [product11, product12] },
  { images: [product21, product22] },
  { images: [product3] },
  { images: [product41, product42] }
];

const CATALOG_PRODUCTS = [
  {
    id: 1,
    name: 'Embroidered Silk Ensemble',
    price: 45000,
    originalPrice: 52000,
    category: 'new'
  },
  {
    id: 2,
    name: 'Velvet Luxury Kurta',
    price: 38500,
    originalPrice: 44000,
    category: 'summer'
  },
  {
    id: 3,
    name: 'Chiffon Draped Saree',
    price: 52000,
    originalPrice: 59000,
    category: 'summer'
  },
  {
    id: 4,
    name: 'Pearl Embellished Gown',
    price: 65000,
    originalPrice: 72000,
    category: 'new'
  },
  {
    id: 5,
    name: 'Organza Evening Suit',
    price: 42000,
    originalPrice: 48000,
    category: 'rtw'
  },
  {
    id: 6,
    name: 'Brocade Lehenga Set',
    price: 78000,
    originalPrice: 85000,
    category: 'luxury'
  },
  {
    id: 7,
    name: 'Cotton Silk Kameez',
    price: 28500,
    originalPrice: 32000,
    category: 'rtw'
  },
  {
    id: 8,
    name: 'Zardozi Anarkali',
    price: 55000,
    originalPrice: 62000,
    category: 'unstitched'
  }
];

const CATEGORY_COPY = {
  new: {
    detail:
      'The design celebrates traditional artistry while embracing modern sensibilities, making it perfect for formal occasions and sophisticated gatherings.',
    highlights: [
      'Hand-finished embellishments with premium threads',
      'Luxury fabric selected for comfort and drape',
      'Contemporary silhouette with timeless elements',
      'Designed exclusively for the MARHAS woman'
    ],
    composition: 'Premium silk-blend base with intricate embroidered overlays.',
    includes: 'Complete ensemble as shown in product imagery.'
  },
  summer: {
    detail:
      'Lightweight construction and breathable fabrics keep the look effortless through warmer seasons without compromising polish.',
    highlights: [
      'Airy textiles for all-day comfort',
      'Soft structure with refined finishing',
      'Easy elegance for daytime and evening wear',
      'Curated for the modern MARHAS wardrobe'
    ],
    composition: 'Breathable cotton-silk and lawn blends with soft lining.',
    includes: 'Outfit components as displayed in imagery.'
  },
  rtw: {
    detail:
      'Ready-to-wear tailoring delivers an polished silhouette straight from the box, ideal for everyday luxury and special moments alike.',
    highlights: [
      'Precision pret construction',
      'Comfort-first fit with elevated detailing',
      'Minimal styling required',
      'Made for repeat wear'
    ],
    composition: 'Premium pret fabric with structured yet soft hand-feel.',
    includes: 'Ready-to-wear piece as shown in product imagery.'
  },
  unstitched: {
    detail:
      'Premium unstitched fabric offers the freedom to customize your fit while preserving MARHAS signature craftsmanship and finish.',
    highlights: [
      'Generous fabric meterage for custom tailoring',
      'Rich texture with artisan-inspired detailing',
      'Ideal for bespoke festive and formal looks',
      'Crafted for personalization'
    ],
    composition: 'Fine unstitched fabric with optional embroidered panels.',
    includes: 'Fabric set as listed; stitching not included.'
  },
  luxury: {
    detail:
      'An elevated festive statement piece with couture-level finishing, created for occasions that call for exceptional presence.',
    highlights: [
      'Statement craftsmanship and rich texture',
      'Limited-edition construction',
      'Designed for milestone celebrations',
      'Finished to luxury standards'
    ],
    composition: 'Luxury brocade and silk blends with detailed embellishment.',
    includes: 'Full festive set as shown in product imagery.'
  }
};

const DEFAULT_CARE = 'Dry clean only. Steam iron at medium temperature.';

const buildProductDescription = (product) => {
  const copy = CATEGORY_COPY[product.category] || CATEGORY_COPY.new;

  return {
    intro: `Introducing our ${product.name}, a MARHAS piece that embodies contemporary elegance with refined craftsmanship and premium fabrics.`,
    detail: copy.detail,
    highlights: copy.highlights
  };
};

const buildProductSpecifications = (product) => {
  const copy = CATEGORY_COPY[product.category] || CATEGORY_COPY.new;

  return {
    composition: copy.composition,
    care: DEFAULT_CARE,
    includes: copy.includes
  };
};

const enrichProductDetails = (product) => ({
  ...product,
  description: buildProductDescription(product),
  specifications: buildProductSpecifications(product)
});

export const buildCraftsmanshipFeature = (product) => {
  const words = product.name.trim().split(/\s+/);
  const titleAccent = words.length > 1 ? words.pop() : '';
  const titlePrimary = words.join(' ') || product.name;
  const { description, specifications } = product;

  return {
    label: 'Craftsmanship',
    titlePrimary,
    titleAccent,
    description: [
      description.intro,
      description.detail,
      `${specifications.composition} ${specifications.care}`
    ].join(' ')
  };
};

export const withProductImages = (products) =>
  products.map((product, index) => {
    const gallery = PRODUCT_GALLERY[index % PRODUCT_GALLERY.length];
    const images = gallery.images.filter(Boolean);

    return enrichProductDetails({
      ...product,
      image: images[0],
      images
    });
  });

export const ALL_PRODUCTS = withProductImages(CATALOG_PRODUCTS);

export const getProductById = (id) =>
  ALL_PRODUCTS.find((product) => product.id === Number(id));

export const getProductsByCategory = (category = 'all') => {
  if (category === 'all') {
    return ALL_PRODUCTS;
  }

  return ALL_PRODUCTS.filter((product) => product.category === category);
};

export const CATEGORY_LABELS = {
  new: 'New Arrivals',
  summer: 'Summer',
  rtw: 'Ready To Wear',
  unstitched: 'Unstitched',
  luxury: 'Collections'
};

export const getCategoryPath = (category) => {
  if (category === 'luxury') {
    return '/collections/all';
  }

  return `/collections/${category}`;
};
