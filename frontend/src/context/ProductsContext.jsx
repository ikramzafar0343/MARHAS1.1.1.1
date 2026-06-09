import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { mapApiProduct, mapApiProducts } from '../utils/apiMappers';
import { registerProductLookup } from '../utils/productLookup';
import { productsService } from '../services/marhasApi';

const ProductsContext = createContext(null);

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [catalog, featured] = await Promise.all([
        productsService.list({ limit: 100 }),
        productsService.getBestSellers({ limit: 12 })
      ]);

      setProducts(mapApiProducts(Array.isArray(catalog) ? catalog : catalog?.products || catalog));
      setBestSellers(
        mapApiProducts(Array.isArray(featured) ? featured : featured?.products || featured)
      );
    } catch (err) {
      setError(err?.message || 'Unable to load products');
      setProducts([]);
      setBestSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(String(product.id), product));
    return map;
  }, [products]);

  const getProductById = useCallback(
    (id) => {
      if (!id) {
        return null;
      }
      return productMap.get(String(id)) || null;
    },
    [productMap]
  );

  const getProductsByCategory = useCallback(
    (category = 'all') => {
      if (category === 'all') {
        return products;
      }
      return products.filter((product) => product.category === category);
    },
    [products]
  );

  const fetchProductById = useCallback(
    async (id) => {
      const cached = getProductById(id);
      if (cached) {
        return cached;
      }

      try {
        const product = await productsService.getById(id);
        const mapped = mapApiProduct(product);
        if (mapped) {
          setProducts((prev) => {
            if (prev.some((item) => String(item.id) === String(mapped.id))) {
              return prev.map((item) => (String(item.id) === String(mapped.id) ? mapped : item));
            }
            return [...prev, mapped];
          });
        }
        return mapped;
      } catch {
        return null;
      }
    },
    [getProductById]
  );

  useEffect(() => {
    registerProductLookup(getProductById);
  }, [getProductById]);

  const value = useMemo(
    () => ({
      products,
      allProducts: products,
      bestSellers: bestSellers.length ? bestSellers : products.slice(0, 8),
      loading,
      error,
      getProductById,
      getProductsByCategory,
      fetchProductById,
      refreshProducts: loadProducts
    }),
    [
      products,
      bestSellers,
      loading,
      error,
      getProductById,
      getProductsByCategory,
      fetchProductById,
      loadProducts
    ]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
};
