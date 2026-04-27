<template>
  <div class="module-page" :data-theme="theme">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Purchase Barang</h1>
        <p class="page-subtitle">Sistem Input Transaksi Stok Masuk</p>
      </div>
    </div>

    <!-- Success Toast -->
    <transition name="toast-slide">
      <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
        <svg v-if="toast.type==='success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        <div>
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click="toast.show = false">×</button>
      </div>
    </transition>

    <div class="content-wrapper">
      <!-- Top: Combobox -->
      <div class="action-card combobox-section slide-up-fade">
        <div class="card-header text-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h2 class="section-title">Pilih Produk</h2>
        </div>
        <div class="form-group mb-0">
          <label class="form-label text-center">Ketik nama atau SKU produk yang ingin ditambah stoknya</label>
          <div class="combobox-wrapper">
            <AppCombobox
              v-model="dummySelectedProductId"
              :options="singleProducts"
              option-key="id"
              option-label="name"
              option-sub-label="sku"
              placeholder="-- Cari produk --"
              search-placeholder="Ketik SKU atau nama..."
              :clearable="true"
              @select="handleSelectProductNew"
            />
          </div>
        </div>
      </div>

      <!-- Middle: Pending list -->
      <div class="section-card slide-up-fade" style="animation-delay: 0.1s">
        <div class="card-header">
          <div class="flex-row gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <h2 class="section-title text-warning">Menunggu Konfirmasi (Pending)</h2>
          </div>
          <span class="badge badge-warning">{{ purchaseStore.pendingOrders.length }}</span>
        </div>
        
        <div class="table-wrap">
          <div v-if="purchaseStore.loading" class="state-empty"><span class="spinner-ring"></span> Memuat...</div>
          <div v-else-if="purchaseStore.pendingOrders.length === 0" class="state-empty">Tidak ada data stok yang disiapkan (Pending). Pilih produk di atas untuk memulai.</div>
          <table v-else class="h-table">
            <thead>
              <tr>
                <th>Tanggal Entri</th>
                <th>Produk</th>
                <th class="num">Tambahan Qty</th>
                <th class="num">Harga Beli / Unit</th>
                <th>Tgl Kadaluarsa</th>
                <th>Catatan</th>
                <th class="align-center">Aksi (Selesaikan Transaksi)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in purchaseStore.pendingOrders" :key="order.id" class="pending-row">
                <td class="col-date">{{ fmtDate(order.createdAt) }}</td>
                <td class="col-name">
                  <div class="cell-stack">
                    <span class="fw-600">{{ order.product?.name || '—' }}</span>
                    <code class="sku-chip">{{ order.product?.sku || '—' }}</code>
                  </div>
                </td>
                <td class="num qty-col">+{{ order.qty }} Unit</td>
                <td class="num font-mono text-accent fw-600">Rp {{ fmt(order.purchasePrice) }}</td>
                <td class="col-exp">{{ order.expiryDate ? fmtDateShort(order.expiryDate) : '—' }}</td>
                <td class="text-xs text-muted">{{ order.notes || '—' }}</td>
                <td class="align-center">
                  <div class="row-actions justify-center">
                    <button class="action-btn btn-view" @click="openModalForEdit(order)" title="Edit Data" :disabled="isActionLoading === order.id">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn btn-danger-soft" @click="handleCancelTask(order.id)" title="Batal Hapus" :disabled="isActionLoading === order.id">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                    <button class="action-btn btn-success-soft" @click="handleConfirmTask(order.id)" title="Konfirmasi & Tambah Stok" :disabled="isActionLoading === order.id">
                      Konfirmasi
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom: History -->
      <div class="section-card slide-up-fade" style="animation-delay: 0.2s">
        <div class="card-header">
          <div class="flex-row gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <h2 class="section-title">Riwayat Pembelian Selesai</h2>
          </div>
          <span class="badge badge-success">{{ purchaseStore.historyOrders.length }}</span>
        </div>
        <div class="table-wrap view-only">
          <div v-if="purchaseStore.loading" class="state-empty"><span class="spinner-ring"></span> Memuat...</div>
          <div v-else-if="purchaseStore.historyOrders.length === 0" class="state-empty">Belum ada riwayat pembelian.</div>
          <table v-else class="h-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Status</th>
                <th>Tanggal Disetujui</th>
                <th>Produk</th>
                <th class="num">Penambahan Qty</th>
                <th class="num">Harga Beli</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in purchaseStore.historyOrders" :key="order.id" class="history-row">
                <td><code class="sku-chip">{{ order.invoiceNumber || order.id.substring(0,8) }}</code></td>
                <td>
                  <span class="status-badge" :class="'status-' + (order.status?.toLowerCase() || 'approved')">
                    {{ order.status || 'APPROVED' }}
                  </span>
                </td>
                <td class="col-date">{{ fmtDate(order.createdAt) }}</td>
                <td class="col-name">
                  <span class="fw-600">{{ order.product?.name || '—' }}</span>
                </td>
                <td class="num qty-col">+{{ order.qty }} Unit</td>
                <td class="num text-muted font-mono">Rp {{ fmt(order.purchasePrice) }}</td>
                <td class="text-xs">{{ order.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Modal: Add/Edit -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-teleport-wrapper">
        <div class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">{{ isEditing ? 'Ubah Data Pending' : 'Input Data Pembelian Stok' }}</h3>
                <p class="modal-sub">Masukkan jumlah & harga beli terbaru</p>
              </div>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <div class="modal-body">
              
              <!-- Product info detail -->
              <transition name="slide-down">
                <div v-if="activeProduct" class="product-info-card">
                  <div class="info-grid">
                    <div><span class="dl">Produk</span><span class="dv">{{ activeProduct.name }}</span></div>
                    <div><span class="dl">SKU</span><code class="dv sku-chip">{{ activeProduct.sku }}</code></div>
                    <div><span class="dl">Kategori</span><span class="dv text-muted">{{ activeProduct.category?.name || '—' }}</span></div>
                    <div><span class="dl">Stok Saat Ini</span><span class="dv text-primary fw-600">{{ activeProduct.totalStock || activeProduct.stock || 0 }} Unit</span></div>
                  </div>
                </div>
              </transition>

              <!-- Form Inputs -->
              <form @submit.prevent="handleSaveModal" class="purchase-form mt-2" novalidate>
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label">Tambahan Jumlah (Qty) <span class="req">*</span></label>
                    <input v-model.number="form.qty" class="input-field styled-input" type="number" placeholder="0" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Harga Beli / Unit Terbaru <span class="req">*</span></label>
                    <div class="input-prefix-wrap">
                      <span class="iprefix">Rp</span>
                      <input v-model.number="form.purchasePrice" class="input-field styled-input iprefix-pad font-mono" type="number" placeholder="0" />
                    </div>
                  </div>
                </div>

                <transition name="slide-down">
                  <div v-if="needsExpiry" class="form-group slide-in">
                    <label class="form-label">Tanggal Kadaluarsa <span class="req">*</span> (Wajib karena kategori)</label>
                    <input v-model="form.expiryDate" class="input-field styled-input" type="date" :min="today" />
                  </div>
                </transition>

                <div class="form-group">
                  <label class="form-label">Catatan</label>
                  <input v-model="form.notes" class="input-field styled-input" type="text" placeholder="Catatan pembelian, nama supplier dll." />
                </div>

                <!-- Preview total cost -->
                <div class="total-cost-preview mt-2">
                  <div class="flex-row justify-between w-full">
                    <span>Estimasi Total Nilai Pembelian:</span>
                    <strong class="font-mono text-accent">Rp {{ fmt(form.qty * form.purchasePrice) }}</strong>
                  </div>
                </div>

                <transition name="fade">
                  <div v-if="formError" class="form-error mt-1 flex-row">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ formError }}
                  </div>
                </transition>

                <div class="modal-actions mt-3 flex-row gap-2 justify-end">
                   <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                   <button type="submit" class="btn btn-primary btn-glow" :disabled="submitting">
                     <span v-if="submitting" class="spinner-sm"></span>
                     <span v-else>Simpan Perubahan</span>
                   </button>
                </div>
              </form>

            </div>
          </div>
        </div>
        </div>
      </transition>

      <!-- Modal Batal Transaksi (Hapus) -->
      <transition name="modal-fade">
        <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
          <div class="modal-box" style="max-width: 400px; text-align: center; padding: 2rem;">
            <div class="delete-icon" style="color: var(--danger); margin-bottom: 1rem;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Batalkan Transaksi?</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem;">
              Apakah Anda yakin ingin membatalkan transaksi ini? Data pembelian akan dihapus dari daftar tunggu.
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <button type="button" class="btn btn-ghost" @click="showCancelModal = false" style="flex: 1; justify-content: center;">Kembali</button>
              <button type="button" class="btn btn-danger" style="flex: 1; justify-content: center;" @click="executeCancelTask" :disabled="isActionLoading === cancelTargetId">
                <span v-if="isActionLoading === cancelTargetId" class="spinner-sm"></span>
                <span v-else>Ya, Batalkan</span>
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Modal Konfirmasi Transaksi -->
      <transition name="modal-fade">
        <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
          <div class="modal-box" style="max-width: 400px; text-align: center; padding: 2rem;">
            <div class="delete-icon" style="color: var(--success); margin-bottom: 1rem;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Konfirmasi Pembelian?</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem;">
              Apakah Anda yakin ingin mengkonfirmasi? Stok produk akan otomatis bertambah, dan tindakan ini tak bisa diedit kembali.
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <button type="button" class="btn btn-ghost" @click="showConfirmModal = false" style="flex: 1; justify-content: center;">Batal</button>
              <button type="button" class="btn" style="background: var(--success); color: white; flex: 1; justify-content: center;" @click="executeConfirmTask" :disabled="isActionLoading === confirmTargetId">
                <span v-if="isActionLoading === confirmTargetId" class="spinner-sm"></span>
                <span v-else>Konfirmasi</span>
              </button>
            </div>
          </div>
        </div>
      </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { usePurchaseOrdersStore } from '@/stores/purchaseOrders'
