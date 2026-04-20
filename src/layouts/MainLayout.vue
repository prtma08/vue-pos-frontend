<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': !sidebarOpen }" :data-theme="theme">

    <!-- ── Overlay ── -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <!-- ─────────────────────── SIDEBAR ───────────────────────────────── -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <!-- Brand -->
      <div class="sidebar-brand">
        <img src="/LOGO.png" alt="Logo" class="brand-logo" />
        <button class="sidebar-close-btn" @click="sidebarOpen = false" title="Tutup Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <!-- Dashboard -->
        <div class="nav-group" v-if="!authStore.isSuperuser">
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
        <div class="nav-group" v-if="!authStore.isSuperuser">
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
          <router-link to="/admin/prices" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
            <span class="nav-label-text">Harga</span>
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
        </div>

        <!-- Keuangan -->
        <div class="nav-group" v-if="!authStore.isSuperuser">
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

        <!-- Operasional -->
        <div class="nav-group" v-if="!authStore.isSuperuser">
          <span class="nav-section-label">Operasional</span>
          <router-link to="/admin/discounts" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </span>
            <span class="nav-label-text">Diskon</span>
          </router-link>
          <router-link to="/admin/pos-devices" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </span>
            <span class="nav-label-text">POS Terminal</span>
          </router-link>
          <router-link to="/admin/purchase" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </span>
            <span class="nav-label-text">Purchase Barang</span>
          </router-link>
          <router-link to="/admin/bundles" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </span>
            <span class="nav-label-text">Paket Bundle</span>
          </router-link>
          <router-link to="/admin/sales-report" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
              </svg>
            </span>
            <span class="nav-label-text">Laporan Penjualan</span>
          </router-link>
          <router-link to="/admin/expired" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <span class="nav-label-text">Laporan Expired</span>
          </router-link>
          <!-- D2: Settings -->
          <router-link to="/admin/settings" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
            <span class="nav-label-text">Pengaturan</span>
          </router-link>
        </div>

        <!-- Manajemen Sistem (Superuser) -->
        <div class="nav-group" v-if="authStore.isSuperuser">
          <span class="nav-section-label">Manajemen Sistem</span>
          <router-link to="/admin/accounts" class="nav-item" active-class="is-active">
            <span class="nav-icon">
              <!-- Users Icon -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </span>
            <span class="nav-label-text">Kelola Akun</span>
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
          <button v-if="authStore.roles?.length > 1" class="ctrl-btn ctrl-btn-switch" @click="handleSwitchRole" title="Ganti Role">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
          </button>
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
        <!-- Sidebar toggle -->
        <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen" :title="sidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'">
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

          <!-- Notification Bell -->
          <div class="notif-trigger-wrap" ref="notifWrapRef">
            <button class="notif-bell-btn" @click="notifOpen = !notifOpen" title="Notifikasi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>

            <!-- Notification Dropdown Panel -->
            <transition name="notif-drop">
              <div v-if="notifOpen" class="notif-panel">
                <div class="notif-panel-header">
                  <h3 class="notif-panel-title">Notifikasi</h3>
                  <button v-if="unreadCount > 0" class="notif-mark-all" @click="markAllRead">Tandai semua dibaca</button>
                </div>
                <div class="notif-list">
                  <div v-if="notifications.length === 0" class="notif-empty">Tidak ada notifikasi</div>
                  <div
                    v-for="n in notifications" :key="n.id"
                    class="notif-item" :class="{ unread: !n.read }"
                    @click="markRead(n)"
                  >
                    <div class="notif-item-icon" :class="n.type">
                      <!-- Order icon -->
                      <svg v-if="n.type === 'order'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      <!-- Alert icon -->
                      <svg v-else-if="n.type === 'alert'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <!-- Info icon -->
                      <svg v-else-if="n.type === 'info'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <!-- System/default icon -->
                      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    </div>
                    <div class="notif-item-body">
                      <span class="notif-item-title">{{ n.title }}</span>
                      <span class="notif-item-msg">{{ n.message }}</span>
                    </div>
                    <span class="notif-item-time">{{ n.time }}</span>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <button v-if="authStore.roles?.length > 1" class="topbar-switch-btn" @click="handleSwitchRole" title="Ganti Role">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
            Switch Role
          </button>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  window.dispatchEvent(new CustomEvent('nextore-theme-change', { detail: theme.value }))
}

