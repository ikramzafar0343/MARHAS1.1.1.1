import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Loader from '../components/loaders/Loader';
import Home from '../pages/Home';
import CustomerRoute from '../components/customer/CustomerRoute';
import CustomerDashboardLayout from '../components/customer/CustomerDashboardLayout';

// Lazy loaded pages
const Collections = lazy(() => import('../pages/Collections'));
const AboutUs = lazy(() => import('../pages/AboutUs'));
const ContactUs = lazy(() => import('../pages/ContactUs'));
const ProductDetail = lazy(() => import('../pages/ProductDetail'));
const Wishlist = lazy(() => import('../pages/Wishlist'));
const Cart = lazy(() => import('../pages/Cart'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Account = lazy(() => import('../pages/account/CustomerDashboardHome'));
const CustomerOrdersPage = lazy(() => import('../pages/account/CustomerOrdersPage'));
const CustomerSettingsPage = lazy(() => import('../pages/account/CustomerSettingsPage'));
const Checkout = lazy(() => import('../pages/Checkout'));
const OrderConfirmation = lazy(() => import('../pages/OrderConfirmation'));
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AddNewProduct = lazy(() => import('../pages/admin/AddNewProduct'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminInventory = lazy(() => import('../pages/admin/AdminInventory'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminCustomerSide = lazy(() => import('../pages/admin/AdminCustomerSide'));
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products/new" element={<AddNewProduct />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/customer-side" element={<AdminCustomerSide />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:category" element={<Collections />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="contact" element={<ContactUs />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route
            path="account"
            element={
              <CustomerRoute>
                <CustomerDashboardLayout />
              </CustomerRoute>
            }
          >
            <Route index element={<Account />} />
            <Route path="orders" element={<CustomerOrdersPage />} />
            <Route path="settings" element={<CustomerSettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
