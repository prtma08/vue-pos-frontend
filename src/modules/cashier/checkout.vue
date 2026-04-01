<template>
  <div class="pos-layout" :data-theme="theme">

    <!-- ── Top Bar: Refined ─────────────────────────────────────────────── -->
    <header class="pos-topbar">
      <div class="topbar-brand">
        <div class="brand-mark">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path d="M7 8h14M7 14h9M7 20h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="21" cy="20" r="3" fill="currentColor"/>
          </svg>
        </div>
        <span class="brand-wordmark">Nextore</span>
        <span class="topbar-separator"></span>
        <span class="topbar-context">Point of Sale</span>
      </div>

      <div class="topbar-actions">
        <!-- Order Tabs: Enhanced -->
        <div class="order-tabs-wrapper">
          <div class="order-tabs">
            <button
              v-for="order in cartStore.orders"
              :key="order.id"
              class="order-tab"
              :class="{ 'is-active': order.id === cartStore.activeOrderId }"
              @click="cartStore.setActiveOrder(order.id)"
            >
              <span class="tab-label">Pesanan {{ cartStore.orders.indexOf(order) + 1 }}</span>
              <button class="tab-remove" @click.stop="handleClearOrder(order.id)" title="Hapus">×</button>
            </button>
            <button v-if="cartStore.canCreateNewOrder" class="order-tab-add" @click="handleCreateOrder" title="Pesanan baru">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="topbar-right">
          <!-- User Chip -->
          <div class="user-chip">
            <span class="user-avatar">{{ (authStore.user?.name || 'U')[0].toUpperCase() }}</span>
            <span class="user-name">{{ authStore.user?.name || authStore.userRole }}</span>
          </div>

          <!-- Theme Toggle -->
          <button class="icon-btn" @click="toggleTheme" :title="theme === 'light' ? 'Dark Mode' : 'Light Mode'">
            <svg v-if="theme === 'light'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </button>

          <!-- Admin Link -->
          <router-link v-if="authStore.isAdmin" to="/admin" class="btn-link">Admin</router-link>

          <!-- Logout -->
          <button class="btn-logout" @click="handleLogout">Keluar</button>
        </div>
      </div>
    </header>

    <!-- ── Main Body ─────────────────────────────────────────────────────── -->
    <div class="pos-body">

      <!-- ── Left: Product Catalog ──────────────────────────────────────── -->
      <section class="catalog-panel">
        
        <!-- Toolbar: Search + Categories -->
        <div class="catalog-toolbar">
          <div class="search-field">
            <span class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Cari produk atau SKU..."
              class="input-control"
            />
          </div>

          <div class="category-pills">
            <button
              class="pill"
              :class="{ 'is-active': !activeCategory }"
              @click="setCategory(null)"
            >Semua</button>
            <button
              v-for="cat in productsStore.categories"
              :key="cat.id"
              class="pill"
              :class="{ 'is-active': activeCategory === cat.name }"
              @click="setCategory(cat.name)"
            >{{ cat.name }}</button>
          </div>
        </div>

        <!-- Product Grid: Masonry-style -->
        <div class="catalog-grid">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-card"
            :class="{
              'state-low': product.isLowStock && product.stock > 0,
              'state-out': product.stock === 0
            }"
            @click="product.stock > 0 && handleAddProduct(product)"
          >
            <div class="product-visual">
              <span class="product-emoji">{{ productEmoji(product) }}</span>
              <span v-if="product.isLowStock && product.stock > 0" class="stock-flag flag-warning">Menipis</span>
              <span v-if="product.stock === 0" class="stock-flag flag-out">Habis</span>
            </div>
            <div class="product-details">
              <h3 class="product-title">{{ product.name }}</h3>
              <p class="product-price">Rp {{ formatCurrency(product.sellingPrice) }}</p>
              <div class="product-meta">
                <span class="meta-stock">Stok: <strong>{{ product.stock }}</strong></span>
              </div>
            </div>
            <div class="product-overlay">
              <span class="overlay-text">+ Tambah</span>
            </div>
          </div>

          <div v-if="filteredProducts.length === 0" class="catalog-empty">
            <div class="empty-visual">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p>Tidak ada produk yang cocok</p>
            <span class="empty-hint">Coba kata kunci lain atau pilih kategori berbeda</span>
          </div>
        </div>
      </section>

      <!-- ── Right: Cart & Checkout ─────────────────────────────────────── -->
      <aside class="checkout-panel">

        <!-- Cart Header -->
        <div class="checkout-header">
          <div>
            <h2 class="checkout-title">Keranjang</h2>
            <span v-if="activeOrder" class="checkout-count">{{ activeOrder.items.length }} item</span>
          </div>
          <button v-if="activeOrder?.items.length" class="btn-clear" @click="handleClearOrder(activeOrder.id)" title="Kosongkan keranjang">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>

        <div v-if="activeOrder && activeOrder.items.length > 0" class="checkout-content">

          <!-- Cart Items List -->
          <div class="cart-list">
            <div
              v-for="(item, index) in activeOrder.items"
              :key="index"
              class="cart-row"
            >
              <div class="row-info">
                <p class="row-name">{{ item.name }}</p>
                <p class="row-price">Rp {{ formatCurrency(item.price) }}</p>
              </div>
              <div class="row-controls">
                <button class="qty-dec" @click="adjustQty(index, -1)">−</button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button class="qty-inc" @click="adjustQty(index, 1)">+</button>
                <span class="row-total">Rp {{ formatCurrency(item.subtotal) }}</span>
                <button class="row-remove" @click="handleRemoveItem(index)" title="Hapus">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Payment Method Selector -->
          <div class="payment-selector">
            <span class="section-label">Pembayaran</span>
            <div class="payment-options">
              <button
                v-for="m in ['CASH', 'TRANSFER', 'QRIS']"
                :key="m"
                class="payment-option"
                :class="{ 'is-selected': activeOrder.paymentMethod === m }"
                @click="cartStore.setPaymentMethod(activeOrder.id, m)"
              >
                <span class="payment-icon">{{ paymentIcon(m) }}</span>
                <span class="payment-name">{{ m }}</span>
              </button>
            </div>
          </div>

          <!-- Member Selector -->
          <div class="member-selector">
            <span class="section-label">Member</span>
            <select class="select-control" @change="handleMemberSelect" :value="activeOrder.member?.id || ''">
              <option value="">-- Tanpa Member --</option>
              <option v-for="m in membersStore.members" :key="m.id" :value="m.id">
                {{ m.name }} • {{ m.phone }}
              </option>
            </select>
          </div>

          <!-- Order Summary -->
          <div class="order-summary">
            <div class="summary-line">
              <span>Subtotal</span>
              <span>Rp {{ formatCurrency(activeOrder.summary.subtotal) }}</span>
            </div>
            <div v-if="activeOrder.summary.discountPercent > 0" class="summary-line summary-discount">
              <span>Diskon ({{ activeOrder.summary.discountPercent }}%)</span>
              <span>− Rp {{ formatCurrency(activeOrder.summary.subtotal * activeOrder.summary.discountPercent / 100) }}</span>
            </div>
            <div v-if="activeOrder.summary.taxPercent > 0" class="summary-line">
              <span>Pajak ({{ activeOrder.summary.taxPercent }}%)</span>
              <span>Rp {{ formatCurrency(activeOrder.summary.tax) }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-total">
              <span>Total</span>
              <span class="total-value">Rp {{ formatCurrency(activeOrder.summary.total) }}</span>
            </div>
            
            <!-- Profit Estimate (Role-based) -->
            <div v-if="authStore.isAdmin || authStore.isSupervisor" class="summary-profit">
              <span>Est. Profit</span>
              <span class="profit-value">+ Rp {{ formatCurrency(cartStore.orderProfit(activeOrder.id)) }}</span>
            </div>
          </div>

          <!-- Checkout Button -->
          <button
            class="btn-checkout"
            @click="handleSubmitOrder"
            :disabled="submitting || !activeOrder.items.length"
          >
            <span v-if="submitting" class="btn-loader"></span>
            <span v-else class="btn-icon">
              <span v-if="activeOrder.paymentMethod === 'CASH'">💵</span>
              <span v-else-if="activeOrder.paymentMethod === 'TRANSFER'">🏦</span>
              <span v-else>📱</span>
            </span>
            <span class="btn-label">{{ submitting ? 'Memproses...' : `Bayar via ${activeOrder.paymentMethod}` }}</span>
            <span class="btn-total">{{ formatCurrency(activeOrder.summary.total) }}</span>
          </button>
        </div>

        <!-- Empty Cart State -->
        <div v-else class="checkout-empty">
          <div class="empty-cart-visual">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h3>Keranjang Masih Kosong</h3>
          <p>Pilih produk dari katalog untuk memulai transaksi</p>
        </div>

        <!-- Success Toast -->
        <transition name="toast-fade">
          <div v-if="successMsg" class="toast-success">
            <span class="toast-icon">✓</span>
            <span>{{ successMsg }}</span>
          </div>
        </transition>

      </aside>
    </div>
  </div>
</template>

<script setup>
// ── Script section remains UNCHANGED per user request ──
// All logic, bindings, and function calls preserved exactly as original
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useCartStore }    from '@/stores/cart'
import { useMembersStore } from '@/stores/members'
import { useRouter }       from 'vue-router'

