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
              <span class="tab-label">{{ order.customerName ? order.customerName : `Pesanan ${cartStore.orders.indexOf(order) + 1}` }}</span>
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
          <router-link v-if="authStore.isAdmin || authStore.isSuperuser" to="/admin" class="btn-link">Admin</router-link>

          <!-- Switch Role (multi-role users) -->
          <button v-if="authStore.roles && authStore.roles.length > 1" class="btn-switch-role" @click="handleSwitchRole" title="Ganti Role">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
            Switch Role
          </button>

          <!-- Closing Shift -->
          <button class="btn-close-shift" @click="handleClosingShift" title="Tutup Shift">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Tutup Shift
          </button>
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
                <button class="row-edit-price" @click="promptPriceChange(index)" title="Ubah Harga">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="row-remove" @click="handleRemoveItem(index)" title="Hapus">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Cash-Only Payment -->
          <div class="payment-section">
            <span class="section-label">💵 Pembayaran Tunai</span>
            <div class="cash-input-row">
              <span class="cash-prefix">Rp</span>
              <input
                v-model="cashInputFormatted"
                type="text"
                inputmode="numeric"
                placeholder="Masukkan uang diterima"
                class="cash-input"
                @input="formatCashInput"
              />
            </div>
            <div class="quick-cash">
              <button type="button" v-for="amt in quickCashAmounts" :key="amt" class="quick-cash-btn" @click="setQuickCash(amt)">{{ formatCurrency(amt) }}</button>
              <button type="button" class="quick-cash-btn exact" @click="setQuickCash(activeOrder.summary.total)">Uang Pas</button>
            </div>
            <div v-if="changeAmount > 0" class="change-display">
              <span>Kembalian</span>
              <span class="change-value">Rp {{ formatCurrency(changeAmount) }}</span>
            </div>
            <div v-if="cashInputRaw > 0 && cashInputRaw < activeOrder.summary.total" class="cash-warning">
              ⚠️ Uang kurang Rp {{ formatCurrency(activeOrder.summary.total - cashInputRaw) }}
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
            <button class="btn-add-inline" @click="showNewMemberForm = !showNewMemberForm">
              {{ showNewMemberForm ? '✕ Batal' : '+ Member Baru' }}
            </button>
            <div v-if="showNewMemberForm" class="inline-member-form">
              <input v-model="newMemberForm.name" class="input-inline" placeholder="Nama member" />
              <input v-model="newMemberForm.phone" class="input-inline" placeholder="No. HP" />
              <button class="btn-save-inline" @click="handleAddMember" :disabled="!newMemberForm.name.trim()">Simpan</button>
            </div>
          </div>

          <!-- Customer Name (for pending orders) -->
          <div class="customer-name-input">
            <span class="section-label">Nama Customer</span>
            <input
              :value="activeOrder.customerName || ''"
              @input="activeOrder.customerName = $event.target.value"
              class="input-inline full"
              placeholder="Opsional — untuk identifikasi pending order"
            />
          </div>

          <div class="order-discount-action">
            <button class="btn-discount" @click="promptDiscount" title="Berikan diskon untuk seluruh order">
              <span class="disc-icon">%</span> Beri Diskon Khusus
            </button>
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
            :disabled="submitting || !activeOrder.items.length || cashInputRaw < activeOrder.summary.total"
          >
            <span v-if="submitting" class="btn-loader"></span>
            <span v-else class="btn-icon">💵</span>
            <span class="btn-label">{{ submitting ? 'Memproses...' : 'Bayar Tunai' }}</span>
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

        <!-- Supervisor Override Modal -->
        <SupervisorOverride
          v-model="showOverrideModal"
          :actionLabel="overrideActionLabel"
          @approved="handleSupervisorApproved"
          @denied="handleSupervisorDenied"
        />

      </aside>
    </div>
  </div>
</template>

<script setup>
// ── Script section remains UNCHANGED per user request ──
// All logic, bindings, and function calls preserved exactly as original
import { ref, reactive, computed, watch, onMounted } from 'vue'
import SupervisorOverride from '@/components/SupervisorOverride.vue'
import { useAuthStore }    from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useCartStore }    from '@/stores/cart'
import { useMembersStore } from '@/stores/members'
import { useShiftStore }   from '@/stores/shift'
import { useRouter }       from 'vue-router'

const authStore     = useAuthStore()
const productsStore = useProductsStore()
const cartStore     = useCartStore()
const membersStore  = useMembersStore()
const shiftStore    = useShiftStore()
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

// Cash input state
const cashInputFormatted = ref('')
const cashInputRaw = ref(0)
const quickCashAmounts = [50000, 100000, 200000, 500000]

const changeAmount = computed(() => {
  if (!activeOrder.value || cashInputRaw.value <= 0) return 0
  return Math.max(0, cashInputRaw.value - activeOrder.value.summary.total)
})

