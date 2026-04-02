<template>
  <div class="module-page" :data-theme="theme">
    <div class="page-header">
      <div><h1 class="page-title">Manajemen Paket</h1><p class="page-subtitle">{{ bundles.length }} paket terdaftar</p></div>
      <button class="btn btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Buat Paket
      </button>
    </div>

    <!-- Bundle Cards -->
    <div class="bundle-grid">
      <div v-if="loading" class="state-loading"><span class="spinner-ring"></span> Memuat data...</div>
      <div v-else-if="bundles.length === 0" class="empty-state">Belum ada paket. Klik "Buat Paket" untuk memulai.</div>
      <div v-for="b in bundles" :key="b.id" class="bundle-card">
        <div class="bundle-top">
          <div class="bundle-badge">🎁</div>
          <div class="bundle-actions">
            <button class="action-btn edit" @click="openModal(b)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="action-btn danger" @click="deleteTarget = b"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
          </div>
        </div>
        <h3 class="bundle-name">{{ b.name }}</h3>
        <div class="bundle-items">
          <span v-for="(item, i) in b.items" :key="i" class="item-chip">{{ item.name }} × {{ item.qty }}</span>
        </div>
        <div class="bundle-pricing">
          <span class="harga-asli">Rp {{ formatCurrency(b.totalOriginal) }}</span>
          <span class="harga-paket">Rp {{ formatCurrency(b.bundlePrice) }}</span>
          <span class="saving-badge">Hemat {{ Math.round((1 - b.bundlePrice / b.totalOriginal) * 100) }}%</span>
        </div>
      </div>
    </div>

    <!-- Modal: Create/Edit Bundle -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box modal-lg">
            <div class="modal-header"><h2 class="modal-title">{{ editTarget ? 'Edit Paket' : 'Buat Paket Baru' }}</h2><button class="modal-close" @click="closeModal">×</button></div>
            <form @submit.prevent="handleSubmit" class="modal-form">
              <div class="form-group">
                <label class="form-label">Nama Paket <span class="req">*</span></label>
                <input v-model="form.name" class="input-field" type="text" placeholder="contoh: Paket Hemat Makan Siang" required/>
              </div>

              <!-- Component products -->
              <div class="form-group">
                <label class="form-label">Komponen Produk</label>
                <div v-for="(comp, i) in form.items" :key="i" class="comp-row">
                  <select v-model="comp.productId" class="input-field comp-select" @change="onComponentSelect(i)">
                    <option value="">-- Pilih produk --</option>
                    <option v-for="p in productsStore.products" :key="p.id" :value="p.id">{{ p.name }} (Rp {{ formatCurrency(p.sellingPrice) }})</option>
                  </select>
                  <input v-model.number="comp.qty" class="input-field comp-qty" type="number" min="1" placeholder="Qty"/>
                  <button type="button" class="comp-remove" @click="removeComponent(i)">×</button>
                </div>
                <button type="button" class="btn-add-comp" @click="addComponent">+ Tambah Produk</button>
              </div>

              <!-- Bundle Price -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Total Harga Normal</label>
                  <div class="readonly-val">Rp {{ formatCurrency(calcTotal) }}</div>
                </div>
                <div class="form-group">
                  <label class="form-label">Harga Paket <span class="req">*</span></label>
                  <input v-model.number="form.bundlePrice" class="input-field" type="number" min="0" required/>
                </div>
              </div>

              <div v-if="formError" class="form-error">{{ formError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">{{ editTarget ? 'Simpan' : 'Buat Paket' }}</button>
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
            <div class="modal-header"><h2 class="modal-title danger-title">Hapus Paket?</h2><button class="modal-close" @click="deleteTarget = null">×</button></div>
            <p class="confirm-text">Paket <strong>"{{ deleteTarget.name }}"</strong> akan dihapus.</p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="deleteTarget = null">Batal</button>
              <button class="btn btn-danger" @click="handleDelete">Hapus</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'

const productsStore = useProductsStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
const loading = ref(false)
const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const formError = ref('')
let nextId = 3

// Mock bundle data
const bundles = ref([
  { id: 'bnd-1', name: 'Paket Hemat A', items: [{ productId: 'prod-1', name: 'Nasi Goreng', qty: 1, price: 15000 }, { productId: 'prod-2', name: 'Es Teh', qty: 1, price: 5000 }], totalOriginal: 20000, bundlePrice: 17000 },
  { id: 'bnd-2', name: 'Paket Kenyang B', items: [{ productId: 'prod-3', name: 'Mie Ayam', qty: 1, price: 12000 }, { productId: 'prod-4', name: 'Es Jeruk', qty: 1, price: 6000 }, { productId: 'prod-5', name: 'Kerupuk', qty: 2, price: 3000 }], totalOriginal: 24000, bundlePrice: 20000 },
])

const form = reactive({ name: '', items: [{ productId: '', qty: 1, name: '', price: 0 }], bundlePrice: 0 })

const calcTotal = computed(() =>
  form.items.reduce((sum, c) => {
    const p = productsStore.products.find(x => x.id === c.productId)
    return sum + (p ? p.sellingPrice * (c.qty || 1) : 0)
  }, 0)
)

const formatCurrency = (v) => Math.round(v || 0).toLocaleString('id-ID')

const addComponent = () => form.items.push({ productId: '', qty: 1, name: '', price: 0 })
const removeComponent = (i) => { if (form.items.length > 1) form.items.splice(i, 1) }
const onComponentSelect = (i) => {
  const p = productsStore.products.find(x => x.id === form.items[i].productId)
  if (p) { form.items[i].name = p.name; form.items[i].price = p.sellingPrice }
}

const openModal = (b = null) => {
  editTarget.value = b; formError.value = ''
  if (b) {
    form.name = b.name; form.bundlePrice = b.bundlePrice
    form.items = b.items.map(i => ({ ...i }))
  } else {
    form.name = ''; form.bundlePrice = 0
    form.items = [{ productId: '', qty: 1, name: '', price: 0 }]
  }
  showModal.value = true
}
const closeModal = () => { showModal.value = false; editTarget.value = null }

const handleSubmit = () => {
  formError.value = ''
  const validItems = form.items.filter(c => c.productId && c.qty > 0)
  if (validItems.length < 2) { formError.value = 'Paket harus berisi minimal 2 produk'; return }
  if (form.bundlePrice <= 0) { formError.value = 'Harga paket harus lebih dari 0'; return }
  const items = validItems.map(c => { const p = productsStore.products.find(x => x.id === c.productId); return { productId: c.productId, name: p?.name || c.name, qty: c.qty, price: p?.sellingPrice || c.price } })
  const totalOriginal = items.reduce((s, i) => s + i.price * i.qty, 0)
  if (editTarget.value) {
    const idx = bundles.value.findIndex(b => b.id === editTarget.value.id)
    if (idx !== -1) bundles.value[idx] = { ...bundles.value[idx], name: form.name.trim(), items, totalOriginal, bundlePrice: form.bundlePrice }
  } else {
    bundles.value.push({ id: `bnd-${nextId++}`, name: form.name.trim(), items, totalOriginal, bundlePrice: form.bundlePrice })
  }
  closeModal()
}

const handleDelete = () => { bundles.value = bundles.value.filter(b => b.id !== deleteTarget.value.id); deleteTarget.value = null }

onMounted(() => productsStore.fetchProducts())
</script>

<style scoped>
.module-page { padding: 2.5rem; max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc, #f1f5f9); min-height: 100vh; font-family: 'Inter', sans-serif; }
.module-page[data-theme="dark"] { background: linear-gradient(135deg, #0f172a, #1e293b); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.module-page[data-theme="dark"] .page-title { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.375rem; }

.btn { display: inline-flex; align-items: center; gap: 0.625rem; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4); }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
.btn-ghost { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
.module-page[data-theme="dark"] .btn-ghost { background: #334155; color: #cbd5e1; border-color: #475569; }
.btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }

.bundle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
.bundle-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: all 0.3s; }
.bundle-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
.module-page[data-theme="dark"] .bundle-card { background: #1e293b; border-color: #334155; }
.bundle-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.bundle-badge { font-size: 2rem; }
.bundle-actions { display: flex; gap: 0.375rem; }
.bundle-name { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.75rem; }
.module-page[data-theme="dark"] .bundle-name { color: #f1f5f9; }
.bundle-items { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 1rem; }
.item-chip { padding: 0.3rem 0.75rem; border-radius: 999px; background: rgba(99,102,241,0.1); color: #6366f1; font-size: 0.75rem; font-weight: 600; }
.bundle-pricing { display: flex; align-items: center; gap: 0.75rem; }
.harga-asli { text-decoration: line-through; color: #94a3b8; font-size: 0.85rem; }
.harga-paket { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
.module-page[data-theme="dark"] .harga-paket { color: #f1f5f9; }
.saving-badge { padding: 0.25rem 0.625rem; border-radius: 999px; background: rgba(16,185,129,0.12); color: #059669; font-size: 0.72rem; font-weight: 700; }

.action-btn { width: 2rem; height: 2rem; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; }
.module-page[data-theme="dark"] .action-btn { background: #334155; border-color: #475569; color: #94a3b8; }
.action-btn.edit:hover { border-color: #6366f1; color: #6366f1; }
.action-btn.danger:hover { border-color: #ef4444; color: #ef4444; }

.state-loading { grid-column: 1/-1; display: flex; align-items: center; gap: 1rem; justify-content: center; padding: 4rem; color: #64748b; }
.spinner-ring { width: 1.5rem; height: 1.5rem; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
.empty-state { grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 4rem; }
@keyframes spin { to { transform: rotate(360deg); } }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; }
.modal-box { background: #fff; border-radius: 24px; width: 100%; max-width: 520px; box-shadow: 0 25px 80px rgba(0,0,0,0.25); overflow: hidden; }
.modal-lg { max-width: 600px; }
.modal-sm { max-width: 420px; }
.module-page[data-theme="dark"] .modal-box { background: #1e293b; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.75rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .modal-header { background: #0f172a; border-bottom-color: #334155; }
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 700; color: #1e293b; margin: 0; }
.module-page[data-theme="dark"] .modal-title { color: #f1f5f9; }
.danger-title { color: #ef4444; }
.modal-close { width: 2.25rem; height: 2.25rem; border: none; background: #fff; border-radius: 10px; cursor: pointer; font-size: 1.5rem; color: #64748b; display: flex; align-items: center; justify-content: center; }
.module-page[data-theme="dark"] .modal-close { background: #334155; color: #94a3b8; }
.modal-form { padding: 2rem; max-height: 70vh; overflow-y: auto; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: #475569; }
.module-page[data-theme="dark"] .form-label { color: #cbd5e1; }
.req { color: #ef4444; }
.input-field { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; color: #1e293b; font-size: 0.9rem; transition: all 0.3s; outline: none; font-weight: 500; width: 100%; box-sizing: border-box; }
.input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.module-page[data-theme="dark"] .input-field { background: #0f172a; border-color: #334155; color: #f1f5f9; }

.comp-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
.comp-select { flex: 3; }
.comp-qty { flex: 1; min-width: 70px; text-align: center; }
.comp-remove { width: 2rem; height: 2rem; border-radius: 8px; border: 1.5px solid #fecaca; background: rgba(239,68,68,0.05); color: #ef4444; font-size: 1.2rem; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.comp-remove:hover { background: #ef4444; color: #fff; }
.btn-add-comp { padding: 0.5rem 1rem; border: 2px dashed #e2e8f0; border-radius: 10px; background: transparent; color: #6366f1; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-add-comp:hover { border-color: #6366f1; background: rgba(99,102,241,0.05); }

.readonly-val { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #f8fafc; color: #64748b; font-size: 0.9rem; font-weight: 600; }
.module-page[data-theme="dark"] .readonly-val { background: #0f172a; border-color: #334155; color: #94a3b8; }

.form-error { color: #dc2626; font-size: 0.825rem; background: rgba(239,68,68,0.1); border-radius: 10px; padding: 0.75rem; margin-bottom: 1rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.875rem; padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .modal-footer { background: #0f172a; border-top-color: #334155; }
.confirm-text { padding: 1.75rem 2rem; font-size: 0.925rem; color: #475569; line-height: 1.7; text-align: center; }
.module-page[data-theme="dark"] .confirm-text { color: #cbd5e1; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