const authStore     = useAuthStore()
const productsStore = useProductsStore()
const cartStore     = useCartStore()
const membersStore  = useMembersStore()
const router        = useRouter()

const searchTerm    = ref('')
const activeCategory = ref(null)
const submitting    = ref(false)
const successMsg    = ref('')

const theme = ref(localStorage.getItem('nextore-theme') || 'light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('nextore-theme', theme.value)
}

const activeOrder     = computed(() => cartStore.activeOrder)
const filteredProducts = computed(() => productsStore.filteredProducts)

watch(searchTerm, (val) => productsStore.setSearchFilter(val))

const setCategory = (name) => {
  activeCategory.value = name
  productsStore.setCategoryFilter(name)
}

const formatCurrency = (v) => Math.round(v || 0).toLocaleString('id-ID')

const productEmoji = (p) => {
  const cat = p.category?.name?.toLowerCase() || ''
  if (cat.includes('minum')) return '🥤'
  if (cat.includes('makan')) return '🍽️'
  if (cat.includes('snack')) return '🍟'
  return '📦'
}

const paymentIcon = (m) => ({ CASH: '💵', TRANSFER: '🏦', QRIS: '📱' }[m] || '💳')

const handleAddProduct = (product) => {
  let orderId = cartStore.activeOrderId
  if (!activeOrder.value) {
    const res = cartStore.createOrder()
    if (!res.success) { alert(res.message); return }
    orderId = res.orderId
  }
  cartStore.addItem(orderId, product)
}

