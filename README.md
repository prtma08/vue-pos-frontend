# POS System - Point of Sale Terintegrasi

A comprehensive Vue.js 3 + Vite Point of Sale system with RBAC (Role-Based Access Control), advanced inventory management, and financial reconciliation.

## Features

### Authentication & Security
- JWT authentication with httpOnly cookies
- CSRF protection on all state-changing operations
- Role-based access control (Admin, Supervisor, Kasir)
- Secure token refresh mechanism
- Audit logging for sensitive actions

### Cashier Module
- **Multiple Pending Orders**: Support up to 5 concurrent orders
- **Order Persistence**: Automatic localStorage save/restore for order recovery
- **Product Management**: Browse and search products with real-time stock info
- **Low Stock Alerts**: Visual indicators for items below threshold
- **Member Association**: Attach customer information to orders
- **Supervisor Authentication**: Price changes and discounts above Rp 100,000 require supervisor approval

### Admin Dashboard
- **Product Management**: Manage catalog, stock levels, and HPP (cost prices)
- **Finance Module**: HPP-based profit reporting with 100% mathematical accuracy
- **Cash Reconciliation**: Daily cash count with automated difference calculation
- **Analytics**: Revenue, profit, and margin tracking
- **Audit Logs**: Complete action history for compliance

### Financial Features
#### Profit Calculation (HPP-Based)
```
Gross Profit = Total Revenue - Total HPP Cost
Profit Margin = (Gross Profit / Total Revenue) × 100
```

#### Cash Reconciliation
```
Difference (Selisih) = Physical Cash - System Total
Difference % = (Difference / System Total) × 100

Status:
- Balanced: |Difference| < Rp 1,000
- Shortage: Difference < 0
- Surplus: Difference > 0
- Requires Approval if |Difference %| > 5%
```

## Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   └── login.vue              # Login form component
│   ├── cashier/
│   │   └── checkout.vue           # Checkout interface
│   └── admin/
│       ├── dashboard.vue          # Admin dashboard
│       ├── finance.vue            # Profit reports
│       ├── reconciliation.vue     # Cash reconciliation
│       └── products.vue           # Product management (todo)
├── stores/                         # Pinia stores
│   ├── auth.js                    # Authentication state
│   ├── cart.js                    # Cart with persistence
│   └── products.js                # Products with HPP
├── router/
│   └── index.js                   # Vue Router with RBAC guards
├── api/
│   └── client.js                  # Axios client with interceptors
├── styles/
│   └── index.css                  # Global styles with Tailwind
├── App.vue                        # Root component
└── main.js                        # Application entry point

docs/
└── API_CONTRACTS.md               # Backend API specifications
```

## Technology Stack

- **Frontend Framework**: Vue.js 3 (Composition API)
- **Build Tool**: Vite 5
- **State Management**: Pinia 2
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (backend)
- **Authentication**: JWT with httpOnly cookies

## Installation

### Prerequisites
- Node.js >= 18
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Create .env.local from .env.example
cp .env.example .env.local

# Update VITE_API_BASE_URL to your backend
# VITE_API_BASE_URL=http://localhost:3001

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Configuration

### Environment Variables

```env
# API
VITE_API_BASE_URL=http://localhost:3001

# Features
VITE_ENABLE_MEMBER_CREATION=true
VITE_ENABLE_SUPERVISOR_AUTH=true
VITE_ENABLE_ANALYTICS=true

