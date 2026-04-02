<template>
  <div class="shift-page" :data-theme="theme">
    <div class="shift-card">
      <!-- Header -->
      <div class="shift-header">
        <div class="brand-row">
          <div class="brand-mark">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 8h14M7 14h9M7 20h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="21" cy="20" r="3" fill="currentColor"/>
            </svg>
          </div>
          <span class="brand-name">Nextore POS</span>
        </div>
        <h1 class="shift-title">Buka Shift</h1>
        <p class="shift-subtitle">Masukkan modal awal untuk memulai shift</p>
      </div>

      <!-- Info -->
      <div class="shift-info">
        <div class="info-row">
          <span class="info-label">Kasir</span>
          <span class="info-value">{{ authStore.user?.name || authStore.user?.username }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Terminal</span>
          <span class="info-value">{{ authStore.posDevice?.name || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal</span>
          <span class="info-value">{{ currentDate }}</span>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleOpenShift" class="shift-form">
        <label class="form-label">Modal Awal (Rp) <span class="required">*</span></label>
        <div class="input-wrapper">
          <span class="input-prefix">Rp</span>
          <input
            ref="balanceInput"
            v-model="balanceFormatted"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="balance-input"
            @input="formatBalance"
            required
          />
        </div>

        <!-- Quick amounts -->
        <div class="quick-amounts">
          <button type="button" v-for="amt in quickAmounts" :key="amt" class="quick-btn" @click="setQuickAmount(amt)">
            {{ formatCurrency(amt) }}
          </button>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="btn-open" :disabled="shiftStore.loading || !balanceRaw">
          <span v-if="shiftStore.loading" class="spinner"></span>
          <span v-else>🚀</span>
          {{ shiftStore.loading ? 'Membuka Shift...' : 'Mulai Shift' }}
        </button>

        <button type="button" class="btn-back" @click="goBack">
          ← Kembali
        </button>
      </form>
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
const balanceFormatted = ref('')
const balanceRaw = ref(0)
const errorMsg = ref('')
const balanceInput = ref(null)

const quickAmounts = [100000, 200000, 300000, 500000]

const currentDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
})

const formatCurrency = (v) => Math.round(v).toLocaleString('id-ID')

const formatBalance = () => {
  const digits = balanceFormatted.value.replace(/\D/g, '')
  balanceRaw.value = parseInt(digits) || 0
  balanceFormatted.value = balanceRaw.value > 0 ? balanceRaw.value.toLocaleString('id-ID') : ''
}

const setQuickAmount = (amt) => {
  balanceRaw.value = amt
  balanceFormatted.value = amt.toLocaleString('id-ID')
}

const handleOpenShift = async () => {
  errorMsg.value = ''
  if (balanceRaw.value <= 0) {
    errorMsg.value = 'Modal awal harus lebih dari Rp 0'
    return
  }

  const result = await shiftStore.openShift(balanceRaw.value)
  if (result.success) {
    router.push('/cashier')
  } else {
    errorMsg.value = result.message
  }
}

const goBack = () => {
  router.push('/cashier/device-select')
}

onMounted(async () => {
  // If shift already open, go directly to cashier
  shiftStore.restoreShift()
  if (shiftStore.isShiftOpen) {
    router.replace('/cashier')
    return
  }
  await nextTick()
  balanceInput.value?.focus()
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
  max-width: 460px;
  background: #ffffff;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.shift-page[data-theme="dark"] .shift-card {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
}

.shift-header {
  padding: 2.5rem 2rem 1.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  text-align: center;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  margin-bottom: 1.25rem;
}

.brand-mark {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.shift-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
}

.shift-subtitle {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-top: 0.375rem;
}

.shift-info {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shift-page[data-theme="dark"] .shift-info {
  border-bottom-color: #334155;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.shift-page[data-theme="dark"] .info-value {
  color: #f1f5f9;
}

.shift-form {
  padding: 1.75rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.shift-page[data-theme="dark"] .form-label {
  color: #cbd5e1;
}

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
  padding: 1.125rem 1.25rem 1.125rem 3.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  background: #ffffff;
  outline: none;
  transition: all 0.3s;
  text-align: right;
  letter-spacing: 0.02em;
}

.balance-input::placeholder {
  color: #cbd5e1;
  font-weight: 400;
}

.balance-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.shift-page[data-theme="dark"] .balance-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.shift-page[data-theme="dark"] .balance-input:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.15);
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.quick-btn {
  padding: 0.625rem 0.5rem;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
  transform: translateY(-1px);
}

.shift-page[data-theme="dark"] .quick-btn {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.shift-page[data-theme="dark"] .quick-btn:hover {
  border-color: #818cf8;
  color: #818cf8;
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

.btn-open {
  padding: 1rem;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #10b981, #14b8a6);
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.35);
  margin-top: 0.5rem;
}

.btn-open:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.45);
}

.btn-open:disabled {
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

.btn-back:hover {
  color: #1e293b;
}

.shift-page[data-theme="dark"] .btn-back:hover {
  color: #f1f5f9;
}

.spinner {
  width: 1.125rem;
  height: 1.125rem;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