import { useCategoriesStore } from '@/stores/categories'
import AppCombobox from '@/components/AppCombobox.vue'

const productsStore = useProductsStore()
const purchaseStore = usePurchaseOrdersStore()
const categoriesStore = useCategoriesStore()

const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })

const dummySelectedProductId = ref('')

// Filter to single products only; avoiding bundles as they can't be purely purchased
const singleProducts = computed(() => productsStore.products.filter(p => p.type !== 'BUNDLE' && !p.isBundle))

// ── Toast System ─────────────────────────────────────────────────────────────
const toast = reactive({ show: false, type: 'success', title: '', message: '' })
let toastTimer = null
const showToast = (type, title, message) => {
  clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, title, message })
  toastTimer = setTimeout(() => { toast.show = false }, 5500)
}

// ── Modal Form State ─────────────────────────────────────────────────────────
const showModal = ref(false)
const isEditing = ref(false)
const activeProduct = ref(null)
const submitting = ref(false)
const formError = ref('')
const form = reactive({ id: null, qty: 0, purchasePrice: 0, expiryDate: '', notes: '' })
const isActionLoading = ref(null)

const showCancelModal = ref(false)
const cancelTargetId = ref(null)

const showConfirmModal = ref(false)
const confirmTargetId = ref(null)

