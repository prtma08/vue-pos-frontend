<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="override-overlay" @click.self="close">
        <div class="override-box">
          <!-- Header -->
          <div class="override-header">
            <div class="override-icon">🔐</div>
            <h2 class="override-title">Supervisor Override</h2>
            <p class="override-desc">Pilih supervisor dan masukkan password untuk {{ actionLabel }}</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="override-form">
            <div class="form-group">
              <label class="form-label">Supervisor</label>
              <!-- AppCombobox: searchable supervisor picker -->
              <AppCombobox
                :model-value="selectedSupervisor"
                :options="supervisorList"
                option-key="id"
                option-label="name"
                option-sub-label="roleDisplay"
                placeholder="-- Pilih Supervisor --"
                search-placeholder="Cari nama supervisor..."
                :clearable="false"
                :autofocus="true"
                class="supervisor-combobox"
                @select="onSupervisorSelect"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Password Supervisor</label>
              <input v-model="password" class="input-field" type="password" placeholder="Masukkan password" required autocomplete="off"/>
            </div>

            <p v-if="error" class="form-error">{{ error }}</p>

            <div class="override-actions">
              <button type="button" class="btn btn-ghost" @click="close">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="verifying">
                <span v-if="verifying" class="spin"></span>
                {{ verifying ? 'Verifikasi...' : 'Konfirmasi' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import AppCombobox from '@/components/AppCombobox.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  actionLabel: { type: String, default: 'aksi ini' },
})
const emit = defineEmits(['update:modelValue', 'approved', 'denied'])

const usersStore = useUsersStore()
const selectedSupervisor = ref('')
const password = ref('')
const error = ref('')
const verifying = ref(false)

const supervisorList = computed(() =>
  usersStore.users.filter(u => {
    const roles = (u.roles || [u.role]).map(r => r?.toLowerCase())
    return roles.includes('supervisor') || roles.includes('admin') || roles.includes('superuser')
  }).map(u => ({
    ...u,
    roleDisplay: (u.roles || [u.role])[0]?.replace(/^\w/, c => c.toUpperCase()) || 'Supervisor',
  }))
)

// Combobox handler: receives full user object
const onSupervisorSelect = (user) => {
  selectedSupervisor.value = user?.id || ''
}

const close = () => {
  error.value = ''
  password.value = ''
  selectedSupervisor.value = ''
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  error.value = ''
  if (!selectedSupervisor.value) { error.value = 'Pilih supervisor terlebih dahulu'; return }
  if (!password.value) { error.value = 'Password wajib diisi'; return }

  verifying.value = true
  try {
    await new Promise(r => setTimeout(r, 600))
    const supervisor = usersStore.users.find(u => u.id === selectedSupervisor.value)

    if (password.value === 'admin123' || password.value === 'super123') {
      emit('approved', { supervisorId: supervisor?.id, supervisorName: supervisor?.name || 'Supervisor' })
      close()
    } else {
      error.value = 'Password supervisor salah'
      emit('denied')
    }
  } finally { verifying.value = false }
}

onMounted(() => { if (!usersStore.users.length) usersStore.fetchAll() })
</script>

<style scoped>
.override-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.7); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1.5rem; }
.override-box { background: #fff; border-radius: 24px; width: 100%; max-width: 440px; box-shadow: 0 30px 90px rgba(0,0,0,0.3); overflow: visible; }
[data-theme="dark"] .override-box { background: #1e293b; }

.override-header { text-align: center; padding: 2rem 2rem 0.5rem; }
.override-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.override-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
[data-theme="dark"] .override-title { color: #f1f5f9; }
.override-desc { font-size: 0.85rem; color: #64748b; margin: 0.375rem 0 0; line-height: 1.5; }

.override-form { padding: 1.5rem 2rem 2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: #475569; }
[data-theme="dark"] .form-label { color: #cbd5e1; }
.input-field { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; color: #1e293b; font-size: 0.9rem; transition: all 0.3s; outline: none; font-weight: 500; width: 100%; box-sizing: border-box; }
.input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
[data-theme="dark"] .input-field { background: #0f172a; border-color: #334155; color: #f1f5f9; }

/* Make combobox trigger visually consistent with input-field */
.supervisor-combobox :deep(.cb-trigger) { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; min-height: 50px; }
[data-theme="dark"] .supervisor-combobox :deep(.cb-trigger) { background: #0f172a; border-color: #334155; }
.supervisor-combobox :deep(.cb-display-text) { font-size: 0.9rem; font-weight: 500; color: #1e293b; }
[data-theme="dark"] .supervisor-combobox :deep(.cb-display-text) { color: #f1f5f9; }

.form-error { color: #dc2626; font-size: 0.825rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1rem; text-align: center; }

.override-actions { display: flex; gap: 0.75rem; }
.btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem; border-radius: 12px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.3s; }
.btn-ghost { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
[data-theme="dark"] .btn-ghost { background: #334155; color: #cbd5e1; border-color: #475569; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 8px 20px rgba(99,102,241,0.35); }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.spin { width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: sp 0.7s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
