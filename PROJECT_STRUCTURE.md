# Project File Structure

Complete directory structure and file descriptions for the POS System.

## Root Files

```
.env.example                 # Environment variables template
index.html                   # HTML entry point
package.json                 # Project dependencies and scripts
postcss.config.js           # PostCSS configuration
tailwind.config.js          # Tailwind CSS configuration
vite.config.js              # Vite bundler configuration
README.md                   # Project overview and documentation
IMPLEMENTATION_GUIDE.md     # Detailed implementation guide
PROJECT_STRUCTURE.md        # This file
```

## src/ Directory

### Main Application Files

```
src/
├── main.js                          # Application entry point
│   └── Initializes Pinia and Vue Router
│   └── Sets up global axios instance
│
├── App.vue                          # Root Vue component
│   └── Initializes stores
│   └── Restores cart from localStorage
│   └── Sets up app-level providers
│
└── styles/
    └── index.css                    # Global styles with Tailwind
        └── Base styles
        └── Animations
        └── Utility classes
```

### Router (src/router/)

```
src/router/
└── index.js                         # Vue Router configuration
    ├── Route definitions with metadata
    ├── RBAC navigation guards
    ├── Authentication checks
    ├── Role-based redirects
    └── Route titles and meta
```

### State Management (src/stores/)

```
src/stores/
├── auth.js                          # Authentication store
│   ├── User state and role
│   ├── Login/logout actions
│   ├── CSRF token management
│   └── Role-based computed properties
│
├── cart.js                          # Shopping cart store
│   ├── Multiple orders management
│   ├── Item operations (add, remove, update)
│   ├── Order calculations
│   ├── localStorage persistence
│   ├── Supervisor auth requests
│   └── Order submission
│
└── products.js                      # Product catalog store
    ├── Product list with HPP
    ├── Stock tracking
    ├── Low stock alerts
    ├── Profit margin calculations
    ├── Search and filtering
    └── Product updates
```

### API Client (src/api/)

```
src/api/
└── client.js                        # Axios HTTP client
    ├── Request interceptors
    │   └── CSRF token attachment
    │   └── Auth headers
    ├── Response interceptors
    │   └── Token refresh logic
    │   └── Error handling
    │   └── CSRF token updates
    └── Error handling for 401/403/422
```

### Feature Modules (src/modules/)

```
src/modules/
│
├── auth/                            # Authentication module
│   └── login.vue                    # Login form component
│       ├── Email/password inputs
│       ├── Error handling
│       ├── Loading states
│       └── Role-based redirect
│
├── cashier/                         # Cashier/POS module
│   └── checkout.vue                 # Main checkout interface
│       ├── Product browser
│       ├── Shopping cart
│       ├── Multiple order management
│       ├── Item management
│       ├── Order summary
│       ├── Stock indicators
│       └── Order submission
│
└── admin/                           # Admin management module
    ├── dashboard.vue                # Admin dashboard overview
    │   ├── Statistics cards
    │   ├── Module navigation
    │   └── Quick actions
    │
    ├── finance.vue                  # Finance & profit reports
    │   ├── Date range filters
    │   ├── Report generation
    │   ├── Profit calculations
    │   ├── HPP-based reporting
    │   ├── Revenue vs cost analysis
    │   ├── Export functionality
    │   └── Calculation formula display
    │
    ├── reconciliation.vue           # Cash reconciliation
    │   ├── Physical cash input
    │   ├── Difference calculation
    │   ├── Status determination
    │   ├── Historical records
    │   ├── Approval tracking
    │   └── Reconciliation formulas
    │
    └── products.vue                 # Product management (TODO)
        ├── Product list with HPP
        ├── Stock management
        ├── Cost price management
        └── Add/edit/delete operations
```

## Documentation (docs/)

```
docs/
└── API_CONTRACTS.md                 # Complete API specification
    ├── Authentication endpoints
    ├── Product endpoints with HPP
    ├── Order endpoints
    ├── Finance endpoints (reconciliation & profits)
    ├── Audit logging endpoints
    ├── Request/response examples
    ├── Error response formats
    ├── Calculation formulas
    │   ├── Profit margin calculation
    │   ├── Cash difference (selisih) calculation
    │   ├── Profit report generation logic
    │   └── Rounding methodology
    └── Rate limiting guidelines
```

## Complete Hierarchy

