<template>
  <div class="module-page" :data-theme="theme">
    <div class="page-header">
      <div><h1 class="page-title">Manajemen POS Terminal</h1><p class="page-subtitle">{{ store.devices.length }} terminal terdaftar</p></div>
      <button class="btn btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah POS
      </button>
    </div>

    <div class="toolbar">
      <div class="search-wrap">
        <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="store.searchTerm" class="input-field search-input" type="text" placeholder="Cari terminal..."/>
      </div>
      <div class="filter-row">
        <button class="filter-pill" :class="{ active: !store.statusFilter }" @click="store.statusFilter = ''">Semua</button>
        <button class="filter-pill" :class="{ active: store.statusFilter === 'active' }" @click="store.statusFilter = 'active'">Aktif</button>
        <button class="filter-pill" :class="{ active: store.statusFilter === 'inactive' }" @click="store.statusFilter = 'inactive'">Nonaktif</button>
      </div>
    </div>

    <!-- Device Cards Grid -->
    <div class="device-grid">
      <div v-if="store.loading" class="state-loading"><span class="spinner-ring"></span><span>Memuat data...</span></div>
      <div v-else-if="store.filtered.length === 0" class="empty-state">Tidak ada terminal ditemukan.</div>
      <div v-for="d in store.filtered" :key="d.id" class="device-card" :class="{ inactive: !d.isActive }">
        <div class="device-header">
          <div class="device-icon" :class="d.isActive ? 'icon-active' : 'icon-inactive'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div class="device-actions">
            <button class="action-btn edit" @click="openModal(d)" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="action-btn danger" @click="deleteTarget = d" title="Hapus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
          </div>
        </div>
        <h3 class="device-name">{{ d.name }}</h3>
        <p class="device-location">📍 {{ d.location || 'Lokasi belum diset' }}</p>
        <div class="device-footer">
          <button class="status-toggle" :class="d.isActive ? 'active' : 'inactive'" @click="store.toggleActive(d.id)">
            {{ d.isActive ? '● Aktif' : '○ Nonaktif' }}
          </button>
          <span class="device-cashier" v-if="d.currentCashier">👤 {{ d.currentCashier }}</span>
          <span class="device-cashier idle" v-else>Tersedia</span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header"><h2 class="modal-title">{{ editTarget ? 'Edit Terminal' : 'Tambah Terminal' }}</h2><button class="modal-close" @click="closeModal">×</button></div>
            <form @submit.prevent="handleSubmit" class="modal-form">
              <div class="form-group">
                <label class="form-label">Nama Terminal <span class="req">*</span></label>
                <input v-model="form.name" class="input-field" type="text" placeholder="contoh: POS Kasir 1" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Lokasi</label>
                <input v-model="form.location" class="input-field" type="text" placeholder="contoh: Lantai 1 - Depan"/>
              </div>
              <div v-if="formError" class="form-error">{{ formError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">{{ editTarget ? 'Simpan' : 'Tambah' }}</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Delete -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
          <div class="modal-box modal-sm">
            <div class="modal-header"><h2 class="modal-title danger-title">Hapus Terminal?</h2><button class="modal-close" @click="deleteTarget = null">×</button></div>
            <p class="confirm-text">Terminal <strong>"{{ deleteTarget.name }}"</strong> akan dihapus.</p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="deleteTarget = null">Batal</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">Hapus</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usePosDevicesStore } from '@/stores/posDevices'
const store = usePosDevicesStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
const showModal = ref(false); const editTarget = ref(null); const deleteTarget = ref(null); const formError = ref('')
const form = reactive({ name: '', location: '' })
onMounted(() => store.fetchAll())
const openModal = (d = null) => { editTarget.value = d; formError.value = ''; Object.assign(form, { name: d?.name || '', location: d?.location || '' }); showModal.value = true }
const closeModal = () => { showModal.value = false; editTarget.value = null }
const handleSubmit = async () => { formError.value = ''; const p = { name: form.name.trim(), location: form.location.trim() }; const r = editTarget.value ? await store.update(editTarget.value.id, p) : await store.add(p); if (r.success) closeModal(); else formError.value = r.message }
const handleDelete = async () => { const r = await store.remove(deleteTarget.value.id); if (r.success) deleteTarget.value = null }
</script>

<style scoped>
.module-page { padding: 2.5rem; max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc, #f1f5f9); min-height: 100vh; font-family: 'Inter', sans-serif; }
.module-page[data-theme="dark"] { background: linear-gradient(135deg, #0f172a, #1e293b); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.module-page[data-theme="dark"] .page-title { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.375rem; }
.btn { display: inline-flex; align-items: center; gap: 0.625rem; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4); }
.btn-primary:hover { transform: translateY(-2px); }
.btn-ghost { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
.module-page[data-theme="dark"] .btn-ghost { background: #334155; color: #cbd5e1; border-color: #475569; }
.btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }

.toolbar { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.75rem; }
.search-wrap { position: relative; max-width: 420px; }
.search-ico { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.search-input { width: 100%; padding: 0.875rem 1rem 0.875rem 2.75rem; }
.filter-row { display: flex; gap: 0.5rem; }
.filter-pill { padding: 0.5rem 1.25rem; border-radius: 999px; border: 2px solid #e2e8f0; background: #fff; color: #64748b; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.filter-pill.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-color: transparent; color: #fff; }
.module-page[data-theme="dark"] .filter-pill { background: #1e293b; border-color: #334155; color: #cbd5e1; }

/* Device Grid */
.device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
.device-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; transition: all 0.3s; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
.device-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
.device-card.inactive { opacity: 0.6; }
.module-page[data-theme="dark"] .device-card { background: #1e293b; border-color: #334155; }
.device-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.device-icon { width: 3rem; height: 3rem; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.icon-active { background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.15)); color: #10b981; }
.icon-inactive { background: rgba(100,116,139,0.1); color: #94a3b8; }
.device-actions { display: flex; gap: 0.375rem; }
.device-name { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }
.module-page[data-theme="dark"] .device-name { color: #f1f5f9; }
.device-location { font-size: 0.825rem; color: #64748b; margin: 0.375rem 0 1rem; }
.device-footer { display: flex; justify-content: space-between; align-items: center; }
.device-cashier { font-size: 0.78rem; font-weight: 600; color: #475569; }
.device-cashier.idle { color: #10b981; }
.module-page[data-theme="dark"] .device-cashier { color: #cbd5e1; }

.status-toggle { padding: 0.375rem 0.75rem; border-radius: 999px; border: none; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.status-toggle.active { background: rgba(16,185,129,0.12); color: #059669; }
.status-toggle.inactive { background: rgba(100,116,139,0.12); color: #64748b; }

.action-btn { width: 2rem; height: 2rem; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; }
.module-page[data-theme="dark"] .action-btn { background: #334155; border-color: #475569; color: #94a3b8; }
.action-btn.edit:hover { border-color: #6366f1; color: #6366f1; }
.action-btn.danger:hover { border-color: #ef4444; color: #ef4444; }

.state-loading { grid-column: 1/-1; display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 4rem; color: #64748b; }
.spinner-ring { width: 1.5rem; height: 1.5rem; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
.empty-state { grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 4rem; font-size: 0.95rem; }
@keyframes spin { to { transform: rotate(360deg); } }

.input-field { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; color: #1e293b; font-size: 0.9rem; transition: all 0.3s; outline: none; font-weight: 500; }
.input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.module-page[data-theme="dark"] .input-field { background: #0f172a; border-color: #334155; color: #f1f5f9; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; }
.modal-box { background: #fff; border-radius: 24px; width: 100%; max-width: 480px; box-shadow: 0 25px 80px rgba(0,0,0,0.25); overflow: hidden; }
.module-page[data-theme="dark"] .modal-box { background: #1e293b; }
.modal-sm { max-width: 420px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.75rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .modal-header { background: #0f172a; border-bottom-color: #334155; }
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 700; color: #1e293b; margin: 0; }
.module-page[data-theme="dark"] .modal-title { color: #f1f5f9; }
.danger-title { color: #ef4444; }
.modal-close { width: 2.25rem; height: 2.25rem; border: none; background: #fff; border-radius: 10px; cursor: pointer; font-size: 1.5rem; color: #64748b; display: flex; align-items: center; justify-content: center; }
.module-page[data-theme="dark"] .modal-close { background: #334155; color: #94a3b8; }
.modal-form { padding: 2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: #475569; }
.module-page[data-theme="dark"] .form-label { color: #cbd5e1; }
.req { color: #ef4444; }
.form-error { color: #dc2626; font-size: 0.825rem; background: rgba(239,68,68,0.1); border-radius: 10px; padding: 0.875rem; margin-bottom: 1rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.875rem; padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .modal-footer { background: #0f172a; border-top-color: #334155; }
.confirm-text { padding: 1.75rem 2rem; font-size: 0.925rem; color: #475569; line-height: 1.7; text-align: center; }
.module-page[data-theme="dark"] .confirm-text { color: #cbd5e1; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
