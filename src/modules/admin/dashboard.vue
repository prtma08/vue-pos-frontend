<template>
  <div class="dashboard-page">
    
    <!-- ── Dashboard Content ─────────────────────────────────────────── -->
    <div class="admin-main">
      
      <!-- Header: Editorial Style ───────────────────────────────────────── -->
      <header class="page-header">
        <div class="header-content">
          <span class="header-greeting">{{ greeting }}</span>
          <h1 class="header-title">{{ authStore.user?.name || 'Administrator' }}</h1>
          <p class="header-subtitle">Ringkasan kinerja bisnis Anda hari ini</p>
        </div>
        <div class="header-meta">
          <div class="date-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{ currentDate }}
          </div>
          <div class="user-profile">
            <div class="avatar-ring">
              <span class="avatar-initials">{{ (authStore.user?.name || 'A')[0].toUpperCase() }}</span>
            </div>
            <div class="user-info">
              <span class="user-name">{{ authStore.user?.name || 'Admin' }}</span>
              <span class="user-role">Super Admin</span>
            </div>
          </div>
        </div>
      </header>

      <!-- ── KPI Metrics: Asymmetric Grid with Visual Hierarchy ─────────── -->
      <section class="metrics-section">
        <div class="metrics-grid">
          
          <!-- Primary: Revenue (Featured Card) -->
          <div class="metric-card metric-featured">
            <div class="metric-glow"></div>
            <div class="metric-header">
              <div class="metric-label">
                <span class="label-icon">💳</span>
                Total Revenue
              </div>
              <span class="metric-delta delta-positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
                12.4%
              </span>
            </div>
            <div class="metric-value">
              <span class="value-prefix">Rp</span>
              <span class="value-main">{{ formatCurrencyShort(stats.totalRevenue) }}</span>
            </div>
            <div class="metric-absolute">{{ formatCurrency(stats.totalRevenue) }}</div>
            <div class="metric-sparkline">
              <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:var(--revenue-start)"/>
                    <stop offset="100%" style="stop-color:var(--revenue-end)"/>
                  </linearGradient>
                </defs>
                <path d="M0,30 Q20,25 40,28 T80,20 T120,15" fill="none" stroke="url(#revenueGrad)" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M0,30 Q20,25 40,28 T80,20 T120,15 L120,40 L0,40 Z" fill="url(#revenueGrad)" opacity="0.12"/>
              </svg>
            </div>
          </div>

          <!-- Orders -->
          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">
                <span class="label-icon">🛒</span>
                Pesanan
              </div>
            </div>
            <div class="metric-value value-neutral">
              <span class="value-main">{{ stats.totalOrders.toLocaleString('id-ID') }}</span>
            </div>
            <div class="metric-absolute">total transaksi</div>
            <div class="metric-compare">
              <span class="compare-label">vs bulan lalu:</span>
              <span class="compare-value positive">+18</span>
            </div>
          </div>

          <!-- Profit -->
          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">
                <span class="label-icon">📈</span>
                Gross Profit
              </div>
            </div>
            <div class="metric-value value-profit">
              <span class="value-prefix">Rp</span>
              <span class="value-main">{{ formatCurrencyShort(stats.totalProfit) }}</span>
            </div>
            <div class="metric-absolute">{{ formatCurrency(stats.totalProfit) }}</div>
            <div class="metric-margin">
              <span class="margin-label">Margin:</span>
              <span class="margin-value" :style="{ color: getMarginColor(profitMargin) }">{{ profitMargin }}%</span>
            </div>
          </div>

          <!-- Stock Alert -->
          <div class="metric-card" :class="{'metric-alert': stats.lowStockCount > 0}">
            <div class="metric-header">
              <div class="metric-label">
                <span class="label-icon">⚠️</span>
                Stok Kritis
              </div>
              <span v-if="stats.lowStockCount > 0" class="metric-badge badge-alert">Perlu Aksi</span>
              <span v-else class="metric-badge badge-ok">Aman</span>
            </div>
            <div class="metric-value" :class="stats.lowStockCount > 0 ? 'value-alert' : 'value-ok'">
              <span class="value-main">{{ stats.lowStockCount }}</span>
              <span class="value-suffix">produk</span>
            </div>
            <div class="metric-absolute">di bawah threshold</div>
            <div class="metric-action" v-if="stats.lowStockCount > 0">
              <router-link to="/admin/products" class="action-link">Lihat Produk →</router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Revenue Trend Chart: Interactive Line Graph ────────────────── -->
      <section class="chart-section">
        <div class="chart-header">
          <div>
            <h2 class="chart-title">Tren Revenue 30 Hari Terakhir</h2>
            <p class="chart-subtitle">Analisis pergerakan pendapatan harian untuk identifikasi pola</p>
          </div>
          <div class="chart-controls">
            <button class="chart-period-btn" :class="{ active: chartPeriod === '7d' }" @click="chartPeriod = '7d'">7H</button>
            <button class="chart-period-btn" :class="{ active: chartPeriod === '30d' }" @click="chartPeriod = '30d'">30H</button>
            <button class="chart-period-btn" :class="{ active: chartPeriod === '90d' }" @click="chartPeriod = '90d'">90H</button>
          </div>
        </div>
        
        <div class="chart-container">
          <!-- Custom SVG Line Chart -->
          <div class="line-chart" ref="chartRef">
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
              <!-- Grid Lines -->
              <g class="chart-grid">
                <line v-for="i in 5" :key="i" 
                      :x1="chartPadding" :y1="chartPadding + (i * (chartHeight - 2*chartPadding) / 5)"
                      :x2="chartWidth - chartPadding" :y2="chartPadding + (i * (chartHeight - 2*chartPadding) / 5)"
                      stroke="var(--grid-color)" stroke-width="0.5" stroke-dasharray="4,4"/>
              </g>
              
              <!-- Area Fill Gradient -->
              <defs>
                <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" :style="{ stopColor: 'var(--revenue-start)', stopOpacity: 0.25 }"/>
                  <stop offset="100%" :style="{ stopColor: 'var(--revenue-end)', stopOpacity: 0.02 }"/>
                </linearGradient>
              </defs>
              
              <!-- Area under line -->
              <path :d="areaPath" fill="url(#chartAreaGrad)" class="chart-area"/>
              
              <!-- Line Path -->
              <path :d="linePath" fill="none" stroke="url(#lineGradient)" stroke-width="2.5" 
                    stroke-linecap="round" stroke-linejoin="round" class="chart-line"/>
              
              <!-- Gradient for line -->
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:var(--revenue-start)"/>
                  <stop offset="100%" style="stop-color:var(--revenue-end)"/>
                </linearGradient>
              </defs>
              
              <!-- Data Points (shown on hover via CSS/JS) -->
              <circle v-for="(point, i) in chartPoints" :key="i"
                      :cx="point.x" :cy="point.y" r="4"
                      fill="white" stroke="var(--revenue-start)" stroke-width="2"
                      class="chart-point" :class="{ 'point-active': hoveredIndex === i }"
                      @mouseenter="hoveredIndex = i" @mouseleave="hoveredIndex = null"/>
              
              <!-- Tooltip -->
              <g v-if="hoveredIndex !== null && chartPoints[hoveredIndex]" class="chart-tooltip">
                <rect :x="chartPoints[hoveredIndex].x - 45" :y="chartPoints[hoveredIndex].y - 55" 
                      width="90" height="48" rx="8" fill="var(--tooltip-bg)" 
                      stroke="var(--border)" stroke-width="1"/>
                <text :x="chartPoints[hoveredIndex].x" :y="chartPoints[hoveredIndex].y - 35" 
                      text-anchor="middle" fill="var(--text-primary)" font-size="11" font-weight="600">
                  {{ formatCurrencyShort(chartData[hoveredIndex]?.value || 0) }}
                </text>
                <text :x="chartPoints[hoveredIndex].x" :y="chartPoints[hoveredIndex].y - 20" 
                      text-anchor="middle" fill="var(--text-secondary)" font-size="9">
                  {{ chartData[hoveredIndex]?.label }}
                </text>
              </g>
              
              <!-- X-Axis Labels -->
              <g class="chart-axis-x">
                <text v-for="(label, i) in xAxisLabels" :key="i"
                      :x="chartPadding + (i * (chartWidth - 2*chartPadding) / (xAxisLabels.length - 1))"
                      :y="chartHeight - chartPadding + 20"
                      text-anchor="middle" fill="var(--text-tertiary)" font-size="9">
                  {{ label }}
                </text>
              </g>
              
              <!-- Y-Axis Labels -->
              <g class="chart-axis-y">
                <text v-for="(label, i) in yAxisLabels" :key="i"
                      :x="chartPadding - 10" 
                      :y="chartPadding + (i * (chartHeight - 2*chartPadding) / (yAxisLabels.length - 1)) + 3"
                      text-anchor="end" fill="var(--text-tertiary)" font-size="9">
                  {{ label }}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      <!-- ── Quick Actions: Navigation Cards ────────────────────────────── -->
      <section class="actions-section">
        <h2 class="section-title">Aksi Cepat</h2>
        <div class="actions-grid">
          <router-link to="/admin/finance" class="action-card">
            <div class="action-card-icon icon-revenue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div class="action-card-content">
              <h3 class="action-card-title">Laporan Keuangan</h3>
              <p class="action-card-desc">Analisis profit, revenue, dan margin berbasis HPP</p>
            </div>
            <span class="action-card-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </router-link>

          <router-link to="/admin/products" class="action-card">
            <div class="action-card-icon icon-products">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div class="action-card-content">
              <h3 class="action-card-title">Manajemen Produk</h3>
              <p class="action-card-desc">Kelola katalog, stok, harga, dan kategori</p>
            </div>
            <span class="action-card-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </router-link>

          <router-link to="/admin/categories" class="action-card">
            <div class="action-card-icon icon-categories">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div class="action-card-content">
              <h3 class="action-card-title">Kategori</h3>
              <p class="action-card-desc">Organisasi produk dalam hierarki kategori</p>
            </div>
            <span class="action-card-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </router-link>

          <router-link to="/admin/transactions" class="action-card">
            <div class="action-card-icon icon-transactions">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div class="action-card-content">
              <h3 class="action-card-title">Transaksi</h3>
              <p class="action-card-desc">Riwayat lengkap semua transaksi kasir</p>
            </div>
            <span class="action-card-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </router-link>
        </div>
      </section>

      <!-- ── Staff Overview: Admin Only ─────────────────────────────────── -->
      <section v-if="authStore.isAdmin" class="staff-section">
        <div class="staff-section-header">
          <div>
            <h2 class="staff-section-title">Staff Overview</h2>
            <p class="staff-section-sub">Pemantauan karyawan &amp; kontribusi pendapatan secara real-time</p>
          </div>
          <div class="staff-meta-chips">
            <span class="staff-chip chip-online">
              <span class="chip-dot dot-online"></span>
              {{ staffStore.onlineCount }} Online
            </span>
            <span class="staff-chip chip-total">
              {{ staffStore.staffPerformance.length }} Karyawan
            </span>
          </div>
        </div>

        <div class="staff-table-wrap">
          <table class="staff-table">
            <thead>
              <tr>
                <th class="col-employee">Karyawan</th>
                <th class="col-status">Status</th>
                <th class="col-shift">Jam Kerja</th>
                <th class="col-revenue">Pendapatan</th>
                <th class="col-bar">Kontribusi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in staffStore.staffPerformance"
                :key="s.id"
                class="staff-row"
              >
                <!-- Employee: Avatar + Name + Role -->
                <td class="cell-employee">
                  <div class="employee-cell">
                    <div class="emp-avatar" :class="'avatar-' + s.role.toLowerCase()">
                      {{ s.avatar }}
                    </div>
                    <div class="emp-info">
                      <span class="emp-name">{{ s.name }}</span>
                      <span class="emp-role role-badge" :class="'role-' + s.role.toLowerCase()">{{ s.roleLabel }}</span>
                    </div>
                  </div>
                </td>

                <!-- Status -->
                <td class="cell-status">
                  <span class="status-pill" :class="s.status === 'Online' ? 'pill-online' : 'pill-offline'">
                    <span class="pill-dot"></span>
                    {{ s.status }}
                  </span>
                </td>

                <!-- Last login / shift duration -->
                <td class="cell-shift">
                  <div class="shift-info">
                    <span v-if="s.status === 'Online'" class="shift-duration">{{ s.shiftDuration }}</span>
                    <span class="shift-label">{{ s.lastLoginFormatted }}</span>
                  </div>
                </td>

                <!-- Revenue -->
                <td class="cell-revenue">
                  <div class="revenue-block">
                    <span class="revenue-prefix">Rp</span>
                    <span class="revenue-value">{{ formatCurrency(s.revenue) }}</span>
                  </div>
                  <div class="revenue-tx">{{ s.txCount }} transaksi</div>
                </td>

                <!-- Mini Bar Chart -->
                <td class="cell-bar">
                  <div class="bar-wrap">
                    <div class="bar-track">
                      <div
                        class="bar-fill"
                        :style="{ width: s.revenuePercent + '%' }"
                        :class="s.status === 'Online' ? 'bar-active' : 'bar-inactive'"
                      ></div>
                    </div>
                    <span class="bar-pct">{{ s.revenuePercent }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Low Stock Alert Table ──────────────────────────────────────── -->
      <section v-if="lowStockProducts.length > 0" class="alerts-section">
        <div class="alerts-header">
          <h2 class="section-title">
            <span class="title-icon">⚠️</span>
            Peringatan Stok
            <span class="badge-count">{{ lowStockProducts.length }}</span>
          </h2>
          <router-link to="/admin/products" class="view-all-link">Lihat Semua →</router-link>
        </div>
        
        <div class="alerts-table">
          <table>
            <thead>
              <tr>
                <th class="col-product">Produk</th>
                <th class="col-sku">SKU</th>
                <th class="col-category">Kategori</th>
                <th class="col-stock">Stok</th>
                <th class="col-threshold">Threshold</th>
                <th class="col-status">Status</th>
                <th class="col-action">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in lowStockProducts.slice(0, 5)" :key="product.id" class="alert-row">
                <td class="cell-product">
                  <div class="product-cell">
                    <div class="product-thumb" :style="{ background: getProductColor(product.name) }">
                      {{ product.name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="product-name">{{ product.name }}</span>
                  </div>
                </td>
                <td class="cell-sku"><code class="sku-code">{{ product.sku || '-' }}</code></td>
                <td class="cell-category">{{ product.category?.name || '-' }}</td>
                <td class="cell-stock">
                  <span class="stock-badge" :class="product.stock === 0 ? 'stock-out' : 'stock-low'">
                    {{ product.stock }}
                  </span>
                </td>
                <td class="cell-threshold">{{ product.lowStockThreshold || lowStockThreshold }}</td>
                <td class="cell-status">
                  <span class="status-chip" :class="product.stock === 0 ? 'status-out' : 'status-critical'">
                    {{ product.stock === 0 ? 'Habis' : 'Kritis' }}
                  </span>
                </td>
                <td class="cell-action">
                  <button class="btn-restock" @click.stop="handleRestock(product)">Restock</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useStaffStore } from '@/stores/staff'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const staffStore = useStaffStore()
const router = useRouter()

// Theme is controlled by MainLayout — read it for CSS variable bindings only
const theme = computed(() => localStorage.getItem('nextore-theme') || 'light')

// Stats
const stats = ref({ 
  totalOrders: 156, 
  totalRevenue: 15_600_000, 
  totalProfit: 6_240_000, 
  lowStockCount: 3 
})
const profitMargin = computed(() => 
  stats.value.totalRevenue > 0 
    ? Math.round((stats.value.totalProfit / stats.value.totalRevenue) * 100) 
    : 0
)

const lowStockProducts = computed(() => productsStore.lowStockProducts)
const lowStockThreshold = computed(() => productsStore.lowStockThreshold)

// Greeting
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Selamat Pagi'
  if (h < 15) return 'Selamat Siang'
  if (h < 19) return 'Selamat Sore'
  return 'Selamat Malam'
})

const currentDate = computed(() => 
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

// Formatters
const formatCurrency = (v) => (v || 0).toLocaleString('id-ID', { minimumFractionDigits: 0 })
const formatCurrencyShort = (v) => {
  const val = v || 0
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Jt'
  if (val >= 1_000) return Math.round(val / 1_000) + ' Rb'
  return String(val)
}

const getMarginColor = (m) => {
  if (m >= 30) return 'var(--margin-excellent)'
  if (m >= 20) return 'var(--margin-good)'
  if (m >= 15) return 'var(--margin-moderate)'
  return 'var(--margin-low)'
}

const getProductColor = (name) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#14b8a6']
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return colors[index]
}

// Chart Configuration
const chartRef = ref(null)
const chartWidth = 800
const chartHeight = 280
const chartPadding = 50
const chartPeriod = ref('30d')
const hoveredIndex = ref(null)

// Generate mock chart data
const generateChartData = (period) => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const baseValue = 450000
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const trend = Math.sin(i * 0.3) * 80000
    const noise = (Math.random() - 0.5) * 120000
    const value = Math.max(200000, baseValue + trend + noise)
    return {
      label: date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
      value: Math.round(value),
      date
    }
  })
}

