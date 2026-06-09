# MARHAS Backend Architecture Report

> Generated from full frontend audit of `frontend/src` (102 source files).

## Executive Summary

The MARHAS frontend is a **client-only prototype**: all data lives in constants, React state, and `localStorage`. `services/api.js` exists but has **zero consumers**. This backend replaces mock data with a MongoDB Atlas–backed API aligned to every page, form, modal, and workflow in the storefront and admin panel.

---

## 1. Frontend Page Inventory (22 routes)

| Route | Page | Auth | Primary Data Needs |
|-------|------|------|-------------------|
| `/` | Home | Public | Products, CMS (hero, showcase, shop-the-look) |
| `/collections/:category?` | Collections | Public | Products by category, CMS heroes |
| `/product/:id` | ProductDetail | Public | Product + variants |
| `/cart` | Cart | Public/Guest | Cart (client → optional sync) |
| `/checkout` | Checkout | Public | Order creation |
| `/order-confirmation/:orderId` | OrderConfirmation | Public | Order read |
| `/wishlist` | Wishlist | Public | Wishlist product IDs |
| `/login`, `/register` | Auth | Public | JWT auth |
| `/account` | Account | Customer | Profile, orders |
| `/about-us`, `/contact` | Static | Public | Optional CMS later |
| `/admin/login` | AdminLogin | Public | Admin JWT |
| `/admin` | Dashboard | Admin | Metrics, recent orders |
| `/admin/products/new` | AddNewProduct | Admin | Product create + upload |
| `/admin/inventory` | AdminInventory | Admin | Inventory CRUD |
| `/admin/orders` | AdminOrders | Admin | Order CRUD + status |
| `/admin/analytics` | AdminAnalytics | Admin | Aggregated analytics |
| `/admin/customer-side` | AdminCustomerSide | Admin | Storefront CMS |

---

## 2. Form & Modal Inventory

### Customer Forms
- **Login**: email, password → JWT
- **Register**: name, email, password, confirmPassword → user create
- **Checkout**: email, phone, fullName, address, city, postalCode, paymentMethod → order create
- **Newsletter** (Footer): email → subscriber create

### Admin Forms
- **Admin Login**: email, password → admin JWT
- **Add Product**: title, category, price, discount, description, sizes, colors, variants, images
- **Order modals**: edit shipping, update status, cancel
- **Inventory modals**: edit SKU, update stock, restock (+ note), delete
- **CMS modals**: nav, hero, showcase, collection hero, shop-the-look

---

## 3. CRUD Matrix

| Entity | C | R | U | D | Notes |
|--------|---|---|---|---|-------|
| Users | ✓ | ✓ | ✓ | soft | Customer + staff roles |
| Products | ✓ | ✓ | ✓ | soft | Multipart images |
| Inventory | ✓ | ✓ | ✓ | soft | Linked to products |
| Orders | ✓ | ✓ | ✓ | — | Cancel = status update |
| Storefront CMS | ✓ | ✓ | ✓ | soft | Monolithic document |
| Media Assets | ✓ | ✓ | — | soft | Upload module |
| Newsletter | ✓ | ✓ | — | — | Email unique |
| Sessions | ✓ | ✓ | ✓ | ✓ | Refresh token rotation |
| Analytics | — | ✓ | — | — | Computed aggregates |

---

## 4. MongoDB Collections

### `users`
```javascript
{
  name, email (unique), passwordHash, role,
  isEmailVerified, emailVerificationToken, passwordResetToken, passwordResetExpires,
  wishlist: [ObjectId],
  addresses: [{ label, fullName, phone, address, city, postalCode, isDefault }],
  refreshTokens: [{ tokenHash, device, ip, expiresAt, revokedAt }],
  deletedAt, createdAt, updatedAt, createdBy, updatedBy
}
```
**Indexes**: `email` unique, `{ role: 1, deletedAt: 1 }`, text on name

### `products`
```javascript
{
  title, slug (unique), sku (unique), category,
  price, originalPrice, discount, discountType,
  description: { intro, detail, highlights[] },
  specifications: { composition, care, includes },
  sizes[], colors: [{ name, hex }],
  variants: [{ colorName, colorHex, images: [{ url, alt }] }],
  images: [{ url, alt, order }],
  bestSeller, stock, rating, reviewCount, status,
  deletedAt, createdAt, updatedAt, createdBy, updatedBy
}
```
**Indexes**: `slug`, `sku`, `{ category: 1, status: 1 }`, `{ bestSeller: 1 }`, text on title

### `orders`
```javascript
{
  orderNumber (#MH-xxxxx), userId?,
  customer, email, phone,
  shipping: { address, city, postalCode },
  paymentMethod, status,
  items: [{ productId, name, sku, quantity, size, color, colorHex, price }],
  subtotal, shippingFee, total,
  deletedAt, createdAt, updatedAt, createdBy, updatedBy
}
```
**Indexes**: `orderNumber` unique, `{ userId: 1, createdAt: -1 }`, `{ status: 1, createdAt: -1 }`

### `storefront_contents`
```javascript
{
  key: 'default', isPublished,
  navigation[], heroSlides[], showcase, collectionHeroes, shopTheLook,
  deletedAt, createdAt, updatedAt, createdBy, updatedBy
}
```

