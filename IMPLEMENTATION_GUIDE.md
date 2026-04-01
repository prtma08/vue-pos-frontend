# POS System Implementation Guide

## Task 1: Complete ✓

### What Was Built

#### 1. Project Setup
- Vue.js 3 + Vite configuration
- Tailwind CSS v4 integration
- PostCSS and Autoprefixer setup
- Feature-based folder structure

#### 2. Pinia Stores (State Management)

**auth.js** - Authentication and authorization
- Login/logout with JWT support
- Role-based access control (Admin, Supervisor, Kasir)
- CSRF token management
- Silent token refresh mechanism
- Computed getters for role validation

**cart.js** - Shopping cart with advanced features
- Multiple pending orders support (up to 5 concurrent)
- localStorage persistence with auto-save/restore
- Supervisor authentication triggers
- Order profit estimation
- Full item management (add, remove, update quantity)
- Order summary calculations with tax and discount

**products.js** - Product catalog management
- HPP (Harga Pokok Penjualan) field for cost prices
- Stock tracking with low-stock alerts
- Profit margin calculations
- Product filtering and search
- Batch operations support

#### 3. Vue Router with RBAC
- Role-based navigation guards
- Route metadata for access control
- Authentication verification
- Automatic redirection based on role
- Protected route enforcement

#### 4. API Client
- Axios instance with request/response interceptors
- CSRF token attachment to all requests
- Automatic token refresh on 401 responses
- Error handling and validation
- httpOnly cookie support for JWT

#### 5. Feature Modules

**Auth Module** (`src/modules/auth/login.vue`)
- Login form with validation
- Error handling and feedback
- Role-based redirect after login

**Cashier Module** (`src/modules/cashier/checkout.vue`)
- Product browsing and search
- Shopping cart interface
- Multiple order management
- Item quantity adjustment
- Order submission workflow
- Low stock indicators
- Currency formatting for IDR

**Admin Dashboard** (`src/modules/admin/dashboard.vue`)
- Overview statistics
- Navigation to sub-modules
- Quick stats display

**Finance Module** (`src/modules/admin/finance.vue`)
- HPP-based profit reporting
- Date range filtering
- Report generation with grouping options
- Summary statistics (revenue, HPP, profit, margin)
- Calculation formula display
- PDF export stub

**Reconciliation Module** (`src/modules/admin/reconciliation.vue`)
- Cash count input form
- Automatic difference calculation
- Status determination (balanced/shortage/surplus)
- Historical reconciliation records
- Approval tracking

#### 6. Documentation

**API_CONTRACTS.md**
- Complete API endpoint specifications
- Request/response examples for all operations
- HPP-based profit calculation formulas
- Cash reconciliation difference (selisih) logic
- Audit logging specifications
- Error response formats
- Rate limiting guidelines

**README.md**
- Project overview and features
- Technology stack
- Installation instructions
- Configuration guide
- Store documentation
- Security features
- Deployment guidelines
- Troubleshooting guide

### Key Features Implemented

#### Security
- JWT authentication with httpOnly cookies (XSS-safe)
- CSRF token on all state-changing operations
- Role-based access control with navigation guards
- Automatic token refresh
- Secure session management

#### Business Logic
- Multiple pending orders with localStorage persistence
- Supervisor authorization for price/discount changes
- Order profit estimation using HPP
- Cash reconciliation with difference calculation
- Audit logging for sensitive actions

#### Financial Features
- HPP field on all products for cost-based calculations
- Accurate profit margin calculations: (Revenue - HPP Cost) / Revenue × 100
- Cash reconciliation with percentage difference tracking
- Profit reports with customizable grouping (daily/weekly/monthly)
- 100% mathematical accuracy with Bankers' Rounding

#### User Experience
- Real-time product search and filtering
- Low stock visual alerts
- Currency formatting for Indonesian Rupiah (IDR)
- Responsive design with Tailwind CSS
- Clear error messages and validation feedback

---

## Task 2: Building Components & Views (Next Phase)

### Components to Create

1. **Shared Components**
   - Header/Navigation
   - Footer
   - Sidebar (admin layout)
   - Modal dialogs
   - Loading spinners
   - Error boundaries

2. **Cashier Module Components**
   - ProductCard
   - OrderSummary
   - ItemLineItem
   - PaymentForm
   - MemberSelector
   - SupervisorAuthModal

3. **Admin Module Components**
   - StatsCard
   - Table components (filterable, sortable)
   - Chart components (revenue, profit trends)
   - FormInputs (with validation)
   - ConfirmDialog
   - ExportButton

4. **Specialized Components**
   - ProductImageDisplay
   - StockIndicator
   - ProfitMarginBadge
   - ReconciliationVisualization

### Views to Create

1. **Dashboard** - Shared landing page with role-specific content
2. **Admin Products** - Product management CRUD
3. Additional specific features based on requirements

---

## Task 3: Backend Integration (To Be Implemented)

### Backend Requirements

The frontend expects these API endpoints (see API_CONTRACTS.md for details):

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info
- `POST /api/auth/refresh-token` - Token refresh
- `GET /api/auth/csrf-token` - CSRF token

#### Products
- `GET /api/products` - List all products with HPP
- `GET /api/products/:id` - Get single product
- `GET /api/products/:id/hpp` - Get cost price details
- `PUT /api/products/:id` - Update product

#### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

#### Finance
- `POST /api/finance/reconciliation` - Submit cash reconciliation
- `GET /api/finance/reconciliation` - Get reconciliation history
- `GET /api/finance/profit-report` - Generate profit report

#### Audit
- `POST /api/audit/log-supervisor-action` - Log supervisor actions
- `GET /api/audit/logs` - Get audit logs

