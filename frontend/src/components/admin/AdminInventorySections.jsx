import React, { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineTrash
} from 'react-icons/hi';
import { replaceBrandInText } from '../../utils/brandText';
import AdminModal from './AdminModal';
import {
  ADMIN_INVENTORY_CATEGORIES,
  ADMIN_INVENTORY_CATEGORY_LABELS,
  ADMIN_INVENTORY_FILTERS,
  ADMIN_INVENTORY_LOW_STOCK_THRESHOLD,
  ADMIN_INVENTORY_STATUS_LABELS,
  formatInventoryPrice,
  getInventoryStatus
} from '../../constants/adminInventory';

const AdminInventoryIconAction = ({ label, onClick, children, tone = 'default' }) => (
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

export const AdminInventoryIntro = () => (
  <header className="admin-inventory-intro">
    <h1 className="admin-inventory-title">Manage Inventory</h1>
    <p className="admin-inventory-subtitle">
      {replaceBrandInText(
        'Monitor stock levels, restock pieces, and keep MARHAS listings available on the storefront.'
      )}
    </p>
  </header>
);

export const AdminInventoryStats = ({ items }) => {
  const stats = useMemo(() => {
    const statuses = items.map((item) => getInventoryStatus(item.stock));

    return {
      total: items.length,
      inStock: statuses.filter((status) => status === 'in-stock').length,
      lowStock: statuses.filter((status) => status === 'low-stock').length,
      outOfStock: statuses.filter((status) => status === 'out-of-stock').length
    };
  }, [items]);

  return (
    <section className="admin-inventory-stats" aria-label="Inventory summary">
      <article className="admin-inventory-stat-card">
        <p className="admin-inventory-stat-label">Total SKUs</p>
        <p className="admin-inventory-stat-value">{stats.total}</p>
      </article>
      <article className="admin-inventory-stat-card">
        <p className="admin-inventory-stat-label">In Stock</p>
        <p className="admin-inventory-stat-value">{stats.inStock}</p>
      </article>
      <article className="admin-inventory-stat-card">
        <p className="admin-inventory-stat-label">Low Stock</p>
        <p className="admin-inventory-stat-value admin-inventory-stat-value--warn">{stats.lowStock}</p>
      </article>
      <article className="admin-inventory-stat-card">
        <p className="admin-inventory-stat-label">Out of Stock</p>
        <p className="admin-inventory-stat-value admin-inventory-stat-value--danger">{stats.outOfStock}</p>
      </article>
    </section>
  );
};

export const AdminInventoryToolbar = ({ search, onSearchChange, activeFilter, onFilterChange }) => (
  <div className="admin-inventory-toolbar">
    <label className="admin-inventory-search">
      <span className="sr-only">Search inventory</span>
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by product or SKU..."
        className="admin-product-input"
      />
    </label>

    <div className="admin-inventory-filters" role="group" aria-label="Inventory filters">
      {ADMIN_INVENTORY_FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`admin-analytics-period ${
            activeFilter === filter.id ? 'admin-analytics-period--active' : ''
          }`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  </div>
);

export const AdminInventoryTable = ({ items, onView, onEdit, onUpdate, onRestock, onDelete }) => (
  <section className="admin-inventory-card">
    <h2 className="admin-section-title">Inventory Items</h2>

    <div className="admin-inventory-table-wrap">
      <table className="admin-inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="admin-inventory-empty">
                No inventory items match your search.
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const status = getInventoryStatus(item.stock);

              return (
                <tr key={item.id}>
                  <td>
                    <div className="admin-inventory-product">
                      <img src={item.image} alt="" className="admin-inventory-product-image" />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="admin-orders-id">{item.sku}</td>
                  <td>{ADMIN_INVENTORY_CATEGORY_LABELS[item.category] || item.category}</td>
                  <td>{item.stock}</td>
                  <td>
                    <span className={`admin-status-pill admin-status-pill--inventory-${status}`}>
                      {ADMIN_INVENTORY_STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td>
                    <div className="admin-inventory-actions">
                      <AdminInventoryIconAction label="View details" onClick={() => onView(item)}>
                        <HiOutlineEye size={17} strokeWidth={1.6} />
                      </AdminInventoryIconAction>
                      <AdminInventoryIconAction label="Edit item" onClick={() => onEdit(item)}>
                        <HiOutlinePencil size={17} strokeWidth={1.6} />
                      </AdminInventoryIconAction>
                      <AdminInventoryIconAction label="Update stock" onClick={() => onUpdate(item)}>
                        <HiOutlineRefresh size={17} strokeWidth={1.6} />
                      </AdminInventoryIconAction>
                      <AdminInventoryIconAction label="Restock item" onClick={() => onRestock(item)}>
                        <HiOutlinePlus size={17} strokeWidth={1.6} />
                      </AdminInventoryIconAction>
                      <AdminInventoryIconAction
                        label="Delete item"
                        tone="danger"
                        onClick={() => onDelete(item)}
                      >
                        <HiOutlineTrash size={17} strokeWidth={1.6} />
                      </AdminInventoryIconAction>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const AdminInventoryDetailsModal = ({ item, open, onClose }) => {
  if (!item) {
    return null;
  }

  const status = getInventoryStatus(item.stock);

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Product Details"
      footer={
        <button type="button" className="luxury-button-outline admin-product-btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="admin-inventory-modal-product">
        <img src={item.image} alt="" className="admin-inventory-modal-image" />
        <div>
          <p className="admin-inventory-modal-name">{item.name}</p>
          <p className="admin-inventory-modal-meta">{item.sku}</p>
        </div>
      </div>

      <dl className="admin-inventory-details">
        <div>
          <dt>Category</dt>
          <dd>{ADMIN_INVENTORY_CATEGORY_LABELS[item.category] || item.category}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{formatInventoryPrice(item.price)}</dd>
        </div>
        <div>
          <dt>Current Stock</dt>
          <dd>{item.stock}</dd>
        </div>
        <div>
          <dt>Low Stock Alert</dt>
          <dd>{ADMIN_INVENTORY_LOW_STOCK_THRESHOLD} units</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={`admin-status-pill admin-status-pill--inventory-${status}`}>
              {ADMIN_INVENTORY_STATUS_LABELS[status]}
            </span>
          </dd>
        </div>
      </dl>
    </AdminModal>
  );
};

const AdminInventoryEditModal = ({ item, open, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    stock: '0'
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        sku: item.sku,
        category: item.category,
        price: String(item.price),
        stock: String(item.stock)
      });
    }
  }, [item]);

  if (!item) {
    return null;
  }

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(item.id, {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category,
      price: Math.max(0, Number(form.price) || 0),
      stock: Math.max(0, Number(form.stock) || 0)
    });
    onClose();
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Edit Inventory Item"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="admin-edit-inventory-form" className="luxury-button-accent admin-product-btn">
            Save Changes
          </button>
        </>
      }
    >
      <form id="admin-edit-inventory-form" className="admin-inventory-modal-form" onSubmit={handleSubmit}>
        <label className="admin-product-field">
          <span className="admin-product-label">Product Name</span>
          <input
            type="text"
            value={form.name}
            onChange={updateField('name')}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">SKU</span>
          <input
            type="text"
            value={form.sku}
            onChange={updateField('sku')}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">Category</span>
          <select
            value={form.category}
            onChange={updateField('category')}
            required
            className="admin-product-input admin-product-select"
          >
            {ADMIN_INVENTORY_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">Price (PKR)</span>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={updateField('price')}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">Stock Quantity</span>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={updateField('stock')}
            required
            className="admin-product-input"
          />
        </label>
      </form>
    </AdminModal>
  );
};

