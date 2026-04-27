<template>
  <div class="module-page" :data-theme="theme">
    <div class="page-header">
      <div>
        <h1 class="page-title">⚙️ Pengaturan Sistem</h1>
        <p class="page-subtitle">Konfigurasi global POS Nextore</p>
      </div>
      <button class="btn btn-primary" @click="handleSave" :disabled="saving">
        {{ saving ? 'Menyimpan...' : '💾 Simpan Perubahan' }}
      </button>
    </div>

    <div v-if="saveSuccess" class="alert-success">✅ Pengaturan berhasil disimpan!</div>

    <div class="settings-grid">
      <!-- Stock & Expiry Settings -->
      <div class="settings-card">
        <h3 class="card-section-title">📦 Stok & Kadaluarsa</h3>

        <!-- D2: Expiry notification threshold -->
        <div class="form-group">
          <label class="form-label">Notifikasi Produk Kadaluarsa
            <span class="form-hint">Produk dengan sisa masa pakai di bawah nilai ini akan ditampilkan sebagai peringatan di Dashboard</span>
          </label>
          <div class="input-with-suffix">
            <input v-model.number="form.expiryNotificationDays" class="input-field" type="number" min="1" max="365" />
            <span class="suffix">hari sebelum expired</span>
          </div>
        </div>
        <div class="expiry-preview">
          <span class="preview-icon">📅</span>
          <span>Dashboard akan menampilkan produk yang expired dalam <strong>{{ form.expiryNotificationDays }} hari</strong> ke depan.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })
const saving = ref(false)
const saveSuccess = ref(false)

const form = reactive({ ...settingsStore.settings })

onMounted(() => {
  Object.assign(form, settingsStore.settings)
})

const handleSave = async () => {
  saving.value = true
  await new Promise(r => setTimeout(r, 300))
  settingsStore.update({ ...form })
  saving.value = false
  saveSuccess.value = true
  setTimeout(() => { saveSuccess.value = false }, 3000)
}
</script>

<style scoped>
.module-page { padding: 2.5rem; max-width: 960px; margin: 0 auto; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
.module-page[data-theme="dark"] { background: linear-gradient(135deg, #0f172a, #1e293b); }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.module-page[data-theme="dark"] .page-title { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }

.alert-success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #059669; padding: 0.75rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600; }

.settings-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; max-width: 600px; }

.settings-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.75rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.module-page[data-theme="dark"] .settings-card { background: #1e293b; border-color: #334155; }
.card-section-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1.25rem; }
.module-page[data-theme="dark"] .card-section-title { color: #f1f5f9; }

.form-group { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: #475569; display: flex; flex-direction: column; gap: 0.2rem; }
.module-page[data-theme="dark"] .form-label { color: #cbd5e1; }
.form-hint { font-weight: 400; color: #94a3b8; font-size: 0.75rem; }

.input-field { padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; color: #1e293b; font-size: 0.9rem; transition: border-color 0.2s; outline: none; width: 100%; box-sizing: border-box; }
.input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.module-page[data-theme="dark"] .input-field { background: #0f172a; border-color: #334155; color: #f1f5f9; }

.input-with-suffix { display: flex; align-items: center; gap: 0.75rem; }
.input-with-suffix .input-field { flex: 1; }
.suffix { font-size: 0.8rem; color: #94a3b8; white-space: nowrap; font-weight: 500; }

.expiry-preview { display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem 1rem; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 10px; font-size: 0.8rem; color: #475569; }
.module-page[data-theme="dark"] .expiry-preview { color: #94a3b8; background: rgba(99,102,241,0.1); }
.preview-icon { font-size: 1rem; flex-shrink: 0; }
.expiry-preview strong { color: #6366f1; }

.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 8px 20px -4px rgba(99,102,241,0.4); }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
