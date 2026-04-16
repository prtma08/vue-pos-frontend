<template>
  <div class="device-selector-page" :data-theme="theme">
    <!-- Theme Toggle -->
    <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'">
      <span v-if="theme === 'light'">🌙</span>
      <span v-else>☀️</span>
    </button>

    <!-- Background decoration -->
    <div class="ds-bg-decoration" aria-hidden="true">
      <div class="decoration-orb orb-1"></div>
      <div class="decoration-orb orb-2"></div>
    </div>

    <!-- Content -->
    <div class="ds-container animate-fadeIn">
      <div class="ds-header">
        <div class="ds-header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h1 class="ds-title">Pilih Terminal POS</h1>
        <p class="ds-subtitle">Pilih perangkat kasir yang akan Anda gunakan</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="ds-loading">
        <div class="ds-spinner"></div>
        <p>Memuat perangkat...</p>
      </div>

      <!-- Device Grid -->
      <div v-else class="ds-grid">
        <button
          v-for="device in authStore.posDevices"
          :key="device.id"
          class="ds-device-card"
          :class="{
            'ds-device-card--occupied': device.isOccupied,
            'ds-device-card--selected': selectedDevice?.id === device.id
          }"
          :disabled="device.isOccupied"
          @click="selectedDevice = device"
        >
          <div class="ds-device-status" :class="device.isOccupied ? 'status--occupied' : 'status--available'">
            <span class="status-dot"></span>
            <span class="status-text">{{ device.isOccupied ? 'Digunakan' : 'Tersedia' }}</span>
          </div>
          <div class="ds-device-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h3 class="ds-device-name">{{ device.name }}</h3>
          <p class="ds-device-location">{{ device.location }}</p>
        </button>
      </div>

      <!-- Error -->
      <div v-if="confirmError" class="ds-error">
        <span>⚠️ {{ confirmError }}</span>
      </div>

      <!-- Actions -->
      <div class="ds-actions">
        <button class="btn btn-primary btn-lg ds-btn-confirm" :disabled="!selectedDevice || confirming" @click="handleConfirm">
          <span v-if="confirming" class="ds-spinner-sm"></span>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>{{ confirming ? 'Memproses...' : 'Mulai Sesi Kasir' }}</span>
        </button>
        <button class="ds-btn-back" @click="handleBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Kembali ke Pilih Role</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const selectedDevice = ref(null)
const loading = ref(true)
const confirming = ref(false)
const confirmError = ref('')
const theme = ref(localStorage.getItem('nextore-theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('nextore-theme', theme.value)
}

onMounted(async () => {
  await authStore.fetchPosDevices()
  loading.value = false
})

const handleConfirm = async () => {
  if (!selectedDevice.value) return
  confirming.value = true
  confirmError.value = ''

  const result = await authStore.selectPosDevice(selectedDevice.value)

  if (!result.success) {
    confirmError.value = result.message || 'Gagal memilih POS terminal'
    confirming.value = false
    return
  }

  confirming.value = false
  // Stage 3 complete → proceed to cashier (router guard handles shift check)
  router.push('/cashier')
}

const handleBack = () => {
  authStore.switchRole()
  router.push('/role-select')
}
</script>

<style scoped>
/* ── Page ── */
.device-selector-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-base);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

/* ── Background ── */
.ds-bg-decoration { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.decoration-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.45; }
.orb-1 { width: 450px; height: 450px; top: -120px; left: -100px; background: radial-gradient(circle, var(--accent-muted), transparent 70%); }
.orb-2 { width: 350px; height: 350px; bottom: -100px; right: -80px; background: radial-gradient(circle, hsl(200 70% 50% / 0.15), transparent 70%); }

/* ── Theme Toggle ── */
.theme-toggle {
  position: fixed; top: 1.25rem; right: 1.25rem;
  width: 2.5rem; height: 2.5rem;
  border-radius: 50%; border: 1.5px solid var(--border);
  background: var(--bg-surface); box-shadow: var(--shadow-sm);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; transition: all 0.2s ease; z-index: 100;
}
.theme-toggle:hover { transform: scale(1.1); box-shadow: var(--shadow-md); }

/* ── Container ── */
.ds-container { position: relative; z-index: 1; width: 100%; max-width: 520px; }

/* ── Header ── */
.ds-header { text-align: center; margin-bottom: 2rem; }
.ds-header-icon {
  width: 4rem; height: 4rem; margin: 0 auto 1rem;
  border-radius: 16px;
  background: var(--accent-soft);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid var(--accent-muted);
}
.ds-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.75rem; font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 0.375rem;
}
.ds-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem; color: var(--text-tertiary);
}

/* ── Loading ── */
.ds-loading {
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  padding: 3rem 0;
  color: var(--text-tertiary);
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
}
.ds-spinner {
  width: 2rem; height: 2rem;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Grid ── */
.ds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

/* ── Device Card ── */
.ds-device-card {
  display: flex; flex-direction: column; align-items: center;
  padding: 1.5rem 1rem;
  background: var(--bg-surface);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  box-shadow: var(--shadow-sm);
  font-family: 'Inter', sans-serif;
  position: relative;
}
.ds-device-card:hover:not(:disabled) {
  border-color: var(--accent);
  box-shadow: 0 4px 24px hsl(var(--accent-hsl) / 0.12);
  transform: translateY(-2px);
}
.ds-device-card--selected {
  border-color: var(--accent) !important;
  background: var(--accent-soft) !important;
  box-shadow: 0 0 0 3px hsl(var(--accent-hsl) / 0.15), 0 4px 24px hsl(var(--accent-hsl) / 0.12) !important;
}
.ds-device-card--occupied {
  opacity: 0.5;
  cursor: not-allowed;
}
.ds-device-card--occupied:hover { transform: none; border-color: var(--border); box-shadow: var(--shadow-sm); }

/* Status indicator */
.ds-device-status {
  position: absolute; top: 0.75rem; right: 0.75rem;
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.65rem; font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-dot {
  width: 6px; height: 6px; border-radius: 50%;
}
.status--available .status-dot { background: var(--success); box-shadow: 0 0 6px var(--success); }
.status--available .status-text { color: var(--success); }
.status--occupied .status-dot { background: var(--danger); }
.status--occupied .status-text { color: var(--danger); }

.ds-device-icon {
  color: var(--accent);
  margin-bottom: 0.75rem;
}
.ds-device-name {
  font-weight: 700; font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}
.ds-device-location {
  font-size: 0.78rem;
  color: var(--text-tertiary);
}

/* ── Actions ── */
.ds-actions {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
}
.ds-btn-confirm {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
}
.ds-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.ds-btn-back {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: color 0.2s;
}
.ds-btn-back:hover { color: var(--accent); }

/* ── Error ── */
.ds-error {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--danger-soft);
  border: 1px solid var(--danger);
  border-radius: 10px;
  color: var(--danger);
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  text-align: center;
}
.ds-spinner-sm {
  width: 1rem; height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Animation ── */
.animate-fadeIn { animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