### `media_assets`
```javascript
{
  filename, originalName, mimeType, size, url, storageProvider,
  uploadedBy, deletedAt, createdAt, updatedAt
}
```

### `newsletter_subscribers`
```javascript
{ email (unique), source, subscribedAt, deletedAt, createdAt, updatedAt }
```

### `restock_events`
```javascript
{
  productId, sku, quantity, note, previousStock, newStock,
  createdBy, createdAt
}
```

### `audit_logs`
```javascript
{ action, entity, entityId, userId, metadata, ip, createdAt }
```

---

## 5. Relationships

```
users ──1:N──> orders
users ──N:M──> products (wishlist)
products ──1:N──> restock_events
products ──embedded──> inventory (stock on product)
orders.items.productId ──> products
storefront_contents ──refs URLs──> media_assets
```

---

## 6. API Endpoint Map

### Auth `/api/v1/auth`
| Method | Path | Role |
|--------|------|------|
| POST | /register | Public |
| POST | /login | Public |
| POST | /admin/login | Public |
| POST | /logout | Auth |
| POST | /refresh | Public (refresh cookie) |
| POST | /forgot-password | Public |
| POST | /reset-password | Public |
| POST | /change-password | Auth |
| GET | /verify-email/:token | Public |
| POST | /resend-verification | Auth |
| GET | /me | Auth |

### Products `/api/v1/products`
| GET | / | Public — list, filter, paginate |
| GET | /best-sellers | Public |
| GET | /search | Public |
| GET | /:id | Public |
| POST | / | Admin+ — multipart |
| PATCH | /:id | Admin+ |
| DELETE | /:id | Admin+ soft delete |

### Orders `/api/v1/orders`
| POST | / | Public/Guest checkout |
| GET | /my | Customer |
| GET | /:orderNumber | Owner/Admin |

### Admin Orders `/api/v1/admin/orders`
| GET | / | Admin+ search/filter |
| GET | /:id | Admin+ |
| PATCH | /:id | Admin+ |
| PATCH | /:id/status | Admin+ |
| POST | /:id/cancel | Admin+ |

### Admin Inventory `/api/v1/admin/inventory`
| GET | / | Admin+ |
| GET | /:id | Admin+ |
| PATCH | /:id | Admin+ |
| PATCH | /:id/stock | Admin+ |
| POST | /:id/restock | Admin+ |
| DELETE | /:id | Admin+ |

### Storefront `/api/v1/content`
| GET | /storefront | Public published |
| GET | /admin/storefront | Admin+ |
| PUT | /admin/storefront | Admin+ |
| POST | /admin/storefront/reset | Super Admin |

### Analytics `/api/v1/admin/analytics`
| GET | /kpis | Admin+ |
| GET | /revenue | Admin+ |
| GET | /orders | Admin+ |
| GET | /categories | Admin+ |
| GET | /top-products | Admin+ |

### Dashboard `/api/v1/admin/dashboard`
| GET | /metrics | Admin+ |
| GET | /recent-orders | Admin+ |

### Uploads `/api/v1/uploads`
| POST | /images | Admin+ |
| POST | /videos | Admin+ |
| POST | /documents | Admin+ |

### Newsletter `/api/v1/newsletter`
| POST | /subscribe | Public |

### Health `/api/v1/health`
| GET | / | Public |
| GET | /ready | Public |

---

## 7. RBAC Matrix

| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | All + user management + CMS reset |
| ADMIN | Products, orders, inventory, CMS, analytics |
| MANAGER | Orders, inventory read/update, analytics read |
| STAFF | Orders read/update status, inventory read |
| CUSTOMER | Own profile, orders, wishlist |

---

## 8. Security Requirements

- Helmet, CORS whitelist, rate limiting
- express-mongo-sanitize, xss-clean
- bcrypt (12 rounds), JWT HS256
- Access token 15m, refresh 7d with rotation
- HttpOnly secure cookies for refresh tokens
- Zod validation on every route
- No hardcoded secrets (.env validated at boot)

---

## 9. Implementation Priority

1. Core infra + MongoDB + health
2. Auth module (full)
3. Products + seed
4. Orders + checkout
5. Admin inventory + orders
6. Storefront CMS
7. Analytics + dashboard
8. Uploads + newsletter
9. Tests + Swagger + Postman
10. Docker + PM2 + deployment docs

---

## 10. Frontend Integration Points

| Frontend File | Backend Endpoint |
|---------------|------------------|
| `GlobalContext.jsx` | `/auth/*`, `/orders`, `/products` |
| `AdminContext.jsx` | `/auth/admin/login` |
| `CustomerContentContext.jsx` | `/content/storefront` |
| `services/api.js` | Base URL `VITE_API_URL=/api/v1` |
| `AddProductForm.jsx` | `POST /products` multipart |
| `AdminOrders.jsx` | `/admin/orders/*` |
| `AdminInventory.jsx` | `/admin/inventory/*` |
| `AdminAnalytics.jsx` | `/admin/analytics/*` |
| `CheckoutForm.jsx` | `POST /orders` |

---

*Report version: 1.0 — MARHAS Backend Architecture*