const needsExpiry = computed(() => {
  let p = activeProduct.value
  if (!p) return false

  // Referensikan ke data produk utuh di store untuk memastikan info kategori (seperti hasExpiry) tersedia
  const storeProduct = productsStore.products.find(prod => prod.id === p.id)
  if (storeProduct) p = storeProduct

  if (p.category && typeof p.category.hasExpiry !== 'undefined') {
    return p.category.hasExpiry === true
  }
  const catId = p.categoryId || p.category?.id
  if (!catId) return false
  return cat?.hasExpiry === true
})

const today = new Date().toISOString().split('T')[0]

// ── Interactions ─────────────────────────────────────────────────────────────
const handleSelectProductNew = (product) => {
  if (!product) return
  activeProduct.value = product
  Object.assign(form, { 
    id: null, 
    qty: 1, 
    purchasePrice: product.hppAverage || product.hpp || 0, 
    expiryDate: '', 
    notes: '' 
  })
  isEditing.value = false
  formError.value = ''
  showModal.value = true
  
  // Clear combobox automatically so user can trigger it again
  setTimeout(() => { dummySelectedProductId.value = '' }, 100)
}

const openModalForEdit = (order) => {
  activeProduct.value = order.product
  Object.assign(form, { 
    id: order.id, 
    qty: order.qty, 
    purchasePrice: order.purchasePrice, 
    expiryDate: order.expiryDate ? order.expiryDate.split('T')[0] : '', 
    notes: order.notes || '' 
  })
  isEditing.value = true
  formError.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  setTimeout(() => { activeProduct.value = null }, 200) // allow fade out
}

