<template>
  <div class="cfd-layout" :data-theme="theme">
    <!-- Header -->
    <div class="cfd-header">
      <div class="cfd-brand">
        <span class="cfd-logo">🛒</span>
        <span class="cfd-title">{{ settings.posName }}</span>
      </div>
      <div class="cfd-clock">{{ clockDisplay }}</div>
    </div>

    <!-- Main content -->
    <div class="cfd-body">
      <!-- Order Items -->
      <div class="cfd-items-panel">
        <div v-if="!hasItems" class="cfd-empty">
          <div class="cfd-empty-icon">🛍️</div>
          <p>Menunggu pesanan...</p>
        </div>
        <div v-else class="cfd-items">
          <div
            v-for="(item, idx) in items"
            :key="idx"
            class="cfd-item"
            :class="{ 'cfd-item-new': idx === items.length - 1 }"
          >
            <span class="cfd-item-name">{{ item.name }}</span>
            <span class="cfd-item-qty">× {{ item.quantity }}</span>
            <span class="cfd-item-price">Rp {{ fmt(item.price * item.quantity) }}</span>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="cfd-summary-panel">
        <div class="cfd-summary-rows">
          <div class="cfd-row">
            <span>Subtotal</span>
            <span>Rp {{ fmt(summary.subtotal) }}</span>
          </div>
          <div v-if="summary.discountPercent > 0" class="cfd-row cfd-row-discount">
            <span>Diskon ({{ summary.discountPercent }}%)</span>
            <span>− Rp {{ fmt(summary.subtotal * summary.discountPercent / 100) }}</span>
          </div>
          <div v-if="summary.tax > 0" class="cfd-row">
            <span>Pajak</span>
            <span>Rp {{ fmt(summary.tax) }}</span>
          </div>
        </div>

        <div class="cfd-total">
          <span>TOTAL</span>
          <span class="cfd-total-value">Rp {{ fmt(summary.total) }}</span>
        </div>

        <div v-if="summary.paymentMethod" class="cfd-payment-method">
          <span class="cfd-method-icon">
            {{ summary.paymentMethod === 'QRIS' ? '📱' : summary.paymentMethod === 'TRANSFER' ? '🏦' : '💵' }}
          </span>
          <span>{{ summary.paymentMethod }}</span>
        </div>

        <!-- Thank you message after payment -->
        <transition name="fade">
          <div v-if="showThankYou" class="cfd-thankyou">
            <div class="cfd-ty-icon">✅</div>
            <p class="cfd-ty-title">Pembayaran Berhasil!</p>
            <p class="cfd-ty-sub">{{ settings.receiptFooter }}</p>
          </div>
        </transition>
      </div>
    </div>

    <!-- Footer -->
    <div class="cfd-footer">
      <span>{{ settings.posName }} — Customer Display</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'

const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const theme = ref(localStorage.getItem('nextore-theme') || 'light')

// Clock display
const clockDisplay = ref('')
const updateClock = () => {
  clockDisplay.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
const clockInterval = setInterval(updateClock, 1000)
updateClock()

// Pull active order from store
const activeOrder = computed(() => cartStore.activeOrder)
const hasItems = computed(() => activeOrder.value?.items?.length > 0)
const items = computed(() => activeOrder.value?.items || [])
const summary = computed(() => activeOrder.value?.summary || { subtotal: 0, discountPercent: 0, tax: 0, total: 0 })

const showThankYou = ref(false)
const fmt = (v) => Math.round(v || 0).toLocaleString('id-ID')

// Watch for order completion (items cleared after payment)
let prevTotal = 0
const watchInterval = setInterval(() => {
  const curr = summary.value.total
  if (prevTotal > 0 && curr === 0) {
    showThankYou.value = true
    setTimeout(() => { showThankYou.value = false }, 4000)
  }
  prevTotal = curr
}, 500)

onMounted(() => {
  // Listen for storage events from the checkout window
  window.addEventListener('storage', (e) => {
    if (e.key === 'nextore-theme') theme.value = e.newValue || 'light'
  })
})

onUnmounted(() => {
  clearInterval(clockInterval)
  clearInterval(watchInterval)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

.cfd-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}
.cfd-layout[data-theme="light"] {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #0f172a;
}

/* Header */
.cfd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}
.cfd-layout[data-theme="light"] .cfd-header { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.1); }
.cfd-brand { display: flex; align-items: center; gap: 0.75rem; }
.cfd-logo { font-size: 1.75rem; }
.cfd-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.5rem; font-weight: 800; }
.cfd-clock { font-size: 1.25rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.05em; font-variant-numeric: tabular-nums; }

/* Body */
.cfd-body { display: flex; flex: 1; overflow: hidden; }

/* Items panel */
.cfd-items-panel {
  flex: 1;
  padding: 1.5rem 2rem;
  overflow-y: auto;
  border-right: 1px solid rgba(255,255,255,0.08);
}
.cfd-layout[data-theme="light"] .cfd-items-panel { border-color: rgba(0,0,0,0.08); }

.cfd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: #475569;
}
.cfd-empty-icon { font-size: 4rem; }
.cfd-empty p { font-size: 1.25rem; font-weight: 500; }

.cfd-items { display: flex; flex-direction: column; gap: 0.5rem; }
.cfd-item {
  display: flex;
  align-items: center;
  padding: 0.875rem 1rem;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  gap: 0.75rem;
  transition: all 0.3s;
}
.cfd-layout[data-theme="light"] .cfd-item { background: rgba(0,0,0,0.04); }
.cfd-item-new { border-left: 3px solid #6366f1; }
.cfd-item-name { flex: 1; font-size: 1.05rem; font-weight: 500; }
.cfd-item-qty { font-size: 1rem; color: #818cf8; font-weight: 700; min-width: 2.5rem; text-align: center; }
.cfd-item-price { font-size: 1rem; font-weight: 600; min-width: 120px; text-align: right; }

/* Summary panel */
.cfd-summary-panel {
  width: 380px;
  flex-shrink: 0;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.cfd-summary-rows { display: flex; flex-direction: column; gap: 0.5rem; }
.cfd-row { display: flex; justify-content: space-between; font-size: 1rem; padding: 0.4rem 0; }
.cfd-row-discount { color: #34d399; }

.cfd-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  margin-top: 0.5rem;
}
.cfd-total span { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.8); }
.cfd-total-value { font-size: 2rem !important; font-weight: 800 !important; color: #fff !important; }

.cfd-payment-method {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #94a3b8;
}
.cfd-layout[data-theme="light"] .cfd-payment-method { background: rgba(0,0,0,0.04); }
.cfd-method-icon { font-size: 1.25rem; }

/* Thank you overlay */
.cfd-thankyou {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1));
  border: 1.5px solid rgba(16,185,129,0.3);
  border-radius: 16px;
  text-align: center;
}
.cfd-ty-icon { font-size: 2.5rem; }
.cfd-ty-title { font-size: 1.25rem; font-weight: 700; color: #34d399; margin: 0; }
.cfd-ty-sub { font-size: 0.875rem; color: #94a3b8; margin: 0; }

/* Footer */
.cfd-footer {
  padding: 0.75rem 2rem;
  background: rgba(255,255,255,0.03);
  border-top: 1px solid rgba(255,255,255,0.08);
  font-size: 0.8rem;
  color: #475569;
  text-align: center;
  flex-shrink: 0;
}
.cfd-layout[data-theme="light"] .cfd-footer { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