const adjustQty = (index, delta) => {
  const item = activeOrder.value?.items[index]
  if (!item) return
  const newQty = item.quantity + delta
  if (newQty <= 0) cartStore.removeItem(cartStore.activeOrderId, index)
  else cartStore.updateQuantity(cartStore.activeOrderId, index, newQty)
}

const handleRemoveItem = (index) => cartStore.removeItem(cartStore.activeOrderId, index)

const handleCreateOrder = () => {
  const res = cartStore.createOrder()
  if (!res.success) alert(res.message)
}

const handleClearOrder = (orderId) => {
  if (confirm('Hapus pesanan ini?')) cartStore.clearOrder(orderId)
}

const handleMemberSelect = (e) => {
  const id = e.target.value
  const member = id ? membersStore.getMemberById(id) : null
  cartStore.setMember(cartStore.activeOrderId, member)
}

const handleSubmitOrder = async () => {
  if (!activeOrder.value?.items.length) return
  submitting.value = true
  try {
    const result = await cartStore.submitOrder(cartStore.activeOrderId)
    if (result.success) {
      successMsg.value = `Transaksi berhasil! ID: ${result.transactionId}`
      setTimeout(() => { successMsg.value = '' }, 4000)
      cartStore.clearOrder(cartStore.activeOrderId)
      if (!cartStore.orders.length) cartStore.createOrder()
    } else {
      alert(`Gagal: ${result.message}`)
    }
  } finally {
    submitting.value = false
  }
}

