<template>
  <div class="module-page" :data-theme="theme">
    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Kelola Kategori</h1>
        <p class="page-subtitle">{{ store.categories.length }} kategori terdaftar</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Kategori
        </button>
      </div>
    </div>

    <!-- ── Search Bar ── -->
    <div class="toolbar">
      <div class="search-wrap">
        <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="store.searchTerm" class="input-field search-input" type="text" placeholder="Cari kategori..."/>
      </div>
    </div>

    <!-- ── Table ── -->
    <div class="table-card">
      <div v-if="store.loading" class="state-loading">
        <span class="spinner-ring"></span>
        <span>Memuat data...</span>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama Kategori</th>
            <th>Deskripsi</th>
            <th>Dibuat</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.filtered.length === 0">
            <td colspan="5" class="empty-row">Tidak ada kategori ditemukan.</td>
          </tr>
          <tr v-for="(cat, i) in store.filtered" :key="cat.id" class="table-row">
            <td class="col-idx">{{ i + 1 }}</td>
            <td>
              <div class="cell-name">
                <div class="cat-badge">{{ cat.name[0] }}</div>
                <span>{{ cat.name }}</span>
              </div>
            </td>
            <td class="col-desc">{{ cat.description || '—' }}</td>
            <td class="col-date">{{ formatDate(cat.createdAt) }}</td>
            <td class="col-actions">
              <button class="action-btn edit" @click="openModal(cat)" title="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="action-btn danger" @click="confirmDelete(cat)" title="Hapus">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Modal: Add / Edit ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-title">{{ editTarget ? 'Edit Kategori' : 'Tambah Kategori' }}</h2>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-form">
              <div class="form-group">
                <label class="form-label">Nama Kategori <span class="required">*</span></label>
                <input v-model="form.name" class="input-field" type="text" placeholder="contoh: Makanan" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Deskripsi</label>
                <textarea v-model="form.description" class="input-field" rows="3" placeholder="Deskripsi singkat kategori..."></textarea>
              </div>
              <div v-if="formError" class="form-error">{{ formError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  {{ editTarget ? 'Simpan Perubahan' : 'Tambah' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ── Modal: Confirm Delete ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
          <div class="modal-box modal-sm">
            <div class="modal-header">
              <h2 class="modal-title danger-title">Hapus Kategori?</h2>
              <button class="modal-close" @click="deleteTarget = null">×</button>
            </div>
            <p class="confirm-text">Kategori <strong>"{{ deleteTarget.name }}"</strong> akan dihapus permanen. Aksi ini tidak bisa dibatalkan.</p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="deleteTarget = null">Batal</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span>
                Hapus
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'

const store = useCategoriesStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')

const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const formError = ref('')
const form = reactive({ name: '', description: '' })

onMounted(() => store.fetchAll())

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const openModal = (cat = null) => {
  editTarget.value = cat
  formError.value = ''
  form.name = cat?.name || ''
  form.description = cat?.description || ''
  showModal.value = true
}

const closeModal = () => { showModal.value = false; editTarget.value = null }

const handleSubmit = async () => {
  formError.value = ''
  const payload = { name: form.name.trim(), description: form.description.trim() }
  const result = editTarget.value
    ? await store.update(editTarget.value.id, payload)
    : await store.add(payload)
  if (result.success) {
    closeModal()
  } else {
    formError.value = result.message || 'Terjadi kesalahan'
  }
}

const confirmDelete = (cat) => { deleteTarget.value = cat }

const handleDelete = async () => {
  const result = await store.remove(deleteTarget.value.id)
  if (result.success) deleteTarget.value = null
}
</script>

<style scoped>
/* ── 🎨 Design System: Sophisticated Aesthetic ───────────────────────── */
.module-page {
  padding: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  background: 
    radial-gradient(1000px 500px at 5% -5%, rgba(79, 70, 229, 0.04), transparent),
    radial-gradient(800px 400px at 95% 5%, rgba(245, 158, 11, 0.03), transparent),
    linear-gradient(180deg, #fafbfc 0%, #f8fafc 50%, #f1f5f9 100%);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
}

.module-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.2), transparent);
}

.module-page[data-theme="dark"] {
  background: 
    radial-gradient(1000px 500px at 5% -5%, rgba(79, 70, 229, 0.1), transparent),
    radial-gradient(800px 400px at 95% 5%, rgba(245, 158, 11, 0.06), transparent),
    linear-gradient(180deg, #0a0e17 0%, #0f172a 50%, #111827 100%);
}

.module-page[data-theme="dark"]::before {
  background: linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.25), transparent);
}

/* ── ✦ Page Header ────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 0.5rem 0;
  position: relative;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.page-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.module-page[data-theme="dark"] .page-title {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.module-page[data-theme="dark"] .page-subtitle {
  color: #94a3b8;
}

/* ── ✦ Premium Button System ─────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.8125rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.5), transparent 40%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.6;
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #7c3aed 100%);
  color: #ffffff;
  box-shadow: 
    0 8px 28px -6px rgba(79, 70, 229, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.06);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 14px 36px -8px rgba(79, 70, 229, 0.5),
    0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-ghost {
  background: #f8fafc;
  color: #475569;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.btn-ghost:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: translateY(-1px);
}

.module-page[data-theme="dark"] .btn-ghost {
  background: #1e293b;
  color: #cbd5e1;
  border-color: #334155;
}

.module-page[data-theme="dark"] .btn-ghost:hover {
  background: #334155;
  border-color: #475569;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  box-shadow: 0 8px 28px -6px rgba(239, 68, 68, 0.35);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 36px -8px rgba(239, 68, 68, 0.45);
}

/* ── ✦ Search & Toolbar ─────────────────────────────────────────── */
.toolbar {
  margin-bottom: 1.875rem;
}

.search-wrap {
  position: relative;
  max-width: 420px;
}

.search-ico {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  transition: color 0.25s;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 0.9375rem 1rem 0.9375rem 2.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.925rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.search-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.search-input:hover {
  border-color: #cbd5e1;
}

.search-input:focus {
  border-color: #4f46e5;
  box-shadow: 
    0 0 0 4px rgba(79, 70, 229, 0.12),
    0 4px 16px rgba(79, 70, 229, 0.12);
}

.module-page[data-theme="dark"] .search-input {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.module-page[data-theme="dark"] .search-input:focus {
  border-color: #818cf8;
  box-shadow: 
    0 0 0 4px rgba(129, 140, 248, 0.18),
    0 4px 16px rgba(129, 140, 248, 0.15);
}

/* ── ✦ Premium Table Card ───────────────────────────────────────── */
.table-card {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 6px 32px -10px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  position: relative;
}

.table-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4f46e5, #6366f1, #7c3aed);
  opacity: 0.9;
}

.module-page[data-theme="dark"] .table-card {
  background: #1e293b;
  border-color: rgba(51, 65, 85, 0.9);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.15),
    0 6px 32px -10px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
}

.module-page[data-theme="dark"] .table-card::before {
  background: linear-gradient(90deg, #6366f1, #818cf8, #a78bfa);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  padding: 1rem 1.375rem;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.085em;
  color: #64748b;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  position: relative;
}

.data-table th::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 1.375rem;
  right: 1.375rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.35), transparent);
}

