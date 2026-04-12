<template>
  <div class="finance-layout" :data-theme="theme">
    
    <!-- ── Sidebar (refined & minimal) ───────────────────────────────────── -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M7 8h14M7 14h9M7 20h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="21" cy="20" r="3" fill="currentColor"/>
          </svg>
        </div>
        <span class="brand-wordmark">Nextore</span>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-group">
          <router-link to="/admin" class="nav-item" exact active-class="is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            Dashboard
          </router-link>
        </div>
        
        <div class="nav-group">
          <span class="nav-label">Master Data</span>
          <router-link to="/admin/products" class="nav-item">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </span>
            Barang
          </router-link>
          <router-link to="/admin/accounts" class="nav-item">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            Akun
          </router-link>
          <router-link to="/admin/members" class="nav-item">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </span>
            Member
          </router-link>
          <router-link to="/admin/categories" class="nav-item">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </span>
            Kategori
          </router-link>
        </div>
        
        <div class="nav-group">
          <span class="nav-label">Keuangan</span>
          <router-link to="/admin/finance" class="nav-item is-active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </span>
            Laporan Laba
          </router-link>
          <router-link to="/admin/transactions" class="nav-item">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </span>
            Transaksi
          </router-link>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <button class="theme-toggle" @click="toggleTheme" title="Ganti tema">
          <svg v-if="theme==='light'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
        <router-link to="/admin" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Kembali
        </router-link>
      </div>
    </aside>

    <!-- ── Main Content ─────────────────────────────────────────────────── -->
    <main class="finance-main">
      
      <!-- Header with refined typography -->
      <header class="page-header">
        <div class="header-content">
          <span class="header-breadcrumb">Keuangan / Laporan</span>
          <h1 class="header-title">Analisis Profitabilitas</h1>
          <p class="header-subtitle">Pantau kinerja pendapatan dan margin secara real-time</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" @click="fetchReport" :disabled="loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
            Refresh
          </button>
          <button class="btn btn-primary" @click="exportReport">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
        </div>
      </header>

      <!-- ── Filter Panel (glassmorphism style) ─────────────────────────── -->
      <div class="filter-panel">
        <div class="filter-grid">
          <div class="filter-item">
            <label class="filter-label">Periode Mulai</label>
            <input v-model="filters.startDate" type="date" class="input-control" />
          </div>
          <div class="filter-item">
            <label class="filter-label">Periode Akhir</label>
            <input v-model="filters.endDate" type="date" class="input-control" />
          </div>
          <div class="filter-item">
            <label class="filter-label">Agregasi Data</label>
            <select v-model="filters.groupBy" class="input-control">
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
          <div class="filter-item filter-apply">
            <button class="btn btn-primary btn-full" @click="fetchReport" :disabled="loading">
              <span v-if="loading" class="loader"></span>
              <span v-else>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── KPI Cards (asymmetric layout with revenue highlight) ───────── -->
      <div class="metrics-grid">
        
        <!-- Revenue Card - Primary Focus with Gradient Accent -->
        <div class="metric-card metric-primary">
          <div class="metric-glow"></div>
          <div class="metric-header">
            <div class="metric-badge badge-revenue">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Revenue
            </div>
            <span class="metric-trend trend-positive">▲ 12.4%</span>
          </div>
          <div class="metric-value">
            <span class="value-currency">Rp</span>
            <span class="value-number">{{ formatCurrencyShort(summary.totalRevenue) }}</span>
          </div>
          <div class="metric-detail">{{ formatCurrency(summary.totalRevenue) }}</div>
          <div class="metric-sparkline">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,20 L20,15 L40,18 L60,10 L80,12 L100,5" fill="none" stroke="var(--revenue-gradient-start)" stroke-width="2"/>
              <path d="M0,20 L20,15 L40,18 L60,10 L80,12 L100,5 L100,30 L0,30 Z" fill="url(#revenueGradient)" opacity="0.15"/>
              <defs>
                <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:var(--revenue-gradient-start)"/>
                  <stop offset="100%" style="stop-color:var(--revenue-gradient-end)"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <!-- HPP Card -->
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-badge badge-cost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              HPP
            </div>
          </div>
          <div class="metric-value value-cost">
            <span class="value-currency">Rp</span>
            <span class="value-number">{{ formatCurrencyShort(summary.totalHPP) }}</span>
          </div>
          <div class="metric-detail">{{ formatCurrency(summary.totalHPP) }}</div>
          <div class="metric-progress">
            <div class="progress-bar" :style="{ width: Math.min((summary.totalHPP / (summary.totalRevenue || 1)) * 100, 100) + '%' }"></div>
          </div>
          <span class="progress-label">{{ Math.round((summary.totalHPP / (summary.totalRevenue || 1)) * 100) }}% dari revenue</span>
        </div>

        <!-- Gross Profit Card -->
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-badge badge-profit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              Gross Profit
            </div>
            <span class="metric-trend" :class="summary.grossProfit >= 0 ? 'trend-positive' : 'trend-negative'">
              {{ summary.grossProfit >= 0 ? '▲' : '▼' }} {{ Math.abs(Math.round((summary.grossProfit / (summary.totalRevenue || 1)) * 100)) }}%
            </span>
          </div>
          <div class="metric-value value-profit">
            <span class="value-currency">Rp</span>
            <span class="value-number">{{ formatCurrencyShort(summary.grossProfit) }}</span>
          </div>
          <div class="metric-detail">{{ formatCurrency(summary.grossProfit) }}</div>
          <div class="metric-diff">
            <span>Bersih setelah HPP</span>
          </div>
        </div>

        <!-- Margin Card -->
        <div class="metric-card metric-highlight">
          <div class="metric-header">
            <div class="metric-badge badge-margin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Margin
            </div>
          </div>
          <div class="metric-value value-margin" :style="{ color: getMarginColor(summary.profitMargin) }">
            <span class="value-number">{{ summary.profitMargin }}%</span>
          </div>
          <div class="metric-detail">Profit margin rata-rata</div>
          <div class="margin-indicator">
            <div class="margin-scale">
              <span class="scale-min">0%</span>
              <span class="scale-mid">15%</span>
              <span class="scale-max">30%+</span>
            </div>
            <div class="margin-marker" :style="{ left: Math.min(summary.profitMargin / 30 * 100, 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- ── Report Table (refined with zebra striping & focus states) ─── -->
      <section class="report-section">
        <div class="section-header">
          <h2 class="section-heading">
            Rincian <span class="heading-accent">{{ groupByLabel }}</span>
          </h2>
          <span class="data-count" v-if="reportData.length > 0">{{ reportData.length }} entri</span>
        </div>

        <div class="table-container">
          <!-- Loading State -->
          <div v-if="loading" class="table-placeholder">
            <div class="loader loader-lg"></div>
            <p>Sedang memproses data...</p>
          </div>

          <!-- Data Table -->
          <div v-else-if="reportData.length > 0" class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-period">Periode</th>
                  <th class="col-numeric">Revenue</th>
                  <th class="col-numeric col-cost">HPP</th>
                  <th class="col-numeric col-profit">Laba Kotor</th>
                  <th class="col-numeric col-margin">Margin</th>
                  <th class="col-center">Unit Terjual</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in reportData" :key="i" class="data-row">
                  <td class="cell-period">{{ row.period }}</td>
                  <td class="cell-numeric">
                    <span class="cell-amount">{{ formatCurrency(row.totalRevenue) }}</span>
                  </td>
                  <td class="cell-numeric cell-cost">
                    <span class="cell-amount amount-cost">{{ formatCurrency(row.totalHPP) }}</span>
                  </td>
                  <td class="cell-numeric cell-profit">
                    <span class="cell-amount amount-profit">{{ formatCurrency(row.grossProfit) }}</span>
                  </td>
                  <td class="cell-numeric cell-margin">
                    <span class="margin-chip" :class="getMarginClass(row.profitMargin)">
                      {{ row.profitMargin }}%
                    </span>
                  </td>
                  <td class="cell-center">
                    <span class="unit-count">{{ row.itemsCount }}</span>
                  </td>
                </tr>
                
                <!-- Summary Row -->
                <tr class="summary-row" v-if="reportData.length > 1">
                  <td class="cell-period cell-bold">TOTAL</td>
                  <td class="cell-numeric cell-bold">
                    <span class="cell-amount">{{ formatCurrency(summary.totalRevenue) }}</span>
                  </td>
                  <td class="cell-numeric cell-cost cell-bold">
                    <span class="cell-amount amount-cost">{{ formatCurrency(summary.totalHPP) }}</span>
                  </td>
                  <td class="cell-numeric cell-profit cell-bold">
                    <span class="cell-amount amount-profit">{{ formatCurrency(summary.grossProfit) }}</span>
                  </td>
                  <td class="cell-numeric cell-margin cell-bold">
                    <span class="margin-chip" :class="getMarginClass(summary.profitMargin)">
                      {{ summary.profitMargin }}%
                    </span>
                  </td>
                  <td class="cell-center cell-bold">
                    <span class="unit-count">{{ reportData.reduce((s,r)=>s+r.itemsCount,0) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="table-placeholder">
            <div class="empty-illustration">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="7" y1="15" x2="7" y2="15"/>
                <line x1="11" y1="15" x2="13" y2="15"/>
              </svg>
            </div>
            <p class="empty-message">Belum ada data untuk periode ini</p>
            <span class="empty-hint">Coba perluas rentang tanggal atau ubah agregasi</span>
          </div>
        </div>
      </section>

      <!-- ── Calculation Reference (minimal footer card) ───────────────── -->
      <footer class="reference-card">
        <div class="reference-content">
          <span class="reference-icon">⚙️</span>
          <div class="reference-text">
            <strong>Metode Perhitungan</strong>
            <span class="reference-formulas">
              <code>Laba = Revenue − HPP</code>
              <span class="reference-separator">•</span>
              <code>Margin = (Laba ÷ Revenue) × 100</code>
              <span class="reference-separator">•</span>
              <code>HPP = Qty × Harga Pokok</code>
            </span>
          </div>
        </div>
      </footer>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Theme management
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('nextore-theme', theme.value)
  window.dispatchEvent(new CustomEvent('nextore-theme-change', { detail: theme.value }))
}

// Filter state
const filters = ref({
  startDate: new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  groupBy: 'daily',
})

const reportData = ref([])
const loading = ref(false)

const groupByLabel = computed(() => ({
  daily: 'Harian',
  weekly: 'Mingguan', 
  monthly: 'Bulanan'
}[filters.value.groupBy] || 'Harian'))

// Computed summary
const summary = computed(() => {
  if (!reportData.value.length) {
    return { totalRevenue: 0, totalHPP: 0, grossProfit: 0, profitMargin: 0 }
  }
  const totalRevenue = reportData.value.reduce((s, r) => s + r.totalRevenue, 0)
  const totalHPP = reportData.value.reduce((s, r) => s + r.totalHPP, 0)
  const grossProfit = totalRevenue - totalHPP
  const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0
  return { totalRevenue, totalHPP, grossProfit, profitMargin }
})

// Formatters
const formatCurrency = (v) => (v || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const formatCurrencyShort = (v) => {
  const val = v || 0
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Jt'
  if (val >= 1_000) return (val / 1_000).toFixed(0) + ' Rb'
  return String(val)
}

// Margin helpers
const getMarginClass = (m) => {
  if (m >= 30) return 'margin-excellent'
  if (m >= 20) return 'margin-good'
  if (m >= 15) return 'margin-moderate'
  return 'margin-low'
}

const getMarginColor = (m) => {
  if (m >= 30) return 'var(--margin-excellent)'
  if (m >= 20) return 'var(--margin-good)'
  if (m >= 15) return 'var(--margin-moderate)'
  return 'var(--margin-low)'
}

// Mock data generator (for development)
const generateMockData = () => {
  const days = Math.ceil((new Date(filters.value.endDate) - new Date(filters.value.startDate)) / 86_400_000)
  const count = filters.value.groupBy === 'daily' ? Math.min(days, 14)
    : filters.value.groupBy === 'weekly' ? Math.min(Math.ceil(days / 7), 8) 
    : Math.min(Math.ceil(days / 30), 6)
    
  return Array.from({ length: count }, (_, i) => {
    const revenue = Math.round(500_000 + Math.random() * 2_000_000)
    const hpp = Math.round(revenue * (0.45 + Math.random() * 0.25))
    const profit = revenue - hpp
    const d = new Date(filters.value.startDate)
    d.setDate(d.getDate() + i * (filters.value.groupBy === 'weekly' ? 7 : filters.value.groupBy === 'monthly' ? 30 : 1))
    
    const periodOptions = { 
      day: '2-digit', 
      month: 'short', 
      year: filters.value.groupBy === 'monthly' ? 'numeric' : undefined 
    }
    
    return {
      period: d.toLocaleDateString('id-ID', periodOptions),
      totalRevenue: revenue,
      totalHPP: hpp,
      grossProfit: profit,
      profitMargin: Math.round((profit / revenue) * 10000) / 100,
      itemsCount: Math.floor(5 + Math.random() * 35),
    }
  })
}

// Data fetching
const fetchReport = async () => {
  loading.value = true
  try {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      reportData.value = generateMockData()
      return
    }
    const response = await apiClient.get('/api/finance/profit-report', {
      params: { 
        startDate: filters.value.startDate, 
        endDate: filters.value.endDate, 
        groupBy: filters.value.groupBy 
      },
    })
    reportData.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch report:', error)
    reportData.value = []
  } finally {
    loading.value = false
  }
}

const exportReport = () => {
  // Placeholder for PDF export implementation
  alert('Fitur export PDF akan tersedia setelah integrasi backend lengkap.')
}

// Initial load
onMounted(fetchReport)
</script>

<style scoped>
/* ── CSS Variables: Sophisticated Color System ── */
.finance-layout {
  --revenue-gradient-start: #6366f1;
  --revenue-gradient-end: #8b5cf6;
  --revenue-glow: rgba(99, 102, 241, 0.15);
  
  --margin-excellent: #10b981;
  --margin-good: #22c55e;
  --margin-moderate: #f59e0b;
  --margin-low: #ef4444;
  
  --cost-accent: #64748b;
  --profit-accent: #10b981;
  
  --surface-elevation: 0 4px 20px rgba(0, 0, 0, 0.06);
  --surface-elevation-hover: 0 8px 30px rgba(0, 0, 0, 0.1);
  --border-subtle: rgba(0, 0, 0, 0.06);
  
  --transition-smooth: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.finance-layout[data-theme="dark"] {
  --revenue-gradient-start: #818cf8;
  --revenue-gradient-end: #a78bfa;
  --revenue-glow: rgba(129, 140, 248, 0.2);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --surface-elevation: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* ── Layout ── */
.finance-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-base);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ── Sidebar: Minimal & Focused ── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 1.25rem 0.75rem;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 60;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.25rem 0.5rem 1.25rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.brand-mark {
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-soft), var(--accent-muted));
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
  letter-spacing: -0.01em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-bottom: 0.75rem;
}