const AdminInventoryDeleteModal = ({ item, open, onClose, onConfirm }) => {
  if (!item) {
    return null;
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Delete Inventory Item"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="luxury-button-accent admin-product-btn admin-inventory-delete-btn"
            onClick={() => {
              onConfirm(item.id);
              onClose();
            }}
          >
            Delete Item
          </button>
        </>
      }
    >
      <p className="admin-inventory-modal-copy">
        Remove <strong>{item.name}</strong> ({item.sku}) from inventory? This action cannot be undone.
      </p>
    </AdminModal>
  );
};

const AdminInventoryUpdateModal = ({ item, open, onClose, onSave }) => {
  const [stock, setStock] = useState('0');

  useEffect(() => {
    if (item) {
      setStock(String(item.stock));
    }
  }, [item]);

  if (!item) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextStock = Math.max(0, Number(stock) || 0);
    onSave(item.id, nextStock);
    onClose();
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Update Stock"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="admin-update-stock-form" className="luxury-button-accent admin-product-btn">
            Save Stock
          </button>
        </>
      }
    >
      <form id="admin-update-stock-form" className="admin-inventory-modal-form" onSubmit={handleSubmit}>
        <p className="admin-inventory-modal-copy">
          Set the exact available quantity for <strong>{item.name}</strong>.
        </p>
        <label className="admin-product-field">
          <span className="admin-product-label">Stock Quantity</span>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            required
            className="admin-product-input"
          />
        </label>
      </form>
    </AdminModal>
  );
};

