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
        <span v-if="pricelistStore.hasActiveEvent" class="topbar-event-chip">
          🏷️ {{ pricelistStore.activePricelist?.name }}
        </span>
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

          <!-- D1: CFD Button -->
          <button class="btn-cfd" @click="openCFD" title="Customer Facing Display">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            CFD
          </button>

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

          <!-- Supervisor Override Topbar Trigger -->
          <button class="btn-sv-override" @click="showSupervisorPanel = true" :class="{ 'sv-active': supervisorUnlocked }" title="Supervisor Override">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            <span v-if="supervisorUnlocked" class="sv-indicator">🔓 {{ supervisorName }}</span>
            <span v-else>🔐 Override</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ── Main Body ─────────────────────────────────────────────────────── -->
    <div class="pos-body">

      <!-- ── Left: Product Catalog ──────────────────────────────────────── -->
      <section class="catalog-panel">
        
        <!-- Toolbar: Combobox Search + Categories -->
        <div class="catalog-toolbar">
          <!-- AppCombobox for quick add by search or barcode -->
          <AppCombobox
            :model-value="comboProductId"
            :options="productsStore.products"
            option-key="id"
            option-label="name"
            option-sub-label="sku"
            placeholder="🔍 Cari atau scan barcode produk..."
            search-placeholder="Ketik nama / SKU / barcode..."
            :clearable="false"
            :autofocus="true"
            :barcode-mode="true"
            barcode-field="sku"
            :filter-fn="productFilterFn"
            class="product-combobox"
            @select="onComboProductSelect"
          />

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
                <p class="row-name">
                  {{ item.name }}
                  <span v-if="item.isEventPrice" class="event-badge">🏷️ Event</span>
                </p>
                <p class="row-price">Rp {{ formatCurrency(item.price) }}</p>
              </div>
              <div class="row-controls">
                <button class="qty-dec" @click="adjustQty(index, -1)">−</button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button class="qty-inc" @click="adjustQty(index, 1)">+</button>
                <span class="row-total">Rp {{ formatCurrency(item.subtotal) }}</span>
                <button v-if="supervisorUnlocked" class="row-edit-price" @click="promptPriceChange(index)" title="Ubah Harga">
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

          <!-- ── Pembayaran: Cash Only ── -->
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

          <!-- Member Combobox (D3-style: search by name or phone) -->
          <div class="member-selector">
            <span class="section-label">Member</span>
            <AppCombobox
              :model-value="activeOrder.member?.id || ''"
              :options="membersStore.members"
              option-key="id"
              option-label="name"
              option-sub-label="phone"
              placeholder="-- Tanpa Member --"
              search-placeholder="Cari nama atau No. HP..."
              :clearable="true"
              :autofocus="true"
              add-new-label="+ Tambah Member Baru"
              class="member-combobox"
              @select="handleMemberComboSelect"
              @add-new="onAddMemberFromCombo"
            />
            <div v-if="showNewMemberForm" class="inline-member-form">
              <input v-model="newMemberForm.name" class="input-inline" placeholder="Nama member" />
              <input v-model="newMemberForm.phone" class="input-inline" placeholder="No. HP" />
              <button class="btn-save-inline" @click="handleAddMember" :disabled="!newMemberForm.name.trim()">Simpan</button>
              <button class="btn-add-inline" @click="showNewMemberForm = false">✕ Batal</button>
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
            <button v-if="supervisorUnlocked" class="btn-discount" @click="promptDiscount" title="Berikan diskon untuk seluruh order">
              <span class="disc-icon">%</span> Beri Diskon Khusus
            </button>
            <!-- B4: Auto-suggest active discounts -->
            <template v-if="applicableDiscounts.length > 0">
              <div class="discount-suggestions">
                <span class="disc-suggest-label">Promo:</span>
                <button
                  v-for="disc in applicableDiscounts" :key="disc.id"
                  class="disc-chip"
                  :class="{ 'is-applied': activeOrder.summary.discountPercent === disc.value && disc.type === 'PERCENTAGE' }"
                  @click="applyAutoDiscount(disc)"
                  :title="disc.name"
                >
                  {{ disc.name }}: {{ discountsStore.getDiscountLabel(disc) }}
                </button>
              </div>
            </template>
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

    <!-- ── Modal Struk Transaksi ──────────────────────────────────────── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showStruk" class="struk-overlay" @click.self="closeStruk">
          <div class="struk-box" ref="strukPrintRef">
            <div class="struk-header">
              <div class="struk-brand">🧾 Nextore POS</div>
              <div class="struk-meta">
                <span>{{ strukData.date }}</span>
                <span v-if="authStore.posDevice">{{ authStore.posDevice.name }}</span>
              </div>
              <div class="struk-cashier">Kasir: {{ authStore.user?.name }}</div>
            </div>
            <div class="struk-divider">────────────────────</div>
            <div class="struk-items">
              <div v-for="item in strukData.items" :key="item.productId" class="struk-item">
                <span class="struk-item-name">{{ item.name }}</span>
                <span class="struk-item-detail">{{ item.quantity }}x Rp {{ fmt(item.price) }}</span>
                <span class="struk-item-sub">Rp {{ fmt(item.subtotal) }}</span>
              </div>
            </div>
            <div class="struk-divider">────────────────────</div>
            <div class="struk-summary">
              <div class="struk-row">
                <span>Subtotal</span>
                <span>Rp {{ fmt(strukData.subtotal) }}</span>
              </div>
              <div v-if="(strukData.discountPercent || 0) > 0" class="struk-row struk-discount">
                <span>Diskon ({{ strukData.discountPercent }}%)</span>
                <span>− Rp {{ fmt(strukData.subtotal * strukData.discountPercent / 100) }}</span>
              </div>
              <div class="struk-row struk-total">
                <span>TOTAL</span>
                <span>Rp {{ fmt(strukData.total) }}</span>
              </div>
              <div class="struk-divider">────────────────────</div>
              <div class="struk-row">
                <span>Uang Tunai</span>
                <span>Rp {{ fmt(strukData.cash) }}</span>
              </div>
              <div class="struk-row struk-change">
                <span>Kembalian</span>
                <span>Rp {{ fmt(strukData.change) }}</span>
              </div>
            </div>
            <div class="struk-divider">────────────────────</div>
            <div class="struk-footer">Terima kasih sudah berbelanja! 🙏</div>
            <div class="struk-actions no-print">
              <button class="struk-btn-print" @click="printStruk">🖨️ Cetak Struk</button>
              <button class="struk-btn-close" @click="closeStruk">Selesai</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ── Supervisor Override Topbar Modal ──────────────────────────── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showSupervisorPanel" class="modal-overlay-sv" @click.self="showSupervisorPanel = false">
          <div class="sv-panel">
            <div class="sv-header">
              <span class="sv-title">🔐 Supervisor Override</span>
              <button class="sv-close" @click="showSupervisorPanel = false">×</button>
            </div>
            <div v-if="!supervisorUnlocked" class="sv-form">
              <div class="sv-form-group">
                <label class="sv-label">Pilih Supervisor</label>
                <select v-model="svSelectedId" class="sv-select">
                  <option value="">-- Pilih supervisor --</option>
                  <option v-for="s in supervisorList" :key="s.id" :value="s.id">{{ s.name }} ({{ s.username }})</option>
                </select>
              </div>
              <div class="sv-form-group">
                <label class="sv-label">Password</label>
                <input v-model="svPassword" type="password" class="sv-input" placeholder="Password supervisor" @keyup.enter="verifySupervisor"/>
              </div>
              <div v-if="svError" class="sv-error">{{ svError }}</div>
              <button class="sv-btn-verify" @click="verifySupervisor" :disabled="!svSelectedId || !svPassword">Verifikasi</button>
            </div>
            <div v-else class="sv-unlocked">
              <div class="sv-unlocked-info">🔓 <strong>{{ supervisorName }}</strong> aktif — edit harga & diskon terbuka</div>
              <button class="sv-btn-lock" @click="lockSupervisor">🔒 Kembali ke Kasir (Kunci)</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
