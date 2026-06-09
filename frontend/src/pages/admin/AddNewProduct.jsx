import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddProductForm from '../../components/admin/AddProductForm';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminRoute from '../../components/admin/AdminRoute';
import { useAdminContext } from '../../context/AdminContext';
import { useProducts } from '../../context/ProductsContext';
import { productsService } from '../../services/marhasApi';
import { getApiErrorMessage } from '../../services/authService';
import { replaceBrandInText } from '../../utils/brandText';

const AddNewProductContent = () => {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminContext();
  const { refreshProducts } = useProducts();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  const handleListProduct = async (formData) => {
    try {
      await productsService.create(formData);
      await refreshProducts();
      navigate('/admin/inventory');
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="admin-shell">
      <AdminHeader adminUser={adminUser} onLogout={handleLogout} />

      <main className="admin-shell-main admin-product-page">
        <nav className="admin-product-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/admin">Dashboard</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="admin-product-breadcrumbs-current">List New Product</span>
        </nav>

        <header className="admin-product-intro">
          <h1 className="admin-product-title">List Your Product</h1>
          <p className="admin-product-subtitle">
            {replaceBrandInText(
              'Fill in the details to publish a new MARHAS piece on the storefront.'
            )}
          </p>
        </header>

        <AddProductForm onCancel={handleCancel} onListProduct={handleListProduct} />
      </main>
    </div>
  );
};

const AddNewProduct = () => (
  <AdminRoute>
    <AddNewProductContent />
  </AdminRoute>
);

export default AddNewProduct;
