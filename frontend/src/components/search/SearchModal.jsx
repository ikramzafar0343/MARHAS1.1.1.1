import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiX } from 'react-icons/hi';
import { useProducts } from '../../context/ProductsContext';
import { productsService } from '../../services/marhasApi';
import { mapApiProducts } from '../../utils/apiMappers';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 280;
const RESULT_LIMIT = 8;

const formatPrice = (amount) => `PKR ${Number(amount || 0).toLocaleString()}`;

const filterLocalProducts = (products, query) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return products
    .filter((product) => {
      const haystack = [product.name, product.sku, product.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    })
    .slice(0, RESULT_LIMIT);
};

const SearchModal = ({ open, onClose }) => {
  const titleId = useId();
  const inputRef = useRef(null);
  const { products } = useProducts();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const resetState = useCallback(() => {
    setQuery('');
    setResults([]);
    setLoading(false);
    setHasSearched(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 120);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      return undefined;
    }

    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await productsService.search(trimmed, { limit: RESULT_LIMIT });
        const mapped = mapApiProducts(Array.isArray(response) ? response : response?.products || response);

        setResults(mapped.length ? mapped : filterLocalProducts(products, trimmed));
      } catch {
        setResults(filterLocalProducts(products, trimmed));
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [open, query, products]);

  const handleResultClick = () => {
    handleClose();
  };

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="search-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <button
            type="button"
            className="search-modal-backdrop"
            aria-label="Close search"
            onClick={handleClose}
          />

          <div className="search-modal-shell">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="search-modal-panel"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
            <h2 id={titleId} className="sr-only">
              Search products
            </h2>

            <form
              className="search-modal-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <HiOutlineSearch size={20} strokeWidth={1.5} aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="search-modal-input"
                placeholder="Search collections, products, SKU..."
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                className="search-modal-close"
                aria-label="Close search"
                onClick={handleClose}
              >
                <HiX size={20} strokeWidth={1.5} />
              </button>
            </form>

            <div className="search-modal-body">
              {query.trim().length < MIN_QUERY_LENGTH && (
                <p className="search-modal-hint">Type at least 2 characters to search.</p>
              )}

              {loading && <p className="search-modal-status">Searching...</p>}

              {!loading && hasSearched && results.length === 0 && (
                <p className="search-modal-status">No products found for &ldquo;{query.trim()}&rdquo;.</p>
              )}

              {!loading && results.length > 0 && (
                <ul className="search-modal-results">
                  {results.map((product) => (
                    <li key={product.id}>
                      <Link
                        to={`/product/${product.id}`}
                        className="search-modal-result"
                        onClick={handleResultClick}
                      >
                        <div className="search-modal-result-media">
                          {product.image ? (
                            <img src={product.image} alt="" loading="lazy" decoding="async" />
                          ) : (
                            <span className="search-modal-result-fallback" aria-hidden="true" />
                          )}
                        </div>
                        <div className="search-modal-result-copy">
                          <span className="search-modal-result-name">{product.name}</span>
                          {product.sku && (
                            <span className="search-modal-result-meta">{product.sku}</span>
                          )}
                        </div>
                        <span className="search-modal-result-price">{formatPrice(product.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SearchModal;