const chartData = computed(() => generateChartData(chartPeriod.value))

// Calculate path for line chart
const linePath = computed(() => {
  if (chartData.value.length < 2) return ''
  const xStep = (chartWidth - 2 * chartPadding) / (chartData.value.length - 1)
  const values = chartData.value.map(d => d.value)
  const minVal = Math.min(...values) * 0.9
  const maxVal = Math.max(...values) * 1.1
  const range = maxVal - minVal || 1
  
  const points = chartData.value.map((d, i) => {
    const x = chartPadding + i * xStep
    const y = chartHeight - chartPadding - ((d.value - minVal) / range) * (chartHeight - 2 * chartPadding)
    return { x, y }
  })
  
  // Smooth curve using quadratic bezier
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpX = (prev.x + curr.x) / 2
    path += ` Q ${prev.x + (curr.x - prev.x) * 0.3} ${prev.y}, ${cpX} ${(prev.y + curr.y) / 2}`
    path += ` T ${curr.x} ${curr.y}`
  }
  return path
})

// Area path (same as line but closed at bottom)
const areaPath = computed(() => {
  const line = linePath.value
  if (!line) return ''
  return `${line} L ${chartWidth - chartPadding} ${chartHeight - chartPadding} L ${chartPadding} ${chartHeight - chartPadding} Z`
})