// ── Script section remains UNCHANGED per user request ──
// All logic, bindings, and function calls preserved exactly as original
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import SupervisorOverride from '@/components/SupervisorOverride.vue'
import AppCombobox from '@/components/AppCombobox.vue'  // Combobox
import { useAuthStore }    from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useCartStore }    from '@/stores/cart'
import { useMembersStore } from '@/stores/members'
import { useShiftStore }   from '@/stores/shift'
import { useDiscountsStore } from '@/stores/discounts'  // B4
import { usePricelistStore } from '@/stores/pricelist'
import { useRouter }       from 'vue-router'

import { useStaffStore } from '@/stores/staff'

const authStore     = useAuthStore()
const productsStore = useProductsStore()
const cartStore     = useCartStore()
const membersStore  = useMembersStore()
const shiftStore    = useShiftStore()
const discountsStore = useDiscountsStore()  // B4
const pricelistStore = usePricelistStore()
const staffStore    = useStaffStore()
const router        = useRouter()

// Cash Only — tidak ada pilihan metode pembayaran lain

const searchTerm    = ref('')
const searchInputRef = ref(null)  // D3: barcode scanner autofocus (legacy ref kept for onMounted)
const comboProductId = ref('')    // Combobox: controlled value (always reset after selection)
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

// B4: Compute discounts applicable to current order (TRANSACTION type + MEMBER type if member is selected)
const applicableDiscounts = computed(() => {
  if (!activeOrder.value) return []
  const memberId = activeOrder.value.member?.id
  return discountsStore.activeDiscounts.filter(d => {
    if (d.target === 'TRANSACTION') return true
    if (d.target === 'MEMBER' && memberId && (!d.targetId || d.targetId === memberId)) return true
    return false
  })
})

