<template>
  <div class="module-page" :data-theme="theme">
    <div class="page-header">
      <div><h1 class="page-title">Laporan Penjualan</h1><p class="page-subtitle">Ringkasan performa penjualan</p></div>
    </div>

    <!-- Tab Selector -->
    <div class="tab-row">
      <button v-for="t in tabs" :key="t.key" class="tab-btn" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">{{ t.label }}</button>
    </div>

    <!-- Per Kasir -->
    <div v-if="activeTab === 'kasir'" class="report-section">
      <div class="table-card">
        <table class="data-table">
          <thead><tr><th>#</th><th>Nama Kasir</th><th>Jumlah Transaksi</th><th>Total Penjualan</th><th>Rata-rata</th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in kasirReport" :key="i" class="table-row">
              <td class="col-idx">{{ i + 1 }}</td>
              <td><span class="cell-name-text">{{ r.name }}</span></td>
              <td>{{ r.count }} transaksi</td>
              <td class="col-val">Rp {{ fmt(r.total) }}</td>
              <td class="col-val">Rp {{ fmt(Math.round(r.total / r.count)) }}</td>
            </tr>
            <tr v-if="kasirReport.length === 0"><td colspan="5" class="empty-row">Belum ada data.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Per POS -->
    <div v-if="activeTab === 'pos'" class="report-section">
      <div class="table-card">
        <table class="data-table">
          <thead><tr><th>#</th><th>Terminal POS</th><th>Jumlah Transaksi</th><th>Total Penjualan</th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in posReport" :key="i" class="table-row">
              <td class="col-idx">{{ i + 1 }}</td>
              <td><span class="cell-name-text">{{ r.name }}</span></td>
              <td>{{ r.count }} transaksi</td>
              <td class="col-val">Rp {{ fmt(r.total) }}</td>
            </tr>
            <tr v-if="posReport.length === 0"><td colspan="4" class="empty-row">Belum ada data.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ringkasan Laba -->
    <div v-if="activeTab === 'laba'" class="report-section">
      <div class="summary-grid">
        <div class="summary-card green">
          <span class="s-label">Total Penjualan</span>
          <span class="s-value">Rp {{ fmt(labaSummary.totalSales) }}</span>
        </div>
        <div class="summary-card blue">
          <span class="s-label">Total HPP</span>
          <span class="s-value">Rp {{ fmt(labaSummary.totalCost) }}</span>
        </div>
        <div class="summary-card" :class="labaSummary.profit >= 0 ? 'green' : 'red'">
          <span class="s-label">Laba Kotor</span>
          <span class="s-value">Rp {{ fmt(labaSummary.profit) }}</span>
        </div>
        <div class="summary-card purple">
          <span class="s-label">Margin</span>
          <span class="s-value">{{ labaSummary.margin }}%</span>
        </div>
      </div>
      <div class="table-card" style="margin-top:1.5rem">
        <table class="data-table">
          <thead><tr><th>#</th><th>Produk</th><th>Qty Terjual</th><th>Revenue</th><th>HPP Total</th><th>Laba</th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in productProfit" :key="i" class="table-row">
              <td class="col-idx">{{ i + 1 }}</td>
              <td><span class="cell-name-text">{{ r.name }}</span></td>
              <td>{{ r.qty }}</td>
              <td>Rp {{ fmt(r.revenue) }}</td>
              <td>Rp {{ fmt(r.cost) }}</td>
              <td :class="r.profit >= 0 ? 'profit-pos' : 'profit-neg'">Rp {{ fmt(r.profit) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Shift & Defisit -->
    <div v-if="activeTab === 'shift'" class="report-section">
      <div class="table-card">
        <table class="data-table">
          <thead><tr><th>#</th><th>Kasir</th><th>POS</th><th>Mulai</th><th>Selesai</th><th>Modal Awal</th><th>Penjualan</th><th>Setoran</th><th>Selisih</th></tr></thead>
          <tbody>
            <tr v-for="(s, i) in shiftHistory" :key="s.id" class="table-row">
              <td class="col-idx">{{ i + 1 }}</td>
              <td><span class="cell-name-text">{{ s.cashierName }}</span></td>
              <td>{{ s.posDeviceName || '—' }}</td>
              <td class="col-date">{{ fmtDate(s.startedAt) }}</td>
              <td class="col-date">{{ fmtDate(s.endedAt) }}</td>
              <td>Rp {{ fmt(s.openingBalance) }}</td>
              <td class="col-val">Rp {{ fmt(s.totalSales) }}</td>
              <td>Rp {{ fmt(s.closingBalance) }}</td>
              <td :class="s.deficit > 0 ? 'profit-neg' : 'profit-pos'">
                {{ s.deficit > 0 ? '−' : '+' }}Rp {{ fmt(Math.abs(s.deficit || 0)) }}
              </td>
            </tr>
            <tr v-if="shiftHistory.length === 0"><td colspan="9" class="empty-row">Belum ada riwayat shift.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useShiftStore } from '@/stores/shift'

const txStore = useTransactionsStore()
const shiftStore = useShiftStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })
const activeTab = ref('kasir')
const tabs = [
  { key: 'kasir', label: '📊 Per Kasir' },
  { key: 'pos', label: '🖥️ Per POS' },
  { key: 'laba', label: '💰 Ringkasan Laba' },
  { key: 'shift', label: '📋 Shift & Defisit' },
]
const fmt = (v) => Math.round(v || 0).toLocaleString('id-ID')
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => txStore.fetchAll())