const handleLogout = async () => {
  if (confirm('Keluar dari sesi ini?')) {
    await authStore.logout()
    router.push('/login')
  }
}

onMounted(async () => {
  await Promise.all([
    productsStore.fetchProducts(),
    productsStore.fetchCategories(),
    membersStore.fetchMembers(),
  ])
  if (!activeOrder.value) cartStore.createOrder()
})
</script>

<style scoped>
/* ── CSS Variables: Professional POS Design System ── */
.pos-layout {
  --pos-gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --pos-gradient-success: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
  --pos-shadow-card: 0 2px 12px rgba(0, 0, 0, 0.08);
  --pos-shadow-elevated: 0 8px 30px rgba(0, 0, 0, 0.12);
  --pos-radius-sm: 8px;
  --pos-radius-md: 12px;
  --pos-radius-lg: 16px;
  --pos-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --pos-focus-ring: 0 0 0 3px rgba(99, 102, 241, 0.2);
  --pos-border-subtle: rgba(0, 0, 0, 0.08);
}

.pos-layout[data-theme="dark"] {
  --pos-gradient-primary: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
  --pos-shadow-card: 0 2px 12px rgba(0, 0, 0, 0.3);
  --pos-border-subtle: rgba(255, 255, 255, 0.1);
}

/* ── Layout ── */
.pos-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-base);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

/* ── Top Bar ── */
.pos-topbar {
  height: 64px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  gap: 1rem;
  z-index: 50;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.brand-mark {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-wordmark {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.topbar-separator {
  width: 1px;
  height: 1.25rem;
  background: var(--border-subtle);
}

.topbar-context {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  justify-content: flex-end;
}

/* Order Tabs */
.order-tabs-wrapper {
  display: flex;
  align-items: center;
  max-width: 45%;
  overflow-x: auto;
  padding-right: 1rem;
}

.order-tabs-wrapper::-webkit-scrollbar {
  height: 3px;
}

.order-tabs {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.order-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--pos-transition);
  white-space: nowrap;
}

.order-tab:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.order-tab.is-active {
  background: var(--pos-gradient-primary);
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.tab-label {
  font-weight: 600;
}

.tab-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: var(--pos-transition);
}

.tab-remove:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

.order-tab.is-active .tab-remove:hover {
  background: rgba(0, 0, 0, 0.15);
}

.order-tab-add {
  width: 2rem;
  height: 2rem;
  border-radius: 10px;
  border: 1.5px dashed var(--border-subtle);
  background: transparent;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--pos-transition);
  flex-shrink: 0;
}

.order-tab-add:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

/* Topbar Right */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-subtle);
}

.user-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--pos-gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.icon-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--pos-transition);
}

.icon-btn:hover {
  background: var(--bg-base);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.btn-link {
  padding: 0.4rem 0.875rem;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: var(--pos-transition);
}

.btn-link:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-logout {
  padding: 0.4rem 1rem;
  border-radius: 10px;
  border: none;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--pos-transition);
}

.btn-logout:hover {
  background: var(--danger);
  color: white;
}

/* ── Body Layout ── */
.pos-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Catalog Panel ── */
.catalog-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1.25rem;
  gap: 1rem;
  border-right: 1px solid var(--border-subtle);
}

.catalog-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
}

