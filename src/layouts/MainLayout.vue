<template>
  <div class="app-shell" :data-theme="theme">

    <!-- ─────────────────────── SIDEBAR ───────────────────────────────── -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-mark">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M7 8h14M7 14h9M7 20h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="21" cy="20" r="3" fill="currentColor"/>
          </svg>
        </div>
        <span class="brand-wordmark">Nextore</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <!-- Dashboard -->
        <div class="nav-group">
          <router-link to="/admin/dashboard" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <span class="nav-label-text">Dashboard</span>
          </router-link>
        </div>

        <!-- Master Data -->
        <div class="nav-group">
          <span class="nav-section-label">Master Data</span>
          <router-link to="/admin/categories" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </span>
            <span class="nav-label-text">Kategori</span>
          </router-link>
          <router-link to="/admin/products" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </span>
            <span class="nav-label-text">Produk</span>
          </router-link>
          <router-link to="/admin/members" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </span>
            <span class="nav-label-text">Member</span>
          </router-link>
          <router-link v-if="authStore.isAdmin" to="/admin/accounts" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <span class="nav-label-text">Kelola Akun</span>
          </router-link>
        </div>

        <!-- Keuangan -->
        <div class="nav-group">
          <span class="nav-section-label">Keuangan</span>
          <router-link to="/admin/transactions" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </span>
            <span class="nav-label-text">Riwayat Transaksi</span>
          </router-link>
          <router-link to="/admin/finance" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </span>
            <span class="nav-label-text">Laporan Laba</span>
          </router-link>
        </div>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <!-- User info -->
        <div class="sidebar-user">
          <div class="user-avatar-sm">{{ (authStore.user?.name || 'A')[0].toUpperCase() }}</div>
          <div class="user-text">
            <span class="user-name-sm">{{ authStore.user?.name || 'Admin' }}</span>
            <span class="user-role-sm">{{ roleLabel }}</span>
          </div>
        </div>
        <!-- Controls -->
        <div class="footer-controls">
          <button class="ctrl-btn" @click="toggleTheme" :title="theme === 'light' ? 'Mode Gelap' : 'Mode Terang'">
            <svg v-if="theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </button>
          <button class="ctrl-btn ctrl-btn-danger" @click="handleLogout" title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- ─────────────────────── MAIN CONTENT ───────────────────────────── -->
    <div class="main-area">

      <!-- ── Topbar ── -->
      <header class="topbar">
        <!-- Hamburger (mobile) -->
        <button class="hamburger" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <!-- Page Title breadcrumb -->
        <div class="topbar-title">
          <h2 class="current-page-title">{{ currentPageTitle }}</h2>
        </div>

        <!-- Right slot: date + user -->
        <div class="topbar-right">
          <div class="today-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{{ todayStr }}</span>
          </div>
          <div class="topbar-avatar" :title="authStore.user?.name">
            {{ (authStore.user?.name || 'A')[0].toUpperCase() }}
          </div>
        </div>
      </header>

      <!-- ── Page Content ── -->
      <main class="content-area">
        <router-view />
      </main>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// ── Theme ──────────────────────────────────────────────────────────────────
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('nextore-theme', theme.value)
}

// ── Sidebar collapse (mobile) ──────────────────────────────────────────────
const sidebarCollapsed = ref(false)

// ── Auth ───────────────────────────────────────────────────────────────────
const roleLabel = computed(() => {
  const map = { admin: 'Admin', supervisor: 'Supervisor', kasir: 'Kasir' }
  return map[authStore.userRole] || authStore.userRole || '—'
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// ── Page Title (derived from route meta or route name) ─────────────────────
const pageTitleMap = {
  AdminDashboard: 'Dashboard',
  AdminCategories: 'Kelola Kategori',
  AdminProducts: 'Manajemen Produk',
  AdminMembers: 'Manajemen Member',
  AdminAccounts: 'Kelola Akun',
  AdminTransactions: 'Riwayat Transaksi',
  AdminFinance: 'Laporan Laba',
  AdminReconciliation: 'Rekonsiliasi',
}

const currentPageTitle = computed(() => {
  if (route.meta?.title) return route.meta.title.split(' -')[0]
  return pageTitleMap[route.name] || 'Nextore Admin'
})

// ── Today date ─────────────────────────────────────────────────────────────
const todayStr = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
)

// ── Close sidebar on route change (mobile) ─────────────────────────────────
watch(() => route.path, () => { sidebarCollapsed.value = false })

// ── Check auth on mount ────────────────────────────────────────────────────
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.checkAuth()
  }
})
</script>