// B4: Apply a discount from the suggestion chips
const applyAutoDiscount = async (disc) => {
  if (!activeOrder.value) return
  let pct = 0
  if (disc.type === 'PERCENTAGE') {
    pct = disc.value
  } else if (disc.type === 'NOMINAL') {
    // Convert nominal to percentage based on current subtotal
    const sub = activeOrder.value.summary.subtotal
    if (sub <= 0) return
    pct = Math.round((disc.value / sub) * 100 * 100) / 100
  }
  const res = await cartStore.applyDiscount(cartStore.activeOrderId, pct, true)
  if (res.requiresAuth) {
    handleRequestAuth(`diskon "${disc.name}" (${discountsStore.getDiscountLabel(disc)})`)
  }
}


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
  // Lock supervisor override when order changes
  if (supervisorUnlocked.value) lockSupervisor()
})

// ── Struk Modal State ──────────────────────────────────────────────────
const showStruk = ref(false)
const strukPrintRef = ref(null)
const strukData = ref({
  date: '', cashier: '', items: [], subtotal: 0, discountPercent: 0,
  total: 0, cash: 0, change: 0,
})

const fmt = (v) => Math.round(v || 0).toLocaleString('id-ID')

const openStruk = (order, cash, change) => {
  strukData.value = {
    date: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    cashier: authStore.user?.name || 'Kasir',
    items: order.items.map(i => ({ ...i })),
    subtotal: order.summary.subtotal,
    discountPercent: order.summary.discountPercent || 0,
    total: order.summary.total,
    cash,
    change,
  }
  showStruk.value = true
}

const closeStruk = () => { showStruk.value = false }

const printStruk = () => {
  const printContent = strukPrintRef.value?.innerHTML
  if (!printContent) return
  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(`<html><head><title>Struk</title><style>
    body { font-family: monospace; font-size: 12px; width: 300px; margin: 0 auto; }
    .struk-divider { color: #999; margin: 4px 0; }
    .struk-row { display: flex; justify-content: space-between; }
    .struk-total { font-weight: bold; font-size: 14px; }
    .struk-change { font-weight: bold; color: green; }
    .struk-discount { color: red; }
    .struk-item { margin: 2px 0; }
    .struk-item-name { font-weight: 600; }
    .struk-item-detail { color: #555; }
    .struk-footer { text-align: center; margin-top: 8px; }
    .no-print { display: none; }
  </style></head><body>${printContent}</body></html>`)
  win.document.close()
  win.print()
  win.close()
}

// ── Supervisor Override State ────────────────────────────────────────
const showSupervisorPanel = ref(false)
const supervisorUnlocked = ref(false)
const supervisorName = ref('')
const svSelectedId = ref('')
const svPassword = ref('')
const svError = ref('')

const MOCK_SV_PASSWORDS = {
  'mock-user-2': 'supervisor123',
  'mock-user-1': 'admin123',
  'mock-user-5': 'super123',
}

// Supervisors list dari staffStore (filter SUPERVISOR + ADMIN)
const supervisorList = computed(() =>
  staffStore.staff.filter(s => s.role === 'SUPERVISOR' || s.role === 'ADMIN')
)

