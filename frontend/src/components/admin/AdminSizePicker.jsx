import React from 'react';
import { ADMIN_PRODUCT_SIZES } from '../../constants/adminProductForm';

const AdminSizePicker = ({ selectedSizes = [], onChange }) => {
  const toggleSize = (size) => {
    const nextSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((item) => item !== size)
      : [...selectedSizes, size];

    onChange(nextSizes);
  };

  return (
    <div className="admin-product-size-chips" role="group" aria-label="Available sizes">
      {ADMIN_PRODUCT_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          className={`admin-product-size-chip ${
            selectedSizes.includes(size) ? 'admin-product-size-chip--active' : ''
          }`}
          aria-pressed={selectedSizes.includes(size)}
          onClick={() => toggleSize(size)}
        >
          {size}
        </button>
      ))}
    </div>
  );
};

export default AdminSizePicker;