<style scoped>
/* ── Shell ─────────────────────────────────────────────────────────────── */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base, #f1f5f9);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --sidebar-w: 230px;
}

/* ─── CSS Variables by theme ────────────────────────────────────────────── */
.app-shell {
  --sidebar-bg: #0f172a;
  --sidebar-text: #94a3b8;
  --sidebar-text-hover: #f1f5f9;
  --sidebar-active-bg: rgba(99, 102, 241, 0.15);
  --sidebar-active-text: #818cf8;
  --sidebar-active-border: #6366f1;
  --sidebar-label: #475569;
  --sidebar-border: rgba(255,255,255,0.06);
  --sidebar-brand: #f1f5f9;
  --topbar-bg: #ffffff;
  --topbar-border: #e2e8f0;
  --topbar-text: #1e293b;
  --content-bg: #f1f5f9;
  --ctrl-hover: rgba(99,102,241,0.15);
}

.app-shell[data-theme="dark"] {
  --topbar-bg: #1e293b;
  --topbar-border: #334155;
  --topbar-text: #f1f5f9;
  --content-bg: #0f172a;
}

/* ─── Sidebar ───────────────────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease, transform 0.25s ease;
  position: relative;
  z-index: 200;
  overflow: hidden;
  border-right: 1px solid var(--sidebar-border);
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.375rem 1.25rem 1.125rem;
  border-bottom: 1px solid var(--sidebar-border);
}

.brand-mark {
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.brand-wordmark {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--sidebar-brand);
  letter-spacing: -0.02em;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}

.nav-group {
  margin-bottom: 0.25rem;
}

.nav-section-label {
  display: block;
  padding: 0.75rem 1.25rem 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sidebar-label);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1.25rem;
  margin: 0.125rem 0.625rem;
  border-radius: 9px;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.18s ease;
  border-left: 2px solid transparent;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: var(--sidebar-text-hover);
}

.nav-item.is-active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  border-left-color: var(--sidebar-active-border);
  font-weight: 600;
}

.nav-icon {
  width: 1.125rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Footer */
.sidebar-footer {
  padding: 0.875rem 1rem;
  border-top: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
}

.user-avatar-sm {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name-sm {
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role-sm {
  font-size: 0.68rem;
  color: var(--sidebar-label);
  font-weight: 500;
}

.footer-controls {
  display: flex;
  gap: 0.5rem;
}

.ctrl-btn {
  flex: 1;
  height: 2rem;
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
}

.ctrl-btn:hover {
  background: var(--ctrl-hover);
  color: var(--sidebar-text-hover);
}

.ctrl-btn-danger:hover {
  background: rgba(239,68,68,0.15);
  color: #f87171;
  border-color: rgba(239,68,68,0.3);
}

/* ─── Main Area ─────────────────────────────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--content-bg);
  transition: background 0.2s;
}

/* Topbar */
.topbar {
  height: 3.5rem;
  background: var(--topbar-bg);
  border-bottom: 1px solid var(--topbar-border);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.5rem;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;
}

.hamburger {
  display: none;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--topbar-text);
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.topbar-title {
  flex: 1;
}

.current-page-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--topbar-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.today-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--topbar-text);
  opacity: 0.6;
  font-weight: 500;
}

.topbar-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  flex-shrink: 0;
}

/* Content */
.content-area {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* ─── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(0);
    z-index: 300;
    box-shadow: 0 0 40px rgba(0,0,0,0.4);
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
  }

  .hamburger {
    display: flex;
  }

  .today-chip {
    display: none;
  }
}

@media (min-width: 769px) {
  .sidebar.collapsed {
    width: 3.5rem;
  }

  .sidebar.collapsed .brand-wordmark,
  .sidebar.collapsed .nav-label-text,
  .sidebar.collapsed .nav-section-label,
  .sidebar.collapsed .user-text,
  .sidebar.collapsed .footer-controls .ctrl-btn:last-child {
    display: none;
  }

  .sidebar.collapsed .sidebar-brand {
    justify-content: center;
    padding: 1.375rem 0.75rem;
  }

  .sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 0.625rem;
    margin: 0.125rem 0.5rem;
  }

  .sidebar.collapsed .footer-controls {
    flex-direction: column;
  }

  .sidebar.collapsed .sidebar-user {
    justify-content: center;
  }

  .hamburger {
    display: flex;
  }
}
</style>