// Chart points for interaction
const chartPoints = computed(() => {
  const xStep = (chartWidth - 2 * chartPadding) / (chartData.value.length - 1)
  const values = chartData.value.map(d => d.value)
  const minVal = Math.min(...values) * 0.9
  const maxVal = Math.max(...values) * 1.1
  const range = maxVal - minVal || 1
  
  return chartData.value.map((d, i) => ({
    x: chartPadding + i * xStep,
    y: chartHeight - chartPadding - ((d.value - minVal) / range) * (chartHeight - 2 * chartPadding),
    value: d.value,
    label: d.label
  }))
})

// Axis labels
const xAxisLabels = computed(() => {
  const count = chartPeriod.value === '7d' ? 4 : chartPeriod.value === '30d' ? 6 : 8
  const step = Math.floor(chartData.value.length / (count - 1))
  return chartData.value.filter((_, i) => i % step === 0 || i === chartData.value.length - 1).map(d => d.label)
})

const yAxisLabels = computed(() => {
  const values = chartData.value.map(d => d.value)
  const minVal = Math.min(...values) * 0.9
  const maxVal = Math.max(...values) * 1.1
  const step = (maxVal - minVal) / 4
  return Array.from({ length: 5 }, (_, i) => {
    const val = maxVal - i * step
    return formatCurrencyShort(Math.round(val))
  })
})

