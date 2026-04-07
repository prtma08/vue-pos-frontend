<template>
  <div class="module-page" :data-theme="theme">
    <!-- ── Header ── -->
    <header class="page-header">
      <div class="header-content">
        <div class="breadcrumb">
          <span>Master Data</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          <span>Manajemen Harga</span>
        </div>
        <h1 class="page-title">Manajemen Harga Jual</h1>
        <p class="page-subtitle">Atur harga jual aktif dan pantau histori perubahan harga</p>
      </div>
    </header>

    <!-- ── Content Grid ── -->
    <div class="content-grid">
      <!-- Left: Pilih Produk & Form Harga -->
      <div class="panel panel-form">
        <h2 class="panel-title">Ubah Harga Jual</h2>

        <!-- Pilih Produk -->
        <div class="form-group">
          <label class="form-label">Pilih Produk <span class="required">*</span></label>
          <AppCombobox
            v-model="selectedProductId"
            :options="productsStore.products"
            option-key="id"
            option-label="name"
            option-sub-label="sku"
            placeholder="-- Pilih produk --"
            search-placeholder="Cari produk atau SKU..."
          />
        </div>

        <!-- Product Info Card -->
        <div v-if="selectedProduct" class="product-info-card">
          <div class="info-row">
            <span class="info-label">SKU</span>
            <code class="info-val">{{ selectedProduct.sku || '—' }}</code>
          </div>
          <div class="info-row">
            <span class="info-label">Harga Aktif</span>
            <span class="info-val price-active">Rp {{ fmt(currentActivePrice) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">HPP Average</span>
            <span class="info-val">Rp {{ fmt(selectedProduct.hpp || 0) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Margin Saat Ini</span>
            <span class="info-val" :class="currentMarginClass">{{ currentMargin }}%</span>
          </div>
        </div>

        <!-- Form Input Harga Baru -->
        <div v-if="selectedProduct" class="form-group mt-form">
          <label class="form-label">Harga Jual Baru <span class="required">*</span></label>
          <div class="input-with-prefix">
            <span class="prefix">Rp</span>
            <input
              v-model.number="newPrice"
              class="input-field"
              type="number"
              min="1"
              placeholder="0"
              @input="onPriceInput"
            />
          </div>
        </div>

        <!-- Loss Alert -->
        <div v-if="showLossAlert" class="loss-alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div class="loss-text">
            <strong>Peringatan Rugi!</strong>
            <span>Harga jual baru (Rp {{ fmt(newPrice) }}) di bawah HPP Average (Rp {{ fmt(selectedProduct?.hpp || 0) }}). Anda akan merugi Rp {{ fmt((selectedProduct?.hpp || 0) - newPrice) }} per unit.</span>
          </div>
        </div>

        <!-- Profit Preview -->
        <div v-if="selectedProduct && newPrice > 0 && !showLossAlert" class="profit-preview">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
          <span>Estimasi Profit: <strong>Rp {{ fmt(newPrice - (selectedProduct.hpp || 0)) }}</strong> ({{ newMarginPct }}%)</span>
        </div>

        <!-- Submit -->
        <div v-if="selectedProduct" class="form-actions">
          <button
            class="btn btn-primary"
            :disabled="!newPrice || newPrice <= 0 || loading"
            @click="handleUpdatePrice"
          >
            <span v-if="loading" class="spinner-sm"></span>
            Simpan Harga Jual Baru
          </button>
        </div>

        <!-- Success / Error message -->
        <div v-if="successMsg" class="form-success">✓ {{ successMsg }}</div>
        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
      </div>

      <!-- Right: Price History Table -->
      <div class="panel panel-history">
        <h2 class="panel-title">
          Histori Harga
          <span v-if="selectedProduct" class="panel-sub">— {{ selectedProduct.name }}</span>
        </h2>

        <div v-if="!selectedProduct" class="history-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p>Pilih produk untuk melihat histori harga</p>
        </div>

        <div v-else-if="priceHistory.length === 0" class="history-empty">
          <p>Belum ada histori harga untuk produk ini.</p>
        </div>

        <table v-else class="history-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Harga Jual</th>
              <th>Sebelumnya</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in priceHistory" :key="h.id" class="history-row" :class="{ 'is-active': h.is_active }">
              <td class="col-date">{{ fmtDate(h.effectiveDate) }}</td>
              <td class="col-price">Rp {{ fmt(h.price) }}</td>
              <td class="col-prev">{{ h.previousPrice ? 'Rp ' + fmt(h.previousPrice) : '—' }}</td>
              <td>
                <span class="status-badge" :class="h.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ h.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProductsStore } from '@/stores/products'
import AppCombobox from '@/components/AppCombobox.vue'

const productsStore = useProductsStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')

const selectedProductId = ref('')
const newPrice = ref(null)
const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const selectedProduct = computed(() =>
  productsStore.products.find(p => p.id === selectedProductId.value) ?? null
)

const priceHistory = computed(() => {
  if (!selectedProductId.value) return []
  return productsStore.getPriceHistory(selectedProductId.value)
})

const currentActivePrice = computed(() => {
  const active = productsStore.getActivePrice(selectedProductId.value)
  return active?.price ?? selectedProduct.value?.sellingPrice ?? selectedProduct.value?.price ?? 0
})

const currentMargin = computed(() => {
  if (!selectedProduct.value) return 0
  const sp = currentActivePrice.value
  const hpp = selectedProduct.value.hpp || 0
  return sp > 0 ? Math.round(((sp - hpp) / sp) * 10000) / 100 : 0
})

const currentMarginClass = computed(() => {
  const m = currentMargin.value
  if (m >= 25) return 'margin-good'
  if (m >= 10) return 'margin-moderate'
  return 'margin-low'
})

const newMarginPct = computed(() => {
  if (!newPrice.value || newPrice.value <= 0 || !selectedProduct.value) return 0
  const hpp = selectedProduct.value.hpp || 0
  return Math.round(((newPrice.value - hpp) / newPrice.value) * 10000) / 100
})

const showLossAlert = computed(() =>
  selectedProduct.value && newPrice.value > 0 && newPrice.value < (selectedProduct.value.hpp || 0)
)

watch(selectedProductId, () => {
  newPrice.value = null
  successMsg.value = ''
  errorMsg.value = ''
})

const onPriceInput = () => {
  successMsg.value = ''
  errorMsg.value = ''
}

const fmt = (n) => (n ?? 0).toLocaleString('id-ID')
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const handleUpdatePrice = async () => {
  if (!selectedProduct.value || !newPrice.value || newPrice.value <= 0) return
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  const result = await productsStore.updateSellingPrice(selectedProductId.value, newPrice.value)
  loading.value = false
  if (result.success) {
    successMsg.value = `Harga jual ${selectedProduct.value.name} diperbarui ke Rp ${fmt(newPrice.value)}`
    newPrice.value = null
  } else {
    errorMsg.value = result.message || 'Gagal memperbarui harga.'
  }
}

onMounted(() => productsStore.fetchProducts())
</script>

<style scoped>
.module-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  min-height: 100vh;
}

.module-page[data-theme="dark"] {
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

/* ── Header ── */
.page-header { margin-bottom: 2rem; padding-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0; }
.breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem; }
.module-page[data-theme="dark"] .page-title { color: #f1f5f9; }
.page-subtitle { font-size: 0.9rem; color: #64748b; margin: 0; }
.module-page[data-theme="dark"] .page-subtitle { color: #94a3b8; }

/* ── Grid ── */
.content-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 900px) {
  .content-grid { grid-template-columns: 1fr; }
}

/* ── Panels ── */
.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.module-page[data-theme="dark"] .panel { background: #1e293b; border-color: #334155; }
.panel-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1.25rem;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.module-page[data-theme="dark"] .panel-title { color: #f1f5f9; }
.panel-sub { font-size: 0.85rem; font-weight: 400; color: #64748b; }

/* ── Form ── */
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: #475569; }
.module-page[data-theme="dark"] .form-label { color: #cbd5e1; }
.required { color: #ef4444; }
.mt-form { margin-top: 1.25rem; }

.input-with-prefix { display: flex; align-items: center; gap: 0; }
.prefix { padding: 0.875rem 0.875rem; background: #f1f5f9; border: 2px solid #e2e8f0; border-right: none; border-radius: 12px 0 0 12px; font-size: 0.875rem; font-weight: 600; color: #64748b; }
.input-field { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; color: #1e293b; font-size: 0.9rem; transition: all 0.3s; outline: none; font-weight: 500; width: 100%; box-sizing: border-box; }
.input-with-prefix .input-field { border-radius: 0 12px 12px 0; }
.input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.module-page[data-theme="dark"] .input-field { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.module-page[data-theme="dark"] .prefix { background: #1e293b; border-color: #334155; color: #94a3b8; }

/* ── Product Info Card ── */
.product-info-card {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 0.5rem;
}
.module-page[data-theme="dark"] .product-info-card { background: #0f172a; border-color: #334155; }
.info-row { display: flex; justify-content: space-between; align-items: center; }
.info-label { font-size: 0.78rem; color: #64748b; font-weight: 500; }
.module-page[data-theme="dark"] .info-label { color: #94a3b8; }
.info-val { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
.module-page[data-theme="dark"] .info-val { color: #f1f5f9; }
.price-active { color: #6366f1; }
.margin-good { color: #059669; }
.margin-moderate { color: #d97706; }
.margin-low { color: #dc2626; }

/* ── Alerts ── */
.loss-alert {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  background: rgba(239,68,68,0.08);
  border: 1.5px solid rgba(239,68,68,0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  color: #dc2626;
}
.loss-text { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
.loss-text strong { font-size: 0.9rem; }

.profit-preview {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: rgba(5,150,105,0.08);
  border: 1.5px solid rgba(5,150,105,0.25);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: #059669;
  margin-bottom: 0.75rem;
}

/* ── Form Actions ── */
.form-actions { margin-top: 1.25rem; }
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  width: 100%;
  justify-content: center;
}
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4); }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(99,102,241,0.5); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.form-success { margin-top: 1rem; padding: 0.875rem 1rem; background: rgba(5,150,105,0.1); border: 1.5px solid rgba(5,150,105,0.3); border-radius: 10px; color: #059669; font-size: 0.875rem; font-weight: 500; }
.form-error { margin-top: 1rem; padding: 0.875rem 1rem; background: rgba(239,68,68,0.08); border: 1.5px solid rgba(239,68,68,0.3); border-radius: 10px; color: #dc2626; font-size: 0.875rem; }

/* ── Spinner ── */
.spinner-sm { width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── History Table ── */
.history-empty { text-align: center; color: #94a3b8; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
.history-empty svg { opacity: 0.4; }
.history-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.history-table th { padding: 0.875rem 1rem; background: #f8fafc; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; text-align: left; border-bottom: 2px solid #e2e8f0; }
.module-page[data-theme="dark"] .history-table th { background: #0f172a; color: #94a3b8; border-bottom-color: #334155; }
.history-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; vertical-align: middle; }
.module-page[data-theme="dark"] .history-table td { border-bottom-color: #334155; color: #cbd5e1; }
.history-row:last-child td { border-bottom: none; }
.history-row.is-active { background: rgba(99,102,241,0.04); }
.col-date { color: #64748b; font-size: 0.8rem; white-space: nowrap; }
.col-price { font-weight: 700; color: #1e293b; }
.module-page[data-theme="dark"] .col-price { color: #f1f5f9; }
.col-prev { color: #94a3b8; font-size: 0.82rem; }

.status-badge { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.badge-active { background: rgba(5,150,105,0.12); color: #059669; }
.badge-inactive { background: rgba(100,116,139,0.12); color: #64748b; }

.module-page[data-theme="dark"] .history-empty { color: #475569; }
</style>
