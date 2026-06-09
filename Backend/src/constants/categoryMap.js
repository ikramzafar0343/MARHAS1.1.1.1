export const FRONTEND_TO_BACKEND_CATEGORY = {
  new: 'new-arrivals',
  summer: 'summer',
  rtw: 'ready-to-wear',
  unstitched: 'unstitched',
  luxury: 'festive',
  all: null
};

export const BACKEND_TO_FRONTEND_CATEGORY = Object.fromEntries(
  Object.entries(FRONTEND_TO_BACKEND_CATEGORY)
    .filter(([, value]) => value)
    .map(([key, value]) => [value, key])
);

export const normalizeCategoryFilter = (category) => {
  if (!category || category === 'all') {
    return undefined;
  }

  return FRONTEND_TO_BACKEND_CATEGORY[category] || category;
};

export const toFrontendCategory = (category) => BACKEND_TO_FRONTEND_CATEGORY[category] || category;