// Actions
const handleLogout = async () => {
  if (confirm('Logout dari sistem?')) {
    await authStore.logout()
    router.push('/login')
  }
}

const handleRestock = (product) => {
  // Navigate to product edit with restock focus
  router.push(`/admin/products/${product.id}?action=restock`)
}

// Initialize
onMounted(async () => {
  await Promise.all([
    productsStore.fetchProducts(),
    staffStore.fetchStaff(),
  ])
  stats.value.lowStockCount = productsStore.lowStockProducts.length
})

// Responsive chart resize (simplified)
watch(chartPeriod, () => { hoveredIndex.value = null })
</script>

<style scoped>
/* ── CSS Variables: Professional Color System ── */
.admin-layout {
  --revenue-start: #6366f1;
  --revenue-end: #8b5cf6;
  --revenue-glow: rgba(99, 102, 241, 0.12);
  
  --margin-excellent: #10b981;
  --margin-good: #22c55e;
  --margin-moderate: #f59e0b;
  --margin-low: #ef4444;
  
  --grid-color: var(--border-subtle, rgba(0,0,0,0.08));
  --tooltip-bg: var(--bg-surface, #fff);
  
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.12);
  
  --transition-smooth: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-layout[data-theme="dark"] {
  --revenue-start: #818cf8;
  --revenue-end: #a78bfa;
  --revenue-glow: rgba(129, 140, 248, 0.18);
  --grid-color: rgba(255,255,255,0.1);
  --tooltip-bg: var(--bg-surface, #1f2937);
}

/* ── Layout ── */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-base);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ── Sidebar: Minimal Professional ── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle, rgba(0,0,0,0.08));
  display: flex;
  flex-direction: column;
  padding: 1.25rem 0.75rem;
  position: fixed;
  top: 0; bottom: 0; left: 0;
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
  font-family: 'Playfair Display', Georgia, serif;
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
  flex-direction: column;
  gap: 0.375rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.theme-toggle, .logout-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-smooth);
  width: 100%;
  text-align: left;
}