.module-page[data-theme="dark"] .data-table th {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #94a3b8;
  border-bottom-color: #334155;
}

.data-table td {
  padding: 1.25rem 1.375rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
  transition: background 0.2s ease;
}

.module-page[data-theme="dark"] .data-table td {
  border-bottom-color: #334155;
  color: #cbd5e1;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover td {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.7) 0%, rgba(241, 245, 249, 0.7) 100%);
}

.module-page[data-theme="dark"] .table-row:hover td {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.5) 100%);
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 4rem !important;
  font-size: 0.95rem;
  font-weight: 500;
}

/* ── ✦ Table Columns ────────────────────────────────────────────── */
.col-idx {
  color: #94a3b8;
  font-size: 0.8125rem;
  width: 45px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.col-desc {
  color: #64748b;
  max-width: 300px;
  line-height: 1.5;
}

.module-page[data-theme="dark"] .col-desc {
  color: #94a3b8;
}

.col-date {
  color: #94a3b8;
  font-size: 0.7875rem;
  white-space: nowrap;
  font-weight: 500;
}

.col-actions {
  width: 100px;
  white-space: nowrap;
}

/* ── ✦ Category Cell ────────────────────────────────────────────── */
.cell-name {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cat-badge {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #7c3aed 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 
    0 4px 12px rgba(79, 70, 229, 0.3),
    0 0 0 2.5px rgba(255, 255, 255, 0.7) inset;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.cat-badge::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.25), transparent 55%);
  opacity: 0;
  transition: opacity 0.2s;
}

