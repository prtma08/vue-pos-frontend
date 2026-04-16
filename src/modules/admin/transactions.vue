<template>
  <div class="module-page" :data-theme="theme">
    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Riwayat Transaksi</h1>
        <p class="page-subtitle">{{ store.filtered.length }} transaksi ditemukan</p>
      </div>
      <div class="header-kpis">
        <div class="kpi-chip">
          <span class="kpi-label">Total Pendapatan</span>
          <span class="kpi-value">Rp {{ fmt(store.totalRevenue) }}</span>
        </div>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="filter-bar">
      <div class="search-wrap">
        <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="store.searchTerm" class="input-field search-input" type="text" placeholder="Cari ID, Kasir, Member..."/>
      </div>
      <select v-model="store.paymentFilter" class="input-field filter-select">
        <option value="">Semua</option>
        <option value="CASH">Cash</option>
      </select>
      <input v-model="store.dateFrom" class="input-field date-input" type="date" title="Dari tanggal"/>
      <input v-model="store.dateTo" class="input-field date-input" type="date" title="Sampai tanggal"/>
      <button class="btn btn-ghost btn-sm" @click="clearFilters">Reset</button>
    </div>

    <!-- ── Table ── -->
    <div class="table-card">
      <div v-if="store.loading" class="state-loading">
        <span class="spinner-ring"></span><span>Memuat transaksi...</span>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID Transaksi</th>
            <th>Waktu</th>
            <th>Kasir</th>
            <th>Member</th>
            <th>Pembayaran</th>
            <th>Total</th>
            <th>Status</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.filtered.length === 0">
            <td colspan="8" class="empty-row">Tidak ada transaksi ditemukan.</td>
          </tr>
          <tr
            v-for="tx in store.filtered"
            :key="tx.id"
            class="table-row clickable"
            @click="openDetail(tx)"
          >
            <td><code class="tx-id">{{ tx.id }}</code></td>
            <td class="col-date">{{ store.formatDate(tx.createdAt) }}</td>
            <td>
              <div class="cell-user">
                <div class="mini-avatar">{{ (tx.cashierName || 'K')[0] }}</div>
                <span>{{ tx.cashierName || '—' }}</span>
              </div>
            </td>
            <td>
              <span v-if="tx.memberName" class="member-chip">{{ tx.memberName }}</span>
              <span v-else class="col-empty">Umum</span>
            </td>
            <td><span class="payment-chip" :class="paymentClass(tx.paymentMethod)">{{ paymentLabel(tx.paymentMethod) }}</span></td>
            <td class="col-total">Rp {{ fmt(tx.total) }}</td>
            <td>
              <span class="status-chip">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--success)"><circle cx="4" cy="4" r="4"/></svg>
                {{ tx.status || 'Selesai' }}
              </span>
            </td>
            <td>
              <button class="action-btn view" title="Lihat detail">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <AppPagination 
        :current-page="store.pagination.page"
        :total-pages="store.pagination.totalPages"
        :limit="store.pagination.limit"
        :total-items="store.pagination.totalItems"
        @page-change="(p) => store.fetchTransactions({ page: p })"
      />
    </div>

    <!-- ── Detail Modal ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="detailTx" class="modal-overlay" @click.self="detailTx = null">
          <div class="modal-box modal-lg">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Detail Transaksi</h2>
                <code class="tx-id-sm">{{ detailTx.id }}</code>
              </div>
              <button class="modal-close" @click="detailTx = null">×</button>
            </div>
            <div class="detail-body">
              <!-- Info grid -->
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Waktu</span>
                  <span class="detail-value">{{ store.formatDate(detailTx.createdAt) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Kasir</span>
                  <span class="detail-value">{{ detailTx.cashierName || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Metode Bayar</span>
                  <span class="payment-chip" :class="paymentClass(detailTx.paymentMethod)">{{ paymentLabel(detailTx.paymentMethod) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Member</span>
                  <span class="detail-value">{{ detailTx.memberName || 'Umum / Non-Member' }}</span>
                </div>
              </div>

              <!-- Items list -->
              <div class="detail-section">
                <h3 class="section-title">Item Pesanan</h3>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Nama Produk</th>
                      <th class="text-right">Harga</th>
                      <th class="text-center">Qty</th>
                      <th class="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in detailTx.items" :key="item.productId">
                      <td>{{ item.name }}</td>
                      <td class="text-right text-caption">Rp {{ fmt(item.price) }}</td>
                      <td class="text-center"><span class="qty-badge">×{{ item.qty ?? item.quantity }}</span></td>
                      <td class="text-right font-serif">Rp {{ fmt(item.subtotal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Total -->
              <div class="detail-total">
                <span>Total</span>
                <span class="total-display">Rp {{ fmt(detailTx.total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppPagination from '@/components/AppPagination.vue'
import { useTransactionsStore } from '@/stores/transactions'

const store = useTransactionsStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })
const detailTx = ref(null)

onMounted(() => store.fetchAll())

const fmt = (n) => (n ?? 0).toLocaleString('id-ID')
const openDetail = (tx) => { detailTx.value = tx }

const paymentLabel = (m) => ({ CASH: '💵 Cash' }[m] || '💵 Cash')
const paymentClass = (m) => 'pay-cash'

const clearFilters = () => {
  store.searchTerm = ''
  store.paymentFilter = ''
  store.dateFrom = ''
  store.dateTo = ''
}
</script>

<style scoped>
/* ── 🎨 Design System: Financial Elegance ───────────────────────────── */
.module-page {
  padding: 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  background: 
    radial-gradient(1400px 700px at -10% 0%, rgba(79, 70, 229, 0.03), transparent 50%),
    radial-gradient(1000px 500px at 110% 10%, rgba(16, 185, 129, 0.025), transparent 50%),
    linear-gradient(180deg, #fafbfc 0%, #f8fafc 45%, #f1f5f9 100%);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
}

.module-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.15), transparent);
  opacity: 0.6;
}

.module-page[data-theme="dark"] {
  background: 
    radial-gradient(1400px 700px at -10% 0%, rgba(79, 70, 229, 0.08), transparent 50%),
    radial-gradient(1000px 500px at 110% 10%, rgba(16, 185, 129, 0.05), transparent 50%),
    linear-gradient(180deg, #0a0e17 0%, #0f172a 45%, #111827 100%);
}

.module-page[data-theme="dark"]::before {
  background: linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.2), transparent);
}

/* ── ✦ Page Header ────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.25rem;
  padding: 0.5rem 0;
  position: relative;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.page-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.module-page[data-theme="dark"] .page-title {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.375rem;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.module-page[data-theme="dark"] .page-subtitle {
  color: #94a3b8;
}

/* ── ✦ KPI Chip ───────────────────────────────────────────────────── */
.kpi-chip {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;
  padding: 0.875rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  position: relative;
  overflow: hidden;
  min-width: 220px;
}

.kpi-chip::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: linear-gradient(90deg, #10b981, #059669, #047857);
  opacity: 0.85;
}

.kpi-chip::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(600px 100px at 50% -50%, rgba(16, 185, 129, 0.08), transparent 70%);
  pointer-events: none;
}

.kpi-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #64748b;
  font-weight: 700;
}

.kpi-value {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.375rem;
  font-weight: 700;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.module-page[data-theme="dark"] .kpi-chip {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-color: rgba(51, 65, 85, 0.9);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.module-page[data-theme="dark"] .kpi-label {
  color: #94a3b8;
}

.module-page[data-theme="dark"] .kpi-value {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── ✦ Premium Button System ─────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6875rem 1.25rem;
  border-radius: 11px;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  position: relative;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.07);
}

.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.45), transparent 45%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.55;
}

.btn-ghost {
  background: #f8fafc;
  color: #475569;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
}

.btn-ghost:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: translateY(-1.5px);
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.09);
}

.btn-ghost:active {
  transform: translateY(0);
}

.module-page[data-theme="dark"] .btn-ghost {
  background: #1e293b;
  color: #cbd5e1;
  border-color: #334155;
}

.module-page[data-theme="dark"] .btn-ghost:hover {
  background: #334155;
  border-color: #475569;
}

.btn-sm {
  padding: 0.5625rem 1rem;
  font-size: 0.775rem;
  border-radius: 9px;
}

/* ── ✦ Filter Bar ────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  gap: 0.875rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  align-items: center;
  padding: 0.25rem 0;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 340px;
}

.search-ico {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  transition: color 0.25s;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 13px;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.search-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.search-input:hover {
  border-color: #cbd5e1;
}

.search-input:focus {
  border-color: #4f46e5;
  box-shadow: 
    0 0 0 4px rgba(79, 70, 229, 0.11),
    0 4px 18px rgba(79, 70, 229, 0.11);
}

.module-page[data-theme="dark"] .search-input {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.module-page[data-theme="dark"] .search-input:focus {
  border-color: #818cf8;
  box-shadow: 
    0 0 0 4px rgba(129, 140, 248, 0.17),
    0 4px 18px rgba(129, 140, 248, 0.14);
}

.filter-select,
.date-input {
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 13px;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  min-width: 145px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.875rem center;
  background-size: 1rem;
  padding-right: 2.25rem;
}

.filter-select:hover,
.date-input:hover {
  border-color: #cbd5e1;
}

.filter-select:focus,
.date-input:focus {
  border-color: #4f46e5;
  box-shadow: 
    0 0 0 4px rgba(79, 70, 229, 0.11),
    0 4px 18px rgba(79, 70, 229, 0.11);
}

.module-page[data-theme="dark"] .filter-select,
.module-page[data-theme="dark"] .date-input {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.module-page[data-theme="dark"] .filter-select:focus,
.module-page[data-theme="dark"] .date-input:focus {
  border-color: #818cf8;
  box-shadow: 
    0 0 0 4px rgba(129, 140, 248, 0.17),
    0 4px 18px rgba(129, 140, 248, 0.14);
}

/* ── ✦ Premium Table Card ───────────────────────────────────────── */
.table-card {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 6px 32px -10px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  position: relative;
}

.table-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4f46e5, #6366f1, #7c3aed);
  opacity: 0.85;
}

.module-page[data-theme="dark"] .table-card {
  background: #1e293b;
  border-color: rgba(51, 65, 85, 0.9);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.15),
    0 6px 32px -10px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
}

