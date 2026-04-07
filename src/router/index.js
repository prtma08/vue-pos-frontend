import { createRouter, createWebHistory } from 'vue-router'
import { defineComponent, h } from 'vue'
import { useAuthStore } from '@/stores/auth'

// ─── Layouts ──────────────────────────────────────────────────────────────────
import MainLayout from '@/layouts/MainLayout.vue'

// ─── Eagerly-loaded pages (top-level & critical) ───────────────────────────────
import Login from '@/modules/auth/login.vue'
import RoleSelector from '@/modules/auth/RoleSelector.vue'
import CashierCheckout from '@/modules/cashier/checkout.vue'
import PosDeviceSelector from '@/modules/cashier/PosDeviceSelector.vue'
import OpeningShift from '@/modules/cashier/OpeningShift.vue'
import ClosingShift from '@/modules/cashier/ClosingShift.vue'

// ─── Lazy-loaded admin pages ──────────────────────────────────────────────────
const AdminDashboard = () => import('@/modules/admin/dashboard.vue')
const AdminCategories = () => import('@/modules/admin/categories.vue')
const AdminProducts = () => import('@/modules/admin/products.vue')
const AdminMembers = () => import('@/modules/admin/members.vue')
const AdminAccounts = () => import('@/modules/admin/accounts.vue')
const AdminTransactions = () => import('@/modules/admin/transactions.vue')
const AdminFinance = () => import('@/modules/admin/finance.vue')
const AdminReconciliation = () => import('@/modules/admin/reconciliation.vue')
const AdminDiscounts = () => import('@/modules/admin/discounts.vue')
const AdminPosDevices = () => import('@/modules/admin/posDevices.vue')
const AdminPurchase = () => import('@/modules/admin/purchase.vue')
const AdminPrices = () => import('@/modules/admin/prices.vue')
const AdminBundles = () => import('@/modules/admin/bundles.vue')
const AdminSalesReport = () => import('@/modules/admin/salesReport.vue')
const AdminExpired = () => import('@/modules/admin/expired.vue')
const AdminSettings = () => import('@/modules/admin/settings.vue')  // D2
const CashierCFD = () => import('@/modules/cashier/CFD.vue')      // D1

// ─── 404 placeholder ─────────────────────────────────────────────────────────
const NotFound = defineComponent({
  name: 'NotFound',
  render: () => h('div', {
    style: 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:3rem;font-family:sans-serif;color:#94a3b8'
  }, [
    h('svg', { width: 64, height: 64, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5 }, [
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('path', { d: 'M16 16s-1.5-2-4-2-4 2-4 2' }),
      h('line', { x1: 9, y1: 9, x2: '9.01', y2: 9 }),
      h('line', { x1: 15, y1: 9, x2: '15.01', y2: 9 }),
    ]),
    h('h2', { style: 'margin:1.5rem 0 0.5rem;font-family:serif;font-size:1.75rem;color:#475569' }, '404'),
    h('p', { style: 'font-size:0.9rem' }, 'Halaman tidak ditemukan'),
  ]),
})

// ─── Role → default redirect map ─────────────────────────────────────────────
const ROLE_REDIRECTS = {
  superuser: '/admin/dashboard',
  admin: '/admin/dashboard',
  supervisor: '/admin/transactions',
  kasir: '/cashier',
}

