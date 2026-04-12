<template>
  <div class="module-page" :data-theme="theme">
    <div class="page-header">
      <div><h1 class="page-title">Laporan Barang Expired</h1><p class="page-subtitle">Monitoring stok yang mendekati atau sudah melewati tanggal kadaluarsa</p></div>
      <div class="threshold-control">
        <label class="form-label">Threshold (hari)</label>
        <input v-model.number="thresholdDays" type="number" min="1" max="365" class="input-sm" />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card red">
        <span class="s-icon">🔴</span>
        <span class="s-value">{{ expiredCount }}</span>
        <span class="s-label">Sudah Expired</span>
      </div>
      <div class="summary-card yellow">
        <span class="s-icon">🟡</span>
        <span class="s-value">{{ warningCount }}</span>
        <span class="s-label">Mendekati Expired</span>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr><th>#</th><th>Produk</th><th>SKU</th><th>Batch (Purchase)</th><th>Qty</th><th>Tgl. Kadaluarsa</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-if="expiringItems.length === 0"><td colspan="7" class="empty-row">Tidak ada barang yang mendekati kadaluarsa. ✅</td></tr>
          <tr v-for="(item, i) in expiringItems" :key="item.id" class="table-row">
            <td class="col-idx">{{ i + 1 }}</td>
            <td><span class="cell-name-text">{{ item.productName }}</span></td>
            <td class="col-sku">{{ item.productSku }}</td>
            <td class="col-date">{{ fmtDate(item.purchasedAt) }}</td>
            <td>{{ item.qty }} unit</td>
            <td class="col-date">{{ fmtDate(item.expiryDate) }}</td>
            <td>
              <span class="status-badge" :class="item.expiryStatus">
                {{ item.expiryStatus === 'expired' ? '🔴 Expired' : '🟡 Segera' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProductsStore } from '@/stores/products'

const productsStore = useProductsStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })
const thresholdDays = ref(30)

onMounted(() => productsStore.fetchProducts())

const expiringItems = computed(() => productsStore.getExpiringProducts(thresholdDays.value))
const expiredCount = computed(() => expiringItems.value.filter(i => i.expiryStatus === 'expired').length)
const warningCount = computed(() => expiringItems.value.filter(i => i.expiryStatus === 'warning').length)

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.module-page { padding: 2.5rem; max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc, #f1f5f9); min-height: 100vh; font-family: 'Inter', sans-serif; }
.module-page[data-theme="dark"] { background: linear-gradient(135deg, #0f172a, #1e293b); }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; gap: 1.5rem; flex-wrap: wrap; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0; }
.module-page[data-theme="dark"] .page-title { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.page-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.375rem; }
.threshold-control { display: flex; flex-direction: column; gap: 0.375rem; }
.form-label { font-size: 0.78rem; font-weight: 600; color: #64748b; }
.input-sm { width: 80px; padding: 0.5rem 0.75rem; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.875rem; font-weight: 600; text-align: center; background: #fff; color: #1e293b; }
.module-page[data-theme="dark"] .input-sm { background: #1e293b; border-color: #334155; color: #f1f5f9; }

.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
.summary-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.375rem; position: relative; overflow: hidden; }
.summary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
.summary-card.red::before { background: linear-gradient(90deg, #ef4444, #f97316); }
.summary-card.yellow::before { background: linear-gradient(90deg, #eab308, #f59e0b); }
.module-page[data-theme="dark"] .summary-card { background: #1e293b; border-color: #334155; }
.s-icon { font-size: 1.5rem; }
.s-value { font-size: 2rem; font-weight: 800; color: #1e293b; }
.module-page[data-theme="dark"] .s-value { color: #f1f5f9; }
.s-label { font-size: 0.78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }

.table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1); }
.module-page[data-theme="dark"] .table-card { background: #1e293b; border-color: #334155; }
.data-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.data-table th { padding: 1rem 1.5rem; background: #f8fafc; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; text-align: left; border-bottom: 2px solid #e2e8f0; }
.module-page[data-theme="dark"] .data-table th { background: #0f172a; color: #94a3b8; border-bottom-color: #334155; }
.data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; }
.module-page[data-theme="dark"] .data-table td { border-bottom-color: #334155; color: #cbd5e1; }
.table-row:hover td { background: #fafafa; }
.module-page[data-theme="dark"] .table-row:hover td { background: #334155; }
.empty-row { text-align: center; color: #94a3b8; padding: 3rem !important; }
.col-idx { color: #94a3b8; font-size: 0.8rem; width: 50px; font-weight: 600; }
.col-sku { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: #94a3b8; }
.col-date { font-size: 0.8rem; color: #64748b; }
.cell-name-text { font-weight: 600; }
.status-badge { font-size: 0.78rem; font-weight: 600; padding: 0.375rem 0.75rem; border-radius: 8px; }
.status-badge.expired { background: rgba(239,68,68,0.12); color: #ef4444; }
.status-badge.warning { background: rgba(234,179,8,0.12); color: #ca8a04; }
</style>