.module-page[data-theme="dark"] .table-card::before {
  background: linear-gradient(90deg, #6366f1, #818cf8, #a78bfa);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  padding: 1rem 1.25rem;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.085em;
  color: #64748b;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  position: relative;
}

.data-table th::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 1.25rem;
  right: 1.25rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.3), transparent);
}

.module-page[data-theme="dark"] .data-table th {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #94a3b8;
  border-bottom-color: #334155;
}

.data-table td {
  padding: 1.125rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
  transition: background 0.2s ease;
}

.module-page[data-theme="dark"] .data-table td {
  border-bottom-color: #334155;
  color: #cbd5e1;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row.clickable {
  cursor: pointer;
  transition: background 0.2s ease;
}

.table-row:hover td {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.7) 0%, rgba(241, 245, 249, 0.7) 100%);
}

.module-page[data-theme="dark"] .table-row:hover td {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.5) 100%);
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 4rem !important;
  font-size: 0.95rem;
  font-weight: 500;
}

/* ── ✦ Table Columns ────────────────────────────────────────────── */
.col-date {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  font-weight: 500;
}

.module-page[data-theme="dark"] .col-date {
  color: #94a3b8;
}

.col-total {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 700;
  white-space: nowrap;
  color: #1e293b;
  font-size: 0.925rem;
}