const handleSaveModal = async () => {
  formError.value = ''

  if (!form.qty || form.qty <= 0) {
    formError.value = 'Qty wajib diisi dan harus lebih dari 0.';
    return;
  }
  if (form.purchasePrice === '' || form.purchasePrice === null || form.purchasePrice < 0) {
    formError.value = 'Harga beli wajib diisi dan tidak bisa minus / kurang dari 0.';
    return;
  }

  if (needsExpiry.value && !form.expiryDate) {
    formError.value = `Kategori ini mewajibkan Tanggal Kadaluarsa diisi.`
    return
  }

  submitting.value = true
  
  const payload = {
    productId: activeProduct.value.id,
    qty: form.qty,
    purchasePrice: form.purchasePrice,
    expiryDate: needsExpiry.value && form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
    notes: form.notes
  }

  let res;
  if (isEditing.value) {
    res = await purchaseStore.updatePurchaseOrder(form.id, payload)
  } else {
    res = await purchaseStore.createPurchaseOrder(payload)
  }

  submitting.value = false

  if (res.success) {
    showToast('success', 'Berhasil Disimpan', isEditing.value ? 'Perubahan disimpan di daftar tunggu / Pending.' : 'Ditambahkan ke daftar tunggu / Pending.')
    closeModal()
  } else {
    formError.value = res.message || 'Gagal menyimpan data ke sistem.'
  }
}

const handleCancelTask = (id) => {
  cancelTargetId.value = id
  showCancelModal.value = true
}

const executeCancelTask = async () => {
  const id = cancelTargetId.value
  isActionLoading.value = id
  const res = await purchaseStore.deletePurchaseOrder(id)
  isActionLoading.value = null
  showCancelModal.value = false
  if(res.success) {
    showToast('success', 'Transaksi Dibatalkan', 'Item telah dihapus dari daftar tunggu.')
  } else {
    showToast('danger', 'Gagal', res.message)
  }
}

const handleConfirmTask = (id) => {
  confirmTargetId.value = id
  showConfirmModal.value = true
}

const executeConfirmTask = async () => {
  const id = confirmTargetId.value
  isActionLoading.value = id
  const res = await purchaseStore.confirmPurchaseOrder(id)
  isActionLoading.value = null
  showConfirmModal.value = false
  if(res.success) {
    showToast('success', 'Sukses Terkonfirmasi', 'Stok berhasil ditambah dan disimpan ke Riwayat.')
    // Silently refresh products to sync updated stock logic for combobox display
    if(productsStore.fetchProducts) productsStore.fetchProducts({ limit: 1000 })
  } else {
    showToast('danger', 'Gagal', res.message)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => Math.round(v || 0).toLocaleString('id-ID')
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const fmtDateShort = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  await Promise.all([
    productsStore.fetchProducts({ limit: 1000 }),
    categoriesStore.fetchAll?.() || categoriesStore.fetchCategories?.(),
    purchaseStore.fetchPurchaseOrders()
  ])
})
</script>