const verifySupervisor = () => {
  svError.value = ''
  const sv = supervisorList.value.find(s => s.id === svSelectedId.value)
  if (!sv) { svError.value = 'Supervisor tidak ditemukan'; return }
  const correctPw = MOCK_SV_PASSWORDS[svSelectedId.value]
  if (!correctPw || svPassword.value !== correctPw) {
    svError.value = 'Password salah. Coba lagi.'
    return
  }
  supervisorUnlocked.value = true
  supervisorName.value = sv.name
  svPassword.value = ''
  svError.value = ''
  showSupervisorPanel.value = false
}

const lockSupervisor = () => {
  supervisorUnlocked.value = false
  supervisorName.value = ''
  svSelectedId.value = ''
  svPassword.value = ''
  svError.value = ''
}

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
  // B1 FIX: delegate entirely to completeSupervisorAuth() — store applies the pending action and clears itself
  const result = await cartStore.completeSupervisorAuth(true, supervisor?.id)
  if (!result.success) {
    console.warn('[Checkout] Supervisor auth failed to apply:', result.message)
  }
}

const handleSupervisorDenied = () => {
  alert('Otorisasi Supervisor Ditolak/Dibatalkan')
  // B1 FIX: use store action instead of direct mutation
  cartStore.completeSupervisorAuth(false)
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

// ── Combobox handlers ─────────────────────────────────────────────────────────

// Product Combobox filter: match name, sku, barcode, category name
const productFilterFn = (product, q) => {
  const lower = q.toLowerCase()
  return (
    product.name?.toLowerCase().includes(lower) ||
    product.sku?.toLowerCase().includes(lower) ||
    product.barcode?.toLowerCase().includes(lower) ||
    product.category?.name?.toLowerCase().includes(lower)
  )
}

// When user selects a product from Combobox → add to cart, reset trigger
const onComboProductSelect = (product) => {
  if (!product) return
  handleAddProduct(product)
  // Reset combobox trigger to placeholder after selection (UX: ready for next scan)
  nextTick(() => { comboProductId.value = '' })
}

// Member Combobox select handler (receives full member object or null for clear)
const handleMemberComboSelect = (member) => {
  cartStore.setMember(cartStore.activeOrderId, member || null)
}

// "Tambah Member Baru" clicked from Combobox empty state
const onAddMemberFromCombo = (query) => {
  newMemberForm.name = query || ''
  newMemberForm.phone = ''
  showNewMemberForm.value = true
}

const handleSubmitOrder = async () => {
  if (!activeOrder.value?.items.length) return
  if (cashInputRaw.value < activeOrder.value.summary.total) {
    alert('Jumlah uang tunai belum mencukupi')
    return
  }
  submitting.value = true
  // Snapshot data order sebelum di-clear untuk struk
  const orderSnapshot = JSON.parse(JSON.stringify(activeOrder.value))
  const cashSnapshot = cashInputRaw.value
  const changeSnapshot = changeAmount.value
  try {
    const result = await cartStore.submitOrder(cartStore.activeOrderId)
    if (result.success) {
      // Record transaction to shift
      shiftStore.recordTransaction(result.transactionId, orderSnapshot.summary.total)
      // Reset pembayaran
      cashInputFormatted.value = ''
      cashInputRaw.value = 0
      // Kunci supervisor jika aktif
      if (supervisorUnlocked.value) lockSupervisor()
      // Buka modal struk
      openStruk(orderSnapshot, cashSnapshot, changeSnapshot)
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
    staffStore.fetchStaff(),
    pricelistStore.fetchPricelists(),
  ])
  if (!activeOrder.value) cartStore.createOrder()

  // D3: Autofocus barcode search input
  nextTick(() => searchInputRef.value?.focus())

  // D3: Barcode burst-input detection
  // A scanner typically sends ≥4 chars within 100ms – we detect this and auto-add the product
  let barcodeBuffer = ''
  let barcodeTimer = null
  document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in a modal input / payment input / etc.
    const tag = document.activeElement?.tagName
    const isModal = document.activeElement?.closest?.('.modal-box, .checkout-right')
    if (isModal || (tag === 'INPUT' && document.activeElement !== searchInputRef.value)) return

    if (e.key === 'Enter') {
      // On Enter: if buffer has content, treat as barcode search
      if (barcodeBuffer.length >= 3) {
        const sku = barcodeBuffer.trim()
        const product = productsStore.products.find(p => p.sku === sku || p.name.toLowerCase() === sku.toLowerCase())
        if (product && product.stock > 0) {
          handleAddProduct(product)
          searchTerm.value = ''
          barcodeBuffer = ''
          clearTimeout(barcodeTimer)
          return
        }
      }
      barcodeBuffer = ''
      return
    }

    if (e.key.length === 1) {
      // Focus search field so single chars appear there too
      if (document.activeElement !== searchInputRef.value) {
        searchInputRef.value?.focus()
      }
      barcodeBuffer += e.key
      clearTimeout(barcodeTimer)
      barcodeTimer = setTimeout(() => { barcodeBuffer = '' }, 100)
    }
  })
})

