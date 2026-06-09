import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CUSTOMER_DASHBOARD_NAV } from '../../constants/customerDashboard';

const CustomerDashboardLayout = () => (
  <div className="customer-dashboard">
    <div className="customer-dashboard-shell">
      <aside className="customer-dashboard-sidebar" aria-label="Account navigation">
        <p className="customer-dashboard-sidebar-label">My Account</p>
        <nav className="customer-dashboard-nav">
          {CUSTOMER_DASHBOARD_NAV.map((item) =>
            item.external ? (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `customer-dashboard-nav-link${isActive ? ' customer-dashboard-nav-link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/account'}
                className={({ isActive }) =>
                  `customer-dashboard-nav-link${isActive ? ' customer-dashboard-nav-link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <div className="customer-dashboard-main">
        <Outlet />
      </div>
    </div>
  </div>
);

export default CustomerDashboardLayout;
