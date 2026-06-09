import React, { useEffect, useRef } from 'react';
import { HiOutlinePhotograph, HiOutlinePlus, HiOutlineTrash, HiOutlineUpload } from 'react-icons/hi';
import AdminColorPicker from './AdminColorPicker';
import {
  ADMIN_PRODUCT_MAX_VARIANT_IMAGES,
  ADMIN_PRODUCT_MAX_VARIANTS,
  createAdminProductVariant
} from '../../constants/adminProductForm';

const AdminProductVariants = ({ variants, onChange }) => {
  const variantsRef = useRef(variants);
  variantsRef.current = variants;

  useEffect(() => {
    return () => {
      variantsRef.current.forEach((variant) => {
        variant.images.forEach((image) => URL.revokeObjectURL(image.preview));
      });
    };
  }, []);

  const updateVariants = (nextVariants) => {
    onChange(nextVariants);
  };

  const addVariant = () => {
    if (variants.length >= ADMIN_PRODUCT_MAX_VARIANTS) {
      return;
    }

    updateVariants([...variants, createAdminProductVariant()]);
  };

  const removeVariant = (variantId) => {
    const target = variants.find((variant) => variant.id === variantId);
    target?.images.forEach((image) => URL.revokeObjectURL(image.preview));
    updateVariants(variants.filter((variant) => variant.id !== variantId));
  };

  const updateVariant = (variantId, patch) => {
    updateVariants(
      variants.map((variant) => (variant.id === variantId ? { ...variant, ...patch } : variant))
    );
  };

  const applyPresetColor = (variantId, preset) => {
    const variant = variants.find((item) => item.id === variantId);

    updateVariant(variantId, {
      colorHex: preset.hex,
      colorName: variant?.colorName || preset.name
    });
  };

  const addVariantImages = (variantId, fileList) => {
    const variant = variants.find((item) => item.id === variantId);
    if (!variant) {
      return;
    }

    const incoming = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    if (!incoming.length) {
      return;
    }

    const remaining = ADMIN_PRODUCT_MAX_VARIANT_IMAGES - variant.images.length;
    const nextImages = incoming.slice(0, remaining).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file)
    }));

    updateVariant(variantId, { images: [...variant.images, ...nextImages] });
  };

  const removeVariantImage = (variantId, imageId) => {
    const variant = variants.find((item) => item.id === variantId);
    if (!variant) {
      return;
    }

    const target = variant.images.find((image) => image.id === imageId);
    if (target) {
      URL.revokeObjectURL(target.preview);
    }

    updateVariant(variantId, {
      images: variant.images.filter((image) => image.id !== imageId)
    });
  };

  return (
    <section className="admin-product-section">
      <div className="admin-product-variant-head">
        <h2 className="admin-product-section-title admin-product-section-title--inline">Color Variants</h2>
        <button
          type="button"
          className="admin-product-add-variant"
          onClick={addVariant}
          disabled={variants.length >= ADMIN_PRODUCT_MAX_VARIANTS}
        >
          <HiOutlinePlus size={16} strokeWidth={1.8} />
          Add Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="admin-product-variant-empty">
          <p>Add a variant to set color and upload variant-specific images.</p>
          <button type="button" className="admin-product-add-variant admin-product-add-variant--center" onClick={addVariant}>
            <HiOutlinePlus size={16} strokeWidth={1.8} />
            Add First Variant
          </button>
        </div>
      ) : (
        <div className="admin-product-variant-list">
          {variants.map((variant, index) => (
            <article key={variant.id} className="admin-product-variant-card">
              <div className="admin-product-variant-card-head">
                <span className="admin-product-variant-label">Variant {index + 1}</span>
                <button
                  type="button"
                  className="admin-product-variant-remove"
                  onClick={() => removeVariant(variant.id)}
                  aria-label={`Remove variant ${index + 1}`}
                >
                  <HiOutlineTrash size={16} strokeWidth={1.6} />
                </button>
              </div>

              <div className="admin-product-variant-grid">
                <label className="admin-product-field admin-product-field--full">
                  <span className="admin-product-label">Color Name</span>
                  <input
                    type="text"
                    value={variant.colorName}
                    onChange={(event) => updateVariant(variant.id, { colorName: event.target.value })}
                    placeholder="e.g., Ivory Gold"
                    className="admin-product-input"
                  />
                </label>

                <div className="admin-product-field admin-product-field--full">
                  <span className="admin-product-label">Pick Color</span>
                  <AdminColorPicker
                    value={variant.colorHex}
                    onChange={(colorHex) => updateVariant(variant.id, { colorHex })}
                    onPresetSelect={(preset) => applyPresetColor(variant.id, preset)}
                  />
                </div>

                <div className="admin-product-field admin-product-field--full">
                  <span className="admin-product-label">Variant Images</span>
                  <label className="admin-product-variant-upload">
                    <HiOutlineUpload size={20} strokeWidth={1.4} />
                    <span>
                      Upload up to {ADMIN_PRODUCT_MAX_VARIANT_IMAGES} images for this color
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="admin-product-upload-input"
                      onChange={(event) => {
                        addVariantImages(variant.id, event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>

                  <div className="admin-product-variant-thumbs">
                    {Array.from({ length: ADMIN_PRODUCT_MAX_VARIANT_IMAGES }).map((_, thumbIndex) => {
                      const image = variant.images[thumbIndex];

                      return (
                        <div key={image?.id || `variant-slot-${variant.id}-${thumbIndex}`} className="admin-product-thumb">
                          {image ? (
                            <>
                              <img src={image.preview} alt="" className="admin-product-thumb-img" />
                              <button
                                type="button"
                                className="admin-product-thumb-remove"
                                aria-label="Remove variant image"
                                onClick={() => removeVariantImage(variant.id, image.id)}
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <HiOutlinePhotograph size={20} strokeWidth={1.4} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminProductVariants;