.search-field {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.input-control {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--pos-radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: var(--pos-transition);
  outline: none;
}

.input-control::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.input-control:hover {
  border-color: var(--border-strong);
}

.input-control:focus {
  border-color: var(--accent);
  box-shadow: var(--pos-focus-ring);
}

.category-pills {
  display: flex;
  gap: 0.375rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.category-pills::-webkit-scrollbar {
  height: 3px;
}

.pill {
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1.5px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: var(--pos-transition);
  flex-shrink: 0;
}

.pill:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.pill.is-active {
  background: var(--pos-gradient-primary);
  border-color: transparent;
  color: white;
}

/* Product Grid */
.catalog-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.875rem;
  overflow-y: auto;
  padding-right: 0.25rem;
  align-content: start;
}

.product-card {
  position: relative;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--pos-radius-lg);
  padding: 0.875rem;
  cursor: pointer;
  transition: var(--pos-transition);
  overflow: hidden;
}

.product-card:hover {
  border-color: var(--accent);
  box-shadow: var(--pos-shadow-card);
  transform: translateY(-2px);
}

.product-card:active {
  transform: translateY(0);
}

.product-card.state-low {
  border-color: var(--warning);
}

.product-card.state-out {
  opacity: 0.6;
  cursor: not-allowed;
}

.product-card.state-out:hover {
  transform: none;
  box-shadow: none;
}

.product-visual {
  position: relative;
  height: 85px;
  border-radius: var(--pos-radius-md);
  background: var(--bg-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.product-card:hover .product-visual {
  background: var(--accent-soft);
}

.product-emoji {
  font-size: 2.5rem;
  transition: transform 0.2s ease;
}

.product-card:hover .product-emoji {
  transform: scale(1.05);
}

.stock-flag {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.flag-warning {
  background: var(--warning);
  color: #1f2937;
}

.flag-out {
  background: var(--danger);
  color: white;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.meta-stock {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.meta-stock strong {
  color: var(--text-secondary);
  font-weight: 600;
}

.product-overlay {
  position: absolute;
  inset: 0;
  background: var(--pos-gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--pos-transition);
  pointer-events: none;
}

.product-card:hover .product-overlay {
  opacity: 0.9;
}

.overlay-text {
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.4rem 1rem;
  border-radius: 999px;
}

/* Empty State */
.catalog-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-visual {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--bg-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.empty-hint {
  font-size: 0.8rem;
}

/* ── Checkout Panel ── */
.checkout-panel {
  width: 380px;
  flex-shrink: 0;
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1.25rem;
  gap: 0;
  border-left: 1px solid var(--border-subtle);
}

.checkout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-shrink: 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.checkout-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.checkout-count {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
}

.btn-clear {
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface-2);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--pos-transition);
}

.btn-clear:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: var(--danger-soft);
}

.checkout-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
  overflow: hidden;
}

/* Cart List */
.cart-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
}

.cart-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: var(--pos-radius-md);
  gap: 0.75rem;
  transition: var(--pos-transition);
}

.cart-row:hover {
  border-color: var(--border-strong);
}

.row-info {
  flex: 1;
  min-width: 0;
}

.row-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-price {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0;
}

.row-controls {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.qty-dec, .qty-inc {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  transition: var(--pos-transition);
}

.qty-dec:hover, .qty-inc:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.qty-num {
  width: 1.75rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.row-total {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 4.5rem;
  text-align: right;
}

.row-remove {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: var(--pos-transition);
}

.row-remove:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

/* Payment Selector */
.payment-selector {
  flex-shrink: 0;
}

.section-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.payment-options {
  display: flex;
  gap: 0.5rem;
}

.payment-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.5rem;
  border-radius: var(--pos-radius-md);
  border: 1.5px solid var(--border-subtle);
  background: var(--bg-base);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--pos-transition);
}