const shiftHistory = computed(() => shiftStore.shiftHistory)

// ── Per Kasir ──
const kasirReport = computed(() => {
  const map = {}
  txStore.transactions.forEach(tx => {
    const name = tx.cashierName || tx.cashier || 'Unknown'
    if (!map[name]) map[name] = { name, count: 0, total: 0 }
    map[name].count++
    map[name].total += tx.total || tx.grandTotal || 0
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})

// ── Per POS ──
const posReport = computed(() => {
  const map = {}
  txStore.transactions.forEach(tx => {
    const name = tx.posDevice || tx.terminal || 'POS Default'
    if (!map[name]) map[name] = { name, count: 0, total: 0 }
    map[name].count++
    map[name].total += tx.total || tx.grandTotal || 0
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})

// ── Laba Summary ──
const labaSummary = computed(() => {
  let totalSales = 0, totalCost = 0
  txStore.transactions.forEach(tx => {
    totalSales += tx.total || tx.grandTotal || 0
    totalCost += tx.totalCost || (tx.total || 0) * 0.65 // fallback 65% COGS
  })
  const profit = totalSales - totalCost
  const margin = totalSales > 0 ? Math.round((profit / totalSales) * 100) : 0
  return { totalSales, totalCost, profit, margin }
})

// ── Product Profit ──
const productProfit = computed(() => {
  const map = {}
  txStore.transactions.forEach(tx => {
    (tx.items || []).forEach(item => {
      const name = item.name || item.productName || 'Produk'
      if (!map[name]) map[name] = { name, qty: 0, revenue: 0, cost: 0 }
      map[name].qty += item.quantity || item.qty || 1
      map[name].revenue += item.subtotal || (item.price * (item.quantity || 1))
      map[name].cost += (item.hpp || item.costPrice || item.price * 0.65) * (item.quantity || 1)
    })
  })
  return Object.values(map).map(r => ({ ...r, profit: r.revenue - r.cost })).sort((a, b) => b.profit - a.profit)
})
</script>

<style scoped>
.module-page { padding: 2.5rem; max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc, #f1f5f9); min-height: 100vh; font-family: 'Inter', sans-serif; }
.module-page[data-theme="dark"] { background: linear-gradient(135deg, #0f172a, #1e293b); }
.page-header { margin-bottom: 2rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0; }
.module-page[data-theme="dark"] .page-title { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.page-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.375rem; }

.tab-row { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
.tab-btn { padding: 0.625rem 1.5rem; border-radius: 12px; border: 2px solid #e2e8f0; background: #fff; color: #64748b; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.tab-btn:hover { border-color: #6366f1; color: #6366f1; }
.tab-btn.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-color: transparent; color: #fff; box-shadow: 0 8px 20px rgba(99,102,241,0.3); }
.module-page[data-theme="dark"] .tab-btn { background: #1e293b; border-color: #334155; color: #cbd5e1; }

.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }
.summary-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.75rem; display: flex; flex-direction: column; gap: 0.625rem; position: relative; overflow: hidden; }
.summary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; border-radius: 18px 18px 0 0; }
.summary-card.green::before { background: linear-gradient(90deg, #10b981, #14b8a6); }
.summary-card.blue::before { background: linear-gradient(90deg, #3b82f6, #6366f1); }
.summary-card.red::before { background: linear-gradient(90deg, #ef4444, #f97316); }
.summary-card.purple::before { background: linear-gradient(90deg, #8b5cf6, #a855f7); }
.module-page[data-theme="dark"] .summary-card { background: #1e293b; border-color: #334155; }
.s-label { font-size: 0.78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.s-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
.module-page[data-theme="dark"] .s-value { color: #f1f5f9; }

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
.col-val { font-weight: 700; }
.cell-name-text { font-weight: 600; }
.profit-pos { font-weight: 700; color: #10b981; }
.profit-neg { font-weight: 700; color: #ef4444; }
</style>