// ── Sidebar open/close ─────────────────────────────────────────────────────
const isDesktop = ref(window.innerWidth >= 769)
const sidebarOpen = ref(isDesktop.value)

// Track resize to auto-open/close sidebar
const onResize = () => {
  const wasDesktop = isDesktop.value
  isDesktop.value = window.innerWidth >= 769
  if (isDesktop.value && !wasDesktop) sidebarOpen.value = true
  if (!isDesktop.value && wasDesktop) sidebarOpen.value = false
}
window.addEventListener('resize', onResize)

// ── Auth ───────────────────────────────────────────────────────────────────
const roleLabel = computed(() => {
  const map = { superuser: 'Superuser', admin: 'Admin', supervisor: 'Supervisor', kasir: 'Kasir' }
  return map[authStore.userRole] || authStore.userRole || '—'
})

const handleSwitchRole = () => {
  authStore.switchRole(null) // clear active role → goes to role selector
  router.push('/role-select')
}

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
  AdminDiscounts: 'Manajemen Diskon',
  AdminPosDevices: 'POS Terminal',
  AdminPurchase: 'Purchase Barang',
  AdminBundles: 'Manajemen Paket',
  AdminSalesReport: 'Laporan Penjualan',
  AdminExpired: 'Laporan Expired',
}

const currentPageTitle = computed(() => {
  if (route.meta?.title) return route.meta.title.split(' -')[0]
  return pageTitleMap[route.name] || 'Nextore Admin'
})

// ── Today date ─────────────────────────────────────────────────────────────
const todayStr = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
)

// ── Close sidebar on route change (mobile only) ────────────────────────────
watch(() => route.path, () => { if (!isDesktop.value) sidebarOpen.value = false })

// ── Notification System ────────────────────────────────────────────────────
const notifOpen = ref(false)
const notifWrapRef = ref(null)

