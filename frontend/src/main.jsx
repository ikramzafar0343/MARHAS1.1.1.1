import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ScrollToTop from './components/navigation/ScrollToTop';
import { GlobalProvider } from './context/GlobalContext';
import { AdminProvider } from './context/AdminContext';
import { CustomerContentProvider } from './context/CustomerContentContext';
import { ProductsProvider } from './context/ProductsContext';
import './index.css';
import App from './App.jsx';

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalProvider>
      <ProductsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <CustomerContentProvider>
            <AdminProvider>
              <App />
            </AdminProvider>
          </CustomerContentProvider>
        </BrowserRouter>
      </ProductsProvider>
    </GlobalProvider>
  </StrictMode>,
);