.module-page[data-theme="dark"] .col-total {
  color: #f1f5f9;
}

.col-empty {
  color: #94a3b8;
  font-size: 0.8rem;
  font-style: italic;
}

/* ── ✦ Transaction ID ───────────────────────────────────────────── */
.tx-id {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0.25rem 0.625rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  color: #475569;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  letter-spacing: -0.02em;
}

.module-page[data-theme="dark"] .tx-id {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-color: #334155;
  color: #cbd5e1;
}

.tx-id-sm {
  font-size: 0.75rem;
  color: #64748b;
  font-family: 'JetBrains Mono', monospace;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.module-page[data-theme="dark"] .tx-id-sm {
  background: #334155;
  color: #94a3b8;
}

/* ── ✦ User Cell ───────────────────────────────────────────────── */
.cell-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mini-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 
    0 3px 10px rgba(79, 70, 229, 0.25),
    0 0 0 2px rgba(255, 255, 255, 0.7) inset;
  transition: transform 0.2s ease;
}

.table-row:hover .mini-avatar {
  transform: scale(1.08);
}

/* ── ✦ Chips & Badges ───────────────────────────────────────────── */
.member-chip {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
  color: #4f46e5;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1.5px solid rgba(79, 70, 229, 0.25);
  transition: all 0.2s;
}

