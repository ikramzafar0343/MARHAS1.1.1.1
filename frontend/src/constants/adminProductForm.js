export const ADMIN_PRODUCT_CATEGORIES = [
  { value: 'new-arrivals', label: 'New Arrivals' },
  { value: 'summer', label: 'Summer' },
  { value: 'ready-to-wear', label: 'Ready To Wear' },
  { value: 'unstitched', label: 'Unstitched' },
  { value: 'festive', label: 'Festive' },
  { value: 'bridal', label: 'Bridal' }
];

export const ADMIN_PRODUCT_BEST_SELLER_OPTIONS = [
  {
    value: 'no',
    title: 'Standard Listing',
    description: 'Publish without homepage placement'
  },
  {
    value: 'yes',
    title: 'Best Seller',
    description: 'Feature in homepage best sellers'
  }
];

export const ADMIN_PRODUCT_MAX_IMAGES = 5;
export const ADMIN_PRODUCT_MAX_VARIANTS = 6;
export const ADMIN_PRODUCT_MAX_VARIANT_IMAGES = 3;

export const ADMIN_PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export const ADMIN_PRODUCT_SPECIFICATION_OPTIONS = [
  {
    key: 'composition',
    label: 'Composition',
    description: 'Fabric blend and material details',
    defaultText: 'Premium fabric with refined finishing.'
  },
  {
    key: 'care',
    label: 'Care',
    description: 'Washing and maintenance instructions',
    defaultText: 'Dry clean only. Steam iron at medium temperature.'
  },
  {
    key: 'includes',
    label: 'Includes',
    description: 'What is included with the product',
    defaultText: 'Complete ensemble as shown in product imagery.'
  }
];

export const PRODUCT_SPECIFICATION_FIELDS = ADMIN_PRODUCT_SPECIFICATION_OPTIONS.map(
  ({ key, label }) => ({ key, label })
);

export const DEFAULT_RETURN_POLICY = `14-day exchange policy for unworn items with original tags intact.
Nationwide delivery within 3–5 working days. Free shipping on orders above PKR 15,000.
Secure checkout with encrypted payment processing.`;

export const ADMIN_PRODUCT_PRESET_COLORS = [
  { name: 'Ivory Gold', hex: '#EAE0D5' },
  { name: 'Soft Sand', hex: '#C9A86A' },
  { name: 'Deep Charcoal', hex: '#4A4238' },
  { name: 'Rose Blush', hex: '#D6C6B8' },
  { name: 'Onyx Black', hex: '#1F1F1F' }
];

export const createAdminProductVariant = () => ({
  id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  colorName: '',
  colorHex: '#EAE0D5',
  images: []
});

export const ADMIN_PRODUCT_INITIAL_STATE = {
  title: '',
  category: '',
  price: '',
  discount: '',
  discountType: 'percentage',
  description: '',
  sizes: [],
  specifications: {},
  returnPolicy: DEFAULT_RETURN_POLICY,
  bestSeller: 'no'
};
