import React, { useState } from 'react';
import {
  HiOutlineExternalLink,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineTrash
} from 'react-icons/hi';
import AdminModal from './AdminModal';
import {
  CONTENT_LAYOUT_OPTIONS,
  CONTENT_OBJECT_POSITIONS,
  SHOP_LOOK_AREAS,
  SHOP_LOOK_PLATFORMS,
  SHOP_LOOK_SHAPES,
  AUTH_PAGE_KEYS,
  FOOTER_SOCIAL_PLATFORMS
} from '../../constants/customerContentDefaults';
import {
  normalizeNavItem,
  readFileAsDataUrl,
  resolveMediaUrl
} from '../../utils/customerContentHelpers';
import { uploadsService } from '../../services/marhasApi';

const TABS = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'hero', label: 'Home Hero' },
  { id: 'showcase', label: 'Category Banners' },
  { id: 'collections', label: 'Collection Heroes' },
  { id: 'shop-look', label: 'Shop The Look' },
  { id: 'auth-pages', label: 'Auth Banners' },
  { id: 'footer-social', label: 'Footer Social' },
  { id: 'commerce', label: 'Shipping & Tax' }
];

const AdminStorefrontIconAction = ({ label, onClick, children, tone = 'default' }) => (
  <button
    type="button"
    className={`admin-inventory-icon-btn admin-inventory-icon-btn--${tone}`}
    aria-label={label}
    title={label}
    onClick={onClick}
  >
    {children}
  </button>
);

const Field = ({ label, children, hint }) => (
  <label className="admin-storefront-field">
    <span className="admin-storefront-field-label">{label}</span>
    {children}
    {hint && <span className="admin-storefront-field-hint">{hint}</span>}
  </label>
);

const ImagePreview = ({ src, alt = '' }) =>
  src ? <img src={src} alt={alt} className="admin-storefront-preview" /> : null;

const ImageUploadField = ({ label, value, onChange, accept = 'image/*' }) => {
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const asset = await uploadsService.uploadImage(file);
      onChange(asset.url || asset.path || '');
    } catch {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
    }

    event.target.value = '';
  };

  return (
    <Field label={label} hint="Upload a new image or paste a URL below.">
      <div className="admin-storefront-media-row">
        <ImagePreview src={resolveMediaUrl(value)} />
        <div className="admin-storefront-media-actions">
          <label className="admin-storefront-upload-btn">
            Upload image
            <input type="file" accept={accept} className="sr-only" onChange={handleFile} />
          </label>
          <input
            type="url"
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            className="admin-product-input"
            placeholder="/assets/images/hero1.jpg or /uploads/..."
          />
        </div>
      </div>
    </Field>
  );
};

export const AdminCustomerSideIntro = ({ draftSavedAt, saving, error, onReset, onPreview }) => (
  <header className="admin-storefront-intro">
    <div>
      <h1 className="admin-inventory-title">Dynamic Customer Side</h1>
      <p className="admin-inventory-subtitle">
        Manage navigation, hero banners, category layouts, collection heroes, auth page banners,
        shop-the-look posts, and storefront shipping and tax settings. Changes publish instantly across the site.
      </p>
      {saving && <p className="admin-storefront-saved-at">Saving changes...</p>}
      {!saving && draftSavedAt && (
        <p className="admin-storefront-saved-at">
          Last saved {new Date(draftSavedAt).toLocaleString()}
        </p>
      )}
      {error && <p className="admin-storefront-error">{error}</p>}
    </div>

    <div className="admin-storefront-intro-actions">
      <button type="button" className="admin-storefront-secondary-btn" onClick={onReset}>
        <HiOutlineRefresh size={16} />
        Reset defaults
      </button>
      <a href="/" target="_blank" rel="noopener noreferrer" className="admin-storefront-preview-btn">
        <HiOutlineExternalLink size={16} />
        Preview storefront
      </a>
      <button type="button" className="luxury-button-accent admin-storefront-save-btn" onClick={onPreview}>
        View live site
      </button>
    </div>
  </header>
);

