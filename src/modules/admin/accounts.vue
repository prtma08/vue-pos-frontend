<template>
  <div class="module-page" :data-theme="theme">
    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Kelola Akun</h1>
        <p class="page-subtitle">{{ store.users.length }} pengguna terdaftar</p>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Pengguna
      </button>
    </div>

    <!-- ── Toolbar ── -->
    <div class="toolbar">
      <div class="search-wrap">
        <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="store.searchTerm" class="input-field search-input" type="text" placeholder="Cari nama, username..."/>
      </div>
      <div class="filter-row">
        <button class="filter-pill" :class="{ active: !store.roleFilter }" @click="store.roleFilter = ''">Semua</button>
        <button class="filter-pill" :class="{ active: store.roleFilter === 'ADMIN' }" @click="store.roleFilter = 'ADMIN'">Admin</button>
        <button class="filter-pill" :class="{ active: store.roleFilter === 'SUPERVISOR' }" @click="store.roleFilter = 'SUPERVISOR'">Supervisor</button>
        <button class="filter-pill" :class="{ active: store.roleFilter === 'CASHIER' }" @click="store.roleFilter = 'CASHIER'">Kasir</button>
      </div>
    </div>

    <!-- ── Table ── -->
    <div class="table-card">
      <div v-if="store.loading" class="state-loading">
        <span class="spinner-ring"></span><span>Memuat akun...</span>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama & Username</th>
            <th>Role</th>
            <th>Email</th>
            <th>Status</th>
            <th>Bergabung</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.filtered.length === 0">
            <td colspan="7" class="empty-row">Tidak ada pengguna ditemukan.</td>
          </tr>
          <tr v-for="(u, i) in store.filtered" :key="u.id" class="table-row">
            <td class="col-idx">{{ i + 1 }}</td>
            <td>
              <div class="cell-user">
                <div class="user-avatar" :style="{ background: avatarColor(u.role) }">{{ u.name[0] }}</div>
                <div>
                  <div class="user-name">{{ u.name }}</div>
                  <div class="user-username">@{{ u.username }}</div>
                </div>
              </div>
            </td>
            <td><span class="badge" :class="roleBadgeClass(u.role)">{{ store.getRoleLabel(u.role) }}</span></td>
            <td class="col-email">{{ u.email || '—' }}</td>
            <td>
              <span class="status-dot" :class="u.isActive ? 'active' : 'inactive'">
                {{ u.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
            <td class="col-date">{{ formatDate(u.createdAt) }}</td>
            <td class="col-actions">
              <button class="action-btn edit" @click="openModal(u)" title="Edit"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="action-btn danger" @click="confirmDelete(u)" title="Hapus"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg></button>
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
              <h2 class="modal-title">{{ editTarget ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h2>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-form">
              <div class="form-group">
                <label class="form-label">Nama Lengkap <span class="required">*</span></label>
                <input v-model="form.name" class="input-field" type="text" placeholder="contoh: Kasir Satu" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Username <span class="required">*</span></label>
                <input v-model="form.username" class="input-field" type="text" placeholder="contoh: kasir1" :disabled="!!editTarget" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input v-model="form.email" class="input-field" type="email" placeholder="email@nextore.id"/>
              </div>
              <div class="form-group">
                <label class="form-label">Role <span class="required">*</span></label>
                <select v-model="form.role" class="input-field" required>
                  <option value="">-- Pilih Role --</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="CASHIER">Kasir</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">
                  Password {{ editTarget ? '(kosongkan jika tidak diubah)' : '' }}
                  <span v-if="!editTarget" class="required">*</span>
                </label>
                <input v-model="form.password" class="input-field" type="password" placeholder="Min. 6 karakter" :required="!editTarget"/>
              </div>
              <div v-if="formError" class="form-error">{{ formError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  {{ editTarget ? 'Simpan' : 'Buat Akun' }}
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
              <h2 class="modal-title danger-title">Hapus Akun?</h2>
              <button class="modal-close" @click="deleteTarget = null">×</button>
            </div>
            <p class="confirm-text">Akun <strong>"{{ deleteTarget.name }}"</strong> akan dihapus permanen. Pastikan akun ini tidak sedang aktif.</p>
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
import { useUsersStore } from '@/stores/users'

const store = useUsersStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')

const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const formError = ref('')
const form = reactive({ name: '', username: '', email: '', role: '', password: '' })

onMounted(() => store.fetchAll())

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const avatarColor = (role) => {
  const map = { ADMIN: 'linear-gradient(135deg, #6366f1, #8b5cf6)', SUPERVISOR: 'linear-gradient(135deg, #f59e0b, #d97706)', CASHIER: 'linear-gradient(135deg, #10b981, #059669)' }
  return map[role] || 'var(--accent)'
}

const roleBadgeClass = (role) => ({ ADMIN: 'badge-role-admin', SUPERVISOR: 'badge-role-supervisor', CASHIER: 'badge-role-cashier' }[role] || 'badge-accent')

const openModal = (u = null) => {
  editTarget.value = u
  formError.value = ''
  Object.assign(form, { name: u?.name || '', username: u?.username || '', email: u?.email || '', role: u?.role || '', password: '' })
  showModal.value = true
}
const closeModal = () => { showModal.value = false; editTarget.value = null }

const handleSubmit = async () => {
  formError.value = ''
  const payload = { name: form.name.trim(), username: form.username.trim(), email: form.email.trim() || null, role: form.role }
  if (form.password) payload.password = form.password
  const result = editTarget.value
    ? await store.update(editTarget.value.id, payload)
    : await store.add(payload)
  if (result.success) { closeModal() } else { formError.value = result.message }
}

const confirmDelete = (u) => { deleteTarget.value = u }
const handleDelete = async () => {
  const result = await store.remove(deleteTarget.value.id)
  if (result.success) deleteTarget.value = null
}
</script>

<style scoped>
/* ── Modern Design System ───────────────────────────────────────────── */
.module-page {
  padding: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.module-page[data-theme="dark"] {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

/* ── Page Header ────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 0 0.5rem;
}

.page-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
}

.module-page[data-theme="dark"] .page-title {
  background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.375rem;
  font-weight: 400;
}

.module-page[data-theme="dark"] .page-subtitle {
  color: #94a3b8;
}

/* ── Primary Button ─────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-ghost {
  background: #f1f5f9;
  color: #475569;
  border: 1.5px solid #e2e8f0;
}

.btn-ghost:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.module-page[data-theme="dark"] .btn-ghost {
  background: #334155;
  color: #cbd5e1;
  border-color: #475569;
}

.module-page[data-theme="dark"] .btn-ghost:hover {
  background: #475569;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(239, 68, 68, 0.5);
}

/* ── Toolbar ──────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.75rem;
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
  transition: color 0.2s;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.9rem;
  transition: all 0.3s;
  outline: none;
  font-weight: 500;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-input:hover {
  border-color: #cbd5e1;
}

.search-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.module-page[data-theme="dark"] .search-input {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.module-page[data-theme="dark"] .search-input:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.15);
}

/* ── Filter Pills ──────────────────────────────────────────────────── */
.filter-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-pill {
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-pill:hover {
  border-color: #6366f1;
  color: #6366f1;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.15);
}

.filter-pill.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.module-page[data-theme="dark"] .filter-pill {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.module-page[data-theme="dark"] .filter-pill:hover {
  border-color: #818cf8;
  color: #818cf8;
}

/* ── Table Card ────────────────────────────────────────────────────── */
.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
}

.module-page[data-theme="dark"] .table-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
}

.module-page[data-theme="dark"] .data-table th {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #94a3b8;
  border-bottom-color: #334155;
}

.data-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
  transition: all 0.2s;
}

.module-page[data-theme="dark"] .data-table td {
  border-bottom-color: #334155;
  color: #cbd5e1;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover td {
  background: linear-gradient(135deg, #fafafa 0%, #f8fafc 100%);
}

.module-page[data-theme="dark"] .table-row:hover td {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 4rem !important;
  font-size: 0.95rem;
}

/* ── Table Columns ─────────────────────────────────────────────────── */
.col-idx {
  color: #94a3b8;
  font-size: 0.8rem;
  width: 50px;
  font-weight: 600;
}

.col-email {
  color: #64748b;
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', monospace;
}

.module-page[data-theme="dark"] .col-email {
  color: #94a3b8;
}

.col-date {
  color: #94a3b8;
  font-size: 0.8rem;
  white-space: nowrap;
}

.col-actions {
  width: 100px;
  white-space: nowrap;
}

/* ── User Cell ─────────────────────────────────────────────────────── */
.cell-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 12px;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.table-row:hover .user-avatar {
  transform: scale(1.05);
}

.user-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.9rem;
}

.module-page[data-theme="dark"] .user-name {
  color: #f1f5f9;
}

.user-username {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  margin-top: 0.125rem;
}

/* ── Badges ────────────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.badge-role-admin {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  color: #6366f1;
  border: 1.5px solid rgba(99, 102, 241, 0.3);
}

.badge-role-supervisor {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%);
  color: #d97706;
  border: 1.5px solid rgba(217, 119, 6, 0.3);
}

.badge-role-cashier {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
  color: #059669;
  border: 1.5px solid rgba(5, 150, 105, 0.3);
}

/* ── Status Dot ────────────────────────────────────────────────────── */
.status-dot {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
  font-weight: 600;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  background: #f8fafc;
}

.module-page[data-theme="dark"] .status-dot {
  background: #334155;
}

.status-dot::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.status-dot.active {
  color: #059669;
  background: rgba(5, 150, 105, 0.1);
}

.status-dot.active::before {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.status-dot.inactive {
  color: #64748b;
  background: rgba(100, 116, 139, 0.1);
}

.status-dot.inactive::before {
  background: #94a3b8;
}

/* ── Action Buttons ────────────────────────────────────────────────── */
.action-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0.375rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.module-page[data-theme="dark"] .action-btn {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

.action-btn.edit:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.action-btn.danger:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* ── Loading State ─────────────────────────────────────────────────── */
.state-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: #64748b;
  font-weight: 500;
}

.module-page[data-theme="dark"] .state-loading {
  color: #94a3b8;
}

.spinner-ring {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.module-page[data-theme="dark"] .spinner-ring {
  border-color: #334155;
  border-top-color: #818cf8;
}

.spinner-sm {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Modal System ──────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
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
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.module-page[data-theme="dark"] .modal-box {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.05);
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
}

.module-page[data-theme="dark"] .modal-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-bottom-color: #334155;
}

.modal-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
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
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.module-page[data-theme="dark"] .modal-close {
  background: #334155;
  color: #94a3b8;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
  transform: rotate(90deg);
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
  gap: 0.625rem;
  margin-bottom: 1.5rem;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 600;
  color: #475569;
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
  font-size: 0.9rem;
  transition: all 0.3s;
  outline: none;
  font-weight: 500;
}

.input-field::placeholder {
  color: #94a3b8;
}

.input-field:hover {
  border-color: #cbd5e1;
}

.input-field:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.module-page[data-theme="dark"] .input-field {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.module-page[data-theme="dark"] .input-field:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.15);
}

.form-error {
  color: #dc2626;
  font-size: 0.825rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1.5px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  padding: 0.875rem 1.125rem;
  margin-bottom: 1.25rem;
  font-weight: 500;
}

.module-page[data-theme="dark"] .form-error {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.875rem;
  padding: 1.5rem 2rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.module-page[data-theme="dark"] .modal-footer {
  background: #0f172a;
  border-top-color: #334155;
}

.confirm-text {
  padding: 1.75rem 2rem;
  font-size: 0.925rem;
  color: #475569;
  line-height: 1.7;
  text-align: center;
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

/* ── Modal Transitions ─────────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  transform: scale(0.95) translateY(12px);
}

/* ── Responsive Design ─────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .module-page {
    padding: 1.5rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
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
    gap: 0.875rem;
  }
  
  .search-wrap {
    max-width: 100%;
  }
  
  .filter-row {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .modal-form {
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1.25rem 1.5rem;
  }
}

/* ── Scrollbar Styling ─────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}

/* ── Animations ────────────────────────────────────────────────────── */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-row {
  animation: fadeIn 0.4s ease forwards;
}

.table-row:nth-child(1) { animation-delay: 0.05s; }
.table-row:nth-child(2) { animation-delay: 0.1s; }
.table-row:nth-child(3) { animation-delay: 0.15s; }
.table-row:nth-child(4) { animation-delay: 0.2s; }
.table-row:nth-child(5) { animation-delay: 0.25s; }
.table-row:nth-child(6) { animation-delay: 0.3s; }
</style>