<template>
  <div class="module-page" :data-theme="theme">
    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Manajemen Member</h1>
        <p class="page-subtitle">{{ store.members.length }} member terdaftar</p>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Member
      </button>
    </div>

    <!-- ── Search ── -->
    <div class="toolbar">
      <div class="search-wrap">
        <input v-model="store.searchTerm" class="input-field search-input" type="text" placeholder="Cari Nama atau Telepon..."/>
      </div>
    </div>

    <!-- ── Table ── -->
    <div class="table-card">
      <div v-if="store.loading" class="state-loading">
        <span class="spinner-ring"></span><span>Memuat member...</span>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama Member</th>
            <th>Telepon</th>
            <th>Status</th>
            <th>Bergabung</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.filtered.length === 0">
            <td colspan="6" class="empty-row">Tidak ada member ditemukan.</td>
          </tr>
          <tr v-for="(m, i) in store.filtered" :key="m.id" class="table-row">
            <td class="col-idx">{{ i + 1 }}</td>
            <td>
              <div class="cell-member">
                <div class="member-avatar">{{ m.name[0] }}</div>
                <span class="member-name">{{ m.name }}</span>
              </div>
            </td>
            <td><a :href="`tel:${m.phone}`" class="link-phone">{{ m.phone }}</a></td>
            <td>
              <span class="status-badge" :class="m.isActive !== false ? 'badge-active' : 'badge-inactive'">
                {{ m.isActive !== false ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
            <td class="col-date">{{ formatDate(m.createdAt) }}</td>
            <td class="col-actions">
              <button class="action-btn edit" @click="openModal(m)" title="Edit"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="action-btn danger" @click="confirmDelete(m)" title="Hapus"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Modal: Add/Edit ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-title">{{ editTarget ? 'Edit Member' : 'Tambah Member' }}</h2>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-form">
              <div class="form-group">
                <label class="form-label">Nama Lengkap <span class="required">*</span></label>
                <input v-model="form.name" class="input-field" type="text" placeholder="contoh: Budi Darma" required/>
              </div>
              <div class="form-group">
                <label class="form-label">No. Telepon <span class="required">*</span></label>
                <input v-model="form.phone" class="input-field" type="tel" placeholder="08xxxxxxxxxx" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Status Member</label>
                <div class="status-toggle-wrap">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="form.isActive" class="toggle-input"/>
                    <span class="toggle-slider"></span>
                    <span class="toggle-text">{{ form.isActive ? 'Aktif' : 'Nonaktif' }}</span>
                  </label>
                </div>
              </div>
              <div v-if="formError" class="form-error">{{ formError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  {{ editTarget ? 'Simpan' : 'Tambah Member' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ── Delete Confirm ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
          <div class="modal-box modal-sm">
            <div class="modal-header">
              <h2 class="modal-title danger-title">Hapus Member?</h2>
              <button class="modal-close" @click="deleteTarget = null">×</button>
            </div>
            <p class="confirm-text">Member <strong>"{{ deleteTarget.name }}"</strong> beserta data poin akan dihapus permanen.</p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="deleteTarget = null">Batal</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span> Hapus
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
import { useMembersStore } from '@/stores/members'

const store = useMembersStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })

const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const formError = ref('')
const form = reactive({ name: '', phone: '', isActive: true })

onMounted(() => store.fetchMembers())

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const openModal = (m = null) => {
  editTarget.value = m
  formError.value = ''
  Object.assign(form, { name: m?.name || '', phone: m?.phone || '', isActive: m?.isActive !== false })
  showModal.value = true
}
const closeModal = () => { showModal.value = false; editTarget.value = null }

const handleSubmit = async () => {
  formError.value = ''
  const payload = { name: form.name.trim(), phone: form.phone.trim(), isActive: form.isActive }
  const result = editTarget.value
    ? await store.update(editTarget.value.id, payload)
    : await store.add(payload)
  if (result.success) { closeModal() } else { formError.value = result.message }
}

const confirmDelete = (m) => { deleteTarget.value = m }
const handleDelete = async () => {
  const result = await store.remove(deleteTarget.value.id)
  if (result.success) deleteTarget.value = null
}
</script>

<style scoped>
/* ── 🎨 Design System: Premium Aesthetic ───────────────────────────── */
.module-page {
  padding: 2.75rem;
  max-width: 1280px;
  margin: 0 auto;
  background: 
    radial-gradient(1200px 600px at 10% -10%, rgba(99, 102, 241, 0.06), transparent),
    radial-gradient(800px 400px at 90% 10%, rgba(139, 92, 246, 0.04), transparent),
    linear-gradient(180deg, #fafafa 0%, #f8fafc 100%);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.module-page[data-theme="dark"] {
  background: 
    radial-gradient(1200px 600px at 10% -10%, rgba(99, 102, 241, 0.12), transparent),
    radial-gradient(800px 400px at 90% 10%, rgba(139, 92, 246, 0.08), transparent),
    linear-gradient(180deg, #0a0f1d 0%, #111827 100%);
}

/* ── ✦ Page Header ────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.75rem;
  padding: 0 0.25rem;
  position: relative;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: -1.25rem;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
}

.page-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 2.125rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.module-page[data-theme="dark"] .page-title {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 0.925rem;
  color: #64748b;
  margin-top: 0.5rem;
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
  gap: 0.7rem;
  padding: 0.875rem 1.625rem;
  border-radius: 14px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  border: none;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(135deg, rgba(255,255,255,0.4), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 45%, #a855f7 100%);
  color: #ffffff;
  box-shadow: 
    0 10px 30px -8px rgba(99, 102, 241, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.08);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 18px 40px -10px rgba(99, 102, 241, 0.55),
    0 4px 12px rgba(0, 0, 0, 0.12);
}

.btn-primary:active {
  transform: translateY(-1px);
}

.btn-ghost {
  background: #f8fafc;
  color: #475569;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.btn-ghost:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: translateY(-2px);
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
  box-shadow: 0 10px 30px -8px rgba(239, 68, 68, 0.4);
}

.btn-danger:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px -10px rgba(239, 68, 68, 0.5);
}

/* ── ✦ Search & Toolbar ─────────────────────────────────────────── */
.toolbar {
  margin-bottom: 2rem;
}

.search-wrap {
  position: relative;
  max-width: 440px;
}

.search-ico {
  position: absolute;
  left: 1.125rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  transition: color 0.25s;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 1rem 1.125rem;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.925rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.search-input:hover {
  border-color: #cbd5e1;
}

.search-input:focus {
  border-color: #6366f1;
  box-shadow: 
    0 0 0 5px rgba(99, 102, 241, 0.12),
    0 4px 20px rgba(99, 102, 241, 0.15);
}

.module-page[data-theme="dark"] .search-input {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.module-page[data-theme="dark"] .search-input:focus {
  border-color: #818cf8;
  box-shadow: 
    0 0 0 5px rgba(129, 140, 248, 0.18),
    0 4px 20px rgba(129, 140, 248, 0.2);
}

/* ── ✦ Premium Table Card ───────────────────────────────────────── */
.table-card {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 8px 40px -12px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  position: relative;
}

.table-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
  opacity: 0.8;
}

.module-page[data-theme="dark"] .table-card {
  background: #1e293b;
  border-color: rgba(51, 65, 85, 0.8);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.2),
    0 8px 40px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.module-page[data-theme="dark"] .table-card::before {
  background: linear-gradient(90deg, #818cf8, #a78bfa, #c4b5fd);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  padding: 1.125rem 1.5rem;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #64748b;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  position: relative;
}

.data-table th::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 1.5rem;
  right: 1.5rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), transparent);
}

.module-page[data-theme="dark"] .data-table th {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #94a3b8;
  border-bottom-color: #334155;
}

.data-table td {
  padding: 1.375rem 1.5rem;
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
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
}

.module-page[data-theme="dark"] .table-row:hover td {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.6) 100%);
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 4.5rem !important;
  font-size: 1rem;
  font-weight: 500;
}

/* ── ✦ Table Columns ────────────────────────────────────────────── */
.col-idx {
  color: #94a3b8;
  font-size: 0.8125rem;
  width: 48px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}


.col-date {
  color: #94a3b8;
  font-size: 0.7875rem;
  white-space: nowrap;
  font-weight: 500;
}

.col-actions {
  width: 105px;
  white-space: nowrap;
}

/* ── ✦ Member Cell ──────────────────────────────────────────────── */
.cell-member {
  display: flex;
  align-items: center;
  gap: 1.125rem;
}

.member-avatar {
  width: 2.875rem;
  height: 2.875rem;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 45%, #a855f7 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 
    0 4px 14px rgba(99, 102, 241, 0.35),
    0 0 0 3px rgba(255, 255, 255, 0.6) inset;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.member-avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent 50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.table-row:hover .member-avatar {
  transform: scale(1.08) rotate(-2deg);
}

.table-row:hover .member-avatar::before {
  opacity: 1;
}

.member-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.925rem;
  letter-spacing: -0.01em;
}

.module-page[data-theme="dark"] .member-name {
  color: #f1f5f9;
}

.link-phone {
  color: #6366f1;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
}

.link-phone::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1.5px;
  background: currentColor;
  transition: width 0.2s ease;
}

.link-phone:hover {
  color: #7c3aed;
}

.link-phone:hover::after {
  width: 100%;
}

/* ── ✦ Status Badge ─────────────────────────────────────────────── */
.status-badge {
  display: inline-flex;
  padding: 0.35rem 0.875rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.badge-active { background: rgba(5,150,105,0.12); color: #059669; }
.badge-inactive { background: rgba(100,116,139,0.12); color: #64748b; }

/* ── ✦ Toggle Switch ────────────────────────────────────────────── */
.status-toggle-wrap { display: flex; align-items: center; }
.toggle-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; user-select: none; }
.toggle-input { display: none; }
.toggle-slider {
  width: 44px; height: 24px; background: #e2e8f0; border-radius: 999px;
  position: relative; transition: background 0.2s;
}
.toggle-slider::after {
  content: ''; position: absolute; left: 3px; top: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.toggle-input:checked + .toggle-slider { background: #6366f1; }
.toggle-input:checked + .toggle-slider::after { transform: translateX(20px); }
.toggle-text { font-size: 0.875rem; font-weight: 600; color: #475569; }
.module-page[data-theme="dark"] .toggle-text { color: #cbd5e1; }
.module-page[data-theme="dark"] .toggle-slider { background: #334155; }

/* ── ✦ Action Buttons ───────────────────────────────────────────── */
.action-btn {
  width: 2.375rem;
  height: 2.375rem;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0.4375rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255,255,255,0.8), transparent 70%);
  opacity: 0;
  transition: opacity 0.2s;
}

.module-page[data-theme="dark"] .action-btn {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

.action-btn.edit:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
  transform: translateY(-3px);
  box-shadow: 
    0 6px 20px rgba(99, 102, 241, 0.25),
    0 0 0 3px rgba(99, 102, 241, 0.1) inset;
}

.action-btn.danger:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  transform: translateY(-3px);
  box-shadow: 
    0 6px 20px rgba(239, 68, 68, 0.25),
    0 0 0 3px rgba(239, 68, 68, 0.1) inset;
}

/* ── ✦ Loading State ────────────────────────────────────────────── */
.state-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.125rem;
  padding: 4.5rem;
  color: #64748b;
  font-weight: 500;
  font-size: 0.925rem;
}

.module-page[data-theme="dark"] .state-loading {
  color: #94a3b8;
}

.spinner-ring {
  width: 1.625rem;
  height: 1.625rem;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.module-page[data-theme="dark"] .spinner-ring {
  border-color: #334155;
  border-top-color: #818cf8;
}

.spinner-sm {
  width: 1.0625rem;
  height: 1.0625rem;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
  margin-right: 0.5625rem;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── ✦ Premium Modal System ─────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(12px) saturate(140%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.75rem;
}

.modal-box {
  background: #ffffff;
  border-radius: 28px;
  width: 100%;
  max-width: 520px;
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.32),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  position: relative;
}

.modal-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #7c3aed, #a855f7);
}

.module-page[data-theme="dark"] .modal-box {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.08);
}

.modal-sm {
  max-width: 440px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.875rem 2.125rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}

.modal-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 2.125rem;
  right: 2.125rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
}

.module-page[data-theme="dark"] .modal-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-bottom-color: #334155;
}

.modal-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.425rem;
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
  width: 2.375rem;
  height: 2.375rem;
  border: none;
  background: #ffffff;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.625rem;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.module-page[data-theme="dark"] .modal-close {
  background: #334155;
  color: #94a3b8;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.module-page[data-theme="dark"] .modal-close:hover {
  background: #475569;
  color: #f1f5f9;
}

.modal-form {
  padding: 2.125rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-bottom: 1.625rem;
}

.form-label {
  font-size: 0.8375rem;
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
  padding: 0.9375rem 1.25rem;
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

.input-field::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.input-field:hover {
  border-color: #cbd5e1;
}

.input-field:focus {
  border-color: #6366f1;
  box-shadow: 
    0 0 0 5px rgba(99, 102, 241, 0.12),
    0 4px 20px rgba(99, 102, 241, 0.15);
}

.module-page[data-theme="dark"] .input-field {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.module-page[data-theme="dark"] .input-field:focus {
  border-color: #818cf8;
  box-shadow: 
    0 0 0 5px rgba(129, 140, 248, 0.18),
    0 4px 20px rgba(129, 140, 248, 0.2);
}

.form-error {
  color: #dc2626;
  font-size: 0.8375rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%);
  border: 1.5px solid rgba(239, 68, 68, 0.35);
  border-left: 4px solid #ef4444;
  border-radius: 12px;
  padding: 0.9375rem 1.25rem;
  margin-bottom: 1.375rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
}

.module-page[data-theme="dark"] .form-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.12) 100%);
  border-color: rgba(239, 68, 68, 0.45);
  color: #fca5a5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.9375rem;
  padding: 1.625rem 2.125rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid #e2e8f0;
  position: relative;
}

