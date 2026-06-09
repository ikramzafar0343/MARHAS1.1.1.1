let lookupFn = null;

export const registerProductLookup = (fn) => {
  lookupFn = fn;
};

export const lookupProduct = (id) => {
  if (!id || !lookupFn) {
    return null;
  }

  return lookupFn(id);
};