# Thresholds
VITE_SUPERVISOR_AUTH_THRESHOLD=100000      # Rp 100,000
VITE_LOW_STOCK_THRESHOLD=10               # Units
VITE_MAX_PENDING_ORDERS=5                 # Orders
```

## Store Documentation

### Auth Store (`stores/auth.js`)

Manages user authentication and authorization.

**State:**
- `user`: Current authenticated user
- `userRole`: 'admin' | 'supervisor' | 'kasir'
- `isAuthenticated`: Boolean
- `csrfToken`: CSRF token for security

**Actions:**
- `login(email, password)`: Authenticate user
- `logout()`: Logout user
- `checkAuth()`: Verify current session
- `updateCsrfToken(token)`: Update CSRF token

**Computed:**
- `isAdmin`, `isSupervisor`, `isKasir`: Role checkers
- `canApproveDiscount`: Can approve discounts
- `canChangePrice`: Can change prices
- `canAccessAdmin`: Can access admin panel

### Cart Store (`stores/cart.js`)

Manages shopping cart with multiple order support and persistence.

**Key Features:**
- Multiple pending orders (up to 5)
- Auto-save to localStorage
- Supervisor auth triggers for restricted actions
- Order profit estimation

**Actions:**
- `createOrder()`: Create new order
- `addItem(orderId, product)`: Add product to order
- `removeItem(orderId, itemIndex)`: Remove item
- `updateQuantity(orderId, itemIndex, qty)`: Update quantity
- `applyDiscount(orderId, percent, requireAuth)`: Apply discount with auth
- `changePriceItem(orderId, index, price, requireAuth)`: Change price with auth
- `submitOrder(orderId)`: Submit order to backend
- `clearOrder(orderId)`: Clear order
- `initializeFromStorage()`: Restore orders from localStorage
- `completeSupervisorAuth(approved, supervisorId)`: Approve supervisor action

### Products Store (`stores/products.js`)

Manages product catalog with HPP (cost price) for profit calculations.

**State:**
- `products`: All products with HPP field
- `lowStockThreshold`: Stock alert level
- `filters`: Category and search filters

**Actions:**
- `fetchProducts()`: Load products from API
- `updateHPP(productId, newHPP)`: Update cost price
- `setLowStockThreshold(threshold)`: Configure alert level

**Computed:**
- `lowStockProducts`: Products below threshold
- `profitMargin(productId)`: Profit margin percentage

## API Integration

See `docs/API_CONTRACTS.md` for complete API specification including:

- **Authentication**: Login, logout, token refresh
- **Products**: CRUD operations with HPP field
- **Orders**: Create and retrieve orders
- **Finance**: Profit reports and reconciliation
- **Audit**: Supervisor action logging

### Key Endpoints

```
POST   /api/auth/login                    # User authentication
POST   /api/auth/logout                   # Logout
GET    /api/auth/me                       # Current user
GET    /api/products                      # List products
POST   /api/orders                        # Create order
POST   /api/finance/reconciliation        # Submit reconciliation
GET    /api/finance/profit-report         # Generate profit report
POST   /api/audit/log-supervisor-action   # Log supervisor actions
```

## RBAC (Role-Based Access Control)

### Admin Role
- Full system access
- Manage products and pricing
- View all reports and analytics
- Approve supervisory actions
- Access audit logs

### Supervisor Role
- Approve discount and price changes
- View reports (limited)
- Perform cash reconciliation
- Access checkout (cashier functions)

### Kasir (Cashier) Role
- Create and manage orders
- Add/remove items
- Process payments
- View own transaction history

## Security Features

### 1. JWT Authentication
- Tokens stored in httpOnly cookies (XSS-safe)
- Automatic refresh on token expiration
- CSRF token validation on all mutations

### 2. Audit Logging
All sensitive actions logged with:
- Action type
- User who performed it
- Timestamp
- Relevant metadata

### 3. Supervisor Authorization
Actions requiring approval:
- Apply discount > Rp 100,000
- Change price (if change amount > threshold)
- Modify existing orders

### 4. Input Validation
- Client-side validation for UX
- Server-side validation for security
- Parameterized queries to prevent SQL injection

## Deployment

### Production Build

```bash
# Build optimized version
pnpm build

# Preview production build locally
pnpm preview
```

### Environment Setup (Production)
1. Set `VITE_API_BASE_URL` to production API endpoint
2. Ensure CORS is properly configured on backend
3. Enable HTTPS (required for secure cookies)
4. Configure Content Security Policy headers

## Troubleshooting

### Order not persisting
- Check if localStorage is enabled
- Verify `persistenceEnabled` is true in cart store
- Check browser console for errors

### Supervisor auth not triggering
- Verify `VITE_SUPERVISOR_AUTH_THRESHOLD` is set
- Check action amount against threshold
- Ensure supervisor is logged in

### API request failures
- Check CORS configuration on backend
- Verify `VITE_API_BASE_URL` is correct
- Check Network tab in DevTools for actual errors
- Ensure JWT token is valid

## Development

### Code Style
- Vue 3 Composition API
- Pinia stores for state management
- Single File Components (.vue)
- Tailwind CSS for styling

### Adding New Features
1. Create feature module in `src/modules/`
2. Add store if needed in `src/stores/`
3. Create router entry in `src/router/index.js`
4. Add API methods in relevant store
5. Document API contracts in `docs/API_CONTRACTS.md`

## Performance Optimization

- Lazy loading for route components
- Debounced search and filters
- Memoized computed properties
- Efficient localStorage operations
- Optimistic UI updates

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

## License

Proprietary - Point of Sale System

## Support

For issues and feature requests, contact your development team or refer to project documentation.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
