<template>
  <div class="module-page" :data-theme="theme">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Purchase Barang</h1>
        <p class="page-subtitle">Tambah stok masuk &amp; hitung HPP rata-rata otomatis</p>
      </div>
    </div>

    <!-- ── Success Toast ── -->
    <transition name="toast-slide">
      <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline v-if="toast.type === 'success'" points="20 6 9 17 4 12"/>
          <path v-else d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
        <div>
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click="toast.show = false">×</button>
      </div>
    </transition>

    <!-- ── Two-column Layout ── -->
    <div class="layout-grid">

      <!-- LEFT: Form -->
      <div class="form-card">
        <div class="form-card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <h2 class="section-title">Input Stok Masuk</h2>
        </div>

        <!-- Combobox Produk -->
        <div class="form-group">
          <label class="form-label">Pilih Produk <span class="req">*</span></label>
          <AppCombobox
            v-model="selectedProductId"
            :options="singleProducts"
            option-key="id"
            option-label="name"
            option-sub-label="sku"
            placeholder="-- Cari SKU atau Nama Produk --"
            search-placeholder="Ketik SKU atau nama..."
            :clearable="true"
            @select="onProductSelect"
          />
        </div>

        <!-- Product Info Card -->
        <transition name="fade-slide">
          <div v-if="selectedProduct" class="product-info-card">
            <div class="info-row">
              <span class="info-label">SKU</span>
              <code class="info-code">{{ selectedProduct.sku }}</code>
            </div>
            <div class="info-row">
              <span class="info-label">Kategori</span>
              <span class="info-val">{{ selectedProduct.category?.name || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Stok Saat Ini</span>
              <span class="info-val" :class="selectedProduct.stock <= (selectedProduct.lowStockThreshold || 10) ? 'text-danger' : ''">
                {{ selectedProduct.stock }} unit
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">HPP Saat Ini</span>
              <span class="info-val accent">Rp {{ fmt(selectedProduct.hpp) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Harga Jual</span>
              <span class="info-val">Rp {{ fmt(selectedProduct.sellingPrice || selectedProduct.price) }}</span>
            </div>
          </div>
        </transition>

        <!-- Form Fields -->
        <form v-if="selectedProduct" @submit.prevent="handlePurchase" class="purchase-form">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Jumlah Beli <span class="req">*</span></label>
              <input v-model.number="form.qty" class="input-field" type="number" min="1" placeholder="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Harga Beli / Unit <span class="req">*</span></label>
              <div class="input-prefix-wrap">
                <span class="iprefix">Rp</span>
                <input v-model.number="form.costPerUnit" class="input-field iprefix-pad" type="number" min="0" placeholder="0" required />
              </div>
            </div>
          </div>

          <!-- Tanggal Kadaluarsa (conditional) -->
          <div v-if="needsExpiry" class="form-group">
            <label class="form-label">
              Tanggal Kadaluarsa <span class="req">*</span>
              <span class="expiry-hint">— wajib untuk kategori {{ selectedProduct.category?.name }}</span>
            </label>
            <input v-model="form.expiryDate" class="input-field" type="date" :required="needsExpiry" :min="todayStr" />
          </div>

          <!-- Catatan / Supplier -->
          <div class="form-group">
            <label class="form-label">Catatan / Supplier</label>
            <input v-model="form.note" class="input-field" type="text" placeholder="Opsional — nama supplier, no. PO, dll." />
          </div>

          <!-- HPP Preview -->
          <transition name="fade-slide">
            <div v-if="form.qty > 0 && form.costPerUnit > 0" class="hpp-preview">
              <div class="hpp-preview-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Preview Kalkulasi HPP
              </div>
              <div class="hpp-grid">
                <div class="hpp-row-item">
                  <span>Stok Lama</span>
                  <span>{{ selectedProduct.stock }} unit × Rp {{ fmt(selectedProduct.hpp) }}</span>
                </div>
                <div class="hpp-row-item">
                  <span>+ Stok Baru</span>
                  <span>{{ form.qty }} unit × Rp {{ fmt(form.costPerUnit) }}</span>
                </div>
                <div class="hpp-divider"></div>
                <div class="hpp-row-item hpp-result">
                  <span>HPP Baru (Avg)</span>
                  <span class="hpp-new-val">Rp {{ fmt(previewHpp) }}</span>
                </div>
                <div class="hpp-row-item">
                  <span>Stok Akhir</span>
                  <strong>{{ selectedProduct.stock + form.qty }} unit</strong>
                </div>
                <div class="hpp-row-item" v-if="previewHpp !== selectedProduct.hpp">
                  <span>Perubahan HPP</span>
                  <span :class="previewHpp > selectedProduct.hpp ? 'text-warning' : 'text-success'">
                    {{ previewHpp > selectedProduct.hpp ? '▲' : '▼' }}
                    Rp {{ fmt(Math.abs(previewHpp - selectedProduct.hpp)) }}
                  </span>
                </div>
              </div>
            </div>
          </transition>

          <p v-if="formError" class="form-error">{{ formError }}</p>
          <button type="submit" class="btn btn-primary btn-full" :disabled="submitting">
            <span v-if="submitting" class="spinner-sm"></span>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="19 11 12 18 5 11"/><line x1="12" y1="3" x2="12" y2="18"/>
            </svg>
            {{ submitting ? 'Memproses...' : 'Simpan Pembelian' }}
          </button>
        </form>

        <div v-else class="no-product-hint">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <p>Pilih produk di atas untuk mulai input stok</p>
        </div>
      </div>

      <!-- RIGHT: Purchase History -->
      <div class="history-panel">
        <div class="history-header">
          <div class="history-title-wrap">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <h2 class="section-title">Riwayat Pembelian</h2>
            <span class="history-count-badge">{{ filteredHistory.length }}</span>
          </div>
        </div>

        <!-- Filters -->
        <div class="filter-bar">
          <div class="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input v-model="histSearch" class="filter-input" type="text" placeholder="Cari nama produk / SKU..." />
          </div>
          <div class="date-filter-wrap">
            <input v-model="histDateFrom" class="filter-input date-input" type="date" title="Dari tanggal" />
            <span class="date-sep">—</span>
            <input v-model="histDateTo" class="filter-input date-input" type="date" title="Sampai tanggal" />
            <button v-if="histSearch || histDateFrom || histDateTo" class="clear-filter-btn" @click="clearFilters" title="Reset filter">×</button>
          </div>
        </div>

        <!-- Table -->
        <div class="history-table-wrap">
          <div v-if="productsStore.loading" class="state-empty">
            <span class="spinner-ring"></span> Memuat...
          </div>
          <div v-else-if="filteredHistory.length === 0" class="state-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>{{ histSearch || histDateFrom || histDateTo ? 'Tidak ada data sesuai filter.' : 'Belum ada riwayat pembelian.' }}</p>
          </div>
          <table v-else class="h-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Produk</th>
                <th>SKU</th>
                <th class="num">Qty</th>
                <th class="num">Harga Beli</th>
                <th class="num">HPP Lama</th>
                <th class="num">HPP Baru</th>
                <th>Expired</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rec in filteredHistory"
                :key="rec.id"
                :class="{ 'row-voided': rec.voided }"
              >
                <td class="col-date">{{ fmtDate(rec.purchasedAt) }}</td>
                <td class="col-name">
                  {{ getProductName(rec.productId) }}
                  <span v-if="rec.voided" class="void-tag">DIBATALKAN</span>
                </td>
                <td><code class="sku-chip">{{ getProductSku(rec.productId) }}</code></td>
                <td class="num qty-col">+{{ rec.qty }}</td>
                <td class="num">Rp {{ fmt(rec.buyPrice) }}</td>
                <td class="num hpp-old">Rp {{ fmt(rec.previousHpp) }}</td>
                <td class="num hpp-new">Rp {{ fmt(rec.newHpp) }}</td>
                <td class="col-exp">{{ rec.expiryDate ? fmtDateShort(rec.expiryDate) : '—' }}</td>
                <td>
                  <div class="row-actions">
                    <button class="action-btn view-btn" @click="openDetail(rec)" title="Lihat Detail">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <button
                      v-if="!rec.voided"
                      class="action-btn void-btn"
                      @click="openVoid(rec)"
                      title="Batalkan Transaksi (Superuser)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Modal: Detail ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="detailRec" class="modal-overlay" @click.self="detailRec = null">
          <div class="modal-box">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Detail Transaksi Pembelian</h3>
                <p class="modal-sub">ID: {{ detailRec.id }}</p>
              </div>
              <button class="modal-close" @click="detailRec = null">×</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item"><span class="dl">Produk</span><span class="dv">{{ getProductName(detailRec.productId) }}</span></div>
                <div class="detail-item"><span class="dl">SKU</span><code class="dv sku-chip">{{ getProductSku(detailRec.productId) }}</code></div>
                <div class="detail-item"><span class="dl">Tanggal Masuk</span><span class="dv">{{ fmtDateFull(detailRec.purchasedAt) }}</span></div>
                <div class="detail-item"><span class="dl">Qty Masuk</span><span class="dv qty-col">+{{ detailRec.qty }} unit</span></div>
                <div class="detail-item"><span class="dl">Harga Beli / Unit</span><span class="dv">Rp {{ fmt(detailRec.buyPrice) }}</span></div>
                <div class="detail-item"><span class="dl">Total Nilai Beli</span><strong class="dv">Rp {{ fmt(detailRec.buyPrice * detailRec.qty) }}</strong></div>
                <div class="detail-item"><span class="dl">Stok Sebelum</span><span class="dv">{{ detailRec.previousStock }} unit</span></div>
                <div class="detail-item"><span class="dl">Stok Sesudah</span><span class="dv">{{ detailRec.newStock }} unit</span></div>
                <div class="detail-item"><span class="dl">HPP Sebelum</span><span class="dv hpp-old">Rp {{ fmt(detailRec.previousHpp) }}</span></div>
                <div class="detail-item"><span class="dl">HPP Sesudah</span><span class="dv hpp-new">Rp {{ fmt(detailRec.newHpp) }}</span></div>
                <div class="detail-item"><span class="dl">Tgl Kadaluarsa</span><span class="dv">{{ detailRec.expiryDate ? fmtDateShort(detailRec.expiryDate) : '—' }}</span></div>
                <div class="detail-item"><span class="dl">Catatan</span><span class="dv">{{ detailRec.note || '—' }}</span></div>
                <div v-if="detailRec.voided" class="detail-item detail-full">
                  <span class="dl">Status</span>
                  <span class="dv void-tag">DIBATALKAN — {{ fmtDateFull(detailRec.voidedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ── Modal: Void (Superuser) ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="voidTarget" class="modal-overlay" @click.self="closeVoid">
          <div class="modal-box modal-sm">
            <div class="modal-header">
              <h3 class="modal-title danger-title">Batalkan Transaksi?</h3>
              <button class="modal-close" @click="closeVoid">×</button>
            </div>
            <div class="modal-body">
              <div class="void-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p>Tindakan ini akan <strong>mengembalikan stok dan HPP</strong> ke nilai sebelum transaksi.</p>
                  <p class="void-detail">
                    Stok: <strong>{{ voidTarget.newStock }} → {{ voidTarget.previousStock }} unit</strong><br/>
                    HPP: <strong>Rp {{ fmt(voidTarget.newHpp) }} → Rp {{ fmt(voidTarget.previousHpp) }}</strong>
                  </p>
                </div>
              </div>

              <!-- Superuser PIN -->
              <div class="form-group mt-1">
                <label class="form-label">PIN Supervisor <span class="req">*</span></label>
                <input
                  v-model="voidPin"
                  class="input-field"
                  type="password"
                  placeholder="Masukkan PIN supervisor"
                  autocomplete="off"
                  @keyup.enter="handleVoid"
                />
              </div>
              <p v-if="voidError" class="form-error">{{ voidError }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="closeVoid">Batal</button>
              <button class="btn btn-danger" @click="handleVoid" :disabled="!voidPin || voidLoading">
                <span v-if="voidLoading" class="spinner-sm"></span>
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'
import AppCombobox from '@/components/AppCombobox.vue'

const productsStore   = useProductsStore()
const categoriesStore = useCategoriesStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })

// ── Toast ──────────────────────────────────────────────────────────────────────
const toast = reactive({ show: false, type: 'success', title: '', message: '' })
let toastTimer = null
const showToast = (type, title, message) => {
  clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, title, message })
  toastTimer = setTimeout(() => { toast.show = false }, 5500)
}

// ── Form State ─────────────────────────────────────────────────────────────────
const selectedProductId = ref('')
const submitting        = ref(false)
const formError         = ref('')
const form = reactive({ qty: 0, costPerUnit: 0, expiryDate: '', note: '' })

const todayStr = new Date().toISOString().split('T')[0]

// ── Selected Product ──────────────────────────────────────────────────────────
const selectedProduct = computed(() =>
  productsStore.products.find(p => p.id === selectedProductId.value) ?? null
)

// Only show SINGLE type products (bundles are not directly purchasable)
const singleProducts = computed(() =>
  productsStore.products.filter(p => p.type !== 'BUNDLE')
)

// ── Expiry Check ──────────────────────────────────────────────────────────────
const needsExpiry = computed(() => {
  if (!selectedProduct.value?.categoryId) return false
  const cat = categoriesStore.categories.find(c => c.id === selectedProduct.value.categoryId)
  return cat?.hasExpiration === true
})

// ── HPP Preview ───────────────────────────────────────────────────────────────
const previewHpp = computed(() => {
  if (!selectedProduct.value || form.qty <= 0 || form.costPerUnit <= 0) return 0
  const totalOld = selectedProduct.value.stock * (selectedProduct.value.hpp || 0)
  const totalNew  = form.qty * form.costPerUnit
  return Math.round((totalOld + totalNew) / (selectedProduct.value.stock + form.qty))
})

// ── Handlers ──────────────────────────────────────────────────────────────────
const onProductSelect = (product) => {
  if (product) selectedProductId.value = product.id
  Object.assign(form, { qty: 0, costPerUnit: 0, expiryDate: '', note: '' })
  formError.value = ''
}

const handlePurchase = async () => {
  formError.value = ''
  if (!selectedProduct.value) return
  if (needsExpiry.value && !form.expiryDate) {
    formError.value = `Tanggal kadaluarsa wajib diisi untuk kategori ${selectedProduct.value.category?.name}`
    return
  }
  if (form.qty <= 0) { formError.value = 'Jumlah beli harus lebih dari 0'; return }
  if (form.costPerUnit <= 0) { formError.value = 'Harga beli harus lebih dari 0'; return }

  submitting.value = true
  const oldHpp = selectedProduct.value.hpp || 0

  try {
    const result = await productsStore.purchaseStock(
      selectedProductId.value,
      form.qty,
      form.costPerUnit,
      needsExpiry.value ? form.expiryDate : null
    )

    // Attach note to last record (mock extension)
    if (result.success && form.note && productsStore.purchaseRecords.length) {
      const last = productsStore.purchaseRecords[productsStore.purchaseRecords.length - 1]
      last.note = form.note
    }

    if (result.success) {
      const newHpp = result.data?.newHpp ?? previewHpp.value
      showToast('success',
        'Pembelian Berhasil!',
        `${selectedProduct.value.name} — HPP: Rp ${fmt(oldHpp)} → Rp ${fmt(newHpp)}. Stok +${form.qty} unit.`
      )
      Object.assign(form, { qty: 0, costPerUnit: 0, expiryDate: '', note: '' })
    } else {
      formError.value = result.message || 'Gagal memproses pembelian.'
    }
  } finally {
    submitting.value = false
  }
}

// ── History Filter ────────────────────────────────────────────────────────────
const histSearch   = ref('')
const histDateFrom = ref('')
const histDateTo   = ref('')

const clearFilters = () => {
  histSearch.value   = ''
  histDateFrom.value = ''
  histDateTo.value   = ''
}

const allHistory = computed(() =>
  [...productsStore.purchaseRecords]
    .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
)

const filteredHistory = computed(() => {
  let list = allHistory.value
  const term = histSearch.value.toLowerCase()
  if (term) {
    list = list.filter(r => {
      const name = getProductName(r.productId).toLowerCase()
      const sku  = getProductSku(r.productId).toLowerCase()
      return name.includes(term) || sku.includes(term)
    })
  }
  if (histDateFrom.value) {
    const from = new Date(histDateFrom.value)
    list = list.filter(r => new Date(r.purchasedAt) >= from)
  }
  if (histDateTo.value) {
    const to = new Date(histDateTo.value)
    to.setHours(23, 59, 59, 999)
    list = list.filter(r => new Date(r.purchasedAt) <= to)
  }
  return list
})

// ── Detail Modal ──────────────────────────────────────────────────────────────
const detailRec = ref(null)
const openDetail = (rec) => { detailRec.value = rec }

// ── Void Modal ────────────────────────────────────────────────────────────────
const voidTarget  = ref(null)
const voidPin     = ref('')
const voidError   = ref('')
const voidLoading = ref(false)
const SUPERVISOR_PIN = '1234' // In production: validate via supervisor store / API

const openVoid  = (rec) => { voidTarget.value = rec; voidPin.value = ''; voidError.value = '' }
const closeVoid = () => { voidTarget.value = null; voidPin.value = ''; voidError.value = '' }

const handleVoid = async () => {
  voidError.value = ''
  if (voidPin.value !== SUPERVISOR_PIN) {
    voidError.value = 'PIN salah. Hubungi supervisor atau admin.'
    return
  }
  voidLoading.value = true
  await new Promise(r => setTimeout(r, 500)) // simulate API call

  const rec     = voidTarget.value
  const product = productsStore.getProductById(rec.productId)
  if (product) {
    // Revert: stock and HPP back to previousStock / previousHpp
    product.stock = rec.previousStock
    product.hpp   = rec.previousHpp
    product.isLowStock = product.stock <= (product.lowStockThreshold || 10)
  }

  // Mark record as voided (keep as audit trail)
  rec.voided   = true
  rec.voidedAt = new Date().toISOString()

  voidLoading.value = false
  closeVoid()
  showToast('warning', 'Transaksi Dibatalkan', `Purchase ${rec.id} telah dibatalkan. Stok dan HPP dikembalikan.`)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) => Math.round(v || 0).toLocaleString('id-ID')
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const fmtDateShort = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
const fmtDateFull = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const getProductName = (id) => productsStore.getProductById(id)?.name ?? id
const getProductSku  = (id) => productsStore.getProductById(id)?.sku  ?? '—'

onMounted(async () => {
  await Promise.all([productsStore.fetchProducts(), categoriesStore.fetchAll()])
})
</script>

<style scoped>
/* ── Base ── */
.module-page {
  padding: 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  --accent: #6366f1;
  --success: #059669;
  --danger: #dc2626;
  --warning: #d97706;
  --border: #e2e8f0;
  --surface: #fff;
  --surface2: #f8fafc;
  --text1: #1e293b;
  --text2: #64748b;
  --text3: #94a3b8;
  --radius: 14px;
}
.module-page[data-theme="dark"] {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  --border: #334155;
  --surface: #1e293b;
  --surface2: #0f172a;
  --text1: #f1f5f9;
  --text2: #94a3b8;
  --text3: #475569;
}

/* ── Page Header ── */
.page-header { margin-bottom: 1.75rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.85rem; font-weight: 700; color: var(--text1); margin: 0; }
.page-subtitle { font-size: 0.875rem; color: var(--text2); margin-top: 0.3rem; }

/* ── Toast ── */
.toast {
  position: fixed; top: 1.25rem; right: 1.25rem; z-index: 9999;
  display: flex; align-items: flex-start; gap: 0.875rem;
  padding: 1rem 1.25rem; border-radius: 14px; max-width: 400px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.toast-success { background: #ecfdf5; border: 1.5px solid rgba(5,150,105,0.3); color: #065f46; }
.toast-warning { background: #fffbeb; border: 1.5px solid rgba(245,158,11,0.3); color: #78350f; }
.toast-title { font-weight: 700; font-size: 0.9rem; }
.toast-msg  { font-size: 0.82rem; margin-top: 0.2rem; line-height: 1.4; }
.toast-close { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; padding: 0; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(1rem); }

/* ── Layout ── */
.layout-grid { display: grid; grid-template-columns: 400px 1fr; gap: 1.5rem; align-items: start; }
@media (max-width: 1024px) { .layout-grid { grid-template-columns: 1fr; } }

/* ── Form Card ── */
.form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
.form-card-header { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1.25rem; color: var(--text2); }
.section-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.05rem; font-weight: 700; color: var(--text1); margin: 0; }

/* ── Product Info Card ── */
.product-info-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.info-row { display: flex; justify-content: space-between; align-items: center; }
.info-label { font-size: 0.75rem; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em; }
.info-val { font-size: 0.875rem; font-weight: 600; color: var(--text1); }
.info-code { font-size: 0.8rem; padding: 0.1rem 0.4rem; background: var(--border); border-radius: 4px; color: var(--text2); }
.accent { color: var(--accent) !important; }
.text-danger  { color: var(--danger); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }

/* ── Form ── */
.purchase-form { border-top: 1px solid var(--border); padding-top: 1.25rem; margin-top: 0.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
.form-label { font-size: 0.8rem; font-weight: 600; color: var(--text2); }
.req { color: var(--danger); }
.expiry-hint { font-weight: 400; color: var(--warning); font-size: 0.75rem; }
.input-field   { padding: 0.8rem 1rem; border: 1.5px solid var(--border); border-radius: 11px; background: var(--surface); color: var(--text1); font-size: 0.875rem; outline: none; width: 100%; box-sizing: border-box; transition: all 0.25s; }
.input-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.input-prefix-wrap { display: flex; align-items: stretch; }
.iprefix { padding: 0.8rem 0.875rem; background: var(--surface2); border: 1.5px solid var(--border); border-right: none; border-radius: 11px 0 0 11px; font-size: 0.8rem; font-weight: 700; color: var(--text3); }
.iprefix-pad { border-radius: 0 11px 11px 0; }
.mt-1 { margin-top: 0.75rem; }

/* ── HPP Preview ── */
.hpp-preview { background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05)); border: 1.5px solid rgba(99,102,241,0.18); border-radius: 12px; padding: 1rem; margin-bottom: 0.875rem; }
.hpp-preview-title { font-size: 0.78rem; font-weight: 700; color: var(--accent); display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
.hpp-grid { display: flex; flex-direction: column; gap: 0.4rem; }
.hpp-row-item { display: flex; justify-content: space-between; font-size: 0.83rem; color: var(--text2); }
.hpp-row-item strong { color: var(--text1); }
.hpp-divider  { height: 1px; background: rgba(99,102,241,0.15); margin: 0.25rem 0; }
.hpp-result   { font-weight: 600; color: var(--text1); }
.hpp-new-val  { color: var(--accent); font-size: 1rem; font-weight: 800; }

/* ── No Product Hint ── */
.no-product-hint { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2.5rem 1rem; color: var(--text3); text-align: center; border-top: 1px solid var(--border); margin-top: 1rem; }

/* ── Buttons ── */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 11px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.25s; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 6px 20px -4px rgba(99,102,241,0.4); }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 24px -4px rgba(99,102,241,0.5); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-ghost  { background: var(--surface2); color: var(--text2); border: 1.5px solid var(--border); }
.btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }
.btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-full { width: 100%; margin-top: 0.25rem; }

/* ── History Panel ── */
.history-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
.history-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.history-title-wrap { display: flex; align-items: center; gap: 0.625rem; }
.history-count-badge { padding: 0.15rem 0.55rem; background: rgba(99,102,241,0.12); color: var(--accent); border-radius: 999px; font-size: 0.72rem; font-weight: 700; }

/* ── Filter Bar ── */
.filter-bar { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
.search-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--surface2); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.55rem 0.875rem; flex: 1; min-width: 200px; }
.search-wrap:focus-within { border-color: var(--accent); }
.filter-input { border: none; background: transparent; outline: none; font-size: 0.875rem; color: var(--text1); width: 100%; }
.date-filter-wrap { display: flex; align-items: center; gap: 0.375rem; }
.date-input { width: 130px; border: 1.5px solid var(--border); border-radius: 10px; padding: 0.5rem 0.7rem; background: var(--surface2); color: var(--text1); font-size: 0.8rem; outline: none; }
.date-input:focus { border-color: var(--accent); }
.date-sep { color: var(--text3); font-size: 0.8rem; }
.clear-filter-btn { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--border); background: var(--surface2); color: var(--text3); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.clear-filter-btn:hover { border-color: var(--danger); color: var(--danger); }

/* ── History Table ── */
.history-table-wrap { overflow-x: auto; }
.h-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.h-table thead th { padding: 0.625rem 0.875rem; text-align: left; font-size: 0.68rem; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1.5px solid var(--border); white-space: nowrap; background: var(--surface2); }
.h-table th.num, .h-table td.num { text-align: right; }
.h-table tbody td { padding: 0.7rem 0.875rem; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: middle; }
.h-table tbody tr:last-child td { border-bottom: none; }
.h-table tbody tr:hover td { background: rgba(99,102,241,0.03); }
.row-voided td { opacity: 0.55; }
.col-date { white-space: nowrap; font-size: 0.77rem; color: var(--text3); }
.col-name { font-weight: 600; color: var(--text1); }
.col-exp  { font-size: 0.78rem; }
.qty-col  { color: var(--success); font-weight: 700; }
.hpp-old  { color: var(--text3); text-decoration: line-through; }
.hpp-new  { color: var(--accent); font-weight: 700; }
.sku-chip { font-size: 0.75rem; padding: 0.15rem 0.45rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 5px; color: var(--text2); }
.void-tag { display: inline-flex; padding: 0.1rem 0.45rem; background: rgba(220,38,38,0.1); color: var(--danger); border-radius: 999px; font-size: 0.65rem; font-weight: 700; margin-left: 0.4rem; border: 1px solid rgba(220,38,38,0.2); }

/* ── Row Actions ── */
.row-actions { display: flex; gap: 0.3rem; }
.action-btn { width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid var(--border); background: var(--surface); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text3); transition: all 0.2s; }
.view-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(99,102,241,0.08); }
.void-btn:hover { border-color: var(--danger); color: var(--danger); background: rgba(220,38,38,0.08); }

/* ── State Empty ── */
.state-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem 1rem; color: var(--text3); text-align: center; }