.payment-option:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.payment-option.is-selected {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

.payment-icon {
  font-size: 1.25rem;
}

.payment-name {
  font-size: 0.7rem;
  font-weight: 600;
}

/* Member Selector */
.member-selector {
  flex-shrink: 0;
}

.select-control {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--pos-radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.85rem;
  transition: var(--pos-transition);
  outline: none;
}

.select-control:hover {
  border-color: var(--border-strong);
}

.select-control:focus {
  border-color: var(--accent);
  box-shadow: var(--pos-focus-ring);
}

/* Order Summary */
.order-summary {
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: var(--pos-radius-lg);
  padding: 1rem;
  flex-shrink: 0;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.summary-discount {
  color: var(--success);
}

.summary-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0.75rem 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-total span:first-child {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.total-value {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-profit {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.625rem;
  margin-top: 0.625rem;
  border-top: 1px dashed var(--border-subtle);
  font-size: 0.8rem;
}

.summary-profit span:first-child {
  color: var(--text-tertiary);
}

.profit-value {
  font-weight: 700;
  color: var(--success);
}

/* Checkout Button */
.btn-checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.875rem 1.25rem;
  background: var(--pos-gradient-success);
  color: white;
  border: none;
  border-radius: var(--pos-radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--pos-transition);
  position: relative;
  overflow: hidden;
  margin-top: 0.5rem;
}

.btn-checkout::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.btn-checkout:hover:not(:disabled)::before {
  transform: translateX(100%);
}

.btn-checkout:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.35);
}

.btn-checkout:active:not(:disabled) {
  transform: translateY(0);
}

.btn-checkout:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-loader {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-label {
  flex: 1;
  text-align: left;
}

.btn-total {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 700;
  font-size: 1rem;
  opacity: 0.9;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty Cart */
.checkout-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.875rem;
  text-align: center;
  padding: 2rem;
  color: var(--text-tertiary);
}

.empty-cart-visual {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: var(--bg-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  margin-bottom: 0.5rem;
}

.checkout-empty h3 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.checkout-empty p {
  font-size: 0.85rem;
  margin: 0;
}

/* Toast */
.toast-success {
  position: absolute;
  bottom: 1.25rem;
  left: 1.25rem;
  right: 1.25rem;
  padding: 0.875rem 1.125rem;
  background: var(--success-soft);
  border: 1px solid var(--success);
  border-left: 4px solid var(--success);
  border-radius: var(--pos-radius-md);
  color: var(--success);
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  box-shadow: var(--pos-shadow-elevated);
  z-index: 100;
}

.toast-icon {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--success);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .checkout-panel {
    width: 340px;
  }
  
  .catalog-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 900px) {
  .pos-body {
    flex-direction: column;
  }
  
  .catalog-panel {
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    max-height: 55vh;
  }
  
  .checkout-panel {
    width: 100%;
    max-height: 45vh;
    border-left: none;
  }
  
  .order-tabs-wrapper {
    max-width: 60%;
  }
}

@media (max-width: 600px) {
  .pos-topbar {
    padding: 0 1rem;
    height: 56px;
  }
  
  .brand-wordmark {
    font-size: 1.1rem;
  }
  
  .topbar-context,
  .user-name,
  .btn-link {
    display: none;
  }
  
  .order-tabs-wrapper {
    max-width: 70%;
  }
  
  .catalog-panel,
  .checkout-panel {
    padding: 0.875rem;
  }
  
  .catalog-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
  
  .product-visual {
    height: 70px;
  }
  
  .product-emoji {
    font-size: 2rem;
  }
  
  .btn-checkout {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }
  
  .total-value {
    font-size: 1.25rem;
  }
}

/* ── Scrollbar Styling ── */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}

/* ── Animations ── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.product-card,
.cart-row {
  animation: fadeIn 0.3s ease forwards;
}

.product-card:nth-child(1) { animation-delay: 0.02s; }
.product-card:nth-child(2) { animation-delay: 0.04s; }
.product-card:nth-child(3) { animation-delay: 0.06s; }
.product-card:nth-child(4) { animation-delay: 0.08s; }
.product-card:nth-child(5) { animation-delay: 0.1s; }
</style>