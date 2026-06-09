import React from 'react';
import { ADMIN_PRODUCT_PRESET_COLORS } from '../../constants/adminProductForm';

const normalizeHex = (hex) => hex.toLowerCase();

const isPresetColor = (hex) =>
  ADMIN_PRODUCT_PRESET_COLORS.some((preset) => normalizeHex(preset.hex) === normalizeHex(hex));

const AdminColorPicker = ({ value, onChange, onPresetSelect }) => {
  const handleCustomChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className="admin-product-color-picker" role="group" aria-label="Pick color">
      {ADMIN_PRODUCT_PRESET_COLORS.map((preset) => {
        const isActive = normalizeHex(value) === normalizeHex(preset.hex);

        return (
          <button
            key={preset.hex}
            type="button"
            className={`admin-product-color-swatch ${isActive ? 'admin-product-color-swatch--active' : ''}`}
            style={{ backgroundColor: preset.hex }}
            aria-label={preset.name}
            aria-pressed={isActive}
            title={preset.name}
            onClick={() => onPresetSelect(preset)}
          />
        );
      })}

      <label
        className={`admin-product-color-swatch admin-product-color-swatch--custom ${
          !isPresetColor(value) ? 'admin-product-color-swatch--active' : ''
        }`}
        style={{ backgroundColor: value }}
        title="Custom color"
      >
        <input
          type="color"
          value={value}
          onChange={handleCustomChange}
          aria-label="Custom color"
          className="admin-product-color-swatch-input"
        />
      </label>
    </div>
  );
};

export default AdminColorPicker;