/* ── Modal ── */
.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,0.55); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.modal-box { background: var(--surface); border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden; }
.modal-sm { max-width: 420px; }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.5rem 1.75rem 1.25rem; border-bottom: 1px solid var(--border); background: var(--surface2); }
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.1rem; font-weight: 700; color: var(--text1); margin: 0; }
.modal-sub { font-size: 0.78rem; color: var(--text3); margin: 0.2rem 0 0; }
.danger-title { color: var(--danger); }
.modal-close { width: 30px; height: 30px; border: none; background: none; font-size: 1.4rem; color: var(--text3); cursor: pointer; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: rgba(220,38,38,0.1); color: var(--danger); }
.modal-body { padding: 1.5rem 1.75rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.25rem 1.75rem; border-top: 1px solid var(--border); background: var(--surface2); }

/* ── Detail Grid ── */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
.detail-full { grid-column: 1 / -1; }
.detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
.dl { font-size: 0.7rem; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.05em; }
.dv { font-size: 0.875rem; font-weight: 600; color: var(--text1); }

/* ── Void Warning ── */
.void-warning { display: flex; gap: 0.875rem; align-items: flex-start; background: rgba(220,38,38,0.07); border: 1.5px solid rgba(220,38,38,0.2); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; color: var(--danger); font-size: 0.85rem; }
.void-warning p { margin: 0.25rem 0; line-height: 1.5; }
.void-detail { margin-top: 0.5rem !important; color: var(--text2); font-size: 0.82rem; }

/* ── Misc ── */
.form-error { color: var(--danger); font-size: 0.82rem; background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; }
.form-hint  { font-size: 0.75rem; color: var(--warning); }
.spinner-ring { width: 1.25rem; height: 1.25rem; border: 2.5px solid rgba(99,102,241,0.2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
.spinner-sm   { width: 0.9rem; height: 0.9rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.25s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
