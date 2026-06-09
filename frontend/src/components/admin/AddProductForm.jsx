import React, { useEffect, useRef, useState } from 'react';
import { HiOutlinePhotograph, HiOutlineUpload } from 'react-icons/hi';
import AdminProductVariants from './AdminProductVariants';
import AdminSizePicker from './AdminSizePicker';
import {
  ADMIN_PRODUCT_BEST_SELLER_OPTIONS,
  ADMIN_PRODUCT_CATEGORIES,
  ADMIN_PRODUCT_INITIAL_STATE,
  ADMIN_PRODUCT_MAX_IMAGES
} from '../../constants/adminProductForm';

const AddProductForm = ({ onCancel, onListProduct }) => {
  const fileInputRef = useRef(null);
  const imagesRef = useRef([]);
  const [form, setForm] = useState(ADMIN_PRODUCT_INITIAL_STATE);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addImages = (fileList) => {
    const incoming = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    if (!incoming.length) {
      return;
    }

    setImages((prev) => {
      const remaining = ADMIN_PRODUCT_MAX_IMAGES - prev.length;
      const nextFiles = incoming.slice(0, remaining).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file)
      }));

      return [...prev, ...nextFiles];
    });
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((image) => image.id !== id);
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addImages(event.dataTransfer.files);
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('category', form.category);
    formData.append('price', String(form.price));
    formData.append('discountType', form.discountType);
    formData.append('description', form.description.trim());
    formData.append('sizes', JSON.stringify(form.sizes));
    formData.append('bestSeller', form.bestSeller);
    formData.append('status', 'published');
    formData.append('stock', '10');

    if (form.discount) {
      formData.append('discount', String(form.discount));
    }

    if (variants.length) {
      formData.append(
        'variants',
        JSON.stringify(
          variants.map(({ colorName, colorHex }) => ({
            colorName,
            colorHex,
            images: []
          }))
        )
      );
    }

    images.forEach(({ file }) => {
      formData.append('images', file);
    });

    return formData;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onListProduct?.(buildFormData());
    } catch (err) {
      setError(err?.message || 'Unable to list product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="admin-product-form" onSubmit={handleSubmit}>
      <section className="admin-product-section">
        <h2 className="admin-product-section-title">Basic Details</h2>

        <div className="admin-product-fields">
          <label className="admin-product-field admin-product-field--full">
            <span className="admin-product-label">Product Title</span>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={updateField('title')}
              placeholder="e.g., Embroidered Silk Ensemble"
              required
              className="admin-product-input"
            />
          </label>

          <label className="admin-product-field admin-product-field--full">
            <span className="admin-product-label">Category</span>
            <select
              name="category"
              value={form.category}
              onChange={updateField('category')}
              required
              className="admin-product-input admin-product-select"
            >
              <option value="">Select a category</option>
              {ADMIN_PRODUCT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="admin-product-section">
        <h2 className="admin-product-section-title">Pricing Details</h2>

        <div className="admin-product-fields">
          <label className="admin-product-field">
            <span className="admin-product-label">Price (PKR)</span>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={updateField('price')}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
              className="admin-product-input"
            />
          </label>

          <div className="admin-product-field">
            <span className="admin-product-label">Discount (Optional)</span>
            <div className="admin-product-discount-row">
              <input
                type="number"
                name="discount"
                value={form.discount}
                onChange={updateField('discount')}
                placeholder="0"
                min="0"
                className="admin-product-input admin-product-discount-input"
              />
              <select
                name="discountType"
                value={form.discountType}
                onChange={updateField('discountType')}
                className="admin-product-input admin-product-select admin-product-discount-type"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-product-section">
        <h2 className="admin-product-section-title">Product Information</h2>

        <div className="admin-product-fields">
          <label className="admin-product-field admin-product-field--full">
            <span className="admin-product-label">Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField('description')}
              placeholder="Describe fabric, craftsmanship, and styling notes..."
              rows={5}
              required
              className="admin-product-input admin-product-textarea"
            />
          </label>

          <div className="admin-product-field admin-product-field--full">
            <span className="admin-product-label">Available Sizes</span>
            <AdminSizePicker
              selectedSizes={form.sizes}
              onChange={(sizes) => setForm((prev) => ({ ...prev, sizes }))}
            />
          </div>

          <div className="admin-product-field admin-product-field--full">
            <span className="admin-product-label">Homepage Best Sellers</span>
            <div className="admin-product-choices">
              {ADMIN_PRODUCT_BEST_SELLER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`admin-product-choice ${
                    form.bestSeller === option.value ? 'admin-product-choice--active' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="bestSeller"
                    value={option.value}
                    checked={form.bestSeller === option.value}
                    onChange={updateField('bestSeller')}
                    className="admin-product-choice-input"
                  />
                  <span className="admin-product-choice-title">{option.title}</span>
                  <span className="admin-product-choice-desc">{option.description}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AdminProductVariants variants={variants} onChange={setVariants} />

      <section className="admin-product-section">
        <h2 className="admin-product-section-title">Product Images</h2>

        <div
          className={`admin-product-upload ${isDragging ? 'admin-product-upload--active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <HiOutlineUpload size={28} strokeWidth={1.4} />
          <p className="admin-product-upload-text">
            Drag and drop up to {ADMIN_PRODUCT_MAX_IMAGES} images or{' '}
            <span className="admin-product-upload-link">click to upload</span>
          </p>
          <p className="admin-product-upload-hint">Min 800×800px · Max 5MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="admin-product-upload-input"
            onChange={(event) => {
              addImages(event.target.files);
              event.target.value = '';
            }}
          />
        </div>

        <div className="admin-product-thumbs">
          {Array.from({ length: ADMIN_PRODUCT_MAX_IMAGES }).map((_, index) => {
            const image = images[index];

            return (
              <div key={image?.id || `slot-${index}`} className="admin-product-thumb">
                {image ? (
                  <>
                    <img src={image.preview} alt="" className="admin-product-thumb-img" />
                    <button
                      type="button"
                      className="admin-product-thumb-remove"
                      aria-label="Remove image"
                      onClick={() => removeImage(image.id)}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <HiOutlinePhotograph size={22} strokeWidth={1.4} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="admin-product-actions">
        {error && <p className="admin-login-error admin-product-form-error">{error}</p>}

        <button type="button" className="admin-product-cancel" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>

        <button type="submit" className="luxury-button-accent admin-product-btn" disabled={submitting}>
          {submitting ? 'Listing Product...' : 'List Product'}
        </button>
      </div>
    </form>
  );
};

export default AddProductForm;