export const AdminCustomerSideTabs = ({ activeTab, onTabChange }) => (
  <div className="admin-storefront-tabs" role="tablist" aria-label="Storefront sections">
    {TABS.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        className={`admin-analytics-period ${activeTab === tab.id ? 'admin-analytics-period--active' : ''}`}
        onClick={() => onTabChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

const NavigationPanel = ({ content, onAdd, onEdit, onDelete }) => (
  <section className="admin-inventory-card">
    <div className="admin-storefront-panel-head">
      <div>
        <h2 className="admin-section-title">Navigation Links</h2>
        <p className="admin-storefront-panel-copy">
          These links appear in the header and drive collection routes across the site.
        </p>
      </div>
      <button type="button" className="admin-storefront-secondary-btn" onClick={onAdd}>
        <HiOutlinePlus size={16} />
        Add link
      </button>
    </div>

    <div className="admin-inventory-table-wrap">
      <table className="admin-inventory-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Path</th>
            <th>Slug</th>
            <th>Visible</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {content.navigation.map((item) => (
            <tr key={item.id}>
              <td>{item.label}</td>
              <td className="admin-orders-id">{item.path}</td>
              <td>{item.slug}</td>
              <td>
                <span className={`admin-status-pill admin-status-pill--${item.visible ? 'delivered' : 'cancelled'}`}>
                  {item.visible ? 'Visible' : 'Hidden'}
                </span>
              </td>
              <td>
                <div className="admin-inventory-actions">
                  <AdminStorefrontIconAction label="Edit link" onClick={() => onEdit(item)}>
                    <HiOutlinePencil size={16} />
                  </AdminStorefrontIconAction>
                  <AdminStorefrontIconAction label="Delete link" tone="danger" onClick={() => onDelete(item)}>
                    <HiOutlineTrash size={16} />
                  </AdminStorefrontIconAction>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const HeroPanel = ({ content, onAdd, onEdit, onDelete, onToggleVisible }) => (
  <section className="admin-inventory-card">
    <div className="admin-storefront-panel-head">
      <div>
        <h2 className="admin-section-title">Home Hero Slides</h2>
        <p className="admin-storefront-panel-copy">Carousel banners on the homepage hero.</p>
      </div>
      <button type="button" className="admin-storefront-secondary-btn" onClick={onAdd}>
        <HiOutlinePlus size={16} />
        Add slide
      </button>
    </div>

    <div className="admin-storefront-grid">
      {content.heroSlides.map((slide) => {
        const isVisible = slide.visible !== false;

        return (
          <article
            key={slide.id}
            className={`admin-storefront-card${isVisible ? '' : ' admin-storefront-card--hidden'}`}
          >
            <img src={resolveMediaUrl(slide.image)} alt={slide.alt} className="admin-storefront-card-image" />
            <div className="admin-storefront-card-body">
              <div className="admin-storefront-card-head">
                <p className="admin-storefront-card-title">{slide.alt}</p>
                <span className={`admin-status-pill admin-status-pill--${isVisible ? 'delivered' : 'cancelled'}`}>
                  {isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="admin-inventory-actions">
                <AdminStorefrontIconAction
                  label={isVisible ? 'Hide slide' : 'Show slide'}
                  onClick={() => onToggleVisible(slide)}
                >
                  {isVisible ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </AdminStorefrontIconAction>
                <AdminStorefrontIconAction label="Edit slide" onClick={() => onEdit(slide)}>
                  <HiOutlinePencil size={16} />
                </AdminStorefrontIconAction>
                <AdminStorefrontIconAction label="Delete slide" tone="danger" onClick={() => onDelete(slide)}>
                  <HiOutlineTrash size={16} />
                </AdminStorefrontIconAction>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

const ShowcasePanel = ({ content, onEditHeading, onAdd, onEdit, onDelete }) => (
  <section className="admin-inventory-card">
    <div className="admin-storefront-panel-head">
      <div>
        <h2 className="admin-section-title">Category Showcase Banners</h2>
        <p className="admin-storefront-panel-copy">
          Home page stacked category cards. Set heading, tagline, shop button position, and banner image.
        </p>
      </div>
      <button type="button" className="admin-storefront-secondary-btn" onClick={onAdd}>
        <HiOutlinePlus size={16} />
        Add category
      </button>
    </div>

    <Field label="Section heading">
      <input
        type="text"
        value={content.showcase.heading}
        onChange={(event) => onEditHeading(event.target.value)}
        className="admin-product-input"
      />
    </Field>

    <div className="admin-storefront-grid admin-storefront-grid--wide">
      {content.showcase.categories.map((category) => (
        <article key={category.id} className="admin-storefront-card">
          <img
            src={resolveMediaUrl(category.image?.jpg)}
            alt={category.image?.alt}
            className="admin-storefront-card-image"
          />
          <div className="admin-storefront-card-body">
            <p className="admin-storefront-card-title">{category.title}</p>
            <p className="admin-storefront-card-meta">{category.description}</p>
            <p className="admin-storefront-card-meta">Layout: {category.layout}</p>
            <div className="admin-inventory-actions">
              <AdminStorefrontIconAction label="Edit category" onClick={() => onEdit(category)}>
                <HiOutlinePencil size={16} />
              </AdminStorefrontIconAction>
              <AdminStorefrontIconAction label="Delete category" tone="danger" onClick={() => onDelete(category)}>
                <HiOutlineTrash size={16} />
              </AdminStorefrontIconAction>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const CollectionsPanel = ({ content, onEdit, onToggleVisible }) => (
  <section className="admin-inventory-card">
    <h2 className="admin-section-title">Collection Page Heroes</h2>
    <p className="admin-storefront-panel-copy">
      Hero banners, titles, and focal points for each collection route.
    </p>

    <div className="admin-storefront-grid admin-storefront-grid--wide">
      {Object.entries(content.collectionHeroes).map(([slug, hero]) => {
        const category = content.showcase.categories.find((item) => item.slug === slug);
        const image =
          hero.image?.jpg || category?.image?.jpg || content.showcase.categories[0]?.image?.jpg;
        const isVisible = hero.visible !== false;

        return (
          <article
            key={slug}
            className={`admin-storefront-card${isVisible ? '' : ' admin-storefront-card--hidden'}`}
          >
            <img
              src={resolveMediaUrl(image)}
              alt={hero.image?.alt || category?.image?.alt || ''}
              className="admin-storefront-card-image"
            />
            <div className="admin-storefront-card-body">
              <div className="admin-storefront-card-head">
                <p className="admin-storefront-card-title">
                  {hero.titleFirst} {hero.titleSecond}
                </p>
                <span className={`admin-status-pill admin-status-pill--${isVisible ? 'delivered' : 'cancelled'}`}>
                  {isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <p className="admin-storefront-card-meta">/{slug}</p>
              <p className="admin-storefront-card-meta">Focus: {hero.objectPosition}</p>
              <div className="admin-inventory-actions">
                <AdminStorefrontIconAction
                  label={isVisible ? 'Hide hero' : 'Show hero'}
                  onClick={() => onToggleVisible(slug, hero)}
                >
                  {isVisible ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </AdminStorefrontIconAction>
                <AdminStorefrontIconAction label="Edit hero" onClick={() => onEdit(slug, hero, category)}>
                  <HiOutlinePencil size={16} />
                </AdminStorefrontIconAction>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

const CommerceSettingsPanel = ({ content, onUpdate }) => {
  const settings = content.commerceSettings || {};

  const updateNumber = (field) => (event) => {
    const value = Number(event.target.value);
    onUpdate({ [field]: Number.isFinite(value) ? value : 0 });
  };

  return (
    <section className="admin-inventory-card">
      <h2 className="admin-section-title">Shipping & Tax</h2>
      <p className="admin-storefront-panel-copy">
        Configure delivery charges and tax applied to all storefront orders. Checkout and admin order
        totals use these settings automatically.
      </p>

      <div className="admin-storefront-meta-grid">
        <Field label="Standard shipping fee (PKR)" hint="Charged when free shipping does not apply.">
          <input
            type="number"
            min="0"
            step="1"
            value={settings.standardShippingFee ?? 0}
            onChange={updateNumber('standardShippingFee')}
            className="admin-product-input"
          />
        </Field>

        <Field label="Free shipping threshold (PKR)" hint="Orders at or above this subtotal ship free.">
          <input
            type="number"
            min="0"
            step="1"
            value={settings.freeShippingThreshold ?? 0}
            onChange={updateNumber('freeShippingThreshold')}
            className="admin-product-input"
          />
        </Field>

        <Field label="Tax label" hint="Shown on cart, checkout, and order receipts.">
          <input
            type="text"
            value={settings.taxLabel || 'GST'}
            onChange={(event) => onUpdate({ taxLabel: event.target.value })}
            className="admin-product-input"
            placeholder="GST"
          />
        </Field>

        <Field label="Tax rate (%)" hint="Applied to product subtotal before shipping.">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={settings.taxRate ?? 0}
            onChange={updateNumber('taxRate')}
            className="admin-product-input"
          />
        </Field>
      </div>

      <div className="admin-storefront-toggle-list">
        <label className="admin-storefront-toggle">
          <input
            type="checkbox"
            checked={settings.freeShippingEnabled !== false}
            onChange={(event) => onUpdate({ freeShippingEnabled: event.target.checked })}
          />
          Enable free shipping above threshold
        </label>

        <label className="admin-storefront-toggle">
          <input
            type="checkbox"
            checked={settings.taxEnabled !== false}
            onChange={(event) => onUpdate({ taxEnabled: event.target.checked })}
          />
          Apply tax to orders
        </label>
      </div>
    </section>
  );
};

const AuthPagesPanel = ({ content, onUpdate }) => (
  <section className="admin-inventory-card">
    <h2 className="admin-section-title">Auth Page Banners</h2>
    <p className="admin-storefront-panel-copy">
      Side banner images for customer login, register, and admin login screens.
    </p>

    <div className="admin-storefront-grid admin-storefront-grid--wide">
      {AUTH_PAGE_KEYS.map(({ id, label, path }) => {
        const page = content.authPages?.[id] || {};
        const image = page.image || {};

        return (
          <article key={id} className="admin-storefront-card">
            <img
              src={resolveMediaUrl(image.jpg)}
              alt={image.alt || label}
              className="admin-storefront-card-image"
            />
            <div className="admin-storefront-card-body">
              <p className="admin-storefront-card-title">{label}</p>
              <p className="admin-storefront-card-meta">{path}</p>
              <ImageUploadField
                label="Banner image"
                value={image.jpg}
                onChange={(jpg) =>
                  onUpdate(id, {
                    image: { ...image, jpg, webp: null, blur: null }
                  })
                }
              />
              <Field label="Image alt text">
                <input
                  type="text"
                  value={image.alt || ''}
                  onChange={(event) =>
                    onUpdate(id, {
                      image: { ...image, alt: event.target.value }
                    })
                  }
                  className="admin-product-input"
                />
              </Field>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

const FooterSocialPanel = ({ content, onUpdate }) => (
  <section className="admin-inventory-card">
    <h2 className="admin-section-title">Footer Social Links</h2>
    <p className="admin-storefront-panel-copy">
      Add profile URLs for each platform. Only icons with a saved link appear in the site footer.
    </p>

    <div className="admin-storefront-meta-grid">
      {FOOTER_SOCIAL_PLATFORMS.map(({ id, label }) => (
        <Field key={id} label={label} hint="Leave empty to hide this icon from the footer.">
          <input
            type="url"
            value={content.footerSocial?.[id] || ''}
            onChange={(event) => onUpdate({ [id]: event.target.value })}
            className="admin-product-input"
            placeholder={`https://www.${id === 'twitter' ? 'x.com' : id}.com/your-page`}
          />
        </Field>
      ))}
    </div>
  </section>
);

const ShopLookPanel = ({ content, onEditMeta, onAdd, onEdit, onDelete }) => (
  <section className="admin-inventory-card">
    <div className="admin-storefront-panel-head">
      <div>
        <h2 className="admin-section-title">Shop The Look</h2>
        <p className="admin-storefront-panel-copy">
          Mosaic grid posts with image or video media and outbound social links.
        </p>
      </div>
      <button type="button" className="admin-storefront-secondary-btn" onClick={onAdd}>
        <HiOutlinePlus size={16} />
        Add post
      </button>
    </div>

    <div className="admin-storefront-meta-grid">
      <Field label="Grid heading">
        <input
          type="text"
          value={content.shopTheLook.heading}
          onChange={(event) => onEditMeta({ heading: event.target.value })}
          className="admin-product-input"
        />
      </Field>
      <Field label="Row subtitle">
        <input
          type="text"
          value={content.shopTheLook.rowSubtitle}
          onChange={(event) => onEditMeta({ rowSubtitle: event.target.value })}
          className="admin-product-input"
        />
      </Field>
    </div>

    <div className="admin-storefront-grid admin-storefront-grid--wide">
      {content.shopTheLook.items.map((item) => (
        <article key={item.id} className="admin-storefront-card">
          {item.mediaType === 'video' && item.video ? (
            <video src={resolveMediaUrl(item.video)} className="admin-storefront-card-image" muted playsInline />
          ) : (
            <img src={resolveMediaUrl(item.image)} alt="" className="admin-storefront-card-image" />
          )}
          <div className="admin-storefront-card-body">
            <p className="admin-storefront-card-title">{item.platform}</p>
            <p className="admin-storefront-card-meta">{item.mediaType}</p>
            <div className="admin-inventory-actions">
              <AdminStorefrontIconAction label="Edit post" onClick={() => onEdit(item)}>
                <HiOutlinePencil size={16} />
              </AdminStorefrontIconAction>
              <AdminStorefrontIconAction label="Delete post" tone="danger" onClick={() => onDelete(item)}>
                <HiOutlineTrash size={16} />
              </AdminStorefrontIconAction>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const NavModal = ({ item, onClose, onSave, isNew = false }) => {
  const [form, setForm] = useState({ ...item });

  const handleSave = () => {
    onSave(normalizeNavItem(form));
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      title={isNew ? 'Add Navigation Link' : 'Edit Navigation Link'}
      footer={
        <button type="button" className="luxury-button-accent" onClick={handleSave}>
          Save link
        </button>
      }
    >
      <div className="admin-storefront-form">
        <Field label="Label">
          <input
            type="text"
            value={form.label}
            onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <Field label="Collection slug" hint="Used in the URL, e.g. festive-wear becomes /collections/festive-wear">
          <input
            type="text"
            value={form.slug}
            onChange={(event) => {
              const slug = event.target.value;
              setForm((prev) => ({
                ...prev,
                slug,
                path: `/collections/${slug.trim().toLowerCase().replace(/\s+/g, '-')}`
              }));
            }}
            className="admin-product-input"
          />
        </Field>
        <Field label="Path" hint="Auto-generated from slug. Header and collection page use this route.">
          <input
            type="text"
            value={form.path}
            readOnly
            className="admin-product-input"
          />
        </Field>
        <label className="admin-storefront-check">
          <input
            type="checkbox"
            checked={form.visible !== false}
            onChange={(event) => setForm((prev) => ({ ...prev, visible: event.target.checked }))}
          />
          Visible in header
        </label>
      </div>
    </AdminModal>
  );
};

const HeroModal = ({ slide, onClose, onSave }) => {
  const [form, setForm] = useState({ ...slide });

  return (
    <AdminModal
      open
      onClose={onClose}
      title="Edit Hero Slide"
      footer={
        <button type="button" className="luxury-button-accent" onClick={() => onSave(form)}>
          Save slide
        </button>
      }
    >
      <div className="admin-storefront-form">
        <ImageUploadField
          label="Banner image"
          value={form.image}
          onChange={(image) => setForm((prev) => ({ ...prev, image }))}
        />
        <Field label="Alt text">
          <input
            type="text"
            value={form.alt}
            onChange={(event) => setForm((prev) => ({ ...prev, alt: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <label className="admin-storefront-check">
          <input
            type="checkbox"
            checked={form.visible !== false}
            onChange={(event) => setForm((prev) => ({ ...prev, visible: event.target.checked }))}
          />
          Visible on homepage
        </label>
      </div>
    </AdminModal>
  );
};

const ShowcaseModal = ({ category, onClose, onSave }) => {
  const [form, setForm] = useState({ ...category, image: { ...category.image } });

  return (
    <AdminModal
      open
      wide
      onClose={onClose}
      title="Edit Category Banner"
      footer={
        <button type="button" className="luxury-button-accent" onClick={() => onSave(form)}>
          Save category
        </button>
      }
    >
      <div className="admin-storefront-form admin-storefront-form--grid">
        <Field label="Title (heading)">
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <Field label="Tagline (description)">
          <input
            type="text"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <Field label="Optional label">
          <input
            type="text"
            value={form.label || ''}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, label: event.target.value || null }))
            }
            className="admin-product-input"
          />
        </Field>
        <Field label="Collection link">
          <input
            type="text"
            value={form.link}
            onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <Field label="Slug">
          <input
            type="text"
            value={form.slug}
            onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <Field label="Heading & Shop Now position">
          <select
            value={form.layout}
            onChange={(event) => setForm((prev) => ({ ...prev, layout: event.target.value }))}
            className="admin-product-input"
          >
            {CONTENT_LAYOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <ImageUploadField
          label="Banner image"
          value={form.image.jpg}
          onChange={(jpg) =>
            setForm((prev) => ({ ...prev, image: { ...prev.image, jpg, webp: null, blur: null } }))
          }
        />
        <Field label="Image alt text">
          <input
            type="text"
            value={form.image.alt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, image: { ...prev.image, alt: event.target.value } }))
            }
            className="admin-product-input"
          />
        </Field>
        <label className="admin-storefront-check">
          <input
            type="checkbox"
            checked={form.visible !== false}
            onChange={(event) => setForm((prev) => ({ ...prev, visible: event.target.checked }))}
          />
          Visible on homepage showcase
        </label>
      </div>
    </AdminModal>
  );
};

const CollectionHeroModal = ({ slug, hero, category, onClose, onSave }) => {
  const [form, setForm] = useState({
    slug,
    titleFirst: hero.titleFirst,
    titleSecond: hero.titleSecond,
    objectPosition: hero.objectPosition,
    visible: hero.visible !== false,
    image: hero.image?.jpg
      ? hero.image
      : category?.image || { jpg: '', webp: null, blur: null, alt: '' }
  });

  return (
    <AdminModal
      open
      onClose={onClose}
      title={`Edit Collection Hero — ${slug}`}
      footer={
        <button type="button" className="luxury-button-accent" onClick={() => onSave(form)}>
          Save hero
        </button>
      }
    >
      <div className="admin-storefront-form">
        <ImageUploadField
          label="Hero banner image"
          value={form.image.jpg}
          onChange={(jpg) =>
            setForm((prev) => ({
              ...prev,
              image: { ...prev.image, jpg, webp: null, blur: null }
            }))
          }
        />
        <Field label="Image alt text">
          <input
            type="text"
            value={form.image.alt || ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                image: { ...prev.image, alt: event.target.value }
              }))
            }
            className="admin-product-input"
          />
        </Field>
        <Field label="Title line 1">
          <input
            type="text"
            value={form.titleFirst}
            onChange={(event) => setForm((prev) => ({ ...prev, titleFirst: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <Field label="Title line 2 (accent)">
          <input
            type="text"
            value={form.titleSecond}
            onChange={(event) => setForm((prev) => ({ ...prev, titleSecond: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <Field label="Banner image focal point">
          <select
            value={form.objectPosition}
            onChange={(event) => setForm((prev) => ({ ...prev, objectPosition: event.target.value }))}
            className="admin-product-input"
          >
            {CONTENT_OBJECT_POSITIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <label className="admin-storefront-check">
          <input
            type="checkbox"
            checked={form.visible !== false}
            onChange={(event) => setForm((prev) => ({ ...prev, visible: event.target.checked }))}
          />
          Visible on collection page
        </label>
      </div>
    </AdminModal>
  );
};

const ShopLookModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({ ...item });

  const handleVideoFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setForm((prev) => ({ ...prev, video: dataUrl, mediaType: 'video' }));
    event.target.value = '';
  };

  return (
    <AdminModal
      open
      wide
      onClose={onClose}
      title="Edit Shop The Look Post"
      footer={
        <button type="button" className="luxury-button-accent" onClick={() => onSave(form)}>
          Save post
        </button>
      }
    >
      <div className="admin-storefront-form admin-storefront-form--grid">
        <Field label="Media type">
          <select
            value={form.mediaType}
            onChange={(event) => setForm((prev) => ({ ...prev, mediaType: event.target.value }))}
            className="admin-product-input"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field label="Platform">
          <select
            value={form.platform}
            onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value }))}
            className="admin-product-input"
          >
            {SHOP_LOOK_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Grid area">
          <select
            value={form.area}
            onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
            className="admin-product-input"
          >
            {SHOP_LOOK_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Shape">
          <select
            value={form.shape}
            onChange={(event) => setForm((prev) => ({ ...prev, shape: event.target.value }))}
            className="admin-product-input"
          >
            {SHOP_LOOK_SHAPES.map((shape) => (
              <option key={shape} value={shape}>
                {shape}
              </option>
            ))}
          </select>
        </Field>
        {form.mediaType === 'image' ? (
          <ImageUploadField
            label="Post image"
            value={form.image}
            onChange={(image) => setForm((prev) => ({ ...prev, image }))}
          />
        ) : (
          <>
            <ImageUploadField
              label="Poster image (fallback)"
              value={form.image}
              onChange={(image) => setForm((prev) => ({ ...prev, image }))}
            />
            <Field label="Video file or URL">
              <div className="admin-storefront-media-actions">
                <label className="admin-storefront-upload-btn">
                  Upload video
                  <input type="file" accept="video/*" className="sr-only" onChange={handleVideoFile} />
                </label>
                <input
                  type="url"
                  value={form.video || ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, video: event.target.value }))}
                  className="admin-product-input"
                  placeholder="https://..."
                />
              </div>
            </Field>
          </>
        )}
        <Field label="Outbound link">
          <input
            type="url"
            value={form.link}
            onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
            className="admin-product-input"
          />
        </Field>
        <label className="admin-storefront-check">
          <input
            type="checkbox"
            checked={form.visible !== false}
            onChange={(event) => setForm((prev) => ({ ...prev, visible: event.target.checked }))}
          />
          Visible in shop-the-look grid
        </label>
      </div>
    </AdminModal>
  );
};

export const AdminCustomerSideContent = ({
  content,
  activeTab,
  onAddNav,
  onEditNav,
  onDeleteNav,
  onAddHero,
  onEditHero,
  onDeleteHero,
  onToggleHeroVisible,
  onEditShowcaseHeading,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onEditCollectionHero,
  onToggleCollectionHeroVisible,
  onEditShopMeta,
  onAddShopLook,
  onEditShopLook,
  onDeleteShopLook,
  onUpdateAuthPageBanner,
  onUpdateFooterSocial,
  onUpdateCommerceSettings
}) => {
  switch (activeTab) {
    case 'navigation':
      return (
        <NavigationPanel
          content={content}
          onAdd={onAddNav}
          onEdit={onEditNav}
          onDelete={onDeleteNav}
        />
      );
    case 'hero':
      return (
        <HeroPanel
          content={content}
          onAdd={onAddHero}
          onEdit={onEditHero}
          onDelete={onDeleteHero}
          onToggleVisible={onToggleHeroVisible}
        />
      );
    case 'showcase':
      return (
        <ShowcasePanel
          content={content}
          onEditHeading={onEditShowcaseHeading}
          onAdd={onAddCategory}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
        />
      );
    case 'collections':
      return (
        <CollectionsPanel
          content={content}
          onEdit={onEditCollectionHero}
          onToggleVisible={onToggleCollectionHeroVisible}
        />
      );
    case 'shop-look':
      return (
        <ShopLookPanel
          content={content}
          onEditMeta={onEditShopMeta}
          onAdd={onAddShopLook}
          onEdit={onEditShopLook}
          onDelete={onDeleteShopLook}
        />
      );
    case 'auth-pages':
      return <AuthPagesPanel content={content} onUpdate={onUpdateAuthPageBanner} />;
    case 'footer-social':
      return <FooterSocialPanel content={content} onUpdate={onUpdateFooterSocial} />;
    case 'commerce':
      return <CommerceSettingsPanel content={content} onUpdate={onUpdateCommerceSettings} />;
    default:
      return null;
  }
};

export const AdminCustomerSideModals = ({
  modal,
  onClose,
  onSaveNav,
  onSaveHero,
  onSaveCategory,
  onSaveCollectionHero,
  onSaveShopLook
}) => {
  if (!modal) {
    return null;
  }

  switch (modal.type) {
    case 'nav':
      return (
        <NavModal
          item={modal.item}
          isNew={modal.isNew}
          onClose={onClose}
          onSave={onSaveNav}
        />
      );
    case 'hero':
      return <HeroModal slide={modal.item} onClose={onClose} onSave={onSaveHero} />;
    case 'showcase':
      return <ShowcaseModal category={modal.item} onClose={onClose} onSave={onSaveCategory} />;
    case 'collection-hero':
      return (
        <CollectionHeroModal
          slug={modal.slug}
          hero={modal.item}
          category={modal.category}
          onClose={onClose}
          onSave={onSaveCollectionHero}
        />
      );
    case 'shop-look':
      return <ShopLookModal item={modal.item} onClose={onClose} onSave={onSaveShopLook} />;
    default:
      return null;
  }
};

export const AdminCustomerSideStats = ({ content }) => (
  <section className="admin-inventory-stats" aria-label="Storefront summary">
    <article className="admin-inventory-stat-card">
      <p className="admin-inventory-stat-label">Nav links</p>
      <p className="admin-inventory-stat-value">{content.navigation.length}</p>
    </article>
    <article className="admin-inventory-stat-card">
      <p className="admin-inventory-stat-label">Hero slides</p>
      <p className="admin-inventory-stat-value">{content.heroSlides.length}</p>
    </article>
    <article className="admin-inventory-stat-card">
      <p className="admin-inventory-stat-label">Categories</p>
      <p className="admin-inventory-stat-value">{content.showcase.categories.length}</p>
    </article>
    <article className="admin-inventory-stat-card">
      <p className="admin-inventory-stat-label">Shop posts</p>
      <p className="admin-inventory-stat-value">{content.shopTheLook.items.length}</p>
    </article>
    <article className="admin-inventory-stat-card">
      <p className="admin-inventory-stat-label">Social links</p>
      <p className="admin-inventory-stat-value">
        {FOOTER_SOCIAL_PLATFORMS.filter(({ id }) => (content.footerSocial?.[id] || '').trim()).length}
      </p>
    </article>
    <article className="admin-inventory-stat-card">
      <p className="admin-inventory-stat-label">Shipping</p>
      <p className="admin-inventory-stat-value">
        PKR {content.commerceSettings?.standardShippingFee?.toLocaleString?.() ?? '500'}
      </p>
    </article>
    <article className="admin-inventory-stat-card">
      <p className="admin-inventory-stat-label">Tax</p>
      <p className="admin-inventory-stat-value">
        {content.commerceSettings?.taxEnabled === false
          ? 'Off'
          : `${content.commerceSettings?.taxLabel || 'GST'} ${content.commerceSettings?.taxRate ?? 17}%`}
      </p>
    </article>
  </section>
);