<style scoped>
/* ── BASE FOUNDATION ── */
.module-page, .modal-teleport-wrapper {
  --primary: #4f46e5;
  --accent: #6366f1;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --border: #e2e8f0;
  --surface: #ffffff;
  --surface-hover: #f8fafc;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --text-sub: #94a3b8;
  --radius: 16px;
  --shadow-sm: 0 4px 20px -5px rgba(0,0,0,0.05);
  --shadow-md: 0 10px 40px -10px rgba(99,102,241,0.1);
  --glass-bg: rgba(255,255,255,0.9);
  --glass-border: rgba(255,255,255,0.2);
}
.module-page {
  padding: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.module-page[data-theme="dark"], .modal-teleport-wrapper[data-theme="dark"] {
  --primary: #818cf8;
  --accent: #8b5cf6;
  --surface: #1e293b;
  --surface-hover: #29384e;
  --border: #334155;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-sub: #475569;
  --glass-bg: rgba(30, 41, 59, 0.85);
  --glass-border: rgba(255,255,255,0.05);
  --shadow-sm: 0 4px 20px -5px rgba(0,0,0,0.3);
  --shadow-md: 0 10px 40px -10px rgba(0,0,0,0.5);
}
.module-page[data-theme="dark"] {
  background: linear-gradient(135deg, #0b1120, #0f172a);
}

/* ── LAYOUT ── */
.content-wrapper { display: flex; flex-direction: column; gap: 1.5rem; }
.flex-row { display: flex; align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.gap-2 { gap: 0.5rem; }
.w-full { width: 100%; }
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mb-0 { margin-bottom: 0 !important; }

/* ── TYPOGRAPHY ── */
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.02em; }
.page-subtitle { font-size: 0.95rem; color: var(--text-muted); margin-top: 0.4rem; font-weight: 500; }
.section-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;}
.font-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
.fw-600 { font-weight: 600; }
.text-xs { font-size: 0.75rem; }
.text-accent { color: var(--accent); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }
.text-primary { color: var(--primary); }
.text-muted { color: var(--text-muted); }

/* ── CARDS ── */
.action-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.75rem; box-shadow: var(--shadow-sm); }
.combobox-section { display: flex; flex-direction: column; gap: 1rem; align-items: center; justify-content: center; padding: 2.5rem 1.75rem; background: linear-gradient(135deg, rgba(99,102,241,0.05), transparent); border: 1.5px dashed rgba(99,102,241,0.25); text-align: center; }
.combobox-wrapper { width: 100%; max-width: 600px; margin: 0 auto; text-align: left;}

.section-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); background: var(--surface-hover); }

/* ── BADGES & CHIPS ── */
.badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.badge-warning { background: rgba(245,158,11,0.15); color: #d97706; }
.badge-success { background: rgba(16,185,129,0.15); color: #059669; }
.status-badge { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.status-pending { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }
.status-approved, .status-completed { background: rgba(16,185,129,0.1); color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
.sku-chip { font-size: 0.7rem; padding: 0.15rem 0.5rem; background: var(--surface-hover); border: 1px solid var(--border); border-radius: 6px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

/* ── TABLES ── */
.table-wrap { overflow-x: auto; }
.h-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.85rem; }
.h-table thead th { padding: 0.875rem 1.25rem; text-align: left; font-size: 0.7rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.06em; background: var(--surface); border-bottom: 2px solid var(--border); white-space: nowrap; }
.h-table th.num, .h-table td.num { text-align: right; }
.h-table th.align-center, .h-table td.align-center { text-align: center; }
.h-table tbody td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); color: var(--text-main); vertical-align: middle; transition: background 0.2s; }
.h-table tbody tr:last-child td { border-bottom: none; }
.h-table tbody tr:hover td { background: var(--surface-hover); }

.cell-stack { display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-start; }
.qty-col { color: var(--success); font-weight: 800; font-size: 0.95rem; }
.col-date { font-size: 0.77rem; color: var(--text-muted); }
.col-exp { font-size: 0.78rem; color: var(--warning); }

/* ── BUTTONS ── */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 1.4rem; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.btn-primary { background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; box-shadow: var(--shadow-sm); }
.btn-primary:active { transform: scale(0.97); }
.btn-glow:not(:disabled):hover { box-shadow: 0 0 20px rgba(99,102,241,0.4); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--surface-hover); color: var(--text-main); }
.action-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; padding: 0.35rem 0.65rem; gap: 0.25rem;}
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-view { color: var(--accent); } .btn-view:hover:not(:disabled) { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); }
.btn-danger-soft { color: var(--danger); } .btn-danger-soft:hover:not(:disabled) { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }
.btn-success-soft { color: var(--success); } .btn-success-soft:hover:not(:disabled) { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); }