.member-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(79, 70, 229, 0.15);
}

.payment-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.275rem 0.8125rem;
  border-radius: 999px;
  font-size: 0.7375rem;
  font-weight: 600;
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}

.pay-cash {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%);
  color: #059669;
  border-color: rgba(5, 150, 105, 0.25);
}

.pay-transfer {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
  color: #4f46e5;
  border-color: rgba(79, 70, 229, 0.25);
}

.pay-qris {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%);
  color: #7c3aed;
  border-color: rgba(124, 58, 237, 0.25);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: #059669;
  font-weight: 600;
  padding: 0.3125rem 0.75rem;
  background: rgba(5, 150, 105, 0.08);
  border-radius: 999px;
  border: 1.5px solid rgba(5, 150, 105, 0.2);
}

.status-chip svg {
  filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.4));
}

/* ── ✦ Action Buttons ───────────────────────────────────────────── */
.action-btn {
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 8.5px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255,255,255,0.7), transparent 65%);
  opacity: 0;
  transition: opacity 0.2s;
}

.module-page[data-theme="dark"] .action-btn {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

.action-btn.view:hover {
  border-color: #4f46e5;
  color: #4f46e5;
  background: rgba(79, 70, 229, 0.08);
  transform: translateY(-2px);
  box-shadow: 
    0 5px 15px rgba(79, 70, 229, 0.18),
    0 0 0 2.5px rgba(79, 70, 229, 0.08) inset;
}

.action-btn.view:hover::before {
  opacity: 1;
}

/* ── ✦ Loading State ────────────────────────────────────────────── */
.state-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: #64748b;
  font-weight: 500;
  font-size: 0.925rem;
}

.module-page[data-theme="dark"] .state-loading {
  color: #94a3b8;
}

.spinner-ring {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.module-page[data-theme="dark"] .spinner-ring {
  border-color: #334155;
  border-top-color: #818cf8;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── ✦ Premium Modal System ─────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(11px) saturate(135%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal-box {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 580px;
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  position: relative;
}

.modal-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5px;
  background: linear-gradient(90deg, #4f46e5, #6366f1, #7c3aed);
}

.module-page[data-theme="dark"] .modal-box {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.08);
}

.modal-lg {
  max-width: 680px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.75rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  gap: 1rem;
}

.modal-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 2rem;
  right: 2rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.3), transparent);
}

.module-page[data-theme="dark"] .modal-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-bottom-color: #334155;
}

.modal-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.375rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.375rem 0;
  letter-spacing: -0.02em;
}

.module-page[data-theme="dark"] .modal-title {
  color: #f1f5f9;
}

.modal-close {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.5rem;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  flex-shrink: 0;
}

.module-page[data-theme="dark"] .modal-close {
  background: #334155;
  color: #94a3b8;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.module-page[data-theme="dark"] .modal-close:hover {
  background: #475569;
  color: #f1f5f9;
}