const formatCashInput = () => {
  const digits = cashInputFormatted.value.replace(/\D/g, '')
  cashInputRaw.value = parseInt(digits) || 0
  cashInputFormatted.value = cashInputRaw.value > 0 ? cashInputRaw.value.toLocaleString('id-ID') : ''
}

const setQuickCash = (amt) => {
  cashInputRaw.value = Math.ceil(amt)
  cashInputFormatted.value = cashInputRaw.value.toLocaleString('id-ID')
}

// Reset cash input when order changes
watch(activeOrder, () => {
  cashInputFormatted.value = ''
  cashInputRaw.value = 0
})

const productEmoji = (p) => {
  const cat = p.category?.name?.toLowerCase() || ''
  if (cat.includes('minum')) return '🥤'
  if (cat.includes('makan')) return '🍽️'
  if (cat.includes('snack')) return '🍟'
  return '📦'
}

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

// ── Supervisor Override Logic (C1) ──
const showOverrideModal = ref(false)
const overrideActionLabel = ref('')

const handleRequestAuth = (actionName) => {
  overrideActionLabel.value = actionName
  showOverrideModal.value = true
}

const promptDiscount = async () => {
  if (!activeOrder.value) return
  const input = prompt('Masukkan persentase diskon (1-100):')
  if (!input) return
  const pct = parseFloat(input)
  if (isNaN(pct) || pct <= 0 || pct > 100) return

  const res = await cartStore.applyDiscount(cartStore.activeOrderId, pct, true)
  if (res.requiresAuth) {
    handleRequestAuth(`memberikan diskon sebesar ${pct}%`)
  } else if (!res.success) {
    alert(res.message)
  }
}

const promptPriceChange = async (itemIndex) => {
  const item = activeOrder.value.items[itemIndex]
  const input = prompt(`Masukkan harga baru untuk ${item.name}:\nHarga awal: Rp ${formatCurrency(item.price)}`)
  if (!input) return
  
  const digits = input.replace(/\D/g, '')
  const newPrice = parseInt(digits)
  if (isNaN(newPrice) || newPrice < 0) return

  const res = await cartStore.changePriceItem(cartStore.activeOrderId, itemIndex, newPrice, true)
  if (res.requiresAuth) {
    handleRequestAuth(`merubah harga ${item.name} menjadi Rp ${formatCurrency(newPrice)}`)
  } else if (!res.success) {
    alert(res.message)
  }
}

const handleSupervisorApproved = async (supervisor) => {
  const pending = cartStore.supervisorAuthPending
  if (!pending) return

  if (pending.action === 'discount') {
    await cartStore.applyDiscount(cartStore.activeOrderId, pending.discountPercent, false)
  } else if (pending.action === 'priceChange') {
    await cartStore.changePriceItem(cartStore.activeOrderId, pending.itemIndex, pending.newPrice, false)
  }
  cartStore.supervisorAuthPending = null
}

const handleSupervisorDenied = () => {
  alert('Otorisasi Supervisor Ditolak/Dibatalkan')
  cartStore.supervisorAuthPending = null
}

const handleMemberSelect = (e) => {
  const id = e.target.value
  const member = id ? membersStore.getMemberById(id) : null
  cartStore.setMember(cartStore.activeOrderId, member)
}

// ── Inline Add Member (D6) ──
const showNewMemberForm = ref(false)
const newMemberForm = reactive({ name: '', phone: '' })
const handleAddMember = async () => {
  if (!newMemberForm.name.trim()) return
  const result = await membersStore.add({ name: newMemberForm.name.trim(), phone: newMemberForm.phone.trim(), email: '' })
  if (result.success && result.data) {
    cartStore.setMember(cartStore.activeOrderId, result.data)
    newMemberForm.name = ''
    newMemberForm.phone = ''
    showNewMemberForm.value = false
  }
}

const handleSubmitOrder = async () => {
  if (!activeOrder.value?.items.length) return
  if (cashInputRaw.value < activeOrder.value.summary.total) {
    alert('Jumlah uang tunai belum mencukupi')
    return
  }
  submitting.value = true
  try {
    const result = await cartStore.submitOrder(cartStore.activeOrderId)
    if (result.success) {
      // Record transaction to shift
      shiftStore.recordTransaction(result.transactionId, activeOrder.value.summary.total)
      successMsg.value = `Transaksi berhasil! Kembalian: Rp ${formatCurrency(changeAmount.value)}`
      setTimeout(() => { successMsg.value = '' }, 5000)
      cashInputFormatted.value = ''
      cashInputRaw.value = 0
      cartStore.clearOrder(cartStore.activeOrderId)
      if (!cartStore.orders.length) cartStore.createOrder()
    } else {
      alert(`Gagal: ${result.message}`)
    }
  } finally {
    submitting.value = false
  }
}

const handleClosingShift = () => {
  if (confirm('Tutup shift sekarang? Pastikan semua transaksi sudah selesai.')) {
    router.push('/cashier/closing-shift')
  }
}