.table-row:hover .cat-badge {
  transform: scale(1.06);
}

.table-row:hover .cat-badge::before {
  opacity: 1;
}

.cell-name span {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.925rem;
}

.module-page[data-theme="dark"] .cell-name span {
  color: #f1f5f9;
}

/* ── ✦ Action Buttons ───────────────────────────────────────────── */
.action-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0.375rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255,255,255,0.7), transparent 65%);
  opacity: 0;
  transition: opacity 0.2s;
}

.module-page[data-theme="dark"] .action-btn {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

.action-btn.edit:hover {
  border-color: #4f46e5;
  color: #4f46e5;
  background: rgba(79, 70, 229, 0.08);
  transform: translateY(-2px);
  box-shadow: 
    0 5px 16px rgba(79, 70, 229, 0.2),
    0 0 0 2.5px rgba(79, 70, 229, 0.08) inset;
}

.action-btn.danger:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  transform: translateY(-2px);
  box-shadow: 
    0 5px 16px rgba(239, 68, 68, 0.2),
    0 0 0 2.5px rgba(239, 68, 68, 0.08) inset;
}

/* ── ✦ Loading State ────────────────────────────────────────────── */
.state-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: #64748b;
  font-weight: 500;
  font-size: 0.925rem;
}

.module-page[data-theme="dark"] .state-loading {
  color: #94a3b8;
}

.spinner-ring {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.module-page[data-theme="dark"] .spinner-ring {
  border-color: #334155;
  border-top-color: #818cf8;
}

.spinner-sm {
  width: 1rem;
  height: 1rem;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── ✦ Premium Modal System ─────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.68);
  backdrop-filter: blur(10px) saturate(130%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal-box {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  box-shadow: 
    0 20px 70px rgba(0, 0, 0, 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  position: relative;
}

.modal-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5px;
  background: linear-gradient(90deg, #4f46e5, #6366f1, #7c3aed);
}

.module-page[data-theme="dark"] .modal-box {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.08);
}

.modal-sm {
  max-width: 420px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.75rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}

.modal-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 2rem;
  right: 2rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.3), transparent);
}

.module-page[data-theme="dark"] .modal-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-bottom-color: #334155;
}

.modal-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.375rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.02em;
}

.module-page[data-theme="dark"] .modal-title {
  color: #f1f5f9;
}

.danger-title {
  color: #ef4444;
}

.modal-close {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.5rem;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  position: relative;
}

