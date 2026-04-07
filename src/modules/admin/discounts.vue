<template>
  <div class="module-page" :data-theme="theme">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Manajemen Diskon</h1>
        <p class="page-subtitle">{{ store.discounts.length }} diskon terdaftar</p>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Diskon
      </button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="store.searchTerm" class="input-field search-input" type="text" placeholder="Cari nama diskon..."/>
      </div>
      <div class="filter-row">
        <button class="filter-pill" :class="{ active: !store.targetFilter }" @click="store.targetFilter = ''">Semua</button>
        <button v-for="t in store.DISCOUNT_TARGETS" :key="t.value" class="filter-pill" :class="{ active: store.targetFilter === t.value }" @click="store.targetFilter = t.value">{{ t.label }}</button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div v-if="store.loading" class="state-loading"><span class="spinner-ring"></span><span>Memuat data...</span></div>
      <table v-else class="data-table">
        <thead>
          <tr><th>#</th><th>Nama Diskon</th><th>Jenis</th><th>Nilai</th><th>Target</th><th>Periode</th><th>Status</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-if="store.filtered.length === 0"><td colspan="8" class="empty-row">Tidak ada diskon ditemukan.</td></tr>
          <tr v-for="(d, i) in store.filtered" :key="d.id" class="table-row">
            <td class="col-idx">{{ i + 1 }}</td>
            <td><span class="cell-name-text">{{ d.name }}</span></td>
            <td><span class="badge" :class="d.type === 'PERCENTAGE' ? 'badge-blue' : 'badge-green'">{{ d.type === 'PERCENTAGE' ? '%' : 'Rp' }}</span></td>
            <td class="col-val">{{ store.getDiscountLabel(d) }}</td>
            <td><span class="badge badge-outline">{{ store.getTargetLabel(d.target) }}</span></td>
            <td class="col-date">{{ formatDate(d.startDate) }} — {{ formatDate(d.endDate) }}</td>
            <td>
              <button class="status-toggle" :class="d.isActive ? 'active' : 'inactive'" @click="store.toggleActive(d.id)">
                {{ d.isActive ? 'Aktif' : 'Nonaktif' }}
              </button>
            </td>
            <td class="col-actions">
              <button class="action-btn edit" @click="openModal(d)" title="Edit"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="action-btn danger" @click="deleteTarget = d" title="Hapus"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: Add/Edit -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-title">{{ editTarget ? 'Edit Diskon' : 'Tambah Diskon' }}</h2>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-form">
              <div class="form-group">
                <label class="form-label">Nama Diskon <span class="req">*</span></label>
                <input v-model="form.name" class="input-field" type="text" placeholder="contoh: Promo Akhir Tahun" required/>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Jenis <span class="req">*</span></label>
                  <select v-model="form.type" class="input-field" required>
                    <option v-for="t in store.DISCOUNT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Nilai <span class="req">*</span></label>
                  <input v-model.number="form.value" class="input-field" type="number" :placeholder="form.type === 'PERCENTAGE' ? '10' : '5000'" min="0" required/>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Target <span class="req">*</span></label>
                <select v-model="form.target" class="input-field" required>
                  <option v-for="t in store.DISCOUNT_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Mulai <span class="req">*</span></label>
                  <input v-model="form.startDate" class="input-field" type="date" required/>
                </div>
                <div class="form-group">
                  <label class="form-label">Berakhir <span class="req">*</span></label>
                  <input v-model="form.endDate" class="input-field" type="date" required/>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <div class="status-row">
                  <button type="button" class="status-toggle" :class="form.isActive ? 'active' : 'inactive'" @click="form.isActive = !form.isActive">
                    {{ form.isActive ? 'Aktif' : 'Nonaktif' }}
                  </button>
                </div>
              </div>
              <div v-if="formError" class="form-error">{{ formError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  {{ editTarget ? 'Simpan' : 'Tambah' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Delete confirm -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
          <div class="modal-box modal-sm">
            <div class="modal-header"><h2 class="modal-title danger-title">Hapus Diskon?</h2><button class="modal-close" @click="deleteTarget = null">×</button></div>
            <p class="confirm-text">Diskon <strong>"{{ deleteTarget.name }}"</strong> akan dihapus permanen.</p>
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
import { useDiscountsStore } from '@/stores/discounts'

const store = useDiscountsStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const formError = ref('')
const form = reactive({ name: '', type: 'PERCENTAGE', value: 0, target: 'TRANSACTION', startDate: '', endDate: '', isActive: true })

onMounted(() => store.fetchAll())

const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const openModal = (d = null) => {
  editTarget.value = d
  formError.value = ''
  Object.assign(form, { name: d?.name || '', type: d?.type || 'PERCENTAGE', value: d?.value || 0, target: d?.target || 'TRANSACTION', startDate: d?.startDate || '', endDate: d?.endDate || '', isActive: d?.isActive !== false })
  showModal.value = true
}
const closeModal = () => { showModal.value = false; editTarget.value = null }

const handleSubmit = async () => {
  formError.value = ''
  if (form.type === 'PERCENTAGE' && (form.value < 0 || form.value > 100)) { formError.value = 'Persentase harus 0-100'; return }
  if (form.startDate > form.endDate) { formError.value = 'Tanggal mulai harus sebelum tanggal berakhir'; return }
  const payload = { ...form, name: form.name.trim() }
  const result = editTarget.value ? await store.update(editTarget.value.id, payload) : await store.add(payload)
  if (result.success) closeModal()
  else formError.value = result.message
}

const handleDelete = async () => { const r = await store.remove(deleteTarget.value.id); if (r.success) deleteTarget.value = null }
</script>

<style scoped>

.module-page { padding: 2.5rem; max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc, #f1f5f9); min-height: 100vh; font-family: 'Inter', sans-serif; }
.module-page[data-theme="dark"] { background: linear-gradient(135deg, #0f172a, #1e293b); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.module-page[data-theme="dark"] .page-title { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.375rem; }
.module-page[data-theme="dark"] .page-subtitle { color: #94a3b8; }

.btn { display: inline-flex; align-items: center; gap: 0.625rem; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(99,102,241,0.5); }
.btn-ghost { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
.btn-ghost:hover { background: #e2e8f0; }
.module-page[data-theme="dark"] .btn-ghost { background: #334155; color: #cbd5e1; border-color: #475569; }
.btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; box-shadow: 0 10px 25px -5px rgba(239,68,68,0.4); }

.toolbar { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.75rem; }
.search-wrap { position: relative; max-width: 420px; }
.search-ico { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.search-input { width: 100%; padding: 0.875rem 1rem 0.875rem 2.75rem; }

.filter-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.filter-pill { padding: 0.5rem 1.25rem; border-radius: 999px; border: 2px solid #e2e8f0; background: #fff; color: #64748b; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.filter-pill:hover { border-color: #6366f1; color: #6366f1; }
.filter-pill.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-color: transparent; color: #fff; }
.module-page[data-theme="dark"] .filter-pill { background: #1e293b; border-color: #334155; color: #cbd5e1; }

.table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1); }
.module-page[data-theme="dark"] .table-card { background: #1e293b; border-color: #334155; }
.data-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.data-table th { padding: 1rem 1.5rem; background: #f8fafc; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; text-align: left; border-bottom: 2px solid #e2e8f0; }
.module-page[data-theme="dark"] .data-table th { background: #0f172a; color: #94a3b8; border-bottom-color: #334155; }
.data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; vertical-align: middle; }
.module-page[data-theme="dark"] .data-table td { border-bottom-color: #334155; color: #cbd5e1; }
.table-row:hover td { background: #fafafa; }
.module-page[data-theme="dark"] .table-row:hover td { background: #334155; }
.empty-row { text-align: center; color: #94a3b8; padding: 4rem !important; }
.col-idx { color: #94a3b8; font-size: 0.8rem; width: 50px; font-weight: 600; }
.col-val { font-weight: 700; font-size: 0.9rem; }
.col-date { color: #94a3b8; font-size: 0.78rem; white-space: nowrap; }
.col-actions { width: 100px; white-space: nowrap; }
.cell-name-text { font-weight: 600; }

.badge { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.badge-blue { background: rgba(99,102,241,0.12); color: #6366f1; }
.badge-green { background: rgba(16,185,129,0.12); color: #059669; }
.badge-outline { background: transparent; border: 1.5px solid #e2e8f0; color: #64748b; }
.module-page[data-theme="dark"] .badge-outline { border-color: #475569; color: #94a3b8; }

.status-toggle { padding: 0.375rem 0.875rem; border-radius: 999px; border: none; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.status-toggle.active { background: rgba(16,185,129,0.12); color: #059669; }
.status-toggle.inactive { background: rgba(100,116,139,0.12); color: #64748b; }
.status-toggle:hover { transform: scale(1.05); }

.action-btn { width: 2.25rem; height: 2.25rem; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; margin-left: 0.375rem; }
.module-page[data-theme="dark"] .action-btn { background: #334155; border-color: #475569; color: #94a3b8; }
.action-btn.edit:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.1); transform: translateY(-2px); }
.action-btn.danger:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.1); transform: translateY(-2px); }

.state-loading { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 4rem; color: #64748b; }
.spinner-ring { width: 1.5rem; height: 1.5rem; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
.spinner-sm { width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; margin-right: 0.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; }
.modal-box { background: #fff; border-radius: 24px; width: 100%; max-width: 520px; box-shadow: 0 25px 80px rgba(0,0,0,0.25); overflow: hidden; }
.module-page[data-theme="dark"] .modal-box { background: #1e293b; }
.modal-sm { max-width: 420px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.75rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .modal-header { background: #0f172a; border-bottom-color: #334155; }
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 700; color: #1e293b; margin: 0; }
.module-page[data-theme="dark"] .modal-title { color: #f1f5f9; }
.danger-title { color: #ef4444; }
.modal-close { width: 2.25rem; height: 2.25rem; border: none; background: #fff; border-radius: 10px; cursor: pointer; font-size: 1.5rem; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.module-page[data-theme="dark"] .modal-close { background: #334155; color: #94a3b8; }
.modal-close:hover { background: #f1f5f9; color: #1e293b; transform: rotate(90deg); }
.modal-form { padding: 2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: #475569; }
.module-page[data-theme="dark"] .form-label { color: #cbd5e1; }
.req { color: #ef4444; }
.input-field { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; color: #1e293b; font-size: 0.9rem; transition: all 0.3s; outline: none; font-weight: 500; }
.input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.module-page[data-theme="dark"] .input-field { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.form-error { color: #dc2626; font-size: 0.825rem; background: rgba(239,68,68,0.1); border: 1.5px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 0.875rem; margin-bottom: 1rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.875rem; padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .modal-footer { background: #0f172a; border-top-color: #334155; }
.confirm-text { padding: 1.75rem 2rem; font-size: 0.925rem; color: #475569; line-height: 1.7; text-align: center; }
.module-page[data-theme="dark"] .confirm-text { color: #cbd5e1; }
.confirm-text strong { color: #1e293b; }
.module-page[data-theme="dark"] .confirm-text strong { color: #f1f5f9; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-box, .modal-fade-leave-active .modal-box { transition: all 0.3s; }
.modal-fade-enter-from .modal-box, .modal-fade-leave-to .modal-box { transform: scale(0.95) translateY(12px); }

.table-row { animation: fadeIn 0.4s ease forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* ── Status Row & Toggle ── */
.status-row { display: flex; align-items: center; }
.status-toggle { padding: 0.5rem 1.25rem; border-radius: 999px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.status-toggle.active { background: rgba(5,150,105,0.12); color: #059669; }
.status-toggle.inactive { background: rgba(100,116,139,0.12); color: #64748b; }
</style>