/* ── FORMS & INPUTS ── */
.form-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.5rem; }
.req { color: var(--danger); }
.styled-input { padding: 0.75rem 1rem; border: 1.5px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--text-main); font-size: 0.9rem; outline: none; width: 100%; box-sizing: border-box; transition: all 0.25s; }
.styled-input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.input-prefix-wrap { display: flex; align-items: stretch; }
.iprefix { padding: 0.75rem 1rem; background: var(--surface-hover); border: 1.5px solid var(--border); border-right: none; border-radius: 10px 0 0 10px; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); display: flex; align-items: center;}
.iprefix-pad { border-radius: 0 10px 10px 0; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

/* ── MODALS ── */
.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.modal-box { background: var(--surface); border-radius: 20px; width: 100%; max-width: 500px; box-shadow: 0 25px 80px rgba(0,0,0,0.25); overflow: hidden; border: 1px solid var(--border); }
.glass-panel { background: var(--glass-bg); backdrop-filter: blur(16px); }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.5rem 2rem 1rem; }
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0; }
.modal-sub { font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0; }
.modal-close { width: 32px; height: 32px; border: none; background: var(--surface-hover); font-size: 1.2rem; color: var(--text-muted); cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.modal-close:hover { background: rgba(239,68,68,0.1); color: var(--danger); }
.modal-body { padding: 0.5rem 2rem 2rem; }

/* ── MODAL INNER INFO ── */
.product-info-card { background: var(--surface-hover); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 0.5rem; }
.dl { display: block; font-size: 0.7rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.2rem; }
.dv { display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
.total-cost-preview { display: flex; flex-direction: column; align-items: center; padding: 1rem 1.25rem; background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02)); border-radius: 10px; border: 1px dashed rgba(99,102,241,0.3); font-size: 0.9rem; color: var(--text-muted); }

/* ── MISC ── */
.form-error { color: var(--danger); font-size: 0.82rem; background: rgba(239,68,68,0.08); border-radius: 8px; padding: 0.75rem 1rem; align-items: center; gap: 0.5rem; font-weight: 500; }
.state-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 3rem 1rem; color: var(--text-sub); text-align: center; font-size: 0.9rem; }
.spinner-ring { width: 1.1rem; height: 1.1rem; border: 2.5px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
.spinner-sm { width: 0.9rem; height: 0.9rem; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── ANIMATIONS ── */
.slide-up-fade { animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes slideUpFade {
  0% { opacity: 0; transform: translateY(15px); }
  100% { opacity: 1; transform: translateY(0); }
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }
.toast { position: fixed; top: 1.25rem; right: 1.25rem; z-index: 9999; display: flex; align-items: flex-start; gap: 0.8rem; padding: 1rem 1.25rem; border-radius: 12px; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); font-size: 0.85rem; }
.toast-success { background: #ecfdf5; border: 1px solid rgba(16,185,129,0.3); color: #065f46; }
.toast-danger { background: #fef2f2; border: 1px solid rgba(239,68,68,0.3); color: #991b1b; }
.toast-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.1rem; }
.toast-close { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; padding: 0; opacity: 0.5; }
.toast-close:hover { opacity: 1; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(20px); }
</style>