const notifications = ref([
  { id: 1, type: 'order',  title: 'Pesanan Baru #1042',        message: 'Pesanan senilai Rp 85.000 masuk dari POS Kasir 1.',   time: '2 menit lalu', read: false },
  { id: 2, type: 'alert',  title: 'Stok Hampir Habis',          message: 'Produk "Es Teh Manis" tersisa 5 unit.',              time: '15 menit lalu', read: false },
  { id: 3, type: 'info',   title: 'Member Baru Terdaftar',      message: 'Siti Rahayu telah bergabung sebagai member.',         time: '1 jam lalu', read: false },
  { id: 4, type: 'system', title: 'Pembaruan Sistem',           message: 'Versi 2.4.0 telah berhasil diterapkan.',             time: '3 jam lalu', read: true },
  { id: 5, type: 'order',  title: 'Pesanan Baru #1041',        message: 'Pesanan senilai Rp 120.000 masuk dari POS Drive Thru.', time: '5 jam lalu', read: true },
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const markRead = (n) => { n.read = true }
const markAllRead = () => { notifications.value.forEach(n => { n.read = true }) }

// Close dropdown when clicking outside
const onClickOutsideNotif = (e) => {
  if (notifWrapRef.value && !notifWrapRef.value.contains(e.target)) {
    notifOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onClickOutsideNotif))
onUnmounted(() => document.removeEventListener('click', onClickOutsideNotif))

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
  /* Light mode sidebar */
  --sidebar-bg: #ffffff;
  --sidebar-text: #475569;
  --sidebar-text-hover: #0f172a;
  --sidebar-active-bg: rgba(99, 102, 241, 0.1);
  --sidebar-active-text: #6366f1;
  --sidebar-active-border: #6366f1;
  --sidebar-label: #94a3b8;
  --sidebar-border: #e2e8f0;
  --sidebar-brand: #1e293b;
  --sidebar-user-name: #1e293b;
  --sidebar-nav-hover-bg: rgba(0,0,0,0.04);
  --topbar-bg: #ffffff;
  --topbar-border: #e2e8f0;
  --topbar-text: #1e293b;
  --content-bg: #f1f5f9;
  --ctrl-hover: rgba(99,102,241,0.1);
}

.app-shell[data-theme="dark"] {
  /* Dark mode sidebar */
  --sidebar-bg: #0f172a;
  --sidebar-text: #94a3b8;
  --sidebar-text-hover: #f1f5f9;
  --sidebar-active-bg: rgba(99, 102, 241, 0.15);
  --sidebar-active-text: #818cf8;
  --sidebar-label: #475569;
  --sidebar-border: rgba(255,255,255,0.06);
  --sidebar-brand: #f1f5f9;
  --sidebar-user-name: #e2e8f0;
  --sidebar-nav-hover-bg: rgba(255,255,255,0.06);
  --ctrl-hover: rgba(99,102,241,0.15);
  /* Dark mode topbar/content */
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
  position: relative;
  z-index: 200;
  overflow: hidden;
  border-right: 1px solid var(--sidebar-border);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  box-shadow: none;
}

.brand-logo {
  max-width: 100%;
  max-height: 50px;
  object-fit: contain;
}

/* Close sidebar button */
.sidebar-close-btn {
  display: flex;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.sidebar-close-btn:hover {
  background: var(--sidebar-nav-hover-bg);
  color: var(--sidebar-text-hover);
}

/* Nav */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
  transition: background-color 0.2s ease;
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
  transition: color 0.2s ease;
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
  background: var(--sidebar-nav-hover-bg);
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
  color: var(--sidebar-user-name);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
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

.ctrl-btn-switch:hover {
  background: rgba(99,102,241,0.2);
  color: #a5b4fc;
  border-color: rgba(99,102,241,0.3);
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

.sidebar-toggle {
  display: flex;
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
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background: var(--ctrl-hover, rgba(99,102,241,0.1));
  color: var(--sidebar-active-text, #6366f1);
}

.topbar-title {
  flex: 1;
}

.current-page-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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

.topbar-switch-btn {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.375rem 0.75rem; border-radius: 8px;
  border: 1.5px solid rgba(99,102,241,0.2);
  background: rgba(99,102,241,0.08); color: #6366f1;
  font-size: 0.72rem; font-weight: 600; cursor: pointer;
  transition: all 0.25s;
}
.topbar-switch-btn:hover { background: rgba(99,102,241,0.18); border-color: rgba(99,102,241,0.35); transform: translateY(-1px); }

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

/* ── Notification Bell & Panel ──────────────────────────────────────────── */
.notif-trigger-wrap {
  position: relative;
}

.notif-bell-btn {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  border: 1.5px solid var(--topbar-border, #e2e8f0);
  background: var(--ctrl-bg, #fff);
  color: var(--topbar-text, #475569);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
}
.notif-bell-btn:hover {
  background: var(--ctrl-hover, rgba(99,102,241,0.1));
  color: #6366f1;
  border-color: rgba(99,102,241,0.3);
}
.app-shell[data-theme="dark"] .notif-bell-btn {
  background: rgba(99,102,241,0.08);
  border-color: rgba(99,102,241,0.25);
  color: #94a3b8;
}
.app-shell[data-theme="dark"] .notif-bell-btn:hover {
  background: rgba(99,102,241,0.18);
  border-color: rgba(99,102,241,0.35);
  color: #818cf8;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(239,68,68,0.45);
  animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes badge-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

/* Panel */
.notif-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 370px;
  max-height: 420px;
  background: var(--ctrl-bg, #fff);
  border: 1px solid var(--topbar-border, #e2e8f0);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  z-index: 999;
  overflow: hidden;
}
.app-shell[data-theme="dark"] .notif-panel {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 20px 60px rgba(0,0,0,0.45);
}

.notif-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--topbar-border, #e2e8f0);
  flex-shrink: 0;
}
.app-shell[data-theme="dark"] .notif-panel-header { border-bottom-color: #334155; }

.notif-panel-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--topbar-text, #1e293b);
  margin: 0;
}

.notif-mark-all {
  border: none;
  background: none;
  color: #6366f1;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}
.notif-mark-all:hover { background: rgba(99,102,241,0.1); }

/* List */
.notif-list {
  overflow-y: auto;
  flex: 1;
  max-height: 340px;
  scrollbar-width: thin;
  scrollbar-color: rgba(99,102,241,0.25) transparent;
}

.notif-empty {
  text-align: center;
  color: #94a3b8;
  padding: 2.5rem 1rem;
  font-size: 0.85rem;
}

/* Item */
.notif-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid rgba(226,232,240,0.5);
  align-items: flex-start;
}
.app-shell[data-theme="dark"] .notif-item { border-bottom-color: rgba(51,65,85,0.5); }

.notif-item:last-child { border-bottom: none; }

.notif-item:hover {
  background: rgba(99,102,241,0.04);
}
.app-shell[data-theme="dark"] .notif-item:hover { background: rgba(99,102,241,0.08); }

.notif-item.unread {
  background: rgba(99,102,241,0.06);
}
.app-shell[data-theme="dark"] .notif-item.unread {
  background: rgba(99,102,241,0.1);
}
.notif-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #6366f1;
  border-radius: 0 3px 3px 0;
}
.notif-item {
  position: relative;
}

/* Icon by type */
.notif-item-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.notif-item-icon.order { background: rgba(99,102,241,0.1); color: #6366f1; }
.notif-item-icon.alert { background: rgba(245,158,11,0.12); color: #f59e0b; }
.notif-item-icon.info  { background: rgba(16,185,129,0.1); color: #10b981; }
.notif-item-icon.system { background: rgba(100,116,139,0.1); color: #64748b; }

.notif-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.notif-item-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--topbar-text, #1e293b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-item.unread .notif-item-title { font-weight: 700; }

.notif-item-msg {
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.app-shell[data-theme="dark"] .notif-item-msg { color: #94a3b8; }

.notif-item-time {
  font-size: 0.65rem;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 3px;
}

/* Transition */
.notif-drop-enter-active { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.notif-drop-leave-active { transition: all 0.15s ease-in; }
.notif-drop-enter-from { opacity: 0; transform: translateY(-8px) scale(0.96); }
.notif-drop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }

/* Content */
.content-area {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* ─── Overlay ───────────────────────────────────────────────────────────── */
.sidebar-overlay {
  display: block;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 350;
  animation: fadeIn 0.3s ease;
  pointer-events: auto;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ─── Desktop (>= 769px) ── Sidebar collapse support ──────────────────── */
@media (min-width: 769px) {
  .sidebar {
    position: relative;
    transform: none;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                visibility 0.3s;
  }

  .app-shell.sidebar-collapsed .sidebar {
    margin-left: calc(-1 * var(--sidebar-w));
    visibility: hidden;
  }

  .sidebar-overlay {
    display: none !important;
  }
}

/* ─── Mobile (< 769px) ─── Sidebar off-canvas ──────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--sidebar-w);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 400;
    box-shadow: none;
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 350;
    animation: fadeIn 0.3s ease;
  }

  .today-chip {
    display: none;
  }

  .topbar-switch-btn {
    display: none;
  }

  .notif-panel {
    position: fixed;
    top: 3.5rem;
    right: 0.75rem;
    left: 0.75rem;
    width: auto;
    max-height: 70vh;
  }
}
</style>