// ─── Routes ──────────────────────────────────────────────────────────────────
const routes = [
  // Public
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false, title: 'Login — Nextore POS' },
  },

  // Role Selection (auth required, no specific role)
  {
    path: '/role-select',
    name: 'RoleSelector',
    component: RoleSelector,
    meta: { requiresAuth: true, title: 'Pilih Role — Nextore POS' },
  },

  // POS Device Selection (kasir only)
  {
    path: '/cashier/device-select',
    name: 'PosDeviceSelector',
    component: PosDeviceSelector,
    meta: { requiresAuth: true, roles: ['kasir'], title: 'Pilih Terminal — Nextore POS' },
  },

  // Opening Shift (kasir, after POS device select)
  {
    path: '/cashier/opening-shift',
    name: 'OpeningShift',
    component: OpeningShift,
    meta: { requiresAuth: true, roles: ['kasir'], requiresPosDevice: true, title: 'Buka Shift — Nextore POS' },
  },

  // Cashier (full-screen, no sidebar — requires POS device + open shift)
  {
    path: '/cashier',
    name: 'Cashier',
    component: CashierCheckout,
    meta: { requiresAuth: true, roles: ['kasir', 'supervisor', 'admin', 'superuser'], requiresPosDevice: true, requiresShift: true, title: 'Kasir — Nextore POS' },
  },

  // Closing Shift
  {
    path: '/cashier/closing-shift',
    name: 'ClosingShift',
    component: ClosingShift,
    meta: { requiresAuth: true, roles: ['kasir'], requiresPosDevice: true, title: 'Tutup Shift — Nextore POS' },
  },

  // D1: Customer Facing Display (CFD) — no auth required (new window)
  {
    path: '/cashier/cfd',
    name: 'CashierCFD',
    component: CashierCFD,
    meta: { requiresAuth: false, title: 'Customer Display — Nextore POS' },
  },

  // ── Admin (nested inside MainLayout) ───────────────────────────────────
  {
    path: '/admin',
    component: MainLayout,
    meta: { requiresAuth: true, roles: ['admin', 'supervisor', 'superuser'] },
    children: [
      // Index → redirect to dashboard
      { path: '', redirect: { name: 'AdminDashboard' } },

      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Dashboard — Nextore' },
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: AdminCategories,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Kategori — Nextore' },
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: AdminProducts,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Produk — Nextore' },
      },
      {
        path: 'members',
        name: 'AdminMembers',
        component: AdminMembers,
        meta: { requiresAuth: true, roles: ['admin', 'supervisor', 'superuser'], title: 'Member — Nextore' },
      },
      {
        path: 'accounts',
        name: 'AdminAccounts',
        component: AdminAccounts,
        meta: { requiresAuth: true, roles: ['superuser'], title: 'Kelola Akun — Nextore' },
      },
      {
        path: 'transactions',
        name: 'AdminTransactions',
        component: AdminTransactions,
        meta: { requiresAuth: true, roles: ['admin', 'supervisor', 'superuser'], title: 'Riwayat Transaksi — Nextore' },
      },
      {
        path: 'finance',
        name: 'AdminFinance',
        component: AdminFinance,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Laporan Laba — Nextore' },
      },
      {
        path: 'reconciliation',
        name: 'AdminReconciliation',
        component: AdminReconciliation,
        meta: { requiresAuth: true, roles: ['admin', 'supervisor', 'superuser'], title: 'Rekonsiliasi — Nextore' },
      },
      {
        path: 'discounts',
        name: 'AdminDiscounts',
        component: AdminDiscounts,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Manajemen Diskon — Nextore' },
      },
      {
        path: 'pos-devices',
        name: 'AdminPosDevices',
        component: AdminPosDevices,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'POS Terminal — Nextore' },
      },
      {
        path: 'purchase',
        name: 'AdminPurchase',
        component: AdminPurchase,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Purchase Barang — Nextore' },
      },
      {
        path: 'prices',
        name: 'AdminPrices',
        component: AdminPrices,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Manajemen Harga — Nextore' },
      },
      {
        path: 'bundles',
        name: 'AdminBundles',
        component: AdminBundles,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Manajemen Paket — Nextore' },
      },
      {
        path: 'sales-report',
        name: 'AdminSalesReport',
        component: AdminSalesReport,
        meta: { requiresAuth: true, roles: ['admin', 'supervisor', 'superuser'], title: 'Laporan Penjualan — Nextore' },
      },
      {
        path: 'expired',
        name: 'AdminExpired',
        component: AdminExpired,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Laporan Expired — Nextore' },
      },
      // D2: System Settings
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettings,
        meta: { requiresAuth: true, roles: ['admin', 'superuser'], title: 'Pengaturan — Nextore' },
      },
    ],
  },

  // 404
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
]

// ─── Router instance ──────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
})

// ─── Navigation Guards ────────────────────────────────────────────────────────
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Set page title
  document.title = to.meta.title || 'Nextore POS'

  // Already authed + going to login → redirect based on state
  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      // If no active role selected (multi-role user), go to role selector
      if (authStore.needsRoleSelection) return next('/role-select')
      return next(ROLE_REDIRECTS[authStore.activeRole] || '/role-select')
    }
    return next()
  }

  // Protected routes
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      let ok = false
      try { ok = (await authStore.checkAuth()).success } catch { ok = false }
      if (!ok) return next('/login')
    }

    // After auth check — if user needs role selection, redirect (unless already going there)
    if (authStore.needsRoleSelection && to.name !== 'RoleSelector') {
      return next('/role-select')
    }

    // Role check (use activeRole)
    const requiredRoles = to.meta.roles
    if (requiredRoles?.length && !requiredRoles.includes(authStore.activeRole)) {
      if (import.meta.env.DEV) {
        console.warn(`[Router] Access denied to '${to.path}' — need ${requiredRoles.join('/')} but got '${authStore.activeRole}'`)
      }
      return next(ROLE_REDIRECTS[authStore.activeRole] || '/role-select')
    }

    // POS Device check for cashier routes
    if (to.meta.requiresPosDevice && authStore.needsPosDevice) {
      return next('/cashier/device-select')
    }

    // Shift check: kasir must have open shift to access POS
    // E4 FIX: Supervisor role bypasses the shift guard — they supervise kasir, not run their own shift
    if (to.meta.requiresShift && authStore.activeRole !== 'supervisor') {
      const { useShiftStore } = await import('@/stores/shift')
      const shiftStore = useShiftStore()
      shiftStore.restoreShift()
      if (!shiftStore.isShiftOpen) {
        return next('/cashier/opening-shift')
      }
    }
  }

  // Role selector guard: redirect if role already selected
  if (to.name === 'RoleSelector' && authStore.activeRole) {
    return next(ROLE_REDIRECTS[authStore.activeRole] || '/admin/dashboard')
  }

  next()
})

router.afterEach((to, from) => {
  if (import.meta.env.DEV) {
    console.log(`[Router] ${from.path} → ${to.path}`)
  }
})

export default router