// D1: Open Customer Facing Display in new window
const openCFD = () => {
  const cfdUrl = new URL('/cashier/cfd', window.location.origin)
  const cfdWin = window.open(cfdUrl.toString(), 'nextore-cfd', 'width=1080,height=720,menubar=no,toolbar=no')
  if (!cfdWin) {
    alert('Pop-up diblokir oleh browser. Izinkan pop-up untuk fitur CFD.')
  }
}
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

.topbar-event-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.65rem;
  background: rgba(251,191,36,0.15);
  border: 1px solid rgba(251,191,36,0.4);
  color: #b45309;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
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
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.event-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: rgba(251,191,36,0.18);
  border: 1px solid rgba(251,191,36,0.4);
  color: #b45309;
  letter-spacing: 0.02em;
  white-space: nowrap;
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

/* B3: Payment method pills */
.payment-method-pills {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.pay-pill {
  flex: 1;
  padding: 0.5rem 0.5rem;
  border-radius: 8px;
  border: 1.5px solid var(--border-subtle);
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--pos-transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.pay-pill:hover { border-color: var(--accent); color: var(--accent); }
.pay-pill.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 4px 12px rgba(99,102,241,0.35);
}

.noncash-confirm {
  padding: 0.75rem 1rem;
  background: var(--bg-surface-2);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  border: 1px dashed var(--border-subtle);
}

/* B4: Discount suggestion chips */
.discount-suggestions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.disc-suggest-label {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  font-weight: 600;
  white-space: nowrap;
}

.disc-chip {
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  border: 1.5px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--pos-transition);
  white-space: nowrap;
}