```
pos-system/
│
├── index.html
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
│
├── README.md
├── IMPLEMENTATION_GUIDE.md
├── PROJECT_STRUCTURE.md
├── .env.example
│
├── docs/
│   └── API_CONTRACTS.md
│
└── src/
    ├── main.js
    ├── App.vue
    │
    ├── styles/
    │   └── index.css
    │
    ├── router/
    │   └── index.js
    │
    ├── stores/
    │   ├── auth.js                  [138 lines]
    │   ├── products.js              [156 lines]
    │   └── cart.js                  [439 lines]
    │
    ├── api/
    │   └── client.js                [91 lines]
    │
    └── modules/
        ├── auth/
        │   └── login.vue            [84 lines]
        │
        ├── cashier/
        │   └── checkout.vue         [209 lines]
        │
        └── admin/
            ├── dashboard.vue        [135 lines]
            ├── finance.vue          [211 lines]
            ├── reconciliation.vue   [291 lines]
            └── products.vue         [TODO]
```

## Code Statistics

| Component | Lines | Purpose |
|-----------|-------|---------|
| cart.js | 439 | Cart state with persistence & supervisor auth |
| reconciliation.vue | 291 | Cash reconciliation interface |
| finance.vue | 211 | Profit reports with HPP calculations |
| checkout.vue | 209 | Main cashier checkout interface |
| auth.js | 138 | Authentication state & JWT |
| products.js | 156 | Products catalog with HPP |
| login.vue | 84 | Login form component |
| client.js | 91 | HTTP client with interceptors |
| dashboard.vue | 135 | Admin dashboard |

**Total: ~2,000 lines of code** (Framework code, no boilerplate)

## Key Design Patterns

### 1. Composition API
- All Vue components use `<script setup>`
- Reactive state with `ref()` and `computed()`
- Template syntax is simple and readable

### 2. Pinia Stores
- Stores organized by feature domain
- Clear separation of state, actions, computed
- No mutations, actions only
- Local persistence with localStorage

### 3. RBAC with Router
- Route metadata defines required roles
- Navigation guards check permissions
- Automatic redirects based on role
- Protected routes enforce auth

### 4. API Layer
- Centralized Axios client
- Request/response interceptors
- Automatic token refresh
- CSRF protection on all mutations
- Error handling and logging

### 5. Feature-Based Structure
- Each feature in its own module
- Related components together
- Clear separation of concerns
- Easy to extend and maintain

## Store Patterns

### Auth Store Pattern
```javascript
// Define state with ref/reactive
const user = ref(null)

// Create actions (not mutations)
const login = async (email, password) => {
  // Perform async operation
  // Update state
}

// Export everything
return { user, login, ... }
```

### Cart Store with Persistence
```javascript
// Define persistence key
const STORAGE_KEY = 'pos_pending_orders_v1'

// Auto-save on mutations
const persistToStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Restore on app init
const initializeFromStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) orders.value = JSON.parse(data).orders
}
```

### Products Store Pattern
```javascript
// Computed properties for derived data
const lowStockProducts = computed(() => 
  products.value.filter(p => p.stock <= threshold)
)

// Getters for calculations
const profitMargin = (productId) => {
  // Calculate derived value
  return Math.round(calculation * 100) / 100
}
```

## Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_SUPERVISOR_AUTH=true
VITE_ENABLE_MEMBER_CREATION=true
VITE_ENABLE_ANALYTICS=true

# Business Rules
VITE_SUPERVISOR_AUTH_THRESHOLD=100000      # Rp 100,000
VITE_LOW_STOCK_THRESHOLD=10               # Units
VITE_MAX_PENDING_ORDERS=5                 # Orders
```

## File Naming Conventions

- **Components**: PascalCase (`.vue`)
  - Example: `LoginForm.vue`, `CheckoutCart.vue`
  
- **Stores**: kebab-case (`.js`)
  - Example: `auth.js`, `shopping-cart.js`
  
- **Routes**: kebab-case in path
  - Example: `/admin-dashboard`, `/cash-reconciliation`
  
- **Utilities**: kebab-case (`.js`)
  - Example: `format-currency.js`, `calculate-profit.js`

## Import Aliases

The `@` alias is configured in `vite.config.js`:

```javascript
// Instead of:
import { useAuthStore } from '../../../stores/auth'

// Use:
import { useAuthStore } from '@/stores/auth'
```

## Next Steps for Expansion

1. Create `src/components/` for shared UI components
2. Create `src/utils/` for helper functions
3. Create `src/composables/` for reusable logic
4. Create `src/types/` for TypeScript definitions (if using TS)
5. Create `tests/` for unit and integration tests
6. Create `scripts/` for build/deployment scripts

## Performance Considerations

- **Code Splitting**: Routes lazy-loaded by Vite
- **Bundle Size**: Tailwind CSS purged in production
- **State Management**: Pinia optimized for small bundles
- **localStorage**: Limited to ~5MB, used only for pending orders
- **Network**: Axios timeout set to 10 seconds

---

**Last Updated**: 2024  
**Status**: Complete and Ready for Development