.nav-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding: 0.75rem 0.625rem 0.375rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: var(--transition-smooth);
  border-left: 2px solid transparent;
}

.nav-item:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.nav-item.is-active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
  border-left-color: var(--accent);
}

.nav-icon {
  width: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.9;
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.theme-toggle {
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.theme-toggle:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  text-decoration: none;
  color: var(--text-tertiary);
  font-size: 0.8rem;
  font-weight: 500;
  transition: var(--transition-smooth);
}

.back-link:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

/* ── Main Content ── */
.finance-main {
  flex: 1;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

/* ── Header: Editorial Style ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-subtle);
  gap: 1.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-breadcrumb {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.header-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0;
}

.header-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 480px;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-self: flex-end;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-smooth);
  border: 1px solid transparent;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-subtle);
}

.btn-ghost:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--accent);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

.btn-full {
  width: 100%;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* ── Filter Panel: Glass-like ── */
.filter-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  box-shadow: var(--surface-elevation);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.input-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-base);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: var(--transition-smooth);
  outline: none;
}

.input-control:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.input-control:hover {
  border-color: var(--border-strong);
}

.filter-apply {
  min-width: 140px;
}

/* ── Metrics Grid: Asymmetric with Revenue Focus ── */
.metrics-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 1rem;
}