.theme-toggle:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.logout-btn {
  color: var(--danger);
}

.logout-btn:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

/* ── Main Content ── */
.admin-main {
  flex: 1;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

/* ── Header: Editorial Typography ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
  gap: 1.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-greeting {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.header-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0;
}

.header-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 420px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.875rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
}

.avatar-ring {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.user-role {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

/* ── Metrics Section ── */
.metrics-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr 1fr;
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
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Featured Revenue Card */
.metric-featured {
  background: linear-gradient(145deg, var(--bg-surface), var(--bg-surface-2));
  border-color: rgba(99, 102, 241, 0.25);
}

.metric-glow {
  position: absolute;
  top: -60%;
  right: -60%;
  width: 220%;
  height: 220%;
  background: radial-gradient(circle, var(--revenue-glow) 0%, transparent 65%);
  opacity: 0.7;
  pointer-events: none;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
}

.metric-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.label-icon {
  font-size: 1rem;
}

.metric-delta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
}

.delta-positive {
  background: var(--success-soft);
  color: var(--success);
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  margin-bottom: 0.125rem;
}

.value-prefix {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.value-main {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.metric-featured .value-main {
  background: linear-gradient(135deg, var(--text-primary), var(--revenue-start));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.value-neutral .value-main { color: var(--text-primary); }
.value-profit .value-main { color: var(--success); }
.value-alert .value-main { color: var(--danger); }
.value-ok .value-main { color: var(--success); }

.value-suffix {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.metric-absolute {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.625rem;
}

.metric-sparkline {
  height: 32px;
  margin-top: 0.25rem;
}

.metric-sparkline svg {
  width: 100%;
  height: 100%;
}

.metric-compare {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
}

.compare-label { color: var(--text-tertiary); }
.compare-value.positive { color: var(--success); font-weight: 600; }

.metric-margin {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
}

.margin-label { color: var(--text-tertiary); }
.margin-value { font-weight: 700; }

.metric-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-alert { background: var(--danger-soft); color: var(--danger); }
.badge-ok { background: var(--success-soft); color: var(--success); }

.metric-action {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-subtle);
}

.action-link {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.action-link:hover { text-decoration: underline; }

/* ── Chart Section ── */
.chart-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 1.25rem;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
}

.chart-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.chart-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: 0.375rem;
  background: var(--bg-surface-2);
  padding: 0.25rem;
  border-radius: 10px;
}

.chart-period-btn {
  padding: 0.375rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.chart-period-btn.active {
  background: var(--accent);
  color: white;
}

.chart-period-btn:hover:not(.active) {
  color: var(--text-primary);
}

.chart-container {
  width: 100%;
  overflow: hidden;
}

.line-chart {
  width: 100%;
  height: 280px;
}

.line-chart svg {
  width: 100%;
  height: 100%;
  display: block;
}

.chart-grid line {
  transition: stroke 0.2s ease;
}

.chart-area {
  transition: opacity 0.2s ease;
}

.chart-line {
  filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.15));
  transition: stroke-width 0.2s ease;
}

.chart-point {
  cursor: pointer;
  transition: r 0.15s ease, stroke 0.15s ease;
}

.chart-point:hover, .chart-point.point-active {
  r: 6;
  stroke-width: 3;
}

.chart-tooltip {
  pointer-events: none;
}

.chart-axis-x text, .chart-axis-y text {
  user-select: none;
}

/* ── Actions Section ── */
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.title-icon { font-size: 1.1rem; }

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  text-decoration: none;
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--accent-dark));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.action-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.action-card:hover::before { opacity: 1; }

