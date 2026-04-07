<template>
  <div class="module-page" :data-theme="theme">
    <div class="page-header">
      <div><h1 class="page-title">Purchase Barang (Stock In)</h1><p class="page-subtitle">Tambah stok dan hitung HPP otomatis</p></div>
    </div>

    <!-- Product Selector -->
    <div class="purchase-card">
      <h3 class="card-title">📦 Pilih Produk</h3>
      <select v-model="selectedProductId" class="input-field" @change="onProductSelect">
        <option value="">-- Pilih produk --</option>
        <option v-for="p in productsStore.products" :key="p.id" :value="p.id">{{ p.name }} (SKU: {{ p.sku }}) — Stok: {{ p.stock }}</option>
      </select>

      <!-- Product Info -->
      <div v-if="selectedProduct" class="product-info">
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Nama</span><span class="info-val">{{ selectedProduct.name }}</span></div>
          <div class="info-item"><span class="info-label">Kategori</span><span class="info-val">{{ selectedProduct.category?.name || '—' }}</span></div>
          <div class="info-item"><span class="info-label">Stok Saat Ini</span><span class="info-val">{{ selectedProduct.stock }}</span></div>
          <div class="info-item"><span class="info-label">HPP Saat Ini</span><span class="info-val">Rp {{ formatCurrency(selectedProduct.hpp) }}</span></div>
        </div>
      </div>

      <!-- Purchase Form -->
      <form v-if="selectedProduct" @submit.prevent="handlePurchase" class="purchase-form">
        <h3 class="card-title">📝 Data Pembelian</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Jumlah Beli <span class="req">*</span></label>
            <input v-model.number="form.qty" class="input-field" type="number" min="1" placeholder="0" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Harga Beli per Unit <span class="req">*</span></label>
            <div class="input-with-prefix"><span class="prefix">Rp</span><input v-model.number="form.costPerUnit" class="input-field prefix-input" type="number" min="0" placeholder="0" required/></div>
          </div>
        </div>

        <!-- Expiry Date (conditional) -->
        <div v-if="needsExpiry" class="form-group">
          <label class="form-label">Tanggal Kadaluarsa <span class="req">*</span></label>
          <input v-model="form.expiryDate" class="input-field" type="date" :required="needsExpiry"/>
          <p class="form-hint">⚠️ Wajib diisi untuk kategori {{ selectedProduct.category?.name }}</p>
        </div>

        <!-- Preview -->
        <div v-if="form.qty > 0 && form.costPerUnit > 0" class="preview-card">
          <h4 class="preview-title">Preview HPP Baru</h4>
          <div class="preview-grid">
            <div><span class="pl">Stok Lama</span><span class="pv">{{ selectedProduct.stock }}</span></div>
            <div><span class="pl">+ Stok Baru</span><span class="pv">{{ form.qty }}</span></div>
            <div><span class="pl">Total Cost Lama</span><span class="pv">Rp {{ formatCurrency(selectedProduct.stock * selectedProduct.hpp) }}</span></div>
            <div><span class="pl">Total Cost Baru</span><span class="pv">Rp {{ formatCurrency(form.qty * form.costPerUnit) }}</span></div>
            <div class="preview-divider"></div>
            <div class="preview-highlight"><span class="pl">HPP Baru (Avg)</span><span class="pv highlight">Rp {{ formatCurrency(newHpp) }}</span></div>
            <div><span class="pl">Stok Akhir</span><span class="pv">{{ selectedProduct.stock + form.qty }}</span></div>
          </div>
        </div>

        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="form-success">{{ successMsg }}</p>

        <button type="submit" class="btn btn-primary btn-full" :disabled="submitting">
          {{ submitting ? 'Memproses...' : '📥 Simpan Pembelian' }}
        </button>
      </form>
    </div>

    <!-- C10: Purchase History for selected product -->
    <div v-if="selectedProduct" class="history-card">
      <h3 class="card-title">📋 Riwayat Pembelian <span class="history-count">{{ purchaseHistory.length }} entri</span></h3>
      <div v-if="purchaseHistory.length === 0" class="history-empty">
        Belum ada riwayat pembelian untuk produk ini.
      </div>
      <div v-else class="history-table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Qty</th>
              <th>Harga Beli/unit</th>
              <th>HPP Sebelum</th>
              <th>HPP Sesudah</th>
              <th>Tgl Expired</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rec in purchaseHistory" :key="rec.id">
              <td>{{ new Date(rec.purchasedAt).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) }}</td>
              <td class="qty-cell">+{{ rec.qty }}</td>
              <td>Rp {{ formatCurrency(rec.buyPrice) }}</td>
              <td class="hpp-prev">Rp {{ formatCurrency(rec.previousHpp) }}</td>
              <td class="hpp-new">Rp {{ formatCurrency(rec.newHpp) }}</td>
              <td>{{ rec.expiryDate ? new Date(rec.expiryDate).toLocaleDateString('id-ID') : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'

const productsStore = useProductsStore()
const categoriesStore = useCategoriesStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
const selectedProductId = ref('')
const selectedProduct = computed(() => productsStore.products.find(p => p.id === selectedProductId.value))
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const form = reactive({ qty: 0, costPerUnit: 0, expiryDate: '' })

const needsExpiry = computed(() => {
  if (!selectedProduct.value?.categoryId) return false
  const cat = categoriesStore.categories.find(c => c.id === selectedProduct.value.categoryId)
  return cat?.hasExpiration === true
})

const formatCurrency = (v) => Math.round(v || 0).toLocaleString('id-ID')

const newHpp = computed(() => {
  if (!selectedProduct.value || form.qty <= 0 || form.costPerUnit <= 0) return 0
  const totalOld = selectedProduct.value.stock * selectedProduct.value.hpp
  const totalNew = form.qty * form.costPerUnit
  return Math.round((totalOld + totalNew) / (selectedProduct.value.stock + form.qty))
})

// C10: Purchase history for selected product
const purchaseHistory = computed(() => {
  if (!selectedProduct.value) return []
  return [...(productsStore.purchaseRecords || [])]
    .filter(r => r.productId === selectedProduct.value.id)
    .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
})

const onProductSelect = () => { Object.assign(form, { qty: 0, costPerUnit: 0, expiryDate: '' }); errorMsg.value = ''; successMsg.value = '' }

const handlePurchase = async () => {
  errorMsg.value = ''; successMsg.value = ''
  if (needsExpiry.value && !form.expiryDate) { errorMsg.value = 'Tanggal kadaluarsa wajib diisi'; return }
  submitting.value = true
  try {
    const result = await productsStore.purchaseStock(selectedProductId.value, form.qty, form.costPerUnit, needsExpiry.value ? form.expiryDate : null)
    if (result.success) {
      successMsg.value = `✅ Stok berhasil ditambah! HPP baru: Rp ${formatCurrency(result.data?.newHpp ?? newHpp.value)}`
      Object.assign(form, { qty: 0, costPerUnit: 0, expiryDate: '' })
      setTimeout(() => { successMsg.value = '' }, 5000)
    } else { errorMsg.value = result.message }
  } finally { submitting.value = false }
}

onMounted(() => {
  productsStore.fetchProducts()
  categoriesStore.fetchAll()
})
</script>

<style scoped>
.module-page { padding: 2.5rem; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc, #f1f5f9); min-height: 100vh; font-family: 'Inter', sans-serif; }
.module-page[data-theme="dark"] { background: linear-gradient(135deg, #0f172a, #1e293b); }
.page-header { margin-bottom: 2rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.module-page[data-theme="dark"] .page-title { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.375rem; }

.purchase-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.06); }
.module-page[data-theme="dark"] .purchase-card { background: #1e293b; border-color: #334155; }
.card-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem; }
.module-page[data-theme="dark"] .card-title { color: #f1f5f9; }

.product-info { margin: 1.25rem 0; padding: 1.25rem; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .product-info { background: #0f172a; border-color: #334155; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.info-item { display: flex; flex-direction: column; gap: 0.25rem; }
.info-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
.info-val { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
.module-page[data-theme="dark"] .info-val { color: #f1f5f9; }

.purchase-form { margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; }
.module-page[data-theme="dark"] .purchase-form { border-top-color: #334155; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: #475569; }
.module-page[data-theme="dark"] .form-label { color: #cbd5e1; }
.req { color: #ef4444; }
.input-field { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; color: #1e293b; font-size: 0.9rem; transition: all 0.3s; outline: none; font-weight: 500; width: 100%; box-sizing: border-box; }
.input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.module-page[data-theme="dark"] .input-field { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.input-with-prefix { position: relative; }
.prefix { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-weight: 700; color: #94a3b8; font-size: 0.875rem; }
.prefix-input { padding-left: 2.75rem; }
.form-hint { font-size: 0.78rem; color: #f59e0b; margin: 0; }

.preview-card { margin: 1.25rem 0; padding: 1.25rem; background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05)); border: 1.5px solid rgba(99,102,241,0.2); border-radius: 14px; }
.preview-title { font-size: 0.85rem; font-weight: 700; color: #6366f1; margin: 0 0 0.75rem; }
.preview-grid { display: flex; flex-direction: column; gap: 0.375rem; }
.preview-grid > div { display: flex; justify-content: space-between; font-size: 0.85rem; }
.pl { color: #64748b; }
.pv { font-weight: 600; color: #1e293b; }
.module-page[data-theme="dark"] .pv { color: #f1f5f9; }
.pv.highlight { color: #6366f1; font-size: 1.05rem; font-weight: 800; }
.preview-divider { height: 1px; background: rgba(99,102,241,0.2); margin: 0.375rem 0; }

.form-error { color: #dc2626; font-size: 0.85rem; background: rgba(239,68,68,0.1); border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1rem; }
.form-success { color: #059669; font-size: 0.85rem; background: rgba(16,185,129,0.1); border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1rem; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.625rem; padding: 0.875rem 1.5rem; border-radius: 12px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4); }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-full { width: 100%; }

/* C10: Purchase history table */
.history-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.06); margin-top: 1.5rem; }
.module-page[data-theme="dark"] .history-card { background: #1e293b; border-color: #334155; }
.history-count { font-size: 0.75rem; font-weight: 500; color: #94a3b8; margin-left: 0.5rem; }
.history-empty { text-align: center; color: #94a3b8; padding: 2rem 0; font-size: 0.875rem; }
.history-table-wrap { overflow-x: auto; }
.history-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.history-table th { padding: 0.6rem 0.75rem; text-align: left; font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1.5px solid #e2e8f0; }
.module-page[data-theme="dark"] .history-table th { border-color: #334155; color: #64748b; }
.history-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #f1f5f9; color: #475569; }
.module-page[data-theme="dark"] .history-table td { border-color: #1e293b; color: #cbd5e1; }
.history-table tr:last-child td { border-bottom: none; }
.history-table tr:hover td { background: #f8fafc; }
.module-page[data-theme="dark"] .history-table tr:hover td { background: #0f172a; }
.qty-cell { color: #059669; font-weight: 700; }
.hpp-prev { color: #94a3b8; text-decoration: line-through; font-size: 0.8rem; }
.hpp-new { color: #6366f1; font-weight: 700; }
</style>