.metric-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 1.125rem;
  position: relative;
  overflow: hidden;
  transition: var(--transition-smooth);
}

.metric-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--surface-elevation-hover);
  transform: translateY(-2px);
}

/* Primary Revenue Card */
.metric-primary {
  grid-column: span 1;
  background: linear-gradient(145deg, var(--bg-surface), var(--bg-surface-2));
  border-color: rgba(99, 102, 241, 0.2);
}

.metric-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, var(--revenue-glow) 0%, transparent 60%);
  opacity: 0.6;
  pointer-events: none;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.metric-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-revenue {
  background: linear-gradient(135deg, var(--revenue-gradient-start), var(--revenue-gradient-end));
  color: white;
}

.badge-cost {
  background: var(--bg-surface-2);
  color: var(--cost-accent);
}

.badge-profit {
  background: var(--success-soft);
  color: var(--profit-accent);
}

.badge-margin {
  background: var(--accent-soft);
  color: var(--accent);
}

.metric-trend {
  font-size: 0.75rem;
  font-weight: 700;
}

.trend-positive {
  color: var(--success);
}

.trend-negative {
  color: var(--danger);
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.value-currency {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.value-number {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.metric-primary .value-number {
  background: linear-gradient(135deg, var(--text-primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.value-cost .value-number {
  color: var(--warning);
}

.value-profit .value-number {
  color: var(--success);
}

.value-margin .value-number {
  font-size: 2rem;
}

.metric-detail {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.metric-sparkline {
  height: 30px;
  margin-top: 0.5rem;
}

.metric-sparkline svg {
  width: 100%;
  height: 100%;
}

.metric-progress {
  height: 4px;
  background: var(--bg-surface-2);
  border-radius: 2px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--warning), var(--warning-dark));
  border-radius: 2px;
  transition: width 0.4s ease;
}

.progress-label {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.metric-diff {
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-subtle);
}

/* Margin Card Highlight */
.metric-highlight {
  border-color: var(--accent-muted);
}

.margin-indicator {
  position: relative;
  height: 6px;
  background: linear-gradient(90deg, var(--margin-low), var(--margin-moderate), var(--margin-good), var(--margin-excellent));
  border-radius: 3px;
  margin: 0.75rem 0 0.25rem;
}

.margin-scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--text-tertiary);
  margin-bottom: 0.375rem;
}

.margin-marker {
  position: absolute;
  top: -3px;
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid var(--accent);
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

/* ── Report Section ── */
.report-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--surface-elevation);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-subtle);
}

.section-heading {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.heading-accent {
  color: var(--accent);
  font-weight: 700;
}

.data-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--bg-surface-2);
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
}

