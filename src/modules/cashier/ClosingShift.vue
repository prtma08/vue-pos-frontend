<template>
  <div class="shift-page" :data-theme="theme">
    <div class="shift-card">
      <!-- Header -->
      <div class="shift-header header-close">
        <h1 class="shift-title">Tutup Shift</h1>
        <p class="shift-subtitle">Laporkan uang fisik di laci kasir</p>
      </div>

      <!-- Shift Summary -->
      <div class="summary-section">
        <h3 class="summary-title">Ringkasan Shift</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Kasir</span>
            <span class="summary-val">{{ shiftStore.currentShift?.cashierName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Terminal</span>
            <span class="summary-val">{{ shiftStore.currentShift?.posDeviceName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Durasi Shift</span>
            <span class="summary-val">{{ shiftStore.shiftDuration }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Jumlah Transaksi</span>
            <span class="summary-val">{{ summary?.transactionCount || 0 }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="money-rows">
          <div class="money-row">
            <span>Modal Awal</span>
            <span class="money-val">Rp {{ formatCurrency(summary?.openingBalance || 0) }}</span>
          </div>
          <div class="money-row">
            <span>Total Penjualan</span>
            <span class="money-val accent">+ Rp {{ formatCurrency(summary?.totalSales || 0) }}</span>
          </div>
          <div class="divider thin"></div>
          <div class="money-row total-row">
            <span>Uang Seharusnya</span>
            <span class="money-val">Rp {{ formatCurrency(summary?.expectedCash || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Physical Cash Input -->
      <form @submit.prevent="handleCloseShift" class="shift-form">
        <label class="form-label">Uang Fisik di Laci (Rp) <span class="required">*</span></label>
        <div class="input-wrapper">
          <span class="input-prefix">Rp</span>
          <input
            ref="cashInput"
            v-model="cashFormatted"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="balance-input"
            @input="formatCash"
            required
          />
        </div>

        <!-- Deficit Alert -->
        <div v-if="cashRaw > 0 && deficitPreview !== 0" class="deficit-alert" :class="deficitPreview > 0 ? 'is-deficit' : 'is-surplus'">
          <span class="deficit-icon">{{ deficitPreview > 0 ? '⚠️' : '✅' }}</span>
          <div>
            <strong>{{ deficitPreview > 0 ? 'Kekurangan' : 'Kelebihan' }}: Rp {{ formatCurrency(Math.abs(deficitPreview)) }}</strong>
            <p class="deficit-hint" v-if="deficitPreview > 0">Selisih akan dicatat dan dilaporkan ke Supervisor</p>
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="btn-close-shift" :disabled="shiftStore.loading || !cashRaw">
          <span v-if="shiftStore.loading" class="spinner"></span>
          {{ shiftStore.loading ? 'Menutup Shift...' : 'Tutup Shift & Logout' }}
        </button>

        <button type="button" class="btn-back" @click="router.push('/cashier')">
          ← Kembali ke Kasir
        </button>
      </form>

      <!-- Success modal -->
      <Teleport to="body">
        <transition name="modal-fade">
          <div v-if="showResult" class="modal-overlay">
            <div class="result-card">
              <div class="result-icon">{{ resultData?.hasDeficit ? '⚠️' : '✅' }}</div>
              <h2 class="result-title">Shift Ditutup</h2>
              <div class="result-details">
                <div class="result-row">
                  <span>Uang Seharusnya</span>
                  <span>Rp {{ formatCurrency(resultData?.shift?.expectedCash || 0) }}</span>
                </div>
                <div class="result-row">
                  <span>Uang Fisik</span>
                  <span>Rp {{ formatCurrency(resultData?.shift?.closingBalance || 0) }}</span>
                </div>
                <div class="result-row" :class="resultData?.hasDeficit ? 'deficit' : 'surplus'" v-if="resultData?.deficit !== 0">
                  <span>{{ resultData?.deficit > 0 ? 'Kekurangan' : 'Kelebihan' }}</span>
                  <span>Rp {{ formatCurrency(Math.abs(resultData?.deficit || 0)) }}</span>
                </div>
              </div>
              <button class="btn-logout" @click="handleLogout">Logout</button>
            </div>
          </div>
        </transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useShiftStore } from '@/stores/shift'

const router = useRouter()
const authStore = useAuthStore()
const shiftStore = useShiftStore()

const theme = ref(localStorage.getItem('nextore-theme') || 'light')
const cashFormatted = ref('')
const cashRaw = ref(0)
const errorMsg = ref('')
const showResult = ref(false)
const resultData = ref(null)
const cashInput = ref(null)

const summary = computed(() => shiftStore.getShiftSummary)

const deficitPreview = computed(() => {
  if (!summary.value || !cashRaw.value) return 0
  return summary.value.expectedCash - cashRaw.value
})

const formatCurrency = (v) => Math.round(v).toLocaleString('id-ID')

const formatCash = () => {
  const digits = cashFormatted.value.replace(/\D/g, '')
  cashRaw.value = parseInt(digits) || 0
  cashFormatted.value = cashRaw.value > 0 ? cashRaw.value.toLocaleString('id-ID') : ''
}

const handleCloseShift = async () => {
  errorMsg.value = ''
  if (cashRaw.value < 0) {
    errorMsg.value = 'Jumlah uang fisik tidak valid'
    return
  }

  const result = await shiftStore.closeShift(cashRaw.value)
  if (result.success) {
    resultData.value = result
    showResult.value = true
  } else {
    errorMsg.value = result.message
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  // If no shift open, redirect back
  shiftStore.restoreShift()
  if (!shiftStore.isShiftOpen) {
    router.replace('/cashier')
    return
  }
  await nextTick()
  cashInput.value?.focus()
})
</script>

<style scoped>
.shift-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
  font-family: 'Inter', system-ui, sans-serif;
}

.shift-page[data-theme="dark"] {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.shift-card {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.shift-page[data-theme="dark"] .shift-card {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.05);
}

.shift-header {
  padding: 2rem;
  text-align: center;
}

.header-close {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.shift-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.shift-subtitle {
  font-size: 0.85rem;
  opacity: 0.85;
  margin-top: 0.25rem;
}

/* Summary section */
.summary-section {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.shift-page[data-theme="dark"] .summary-section {
  border-bottom-color: #334155;
}

.summary-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin: 0 0 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-val {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}

.shift-page[data-theme="dark"] .summary-val {
  color: #f1f5f9;
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 1rem 0;
}

.divider.thin { margin: 0.5rem 0; }

.shift-page[data-theme="dark"] .divider {
  background: #334155;
}

.money-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.money-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #475569;
}

.shift-page[data-theme="dark"] .money-row {
  color: #cbd5e1;
}

.money-val {
  font-weight: 700;
  color: #1e293b;
}

.money-val.accent { color: #10b981; }

.shift-page[data-theme="dark"] .money-val {
  color: #f1f5f9;
}

.total-row {
  font-weight: 700;
  font-size: 1rem;
  color: #1e293b;
}

.shift-page[data-theme="dark"] .total-row {
  color: #f1f5f9;
}

/* Form */
.shift-form {
  padding: 1.5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.shift-page[data-theme="dark"] .form-label { color: #cbd5e1; }
.required { color: #ef4444; }

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 1.25rem;
  font-size: 1rem;
  font-weight: 700;
  color: #94a3b8;
}

.balance-input {
  width: 100%;
  padding: 1rem 1.25rem 1rem 3.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  background: #ffffff;
  outline: none;
  transition: all 0.3s;
  text-align: right;
}

.balance-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
}

.shift-page[data-theme="dark"] .balance-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

/* Deficit alert */
.deficit-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.deficit-alert.is-deficit {
  background: rgba(239, 68, 68, 0.1);
  border: 1.5px solid rgba(239, 68, 68, 0.25);
  color: #dc2626;
}

.deficit-alert.is-surplus {
  background: rgba(16, 185, 129, 0.1);
  border: 1.5px solid rgba(16, 185, 129, 0.25);
  color: #059669;
}

.deficit-icon { font-size: 1.25rem; }

.deficit-hint {
  font-size: 0.78rem;
  margin: 0.25rem 0 0;
  opacity: 0.8;
}

.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.625rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 10px;
  margin: 0;
}

.btn-close-shift {
  padding: 1rem;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.35);
}

.btn-close-shift:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(245, 158, 11, 0.45);
}

.btn-close-shift:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-back {
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-back:hover { color: #1e293b; }
.shift-page[data-theme="dark"] .btn-back:hover { color: #f1f5f9; }

.spinner {
  width: 1.125rem;
  height: 1.125rem;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Result modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.result-card {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
}

.shift-page[data-theme="dark"] .result-card {
  background: #1e293b;
}

.result-icon { font-size: 3rem; margin-bottom: 1rem; }

.result-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 1.5rem;
}

.shift-page[data-theme="dark"] .result-title { color: #f1f5f9; }

.result-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
  margin-bottom: 1.5rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}

.shift-page[data-theme="dark"] .result-row { color: #cbd5e1; }
.result-row.deficit { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.result-row.surplus { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.btn-logout {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(239, 68, 68, 0.4);
}

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