const AdminInventoryRestockModal = ({ item, open, onClose, onSave }) => {
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (item) {
      setQuantity('1');
      setNote('');
    }
  }, [item]);

  if (!item) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const addAmount = Math.max(1, Number(quantity) || 0);
    onSave(item.id, item.stock + addAmount, note.trim());
    onClose();
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Restock Product"
      footer={
        <>
          <button type="button" className="admin-product-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="admin-restock-form" className="luxury-button-accent admin-product-btn">
            Confirm Restock
          </button>
        </>
      }
    >
      <form id="admin-restock-form" className="admin-inventory-modal-form" onSubmit={handleSubmit}>
        <p className="admin-inventory-modal-copy">
          Add units to <strong>{item.name}</strong>. Current stock: {item.stock}.
        </p>

        <label className="admin-product-field">
          <span className="admin-product-label">Units to Add</span>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
            className="admin-product-input"
          />
        </label>

        <label className="admin-product-field">
          <span className="admin-product-label">Restock Note (Optional)</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Supplier batch, warehouse location, etc."
            rows={3}
            className="admin-product-input admin-product-textarea"
          />
        </label>
      </form>
    </AdminModal>
  );
};

export const AdminInventoryModals = ({
  activeModal,
  selectedItem,
  onClose,
  onEdit,
  onUpdateStock,
  onRestock,
  onDelete
}) => (
  <>
    <AdminInventoryDetailsModal item={selectedItem} open={activeModal === 'details'} onClose={onClose} />
    <AdminInventoryEditModal
      item={selectedItem}
      open={activeModal === 'edit'}
      onClose={onClose}
      onSave={onEdit}
    />
    <AdminInventoryUpdateModal
      item={selectedItem}
      open={activeModal === 'update'}
      onClose={onClose}
      onSave={onUpdateStock}
    />
    <AdminInventoryRestockModal
      item={selectedItem}
      open={activeModal === 'restock'}
      onClose={onClose}
      onSave={onRestock}
    />
    <AdminInventoryDeleteModal
      item={selectedItem}
      open={activeModal === 'delete'}
      onClose={onClose}
      onConfirm={onDelete}
    />
  </>
);

export const filterInventoryItems = (items, search, activeFilter) => {
  const query = search.trim().toLowerCase();

  return items.filter((item) => {
    const status = getInventoryStatus(item.stock);
    const matchesFilter = activeFilter === 'all' || status === activeFilter;
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
};
