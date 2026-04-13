<template>
  <div class="module-page" :data-theme="theme">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <header class="page-header">
      <div class="header-content">
        <div class="breadcrumb">
          <span>Master Data</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          <span>Manajemen Harga</span>
        </div>
        <h1 class="page-title">Pricelist Event</h1>
        <p class="page-subtitle">Kelola harga khusus per event. Hanya satu event yang dapat aktif dalam satu waktu.</p>
      </div>
      <button class="btn-primary" @click="openPlModal()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Tambah Event
      </button>
    </header>

    <!-- ── Active event banner ───────────────────────────────────────── -->
    <div v-if="pricelistStore.activePricelist" class="pl-active-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/>
      </svg>
      Event aktif: <strong>{{ pricelistStore.activePricelist.name }}</strong>
      <button class="pl-deactivate-btn" @click="handleDeactivateAll">Nonaktifkan Semua</button>
    </div>

    <!-- ── Pricelist Table ───────────────────────────────────────────── -->
    <div class="table-card">
      <div v-if="pricelistStore.loading" class="state-loading">
        <span class="spinner-ring"></span>
        <span>Memuat pricelist...</span>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Nama Event</th>
            <th>Deskripsi</th>
            <th>Jumlah Produk</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pricelistStore.pricelists.length === 0">
            <td colspan="5" class="empty-row">
              <div class="empty-visual">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>
              <p>Belum ada pricelist event.</p>
              <span class="empty-hint">Klik "Tambah Event" untuk membuat event promo baru.</span>
            </td>
          </tr>

          <!-- Pricelist row -->
          <tr v-for="pl in pricelistStore.pricelists" :key="pl.id" class="table-row">
            <td>
              <div class="pl-name-cell">
                <span class="pl-icon">🏷️</span>
                <strong>{{ pl.name }}</strong>
              </div>
            </td>
            <td class="col-desc">{{ pl.description || '—' }}</td>
            <td>
              <span class="count-chip">{{ pricelistStore.getItemsByPricelist(pl.id).length }} produk</span>
            </td>
            <td>
              <div class="toggle-cell">
                <label class="toggle-switch" :title="pl.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'">
                  <input type="checkbox" :checked="pl.is_active" @change="handleTogglePricelist(pl)" />
                  <span class="toggle-slider"></span>
                </label>
                <span class="status-badge" :class="pl.is_active ? 'badge-success' : 'badge-inactive'">
                  {{ pl.is_active ? '● Aktif' : '○ Nonaktif' }}
                </span>
              </div>
            </td>
            <td class="col-actions">
              <button
                class="action-btn expand-btn"
                :class="{ 'is-expanded': expandedPlId === pl.id }"
                @click="expandedPlId = expandedPlId === pl.id ? null : pl.id"
                title="Lihat / Edit Produk"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <button class="action-btn edit-btn" @click="openPlModal(pl)" title="Edit Event">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" @click="handleDeletePricelist(pl)" title="Hapus Event">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                </svg>
              </button>
            </td>
          </tr>

          <!-- Expanded: product items per pricelist -->
          <template v-for="pl in pricelistStore.pricelists" :key="'exp-' + pl.id">
            <tr v-if="expandedPlId === pl.id" class="pl-items-row">
              <td colspan="5" class="pl-items-cell">

                <div class="pl-items-header">
                  <div class="pl-items-title-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    <span class="pl-items-title">Produk dalam "{{ pl.name }}"</span>
                  </div>
                  <button class="btn-add-item" @click="openAddItemModal(pl)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Tambah Produk
                  </button>
                </div>

                <div v-if="pricelistStore.getItemsByPricelist(pl.id).length === 0" class="items-empty">
                  Belum ada produk dalam event ini. Klik "Tambah Produk" untuk menambahkan.
                </div>

                <table v-else class="pl-items-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>SKU</th>
                      <th>HPP</th>
                      <th>Harga Normal</th>
                      <th>Harga Event</th>
                      <th>Status Margin</th>
                      <th>Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="pli in pricelistStore.getItemsByPricelist(pl.id)" :key="pli.id">
                      <td class="col-prod-name">{{ pli.productName }}</td>
                      <td><code class="sku-chip">{{ pli.productSku || '—' }}</code></td>
                      <td class="col-hpp">Rp {{ fmt(getProductHpp(pli.productId)) }}</td>
                      <td class="col-normal">Rp {{ fmt(getProductNormalPrice(pli.productId)) }}</td>
                      <td>
                        <div class="event-price-wrap">
                          <span class="rp-prefix">Rp</span>
                          <input
                            type="number"
                            min="0"
                            :value="pli.eventPrice"
                            class="event-price-input"
                            :class="{ 'input-loss': pli.eventPrice < getProductHpp(pli.productId) }"
                            @change="handleUpdateItemPrice(pli, $event.target.value)"
                          />
                        </div>
                      </td>
                      <td>
                        <span v-if="pli.eventPrice < getProductHpp(pli.productId)" class="loss-badge">
                          ⚠️ Di bawah HPP!
                        </span>
                        <span v-else-if="pli.eventPrice < getProductNormalPrice(pli.productId)" class="discount-badge">
                          ↓ Diskon {{ discountPct(pli) }}%
                        </span>
                        <span v-else class="neutral-badge">= Harga Normal</span>
                      </td>
                      <td>
                        <button class="action-btn delete-btn" @click="handleRemovePlItem(pli)" title="Hapus dari event">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M18 6 6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </td>
            </tr>
          </template>

        </tbody>
      </table>
    </div>

    <!-- ── Modal: Add / Edit Pricelist ──────────────────────────────── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showPlModal" class="modal-overlay" @click.self="showPlModal = false">
          <div class="modal-box">
            <div class="modal-header">
              <div class="header-text">
                <h2 class="modal-title">{{ plEditTarget ? 'Edit Event' : 'Tambah Event Baru' }}</h2>
                <p class="modal-subtitle">{{ plEditTarget ? 'Perbarui nama dan deskripsi event' : 'Buat event promo baru' }}</p>
              </div>
              <button class="modal-close" @click="showPlModal = false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form @submit.prevent="handlePlSubmit" class="modal-form">
              <div class="form-group">
                <label class="form-label">Nama Event <span class="required">*</span></label>
                <input v-model="plForm.name" class="input-field" type="text" placeholder="Contoh: Promo Lebaran 2026" required />
              </div>
              <div class="form-group">
                <label class="form-label">Deskripsi</label>
                <input v-model="plForm.description" class="input-field" type="text" placeholder="Opsional — keterangan singkat event" />
              </div>
              <div v-if="plFormError" class="form-error-msg">{{ plFormError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="showPlModal = false">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="pricelistStore.loading">
                  <span v-if="pricelistStore.loading" class="spinner-sm"></span>
                  {{ plEditTarget ? 'Simpan Perubahan' : 'Tambah Event' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ── Modal: Tambah Produk ke Pricelist ─────────────────────────── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showAddItemModal" class="modal-overlay" @click.self="showAddItemModal = false">
          <div class="modal-box">
            <div class="modal-header">
              <div class="header-text">
                <h2 class="modal-title">Tambah Produk ke Pricelist</h2>
                <p class="modal-subtitle">{{ addItemTargetPl?.name }}</p>
              </div>
              <button class="modal-close" @click="showAddItemModal = false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form @submit.prevent="handleAddPlItem" class="modal-form">
              <div class="form-group">
                <label class="form-label">Pilih Produk <span class="required">*</span></label>
                <AppCombobox
                  v-model="addItemForm.productId"
                  :options="availableProductsForPl"
                  option-key="id"
                  option-label="name"
                  option-sub-label="sku"
                  placeholder="-- Pilih Produk --"
                  search-placeholder="Cari nama / SKU..."
                  :clearable="false"
                  @select="onAddItemProductSelect"
                />
              </div>

              <div v-if="addItemForm.productId" class="selected-product-info">
                <div class="info-row">
                  <span class="info-label">HPP Average</span>
                  <span class="info-val">Rp {{ fmt(getProductHpp(addItemForm.productId)) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Harga Normal</span>
                  <span class="info-val">Rp {{ fmt(getProductNormalPrice(addItemForm.productId)) }}</span>
                </div>
              </div>

              <div v-if="addItemForm.productId" class="form-group">
                <label class="form-label">Harga Event (Rp) <span class="required">*</span></label>
                <div class="input-with-prefix">
                  <span class="prefix">Rp</span>
                  <input
                    v-model.number="addItemForm.eventPrice"
                    class="input-field"
                    :class="{ 'input-loss': addItemForm.eventPrice > 0 && addItemForm.eventPrice < getProductHpp(addItemForm.productId) }"
                    type="number"
                    min="0"
                    placeholder="0"
                    required
                    @input="addItemFormError = ''"
                  />
                </div>

                <!-- Loss Alert real-time -->
                <div
                  v-if="addItemForm.eventPrice > 0 && addItemForm.eventPrice < getProductHpp(addItemForm.productId)"
                  class="loss-alert-box"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div class="loss-text">
                    <strong>Peringatan Rugi!</strong>
                    <span>
                      Harga event (Rp {{ fmt(addItemForm.eventPrice) }}) di bawah HPP
                      (Rp {{ fmt(getProductHpp(addItemForm.productId)) }}).
                      Rugi Rp {{ fmt(getProductHpp(addItemForm.productId) - addItemForm.eventPrice) }} per unit.
                    </span>
                  </div>
                </div>

                <!-- Profit preview -->
                <div
                  v-else-if="addItemForm.eventPrice > 0"
                  class="profit-preview"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                  <span>
                    Margin event: <strong>Rp {{ fmt(addItemForm.eventPrice - getProductHpp(addItemForm.productId)) }}</strong>
                    (diskon {{ Math.round((1 - addItemForm.eventPrice / getProductNormalPrice(addItemForm.productId)) * 100) }}% dari harga normal)
                  </span>
                </div>
              </div>

              <div v-if="addItemFormError" class="form-error-msg">{{ addItemFormError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="showAddItemModal = false">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="pricelistStore.loading || !addItemForm.productId">
                  <span v-if="pricelistStore.loading" class="spinner-sm"></span>
                  Tambah ke Pricelist
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { usePricelistStore } from '@/stores/pricelist'
import AppCombobox from '@/components/AppCombobox.vue'

const productsStore  = useProductsStore()
const pricelistStore = usePricelistStore()

const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })

onMounted(async () => {
  await Promise.all([productsStore.fetchProducts(), pricelistStore.fetchPricelists()])
})

const fmt = (n) => (n ?? 0).toLocaleString('id-ID')

// ── Product helpers ───────────────────────────────────────────────────────────
const getProductHpp = (productId) => {
  const p = productsStore.getProductById(productId)
  return p?.hpp ?? 0
}
const getProductNormalPrice = (productId) => {
  const p = productsStore.getProductById(productId)
  return p?.sellingPrice ?? p?.price ?? 0
}
const discountPct = (pli) => {
  const normal = getProductNormalPrice(pli.productId)
  if (!normal) return 0
  return Math.round((1 - pli.eventPrice / normal) * 100)
}

// ── Pricelist CRUD state ──────────────────────────────────────────────────────
const expandedPlId   = ref(null)
const showPlModal    = ref(false)
const plEditTarget   = ref(null)
const plFormError    = ref('')
const plForm         = reactive({ name: '', description: '' })

const showAddItemModal = ref(false)
const addItemTargetPl  = ref(null)
const addItemFormError = ref('')
const addItemForm      = reactive({ productId: '', eventPrice: 0 })

// Produk yang belum ada di pricelist target
const availableProductsForPl = computed(() => {
  if (!addItemTargetPl.value) return productsStore.products
  const existingIds = pricelistStore.getItemsByPricelist(addItemTargetPl.value.id).map(i => i.productId)
  return productsStore.products.filter(p => !existingIds.includes(p.id))
})

// ── Pricelist handlers ────────────────────────────────────────────────────────
const openPlModal = (pl = null) => {
  plEditTarget.value = pl
  plFormError.value  = ''
  Object.assign(plForm, { name: pl?.name ?? '', description: pl?.description ?? '' })
  showPlModal.value  = true
}

const handlePlSubmit = async () => {
  plFormError.value = ''
  const result = plEditTarget.value
    ? await pricelistStore.updatePricelist(plEditTarget.value.id, { name: plForm.name, description: plForm.description })
    : await pricelistStore.addPricelist({ name: plForm.name, description: plForm.description })
  if (result.success) { showPlModal.value = false }
  else { plFormError.value = result.message }
}

const handleTogglePricelist = async (pl) => {
  if (pl.is_active) {
    if (confirm('Nonaktifkan event ini?')) await pricelistStore.deactivateAll()
  } else {
    if (confirm(`Aktifkan "${pl.name}"?\n\nEvent lain yang sedang aktif akan dinonaktifkan secara otomatis.`)) {
      await pricelistStore.activatePricelist(pl.id)
    }
  }
}

const handleDeactivateAll = async () => {
  if (confirm('Nonaktifkan semua event? Kasir akan kembali ke harga normal.')) {
    await pricelistStore.deactivateAll()
  }
}

const handleDeletePricelist = async (pl) => {
  if (confirm(`Hapus event "${pl.name}"?\n\nSemua harga event di dalamnya juga akan dihapus permanen.`)) {
    await pricelistStore.deletePricelist(pl.id)
    if (expandedPlId.value === pl.id) expandedPlId.value = null
  }
}

// ── Add Item handlers ─────────────────────────────────────────────────────────
const openAddItemModal = (pl) => {
  addItemTargetPl.value  = pl
  addItemFormError.value = ''
  Object.assign(addItemForm, { productId: '', eventPrice: 0 })
  showAddItemModal.value = true
}

const onAddItemProductSelect = (product) => {
  if (!product) return
  addItemForm.productId  = product.id
  addItemForm.eventPrice = product.sellingPrice ?? product.price ?? 0
}

const handleAddPlItem = async () => {
  addItemFormError.value = ''
  const product = productsStore.getProductById(addItemForm.productId)
  if (!product) { addItemFormError.value = 'Produk tidak valid'; return }
  const result = await pricelistStore.addPricelistItem(addItemTargetPl.value.id, product, addItemForm.eventPrice)
  if (result.success) { showAddItemModal.value = false }
  else { addItemFormError.value = result.message }
}

const handleUpdateItemPrice = async (pli, rawValue) => {
  const newPrice = parseInt(rawValue)
  if (isNaN(newPrice) || newPrice < 0) return
  await pricelistStore.updatePricelistItem(pli.id, newPrice)
}

const handleRemovePlItem = async (pli) => {
  if (confirm(`Hapus "${pli.productName}" dari pricelist ini?`)) {
    await pricelistStore.removePricelistItem(pli.id)
  }
}
</script>

<style scoped>
.module-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  min-height: 100vh;

  --accent: #6366f1;
  --accent-soft: rgba(99,102,241,0.1);
  --success: #059669;
  --success-soft: rgba(5,150,105,0.1);
  --danger: #dc2626;
  --danger-soft: rgba(220,38,38,0.08);
  --warning: #d97706;
  --border: #e2e8f0;
  --border-strong: #cbd5e1;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --surface: #fff;
  --surface-elevated: #f8fafc;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.module-page[data-theme="dark"] {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --border: #334155;
  --border-strong: #475569;
  --surface: #1e293b;
  --surface-elevated: #0f172a;
  --accent: #818cf8;
  --accent-soft: rgba(129,140,248,0.15);
  --success: #34d399;
  --success-soft: rgba(52,211,153,0.12);
}

/* ── Header ─────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
  gap: 1rem;
}
.header-content { display: flex; flex-direction: column; gap: 0.3rem; }
.breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-subtitle { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 14px rgba(99,102,241,0.3);
  white-space: nowrap;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
.btn-primary:active { transform: translateY(0); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

/* ── Active Banner ──────────────────────────────────────────────── */
.pl-active-banner {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  background: var(--success-soft);
  border: 1.5px solid rgba(5,150,105,0.2);
  color: var(--success);
  font-size: 0.875rem;
  font-weight: 500;
}
.pl-deactivate-btn {
  margin-left: auto;
  padding: 0.3rem 0.875rem;
  border-radius: 999px;
  border: 1.5px solid currentColor;
  background: transparent;
  color: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.pl-deactivate-btn:hover { background: var(--success); color: #fff; border-color: var(--success); }

/* ── Table Card ─────────────────────────────────────────────────── */
.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.state-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.data-table { width: 100%; border-collapse: collapse; }
.data-table thead th {
  padding: 0.875rem 1.25rem;
  background: var(--surface-elevated);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-tertiary);
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.data-table tbody td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
  color: var(--text-primary);
  vertical-align: middle;
}
.table-row:last-child td { border-bottom: none; }
.table-row:hover { background: rgba(99,102,241,0.03); }

.empty-row { text-align: center; padding: 3rem 1rem !important; color: var(--text-secondary); }
.empty-visual { margin-bottom: 0.75rem; opacity: 0.4; }
.empty-hint { font-size: 0.8rem; color: var(--text-tertiary); }
.empty-row p { margin: 0.25rem 0 0.5rem; font-weight: 500; }

/* ── Table cells ────────────────────────────────────────────────── */
.pl-name-cell { display: flex; align-items: center; gap: 0.625rem; }
.pl-icon { font-size: 1.1rem; }
.col-desc { color: var(--text-secondary); font-size: 0.83rem; }
.count-chip {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.toggle-cell { display: flex; align-items: center; gap: 0.625rem; }

/* ── Toggle Switch ──────────────────────────────────────────────── */
.toggle-switch { display: inline-flex; align-items: center; cursor: pointer; }
.toggle-switch input { display: none; }
.toggle-slider {
  position: relative;
  display: inline-block;
  width: 40px; height: 22px;
  background: var(--border-strong);
  border-radius: 999px;
  transition: var(--transition);
}
.toggle-slider::after {
  content: '';
  position: absolute;
  top: 4px; left: 4px;
  width: 14px; height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: var(--transition);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-switch input:checked + .toggle-slider { background: var(--success); }
.toggle-switch input:checked + .toggle-slider::after { transform: translateX(18px); }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.badge-success { background: var(--success-soft); color: var(--success); }
.badge-inactive { background: rgba(100,116,139,0.12); color: #64748b; }

/* ── Action Buttons ─────────────────────────────────────────────── */
.col-actions { display: flex; gap: 0.375rem; align-items: center; }
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
}
.expand-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.expand-btn.is-expanded { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
.expand-btn.is-expanded svg { transform: rotate(180deg); }
.edit-btn:hover { border-color: #0ea5e9; color: #0ea5e9; background: rgba(14,165,233,0.08); }
.delete-btn:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-soft); }

/* ── Expanded Items ─────────────────────────────────────────────── */
.pl-items-row td { padding: 0 !important; }
.pl-items-cell {
  padding: 1.25rem 1.75rem !important;
  background: var(--surface-elevated);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.pl-items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.pl-items-title-wrap { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); }
.pl-items-title { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }

.btn-add-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 1rem;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.btn-add-item:hover { background: var(--accent); color: #fff; }

.items-empty {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-style: italic;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
}

.pl-items-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.pl-items-table th {
  padding: 0.5rem 0.875rem;
  text-align: left;
  color: var(--text-tertiary);
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.pl-items-table td {
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
  vertical-align: middle;
}
.pl-items-table tr:last-child td { border-bottom: none; }

.col-prod-name { font-weight: 600; }
.col-hpp { color: var(--text-secondary); }
.col-normal { color: var(--text-secondary); }
.sku-chip {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

/* ── Event Price Input ──────────────────────────────────────────── */
.event-price-wrap { display: flex; align-items: center; gap: 0.25rem; }
.rp-prefix { font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; }
.event-price-input {
  width: 110px;
  padding: 0.35rem 0.6rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-primary);
  font-size: 0.83rem;
  outline: none;
  transition: var(--transition);
}
.event-price-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.input-loss { border-color: var(--danger) !important; background: rgba(220,38,38,0.05) !important; }

/* ── Item badges ────────────────────────────────────────────────── */
.loss-badge {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 0.72rem; font-weight: 700; color: var(--danger);
  background: var(--danger-soft); border: 1px solid rgba(220,38,38,0.25);
  padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap;
}
.discount-badge {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 0.72rem; font-weight: 700; color: var(--success);
  background: var(--success-soft); border: 1px solid rgba(5,150,105,0.2);
  padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap;
}
.neutral-badge {
  font-size: 0.72rem; font-weight: 600; color: var(--text-tertiary);
  padding: 0.2rem 0.6rem; border-radius: 999px;
  background: rgba(100,116,139,0.08); white-space: nowrap;
}

/* ── Modal ──────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal-box {
  background: var(--surface);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 1.75rem 1.25rem;
  border-bottom: 1px solid var(--border);
}
.header-text { display: flex; flex-direction: column; gap: 0.2rem; }
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.modal-subtitle { font-size: 0.825rem; color: var(--text-secondary); margin: 0; }
.modal-close {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  border: 1.5px solid var(--border);
  background: transparent; color: var(--text-secondary);
  cursor: pointer; transition: var(--transition);
}
.modal-close:hover { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); }
.modal-form { padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }

/* ── Form Elements ──────────────────────────────────────────────── */
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); }
.required { color: #ef4444; }
.input-field {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
  transition: var(--transition);
  width: 100%;
  box-sizing: border-box;
}
.input-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.input-with-prefix { display: flex; align-items: stretch; }
.prefix {
  padding: 0.75rem 0.875rem;
  background: var(--surface-elevated);
  border: 1.5px solid var(--border);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.input-with-prefix .input-field { border-radius: 0 var(--radius-md) var(--radius-md) 0; }

.selected-product-info {
  display: flex; flex-direction: column; gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.83rem;
}
.info-row { display: flex; justify-content: space-between; align-items: center; }
.info-label { color: var(--text-secondary); }
.info-val { font-weight: 600; color: var(--text-primary); }

/* ── Loss Alert Box ─────────────────────────────────────────────── */
.loss-alert-box {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: var(--danger-soft);
  border: 1.5px solid rgba(220,38,38,0.25);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem;
  color: var(--danger);
}
.loss-text { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.83rem; }
.loss-text strong { font-size: 0.875rem; }

.profit-preview {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  background: var(--success-soft);
  border: 1.5px solid rgba(5,150,105,0.2);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.83rem;
  color: var(--success);
}

.form-error-msg {
  padding: 0.75rem 1rem;
  background: var(--danger-soft);
  border: 1.5px solid rgba(220,38,38,0.25);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: 0.83rem;
}

/* ── Buttons in modal ───────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: var(--transition);
}
.btn-ghost {
  background: transparent;
  border: 1.5px solid var(--border);
  color: var(--text-secondary);
}
.btn-ghost:hover { background: var(--surface-elevated); }

/* ── Spinner ────────────────────────────────────────────────────── */
.spinner-sm {
  width: 0.9rem; height: 0.9rem;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.spinner-ring {
  width: 1.5rem; height: 1.5rem;
  border: 2.5px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transitions ────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