.modal-close::after {
  content: '';
  position: absolute;
  inset: -1.5px;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(135deg, rgba(79,70,229,0.35), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.2s;
}

.module-page[data-theme="dark"] .modal-close {
  background: #334155;
  color: #94a3b8;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
  transform: rotate(90deg) scale(1.03);
}

.modal-close:hover::after {
  opacity: 1;
}

.module-page[data-theme="dark"] .modal-close:hover {
  background: #475569;
  color: #f1f5f9;
}

.modal-form {
  padding: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.6875rem;
  margin-bottom: 1.5rem;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.01em;
}

.module-page[data-theme="dark"] .form-label {
  color: #cbd5e1;
}

.required {
  color: #ef4444;
  font-weight: 700;
}

.input-field {
  padding: 0.875rem 1.125rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.925rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
  resize: vertical;
  min-height: 44px;
}

.input-field::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.input-field:hover {
  border-color: #cbd5e1;
}

.input-field:focus {
  border-color: #4f46e5;
  box-shadow: 
    0 0 0 4px rgba(79, 70, 229, 0.12),
    0 4px 16px rgba(79, 70, 229, 0.12);
}

.module-page[data-theme="dark"] .input-field {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.module-page[data-theme="dark"] .input-field:focus {
  border-color: #818cf8;
  box-shadow: 
    0 0 0 4px rgba(129, 140, 248, 0.18),
    0 4px 16px rgba(129, 140, 248, 0.15);
}

.form-error {
  color: #dc2626;
  font-size: 0.825rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.07) 100%);
  border: 1.5px solid rgba(239, 68, 68, 0.32);
  border-left: 4px solid #ef4444;
  border-radius: 10px;
  padding: 0.875rem 1.125rem;
  margin-bottom: 1.25rem;
  font-weight: 500;
  box-shadow: 0 2px 7px rgba(239, 68, 68, 0.07);
}

.module-page[data-theme="dark"] .form-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(220, 38, 38, 0.11) 100%);
  border-color: rgba(239, 68, 68, 0.42);
  color: #fca5a5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.875rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid #e2e8f0;
  position: relative;
}

.modal-footer::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 2rem;
  right: 2rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.3), transparent);
}

.module-page[data-theme="dark"] .modal-footer {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-top-color: #334155;
}

.confirm-text {
  padding: 1.75rem 2rem;
  font-size: 0.925rem;
  color: #475569;
  line-height: 1.7;
  text-align: center;
  font-weight: 500;
}

.module-page[data-theme="dark"] .confirm-text {
  color: #cbd5e1;
}

.confirm-text strong {
  color: #1e293b;
  font-weight: 700;
}

.module-page[data-theme="dark"] .confirm-text strong {
  color: #f1f5f9;
}

/* ── ✦ Modal Transitions ───────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  transform: scale(0.95) translateY(14px);
  opacity: 0;
}

/* ── ✦ Responsive Design ───────────────────────────────────────── */
@media (max-width: 1024px) {
  .module-page {
    padding: 1.625rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.375rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-width: 768px) {
  .module-page {
    padding: 1.25rem;
  }
  
  .page-title {
    font-size: 1.625rem;
  }
  
  .toolbar {
    margin-bottom: 1.375rem;
  }
  
  .search-wrap {
    max-width: 100%;
  }
  
  .modal-form {
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1.25rem 1.625rem;
    flex-direction: column-reverse;
  }
}

/* ── ✦ Premium Scrollbar ───────────────────────────────────────── */
::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

.module-page[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #475569 0%, #334155 100%);
}

.module-page[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #64748b 0%, #475569 100%);
}

/* ── ✦ Premium Animations ──────────────────────────────────────── */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-row {
  animation: fadeInUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.table-row:nth-child(1) { animation-delay: 0.04s; }
.table-row:nth-child(2) { animation-delay: 0.08s; }
.table-row:nth-child(3) { animation-delay: 0.12s; }
.table-row:nth-child(4) { animation-delay: 0.16s; }
.table-row:nth-child(5) { animation-delay: 0.2s; }
.table-row:nth-child(6) { animation-delay: 0.24s; }

/* Focus accessibility */
.btn:focus-visible,
.input-field:focus-visible,
.action-btn:focus-visible,
.modal-close:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 3px rgba(255, 255, 255, 0.85),
    0 0 0 5.5px rgba(79, 70, 229, 0.38) !important;
}

.module-page[data-theme="dark"] .btn:focus-visible,
.module-page[data-theme="dark"] .input-field:focus-visible {
  box-shadow: 
    0 0 0 3px rgba(10, 14, 23, 0.92),
    0 0 0 5.5px rgba(129, 140, 248, 0.48) !important;
}
</style>