.action-card-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.icon-revenue { background: linear-gradient(135deg, var(--revenue-start), var(--revenue-end)); }
.icon-products { background: linear-gradient(135deg, #3b82f6, #6366f1); }
.icon-categories { background: linear-gradient(135deg, #ec4899, #f43f5e); }
.icon-transactions { background: linear-gradient(135deg, #10b981, #14b8a6); }

.action-card-content {
  flex: 1;
  min-width: 0;
}

.action-card-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
  margin: 0 0 0.125rem 0;
}

.action-card-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.action-card-arrow {
  color: var(--text-tertiary);
  transition: var(--transition-smooth);
}

.action-card:hover .action-card-arrow {
  color: var(--accent);
  transform: translateX(2px);
}

/* ── Alerts Section ── */
.alerts-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alerts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-count {
  background: var(--danger);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.view-all-link {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--accent);
  text-decoration: none;
}

.view-all-link:hover { text-decoration: underline; }

.alerts-table {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
}

.alerts-table table {
  width: 100%;
  border-collapse: collapse;
}

.alerts-table th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface-2);
}

.alerts-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.alerts-table tbody tr:last-child td { border-bottom: none; }
.alerts-table tbody tr:hover { background: var(--bg-surface-2); }

.col-product { min-width: 200px; }
.col-sku { min-width: 100px; }
.col-category { min-width: 120px; }
.col-stock, .col-threshold { min-width: 80px; text-align: center; }
.col-status { min-width: 90px; }
.col-action { min-width: 100px; text-align: right; }

.product-cell {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.product-thumb {
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.product-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.sku-code {
  background: var(--bg-surface-2);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8rem;
}

.stock-out { background: var(--danger-soft); color: var(--danger); }
.stock-low { background: var(--warning-soft); color: var(--warning); }

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-out { background: var(--danger); color: white; }
.status-critical { background: var(--warning); color: #1f2937; }

.btn-restock {
  padding: 0.375rem 0.875rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-restock:hover {
  background: var(--accent-dark);
  transform: translateY(-1px);
}

/* ── Responsive ── */
@media (max-width: 1280px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .metric-featured { grid-column: span 2; }
  .actions-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .sidebar { width: 68px; padding: 1rem 0.5rem; }
  .brand-wordmark, .nav-label, .nav-item span:not(.nav-icon), 
  .sidebar-footer span, .user-info { display: none; }
  .sidebar-brand { justify-content: center; padding-bottom: 1rem; }
  .nav-item { justify-content: center; padding: 0.625rem; }
  .nav-icon { margin: 0; }
  .sidebar-footer { justify-content: center; gap: 0.75rem; }
  
  .admin-main { margin-left: 68px; padding: 1.25rem; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-meta { width: 100%; justify-content: space-between; }
  
  .metrics-grid { grid-template-columns: 1fr; }
  .metric-featured { grid-column: span 1; }
  .actions-grid { grid-template-columns: 1fr; }
  
  .chart-header { flex-direction: column; align-items: flex-start; }
  .chart-controls { width: 100%; justify-content: center; }
}

/* ── Animations ── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.metric-card, .action-card, .alert-row {
  animation: fadeInUp 0.4s ease forwards;
}

.metric-card:nth-child(1) { animation-delay: 0.05s; }
.metric-card:nth-child(2) { animation-delay: 0.1s; }
.metric-card:nth-child(3) { animation-delay: 0.15s; }
.metric-card:nth-child(4) { animation-delay: 0.2s; }

.chart-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 1.2s ease forwards 0.3s;
}

@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}

/* ── Staff Overview Section ── */
.staff-section {
  --staff-online: #10b981;
  --staff-online-glow: rgba(16, 185, 129, 0.25);
  --staff-offline: #9ca3af;
  --staff-bar-active: linear-gradient(90deg, #6366f1, #8b5cf6);
  --staff-bar-inactive: linear-gradient(90deg, #d1d5db, #9ca3af);
  --staff-avatar-admin: linear-gradient(135deg, #6366f1, #8b5cf6);
  --staff-avatar-supervisor: linear-gradient(135deg, #f59e0b, #f97316);
  --staff-avatar-cashier: linear-gradient(135deg, #14b8a6, #06b6d4);
  background: var(--bg-surface);
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: var(--shadow-md);
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.4s ease forwards 0.25s;
  opacity: 0;
}

.admin-layout[data-theme="dark"] .staff-section {
  --staff-bar-inactive: linear-gradient(90deg, #374151, #4b5563);
}

.staff-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.staff-section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
  letter-spacing: -0.02em;
}

.staff-section-sub {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin: 0;
}

.staff-meta-chips {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.staff-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.775rem;
  font-weight: 600;
}

.chip-online {
  background: rgba(16, 185, 129, 0.1);
  color: var(--staff-online);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.chip-total {
  background: var(--bg-surface-2, rgba(0,0,0,0.04));
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-online {
  background: var(--staff-online);
  box-shadow: 0 0 0 2px var(--staff-online-glow);
  animation: pulseGreen 2s ease-in-out infinite;
}

@keyframes pulseGreen {
  0%, 100% { box-shadow: 0 0 0 2px var(--staff-online-glow); }
  50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.1); }
}

/* Table base */
.staff-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
}

.staff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.staff-table thead tr {
  background: var(--bg-surface-2, rgba(0,0,0,0.03));
}

.staff-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  white-space: nowrap;
  border-bottom: 1px solid var(--border-subtle);
}

.staff-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  cursor: default;
}

.staff-row:last-child {
  border-bottom: none;
}

.staff-row:hover {
  background: var(--accent-soft, rgba(99, 102, 241, 0.04));
  transform: translateX(2px);
  box-shadow: inset 3px 0 0 var(--revenue-start);
}

.staff-table td {
  padding: 0.875rem 1rem;
  vertical-align: middle;
}

/* Employee cell */
.employee-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.emp-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  letter-spacing: 0;
}

.avatar-admin    { background: var(--staff-avatar-admin); }
.avatar-supervisor { background: var(--staff-avatar-supervisor); }
.avatar-cashier  { background: var(--staff-avatar-cashier); }

.emp-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.emp-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1;
}

.emp-role {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  text-transform: uppercase;
  width: fit-content;
}

.role-admin      { background: rgba(99,102,241,0.1); color: #6366f1; }
.role-supervisor { background: rgba(245,158,11,0.1); color: #f59e0b; }
.role-cashier    { background: rgba(20,184,166,0.1); color: #14b8a6; }

/* Status pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pill-online {
  background: rgba(16, 185, 129, 0.1);
  color: var(--staff-online);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.pill-online .pill-dot {
  background: var(--staff-online);
  box-shadow: 0 0 0 3px var(--staff-online-glow);
  animation: pulseGreen 2s ease-in-out infinite;
}

.pill-offline {
  background: rgba(156,163,175,0.1);
  color: var(--staff-offline);
  border: 1px solid rgba(156,163,175,0.2);
}

.pill-offline .pill-dot {
  background: var(--staff-offline);
}

/* Shift info */
.shift-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.shift-duration {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
}

.shift-label {
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

/* Revenue */
.revenue-block {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.revenue-prefix {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.revenue-value {
  font-family: 'Playfair Display', 'EB Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.revenue-tx {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  margin-top: 0.1rem;
}

/* Mini bar */
.bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 110px;
}

.bar-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-surface-2, rgba(0,0,0,0.06));
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.bar-active   { background: var(--staff-bar-active); }
.bar-inactive { background: var(--staff-bar-inactive); }

.bar-pct {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-tertiary);
  min-width: 30px;
  text-align: right;
}

/* Column widths */
.col-employee { width: 35%; }
.col-status   { width: 12%; }
.col-shift    { width: 18%; }
.col-revenue  { width: 20%; }
.col-bar      { width: 15%; }

@media (max-width: 900px) {
  .staff-section-header { flex-direction: column; align-items: flex-start; }
  .col-shift { display: none; }
}

@media (max-width: 640px) {
  .staff-section { padding: 1.25rem; }
  .col-bar { display: none; }
}
</style>