.modal-footer::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 2.125rem;
  right: 2.125rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
}

.module-page[data-theme="dark"] .modal-footer {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-top-color: #334155;
}

.confirm-text {
  padding: 1.875rem 2.125rem;
  font-size: 0.9375rem;
  color: #475569;
  line-height: 1.75;
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
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  transform: scale(0.94) translateY(16px);
  opacity: 0;
}

/* ── ✦ Responsive Design ───────────────────────────────────────── */
@media (max-width: 1024px) {
  .module-page {
    padding: 1.75rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-width: 768px) {
  .module-page {
    padding: 1.375rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .toolbar {
    margin-bottom: 1.5rem;
  }
  
  .search-wrap {
    max-width: 100%;
  }
  
  .modal-form {
    padding: 1.625rem;
  }
  
  .modal-footer {
    padding: 1.375rem 1.75rem;
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* ── ✦ Premium Scrollbar ───────────────────────────────────────── */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 6px;
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
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.table-row {
  animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--row-index, 0) * 0.06s);
}

.table-row:nth-child(1) { --row-index: 1; }
.table-row:nth-child(2) { --row-index: 2; }
.table-row:nth-child(3) { --row-index: 3; }
.table-row:nth-child(4) { --row-index: 4; }
.table-row:nth-child(5) { --row-index: 5; }
.table-row:nth-child(6) { --row-index: 6; }
.table-row:nth-child(7) { --row-index: 7; }
.table-row:nth-child(8) { --row-index: 8; }

/* Focus accessibility */
.btn:focus-visible,
.input-field:focus-visible,
.action-btn:focus-visible,
.modal-close:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 3px rgba(255, 255, 255, 0.8),
    0 0 0 6px rgba(99, 102, 241, 0.35) !important;
}

.module-page[data-theme="dark"] .btn:focus-visible,
.module-page[data-theme="dark"] .input-field:focus-visible {
  box-shadow: 
    0 0 0 3px rgba(15, 23, 42, 0.9),
    0 0 0 6px rgba(129, 140, 248, 0.45) !important;
}
</style>