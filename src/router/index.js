import { createRouter, createWebHistory } from 'vue-router'
import { defineComponent, h } from 'vue'
import { useAuthStore } from '@/stores/auth'

// ─── Layouts ──────────────────────────────────────────────────────────────────
import MainLayout from '@/layouts/MainLayout.vue'

// ─── Eagerly-loaded pages (top-level & critical) ───────────────────────────────
import Login from '@/modules/auth/login.vue'
import CashierCheckout from '@/modules/cashier/checkout.vue'

// ─── Lazy-loaded admin pages ──────────────────────────────────────────────────
const AdminDashboard = () => import('@/modules/admin/dashboard.vue')
const AdminCategories = () => import('@/modules/admin/categories.vue')
const AdminProducts = () => import('@/modules/admin/products.vue')
const AdminMembers = () => import('@/modules/admin/members.vue')
const AdminAccounts = () => import('@/modules/admin/accounts.vue')
const AdminTransactions = () => import('@/modules/admin/transactions.vue')
const AdminFinance = () => import('@/modules/admin/finance.vue')
const AdminReconciliation = () => import('@/modules/admin/reconciliation.vue')

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

  // Cashier (full-screen, no sidebar)
  {
    path: '/cashier',
    name: 'Cashier',
    component: CashierCheckout,
    meta: { requiresAuth: true, roles: ['kasir', 'supervisor', 'admin'], title: 'Kasir — Nextore POS' },
  },

  // ── Admin (nested inside MainLayout) ───────────────────────────────────
  {
    path: '/admin',
    component: MainLayout,
    meta: { requiresAuth: true, roles: ['admin', 'supervisor'] },
    children: [
      // Index → redirect to dashboard
      { path: '', redirect: { name: 'AdminDashboard' } },

      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { requiresAuth: true, roles: ['admin'], title: 'Dashboard — Nextore' },
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: AdminCategories,
        meta: { requiresAuth: true, roles: ['admin'], title: 'Kategori — Nextore' },
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: AdminProducts,
        meta: { requiresAuth: true, roles: ['admin'], title: 'Produk — Nextore' },
      },
      {
        path: 'members',
        name: 'AdminMembers',
        component: AdminMembers,
        meta: { requiresAuth: true, roles: ['admin', 'supervisor'], title: 'Member — Nextore' },
      },
      {
        path: 'accounts',
        name: 'AdminAccounts',
        component: AdminAccounts,
        meta: { requiresAuth: true, roles: ['admin'], title: 'Kelola Akun — Nextore' },
      },
      {
        path: 'transactions',
        name: 'AdminTransactions',
        component: AdminTransactions,
        meta: { requiresAuth: true, roles: ['admin', 'supervisor'], title: 'Riwayat Transaksi — Nextore' },
      },
      {
        path: 'finance',
        name: 'AdminFinance',
        component: AdminFinance,
        meta: { requiresAuth: true, roles: ['admin'], title: 'Laporan Laba — Nextore' },
      },
      {
        path: 'reconciliation',
        name: 'AdminReconciliation',
        component: AdminReconciliation,
        meta: { requiresAuth: true, roles: ['admin', 'supervisor'], title: 'Rekonsiliasi — Nextore' },
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

  // Already authed + going to login → redirect to role page
  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      const roleRedirects = { admin: '/admin/dashboard', supervisor: '/admin/transactions', kasir: '/cashier' }
      return next(roleRedirects[authStore.userRole] || '/login')
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

    // Role check (use matched records for inherited meta)
    const requiredRoles = to.meta.roles
    if (requiredRoles?.length && !requiredRoles.includes(authStore.userRole)) {
      if (import.meta.env.DEV) {
        console.warn(`[Router] Access denied to '${to.path}' — need ${requiredRoles.join('/')} but got '${authStore.userRole}'`)
      }
      const fallback = { admin: '/admin/dashboard', supervisor: '/admin/transactions', kasir: '/cashier' }
      return next(fallback[authStore.userRole] || '/login')
    }
  }

  next()
})

router.afterEach((to, from) => {
  if (import.meta.env.DEV) {
    console.log(`[Router] ${from.path} → ${to.path}`)
  }
})

export default router