.detail-body {
  padding: 2rem;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.125rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.module-page[data-theme="dark"] .detail-grid {
  border-bottom-color: #334155;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.detail-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-weight: 700;
  color: #64748b;
}

.module-page[data-theme="dark"] .detail-label {
  color: #94a3b8;
}

.detail-value {
  font-size: 0.925rem;
  color: #1e293b;
  font-weight: 500;
}

.module-page[data-theme="dark"] .detail-value {
  color: #f1f5f9;
}

.detail-section {
  margin-bottom: 1.75rem;
}

.section-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.875rem 0;
  padding-bottom: 0.625rem;
  border-bottom: 1.5px solid #f1f5f9;
}

.module-page[data-theme="dark"] .section-title {
  color: #f1f5f9;
  border-bottom-color: #334155;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #64748b;
  font-weight: 700;
  padding: 0.625rem 0.5rem;
  border-bottom: 1.5px solid #e2e8f0;
  text-align: left;
}

.module-page[data-theme="dark"] .items-table th {
  color: #94a3b8;
  border-bottom-color: #334155;
}

.items-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.module-page[data-theme="dark"] .items-table td {
  border-bottom-color: #334155;
}

.items-table tr:last-child td {
  border-bottom: none;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.text-caption {
  font-size: 0.8rem;
  color: #64748b;
}

.module-page[data-theme="dark"] .text-caption {
  color: #94a3b8;
}

.font-serif {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 600;
}

.qty-badge {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  padding: 0.15rem 0.625rem;
  border-radius: 7px;
  font-weight: 600;
  font-size: 0.8rem;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.module-page[data-theme="dark"] .qty-badge {
  background: linear-gradient(135deg, #334155 0%, #475569 100%);
  border-color: #64748b;
  color: #cbd5e1;
}

.detail-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.25rem;
  border-top: 2.5px solid #e2e8f0;
  font-weight: 600;
  color: #1e293b;
  margin-top: 0.5rem;
}

.module-page[data-theme="dark"] .detail-total {
  border-top-color: #334155;
  color: #f1f5f9;
}

.total-display {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

/* ── ✦ Modal Transitions ───────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  transform: scale(0.95) translateY(14px);
  opacity: 0;
}

/* ── ✦ Responsive Design ───────────────────────────────────────── */
@media (max-width: 1024px) {
  .module-page {
    padding: 1.625rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-wrap {
    max-width: 100%;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .module-page {
    padding: 1.25rem;
  }
  
  .page-title {
    font-size: 1.625rem;
  }
  
  .kpi-chip {
    width: 100%;
    min-width: auto;
  }
  
  .filter-select,
  .date-input {
    width: 100%;
    min-width: auto;
  }
  
  .modal-box {
    max-width: 100%;
    margin: 0.5rem;
  }
  
  .detail-body {
    padding: 1.5rem;
  }
}

/* ── ✦ Premium Scrollbar ───────────────────────────────────────── */
::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

.module-page[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #475569 0%, #334155 100%);
}

.module-page[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #64748b 0%, #475569 100%);
}

/* ── ✦ Premium Animations ──────────────────────────────────────── */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-row {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.table-row:nth-child(1) { animation-delay: 0.04s; }
.table-row:nth-child(2) { animation-delay: 0.08s; }
.table-row:nth-child(3) { animation-delay: 0.12s; }
.table-row:nth-child(4) { animation-delay: 0.16s; }
.table-row:nth-child(5) { animation-delay: 0.2s; }
.table-row:nth-child(6) { animation-delay: 0.24s; }
.table-row:nth-child(7) { animation-delay: 0.28s; }
.table-row:nth-child(8) { animation-delay: 0.32s; }

/* Focus accessibility */
.btn:focus-visible,
.input-field:focus-visible,
.filter-select:focus-visible,
.date-input:focus-visible,
.action-btn:focus-visible,
.modal-close:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 3px rgba(255, 255, 255, 0.85),
    0 0 0 5.5px rgba(79, 70, 229, 0.38) !important;
}

.module-page[data-theme="dark"] .btn:focus-visible,
.module-page[data-theme="dark"] .input-field:focus-visible {
  box-shadow: 
    0 0 0 3px rgba(10, 14, 23, 0.92),
    0 0 0 5.5px rgba(129, 140, 248, 0.48) !important;
}
</style>