const handleSwitchRole = () => {
  authStore.switchRole()
  router.push('/role-select')
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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
  height: 100%;
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(100,116,139,0.3) transparent;
}
.checkout-content::-webkit-scrollbar { width: 5px; }
.checkout-content::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 10px; }

/* Cart List */
.cart-list {
  flex-shrink: 0;
  min-height: 100px;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(100,116,139,0.3) transparent;
}
.cart-list::-webkit-scrollbar { width: 4px; }
.cart-list::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 10px; }

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

.row-controls { display: flex; align-items: center; gap: 0.5rem; }
.qty-dec, .qty-inc { width: 1.75rem; height: 1.75rem; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border-subtle); background: var(--bg-surface); color: var(--text-primary); cursor: pointer; font-size: 1rem; transition: all 0.2s; }
.qty-dec:hover, .qty-inc:hover { border-color: #6366f1; color: #6366f1; }
.qty-num { min-width: 1.5rem; text-align: center; font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
.row-total { font-weight: 700; font-size: 0.9rem; margin-right: auto; color: var(--text-primary); }
.row-edit-price { padding: 0.375rem; border: none; background: transparent; color: #94a3b8; cursor: pointer; transition: color 0.2s; display: flex; align-items: center; }
.row-edit-price:hover { color: #8b5cf6; }
.row-remove { padding: 0.375rem; border: none; background: transparent; color: #94a3b8; cursor: pointer; transition: color 0.2s; display: flex; align-items: center; }
.row-remove:hover { color: #ef4444; }

.qty-num {
  width: 1.75rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.row-total {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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

/* Cash Payment Section */
.payment-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.section-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.25rem;
}

.cash-input-row {
  position: relative;
  display: flex;
  align-items: center;
}

.cash-prefix {
  position: absolute;
  left: 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-tertiary);
}

.cash-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--pos-radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 700;
  text-align: right;
  outline: none;
  transition: var(--pos-transition);
}

.cash-input::placeholder {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-tertiary);
}

.cash-input:focus {
  border-color: var(--accent);
  box-shadow: var(--pos-focus-ring);
}

.quick-cash {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.quick-cash-btn {
  flex: 1;
  min-width: fit-content;
  padding: 0.375rem 0.625rem;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--pos-transition);
}

.quick-cash-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.quick-cash-btn.exact {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: var(--accent);
}

.change-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: var(--pos-radius-md);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.1));
  border: 1.5px solid rgba(16, 185, 129, 0.3);
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
}

.change-value {
  font-size: 1.125rem;
  font-weight: 800;
}

.cash-warning {
  padding: 0.5rem 0.75rem;
  border-radius: var(--pos-radius-sm);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  font-size: 0.78rem;
  font-weight: 500;
  color: #d97706;
}

/* Close Shift Button */
.btn-close-shift {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border-radius: 10px;
  border: none;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--pos-transition);
}

.btn-close-shift:hover {
  background: var(--danger);
  color: white;
}

/* Member Selector */
.btn-switch-role {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid rgba(99, 102, 241, 0.2);
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--pos-transition);
}
.btn-switch-role:hover {
  background: rgba(99, 102, 241, 0.18);
  border-color: rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

/* Member Selector */
.member-selector {
  flex-shrink: 0;
}

.btn-add-inline { display: block; width: 100%; margin-top: 0.375rem; padding: 0.375rem; border: 1.5px dashed rgba(99,102,241,0.3); border-radius: 8px; background: transparent; color: #6366f1; font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.25s; }
.btn-add-inline:hover { background: rgba(99,102,241,0.08); }
.inline-member-form { display: flex; flex-direction: column; gap: 0.375rem; margin-top: 0.5rem; }
.input-inline { padding: 0.5rem 0.625rem; border: 1.5px solid var(--border-subtle); border-radius: var(--pos-radius-md); background: var(--bg-surface); color: var(--text-primary); font-size: 0.8rem; outline: none; transition: all 0.25s; }
.input-inline:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.input-inline.full { width: 100%; }
.btn-save-inline { padding: 0.4rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.btn-save-inline:disabled { opacity: 0.4; cursor: not-allowed; }
.customer-name-input { flex-shrink: 0; margin-top: 0.25rem; }

.order-discount-action { flex-shrink: 0; margin-bottom: 0.75rem; display: flex; justify-content: flex-end; }
.btn-discount { display: inline-flex; align-items: center; gap: 0.375rem; background: rgba(99,102,241,0.08); color: #6366f1; border: 1.5px solid rgba(99,102,241,0.2); padding: 0.5rem 0.875rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.3s; }
.btn-discount:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); }
.disc-icon { font-size: 0.9rem; font-weight: 800; background: #6366f1; color: white; border-radius: 50%; width: 1.25rem; height: 1.25rem; display: flex; align-items: center; justify-content: center; padding-right: 1px; }

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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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