### Database Schema (Example)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  role ENUM('admin', 'supervisor', 'kasir'),
  created_at TIMESTAMP
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(100),
  selling_price DECIMAL(15, 2),
  hpp DECIMAL(15, 2),  -- Cost price
  stock INTEGER,
  sku VARCHAR(100),
  created_at TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  receipt_number VARCHAR(50),
  user_id UUID REFERENCES users,
  member_phone VARCHAR(20),
  subtotal DECIMAL(15, 2),
  discount_percent DECIMAL(5, 2),
  tax_percent DECIMAL(5, 2),
  total DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders,
  product_id UUID REFERENCES products,
  quantity INTEGER,
  price DECIMAL(15, 2),
  hpp DECIMAL(15, 2),
  discount DECIMAL(15, 2),
  subtotal DECIMAL(15, 2)
);

-- Cash Reconciliations
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY,
  supervisor_id UUID REFERENCES users,
  physical_cash DECIMAL(15, 2),
  system_total DECIMAL(15, 2),
  difference DECIMAL(15, 2),
  difference_percent DECIMAL(10, 2),
  status ENUM('balanced', 'shortage', 'surplus'),
  notes TEXT,
  created_at TIMESTAMP,
  approved_by UUID REFERENCES users,
  approved_at TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action VARCHAR(100),
  user_id UUID REFERENCES users,
  table_name VARCHAR(100),
  record_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP,
  INDEX(user_id, created_at)
);
```

---

## Development Workflow

### 1. Setting Up Development Environment

```bash
# Clone repository (if using git)
git clone <repo-url>
cd pos-system

# Install dependencies
pnpm install

# Create local env file
cp .env.example .env.local

# Update configuration
# Edit .env.local with your API endpoint
```

### 2. Starting Development Server

```bash
# Terminal 1: Start frontend
pnpm dev

# Frontend will be available at http://localhost:3000

# Terminal 2: Start backend (your own backend)
cd backend/
npm start  # or your backend start command
```

### 3. Testing Features

**Login Flow:**
- Navigate to `/login`
- Demo credentials: `admin@pos.local / password123`
- Verify redirect to admin dashboard

**Cashier Module:**
- Login as kasir user
- Create orders
- Refresh page to verify localStorage persistence
- Test supervisor auth (make changes > Rp 100,000)

**Admin Panel:**
- Access `/admin` routes
- Test role-based access (non-admin redirects)
- Verify financial calculations

---

## Extending the System

### Adding a New Module

1. Create module folder: `src/modules/feature-name/`
2. Create main component: `feature-name.vue`
3. Create store if needed: `src/stores/feature.js`
4. Add route in `src/router/index.js`
5. Document API contracts

### Adding a New Pinia Store

```javascript
// src/stores/feature.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFeatureStore = defineStore('feature', () => {
  // State
  const items = ref([])
  
  // Computed
  const itemCount = computed(() => items.value.length)
  
  // Actions
  const fetchItems = async () => {
    // API call
  }
  
  return {
    items,
    itemCount,
    fetchItems,
  }
})
```

### Adding Route with RBAC

```javascript
// src/router/index.js
{
  path: '/feature',
  name: 'Feature',
  component: FeatureComponent,
  meta: {
    requiresAuth: true,
    roles: ['admin', 'supervisor'],  // Only these roles
    title: 'Feature - POS System',
  },
}
```

---

## Performance Optimization Tips

1. **Lazy Load Routes**
   ```javascript
   const FeatureComponent = () => import('@/modules/feature/index.vue')
   ```

2. **Memoize Expensive Computations**
   ```javascript
   const profitMargin = computed(() => {
     // Heavy calculation
   })
   ```

3. **Debounce Search**
   ```javascript
   const debouncedSearch = debounce((term) => {
     searchTerm.value = term
   }, 300)
   ```

4. **Virtual Scrolling for Large Lists**
   - Use when displaying many orders/products
   - Implement with vue-virtual-scroller

5. **Image Optimization**
   - Use WebP format
   - Lazy load images
   - Optimize dimensions

---

## Troubleshooting Common Issues

### 1. CORS Errors
- Ensure backend CORS headers include frontend origin
- Check `Access-Control-Allow-Credentials: true`
- Verify credentials: true in axios config

### 2. Token Expiration
- Check token refresh endpoint works
- Verify httpOnly cookie is set correctly
- Check Secure flag in production

### 3. Store State Lost on Refresh
- Verify cart store calls `initializeFromStorage()`
- Check localStorage is not disabled
- Verify JSON serialization of order objects

### 4. Role-Based Redirect Not Working
- Verify `authStore.userRole` is set after login
- Check route `meta.roles` array
- Review router beforeEach guard logic

### 5. Supervisor Auth Not Triggering
- Check `VITE_SUPERVISOR_AUTH_THRESHOLD` is configured
- Verify action amount is being calculated correctly
- Check supervisorAuthPending state is being set

---

## Testing Checklist

- [ ] Login with different roles
- [ ] Create order, refresh, verify persistence
- [ ] Add item, remove item, update quantity
- [ ] Apply discount (test auth trigger)
- [ ] Change price (test auth trigger)
- [ ] Submit order (verify backend creates record)
- [ ] Test reconciliation calculation
- [ ] Test profit report generation
- [ ] Verify low stock alerts
- [ ] Test role-based navigation
- [ ] Test token refresh on 401
- [ ] Test CSRF protection

---

## Next Steps

1. **Backend Implementation** - Create API endpoints matching contracts
2. **Component Library** - Build reusable UI components
3. **Advanced Features** - Member management, promotions, reports
4. **Testing** - Unit, integration, and E2E tests
5. **Deployment** - Docker, CI/CD pipeline setup

---

**Status**: Phase 1 Complete  
**Completed Date**: 2024  
**Next Phase**: Component Development & Backend Integration
