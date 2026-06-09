import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AdminInventoryIntro,
  AdminInventoryModals,
  AdminInventoryStats,
  AdminInventoryTable,
  AdminInventoryToolbar,
  filterInventoryItems
} from '../../components/admin/AdminInventorySections';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminRoute from '../../components/admin/AdminRoute';
import { useAdminContext } from '../../context/AdminContext';
import { inventoryService } from '../../services/marhasApi';
import { getApiErrorMessage } from '../../services/authService';
import { mapApiInventoryItem, toBackendCategory } from '../../utils/apiMappers';

const AdminInventoryContent = () => {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadInventory = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await inventoryService.list({ limit: 100 });
      const list = Array.isArray(data) ? data : data?.items || [];
      setItems(list.map(mapApiInventoryItem).filter(Boolean));
    } catch (err) {
      setError(getApiErrorMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredItems = useMemo(
    () => filterInventoryItems(items, search, activeFilter),
    [items, search, activeFilter]
  );

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const openModal = (type, item) => {
    setSelectedItem(item);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
  };

  const replaceItem = (updated) => {
    const mapped = mapApiInventoryItem(updated?.item || updated);
    setItems((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
  };

  const handleUpdateStock = async (itemId, stock) => {
    try {
      const updated = await inventoryService.updateStock(itemId, stock);
      replaceItem(updated);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleEditItem = async (itemId, updates) => {
    try {
      const payload = {
        title: updates.name,
        sku: updates.sku,
        category: toBackendCategory(updates.category)
      };
      const updated = await inventoryService.update(itemId, payload);

      if (updates.stock !== undefined) {
        const stockUpdated = await inventoryService.updateStock(itemId, updates.stock);
        replaceItem(stockUpdated);
        return;
      }

      replaceItem(updated);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleRestock = async (itemId, targetStock, note) => {
    const item = items.find((entry) => entry.id === itemId);
    const quantity = Math.max(1, targetStock - (item?.stock || 0));

    try {
      const updated = await inventoryService.restock(itemId, quantity, note);
      replaceItem(updated?.item || updated);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await inventoryService.remove(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="admin-shell">
      <AdminHeader adminUser={adminUser} onLogout={handleLogout} />

      <main className="admin-shell-main admin-inventory-page">
        <nav className="admin-product-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/admin">Dashboard</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="admin-product-breadcrumbs-current">Manage Inventory</span>
        </nav>

        <AdminInventoryIntro />
        {error && <p className="admin-login-error">{error}</p>}
        {loading ? (
          <p className="admin-inventory-empty">Loading inventory...</p>
        ) : (
          <>
            <AdminInventoryStats items={items} />
            <AdminInventoryToolbar
              search={search}
              onSearchChange={setSearch}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            <AdminInventoryTable
              items={filteredItems}
              onView={(item) => openModal('details', item)}
              onEdit={(item) => openModal('edit', item)}
              onUpdate={(item) => openModal('update', item)}
              onRestock={(item) => openModal('restock', item)}
              onDelete={(item) => openModal('delete', item)}
            />
          </>
        )}
      </main>

      <AdminInventoryModals
        activeModal={activeModal}
        selectedItem={selectedItem}
        onClose={closeModal}
        onEdit={handleEditItem}
        onUpdateStock={handleUpdateStock}
        onRestock={handleRestock}
        onDelete={handleDeleteItem}
      />
    </div>
  );
};

const AdminInventory = () => (
  <AdminRoute>
    <AdminInventoryContent />
  </AdminRoute>
);

export default AdminInventory;