.disc-chip:hover { background: var(--accent); color: #fff; }
.disc-chip.is-applied {
  background: var(--success, #10b981);
  border-color: var(--success, #10b981);
  color: #fff;
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

/* D1: CFD button */
.btn-cfd {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid var(--pos-border-subtle, rgba(99,102,241,0.3));
  background: transparent;
  color: var(--text-secondary, #64748b);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--pos-transition);
}
.btn-cfd:hover {
  background: rgba(99,102,241,0.08);
  color: #6366f1;
  border-color: #6366f1;
}

/* ── Combobox integration styles ─────────────────────────────────────────── */
/* Product search combobox in catalog toolbar */
.product-combobox { width: 100%; }
.product-combobox :deep(.cb-trigger) {
  background: var(--pos-bg-surface2, #f8fafc);
  border-color: var(--pos-border, #e2e8f0);
  border-radius: 12px;
  min-height: 44px;
  padding: 0.65rem 1rem;
}
.product-combobox :deep(.cb-display-text) { font-size: 0.875rem; color: var(--pos-text-secondary, #64748b); }
.product-combobox :deep(.cb-focus) { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }

/* Member combobox in checkout sidebar payment section */
.member-combobox { width: 100%; }
.member-combobox :deep(.cb-trigger) {
  background: var(--pos-bg-surface2, #f8fafc);
  border-color: var(--pos-border, #e2e8f0);
  border-radius: 10px;
  min-height: 40px;
  padding: 0.5rem 0.875rem;
}
.member-combobox :deep(.cb-display-text) { font-size: 0.825rem; }

/* ── Struk Modal ───────────────────────────────────────────────────────── */
.struk-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.struk-box {
  background: #fff; border-radius: 16px; padding: 1.5rem;
  min-width: 320px; max-width: 420px; width: 100%;
  box-shadow: 0 24px 60px rgba(0,0,0,0.3);
  font-family: monospace;
  max-height: 90vh; overflow-y: auto;
}
.pos-layout[data-theme="dark"] .struk-box { background: #1e293b; color: #f1f5f9; }
.struk-header { text-align: center; margin-bottom: 0.75rem; }
.struk-brand { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
.struk-meta { font-size: 0.78rem; color: #64748b; }
.struk-cashier { font-size: 0.8rem; color: #64748b; margin-top: 0.2rem; }
.struk-divider { color: #94a3b8; font-size: 0.75rem; margin: 0.5rem 0; }
.struk-items { display: flex; flex-direction: column; gap: 0.4rem; }
.struk-item { display: grid; grid-template-columns: 1fr auto auto; gap: 0.5rem; align-items: center; font-size: 0.82rem; }
.struk-item-name { font-weight: 600; }
.struk-item-detail { color: #64748b; font-size: 0.75rem; }
.struk-item-sub { font-weight: 700; text-align: right; }
.struk-summary { display: flex; flex-direction: column; gap: 0.35rem; }
.struk-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
.struk-total { font-weight: 800; font-size: 1rem; margin: 0.25rem 0; }
.struk-discount { color: #ef4444; }
.struk-change { color: #10b981; font-weight: 700; }
.struk-footer { text-align: center; margin-top: 0.75rem; font-size: 0.8rem; color: #64748b; }
.struk-actions {
  display: flex; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}
.pos-layout[data-theme="dark"] .struk-actions { border-top-color: #334155; }
.struk-btn-print {
  flex: 1; padding: 0.625rem; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.struk-btn-print:hover { opacity: 0.9; transform: translateY(-1px); }
.struk-btn-close {
  flex: 1; padding: 0.625rem; border-radius: 10px;
  border: 1.5px solid #e2e8f0; background: transparent;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; color: #475569;
  transition: all 0.2s;
}
.struk-btn-close:hover { border-color: #6366f1; color: #6366f1; }
.pos-layout[data-theme="dark"] .struk-btn-close { border-color: #334155; color: #94a3b8; }

/* ── Supervisor Override Panel ────────────────────────────────────── */
.btn-sv-override {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.875rem; border-radius: 8px;
  border: 1.5px solid rgba(245,158,11,0.4);
  background: transparent; color: #b45309;
  font-size: 0.76rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.btn-sv-override:hover { background: rgba(245,158,11,0.1); border-color: #f59e0b; }
.btn-sv-override.sv-active {
  background: rgba(16,185,129,0.12); border-color: #10b981; color: #059669;
}
.sv-indicator { font-size: 0.75rem; }

.modal-overlay-sv {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 300;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.sv-panel {
  background: #fff; border-radius: 16px; padding: 1.5rem;
  width: 100%; max-width: 380px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
}
.pos-layout[data-theme="dark"] .sv-panel { background: #1e293b; color: #f1f5f9; }
.sv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.sv-title { font-size: 1rem; font-weight: 700; }
.sv-close {
  background: none; border: none; font-size: 1.25rem; cursor: pointer;
  color: #94a3b8; padding: 0.25rem; line-height: 1;
}
.sv-form { display: flex; flex-direction: column; gap: 0.875rem; }
.sv-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.sv-label { font-size: 0.8rem; font-weight: 600; color: #64748b; }
.sv-select, .sv-input {
  padding: 0.625rem 0.875rem; border-radius: 10px;
  border: 1.5px solid #e2e8f0; font-size: 0.875rem;
  background: #f8fafc; color: #1e293b; outline: none;
  transition: border-color 0.2s;
}
.pos-layout[data-theme="dark"] .sv-select,
.pos-layout[data-theme="dark"] .sv-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.sv-select:focus, .sv-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.sv-error { font-size: 0.8rem; color: #ef4444; padding: 0.5rem 0.75rem; background: rgba(239,68,68,0.08); border-radius: 8px; }
.sv-btn-verify {
  padding: 0.75rem; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.sv-btn-verify:disabled { opacity: 0.5; cursor: not-allowed; }
.sv-btn-verify:hover:not(:disabled) { opacity: 0.9; }
.sv-unlocked { display: flex; flex-direction: column; gap: 1rem; }
.sv-unlocked-info {
  padding: 0.875rem; border-radius: 10px;
  background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
  color: #059669; font-size: 0.875rem;
}
.sv-btn-lock {
  padding: 0.75rem; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.sv-btn-lock:hover { opacity: 0.9; }

/* Modal fade transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>