.table-container {
  min-height: 200px;
}

.table-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-illustration {
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-message {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.empty-hint {
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead {
  background: var(--bg-surface-2);
}

.data-table th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.data-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.data-table tbody tr {
  transition: background 0.15s ease;
}

.data-table tbody tr:hover {
  background: var(--bg-surface-2);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.col-period {
  min-width: 140px;
}

.col-numeric {
  text-align: right;
  min-width: 120px;
}

.col-center {
  text-align: center;
  min-width: 100px;
}

.col-cost {
  color: var(--cost-accent);
}

.col-profit {
  color: var(--profit-accent);
}

.col-margin {
  min-width: 90px;
}

.cell-period {
  font-weight: 500;
  color: var(--text-primary);
}

.cell-amount {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 600;
  color: var(--text-primary);
}

.amount-cost {
  color: var(--warning);
}

.amount-profit {
  color: var(--success);
}

.cell-bold {
  font-weight: 700;
}

.margin-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.margin-excellent {
  background: var(--success-soft);
  color: var(--success);
}

.margin-good {
  background: rgba(34, 197, 94, 0.12);
  color: var(--margin-good);
}

.margin-moderate {
  background: var(--warning-soft);
  color: var(--warning);
}

.margin-low {
  background: var(--danger-soft);
  color: var(--danger);
}

.unit-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg-surface-2);
  border-radius: 6px;
  font-weight: 600;
  color: var(--text-secondary);
}

.summary-row {
  background: var(--bg-surface-2) !important;
}

.summary-row td {
  border-top: 2px solid var(--border-strong);
  border-bottom: none;
}

/* ── Reference Card ── */
.reference-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 0.875rem 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.reference-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.reference-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.reference-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.reference-text strong {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.reference-formulas {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.reference-formulas code {
  background: var(--bg-surface-2);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
}

.reference-separator {
  color: var(--text-tertiary);
  font-weight: 700;
}

/* ── Loaders ── */
.loader {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

.loader-lg {
  width: 2rem;
  height: 2rem;
  border-width: 2.5px;
  border-color: var(--border-subtle);
  border-top-color: var(--accent);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Responsive ── */
@media (max-width: 1280px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .metric-primary {
    grid-column: span 2;
  }
  .filter-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 68px;
    padding: 1rem 0.5rem;
  }
  .brand-wordmark,
  .nav-label,
  .nav-item span:not(.nav-icon),
  .sidebar-footer span {
    display: none;
  }
  .sidebar-brand {
    justify-content: center;
    padding-bottom: 1rem;
  }
  .nav-item {
    justify-content: center;
    padding: 0.625rem;
  }
  .nav-icon {
    margin: 0;
  }
  .sidebar-footer {
    justify-content: center;
    gap: 0.75rem;
  }
  .finance-main {
    margin-left: 68px;
    padding: 1.25rem;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    align-self: stretch;
    width: 100%;
  }
  .header-actions .btn {
    flex: 1;
    justify-content: center;
  }
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .metric-primary {
    grid-column: span 1;
  }
}

/* ── Animations ── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.data-row {
  animation: fadeIn 0.3s ease forwards;
  animation-delay: calc(var(--i, 0) * 0.05s);
}
</style>