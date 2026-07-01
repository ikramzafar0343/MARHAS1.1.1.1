import { ADMIN_PRODUCT_SPECIFICATION_OPTIONS } from '../../constants/adminProductForm';

const AdminProductSpecifications = ({ specifications = {}, onChange }) => {
  const toggleSpecification = (key, defaultText) => {
    const next = { ...specifications };

    if (next[key]) {
      delete next[key];
    } else {
      next[key] = defaultText;
    }

    onChange(next);
  };

  const updateSpecification = (key, text) => {
    onChange({
      ...specifications,
      [key]: text
    });
  };

  const activeOptions = ADMIN_PRODUCT_SPECIFICATION_OPTIONS.filter(
    (option) => specifications[option.key]
  );

  return (
    <div className="admin-product-specs">
      <div className="admin-product-spec-chips" role="group" aria-label="Product specifications">
        {ADMIN_PRODUCT_SPECIFICATION_OPTIONS.map((option) => {
          const isActive = Boolean(specifications[option.key]);

          return (
            <button
              key={option.key}
              type="button"
              className={`admin-product-spec-chip ${isActive ? 'admin-product-spec-chip--active' : ''}`}
              aria-pressed={isActive}
              onClick={() => toggleSpecification(option.key, option.defaultText)}
            >
              <span className="admin-product-spec-chip-label">{option.label}</span>
              <span className="admin-product-spec-chip-desc">{option.description}</span>
            </button>
          );
        })}
      </div>

      {activeOptions.length > 0 ? (
        <div className="admin-product-spec-fields">
          {activeOptions.map((option) => (
            <label key={option.key} className="admin-product-field admin-product-field--full">
              <span className="admin-product-label">{option.label}</span>
              <textarea
                value={specifications[option.key] || ''}
                onChange={(event) => updateSpecification(option.key, event.target.value)}
                rows={3}
                className="admin-product-input admin-product-textarea"
                placeholder={option.defaultText}
              />
            </label>
          ))}
        </div>
      ) : (
        <p className="admin-product-spec-hint">
          Select one or more specification types to show on the product page.
        </p>
      )}
    </div>
  );
};

export default AdminProductSpecifications;
