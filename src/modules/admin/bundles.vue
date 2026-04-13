<template>
  <div class="module-page" :data-theme="theme">
    <div class="page-header">
      <div>
        <h1 class="page-title">Manajemen Paket</h1>
        <p class="page-subtitle">{{ bundles.length }} paket terdaftar</p>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Buat Paket
      </button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <svg class="search-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="searchTerm" class="input-field search-input" type="text" placeholder="Cari Nama Paket..."/>
      </div>
    </div>

    <!-- Bundle Cards -->
    <div class="bundle-grid">
      <div v-if="loading" class="state-loading"><span class="spinner-ring"></span> Memuat data...</div>
      <div v-else-if="filteredBundles.length === 0" class="empty-state">
        {{ searchTerm ? 'Tidak ada paket yang cocok dengan pencarian.' : 'Belum ada paket. Klik "Buat Paket" untuk memulai.' }}
      </div>
      <div v-for="b in filteredBundles" :key="b.id" class="bundle-card">
        <!-- Card image or emoji fallback -->
        <div class="bundle-top">
          <div class="bundle-visual">
            <img v-if="b.imageUrl" :src="b.imageUrl" class="bundle-image" :alt="b.name" />
            <div v-else class="bundle-badge">🎁</div>
          </div>
          <div class="bundle-actions">
            <button class="action-btn edit" @click="openModal(b)" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn danger" @click="deleteTarget = b" title="Hapus">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              </svg>
            </button>
          </div>
        </div>
        <h3 class="bundle-name">{{ b.name }}</h3>
        <div class="bundle-items">
          <span v-for="(item, i) in b.items" :key="i" class="item-chip">{{ item.name }} × {{ item.qty }}</span>
        </div>
        <div class="bundle-pricing">
          <span class="harga-asli">Rp {{ formatCurrency(b.totalOriginal) }}</span>
          <span class="harga-paket">Rp {{ formatCurrency(b.bundlePrice) }}</span>
          <span v-if="b.totalOriginal > b.bundlePrice" class="saving-badge">
            Hemat {{ Math.round((1 - b.bundlePrice / b.totalOriginal) * 100) }}%
          </span>
        </div>
        <!-- HPP badge on card -->
        <div class="bundle-hpp-row">
          <span class="hpp-label">Modal HPP</span>
          <span class="hpp-val">Rp {{ formatCurrency(b.bundleHpp || 0) }}</span>
          <span
            class="margin-chip"
            :class="(b.bundlePrice - (b.bundleHpp || 0)) >= 0 ? 'chip-profit' : 'chip-loss'"
          >
            {{ (b.bundlePrice - (b.bundleHpp || 0)) >= 0 ? '▲ Profit' : '▼ Rugi' }}
            Rp {{ formatCurrency(Math.abs(b.bundlePrice - (b.bundleHpp || 0))) }}
          </span>
        </div>
        <div class="bundle-stock" :class="(b.bundleStock ?? 0) <= 5 ? 'stock-low' : 'stock-ok'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          Stok: {{ b.bundleStock ?? 0 }}
        </div>
      </div>
    </div>

    <!-- ── Modal: Create/Edit Bundle ─────────────────────────────────────── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box modal-lg">
            <div class="modal-header">
              <h2 class="modal-title">{{ editTarget ? 'Edit Paket' : 'Buat Paket Baru' }}</h2>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-form">

              <!-- ► Nama Paket -->
              <div class="form-group">
                <label class="form-label">Nama Paket <span class="req">*</span></label>
                <input v-model="form.name" class="input-field" type="text" placeholder="contoh: Paket Hemat Makan Siang" required/>
              </div>

              <!-- ► Upload Gambar -->
              <div class="form-group">
                <label class="form-label">Gambar Paket</label>
                <div class="image-upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="onImageDrop">
                  <img v-if="form.imagePreview" :src="form.imagePreview" class="image-preview" alt="Preview"/>
                  <div v-else class="image-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Klik atau drag &amp; drop gambar (JPG/PNG)</span>
                    <span class="upload-hint">Maks. 2MB — Rasio 1:1 direkomendasikan</span>
                  </div>
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="hidden-file-input"
                    @change="onImageChange"
                  />
                </div>
                <button v-if="form.imagePreview" type="button" class="btn-remove-image" @click.stop="removeImage">
                  × Hapus Gambar
                </button>
              </div>

              <!-- ► Komponen Produk -->
              <div class="form-group">
                <label class="form-label">Komponen Produk <span class="req">*</span></label>
                <div v-for="(comp, i) in form.items" :key="i" class="comp-row">
                  <div class="comp-combobox-wrap">
                    <AppCombobox
                      :model-value="comp.productId"
                      :options="productsStore.products"
                      option-key="id"
                      option-label="name"
                      :option-sub-label="'sku'"
                      placeholder="-- Pilih produk --"
                      search-placeholder="Cari Produk..."
                      :clearable="true"
                      @update:model-value="(val) => { comp.productId = val; onComponentSelectById(i, val) }"
                    />
                  </div>
                  <div class="comp-right">
                    <input
                      v-model.number="comp.qty"
                      class="input-field comp-qty"
                      type="number"
                      min="1"
                      placeholder="Qty"
                    />
                    <!-- Per-component HPP indicator -->
                    <span class="comp-hpp-hint" v-if="comp.productId">
                      HPP: Rp {{ formatCurrency(getProductHpp(comp.productId) * (comp.qty || 1)) }}
                    </span>
                  </div>
                  <button type="button" class="comp-remove" @click="removeComponent(i)">×</button>
                </div>
                <button type="button" class="btn-add-comp" @click="addComponent">+ Tambah Produk</button>
              </div>

              <!-- ► HPP & Pricing section -->
              <div class="hpp-section">
                <div class="hpp-row">
                  <div class="hpp-stat">
                    <span class="hpp-stat-label">Total Modal Paket (HPP)</span>
                    <span class="hpp-stat-val hpp-val-color">Rp {{ formatCurrency(calculatedBundleHpp) }}</span>
                  </div>
                  <div class="hpp-stat">
                    <span class="hpp-stat-label">Total Harga Normal</span>
                    <span class="hpp-stat-val">Rp {{ formatCurrency(calcTotal) }}</span>
                  </div>
                </div>
              </div>

              <!-- ► Harga & Stok -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Harga Jual Paket <span class="req">*</span></label>
                  <input v-model.number="form.bundlePrice" class="input-field" type="number" min="0" required/>
                </div>
                <div class="form-group">
                  <label class="form-label">Stok Paket <span class="req">*</span></label>
                  <input
                    v-model.number="form.bundleStock"
                    class="input-field"
                    type="number"
                    min="0"
                    placeholder="0"
                    @input="() => { if (form.bundleStock < 0) form.bundleStock = 0 }"
                  />
                </div>
              </div>

              <!-- ► Profit / Loss Indicator -->
              <div v-if="form.bundlePrice > 0 && calculatedBundleHpp > 0">
                <!-- Loss Alert -->
                <div v-if="bundleLoss" class="bundle-loss-alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div>
                    <strong>Peringatan: Harga Jual di Bawah HPP!</strong>
                    <p>Paket ini akan dijual dengan kerugian sebesar <strong>Rp {{ formatCurrency(calculatedBundleHpp - form.bundlePrice) }}</strong> per transaksi.</p>
                  </div>
                </div>
                <!-- Profit Preview -->
                <div v-else class="bundle-profit-preview">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                  <span>
                    Potensi Laba: <strong>Rp {{ formatCurrency(form.bundlePrice - calculatedBundleHpp) }}</strong>
                    (Margin {{ bundleMarginPct }}% dari HPP)
                  </span>
                </div>
              </div>

              <span class="form-hint">Stok paket dikurangi otomatis saat transaksi.</span>

              <div v-if="formError" class="form-error">{{ formError }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  <span v-if="loading" class="spinner-sm"></span>
                  {{ editTarget ? 'Simpan' : 'Buat Paket' }}
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
            <div class="modal-header">
              <h2 class="modal-title danger-title">Hapus Paket?</h2>
              <button class="modal-close" @click="deleteTarget = null">×</button>
            </div>
            <p class="confirm-text">Paket <strong>"{{ deleteTarget.name }}"</strong> akan dihapus permanen.</p>
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
import AppCombobox from '@/components/AppCombobox.vue'

const productsStore = useProductsStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })
const loading = ref(false)
const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const formError = ref('')
const searchTerm = ref('')
const fileInputRef = ref(null)
let nextId = 3

// ── Mock bundle data ─────────────────────────────────────────────────────────
// bundleHpp: pre-computed Total HPP at creation time, snapshot-safe for reports
const bundles = ref([
  {
    id: 'bnd-1', name: 'Paket Hemat A', bundleStock: 10, imageUrl: null, bundleHpp: 17000,
    items: [
      { productId: 'prod-1', name: 'Nasi Goreng Spesial', qty: 1, price: 25000, hpp: 12000 },
      { productId: 'prod-4', name: 'Es Teh Manis',        qty: 1, price: 6000,  hpp: 2000  },
    ],
    totalOriginal: 31000, bundlePrice: 27000,
  },
  {
    id: 'bnd-2', name: 'Paket Kenyang B', bundleStock: 5, imageUrl: null, bundleHpp: 28000,
    items: [
      { productId: 'prod-2', name: 'Mie Ayam Bakso', qty: 1, price: 18000, hpp: 10000 },
      { productId: 'prod-5', name: 'Jus Alpukat',    qty: 1, price: 14000, hpp: 8000  },
      { productId: 'prod-7', name: 'Kentang Goreng', qty: 2, price: 12000, hpp: 5000  },
    ],
    totalOriginal: 56000, bundlePrice: 48000,
  },
])

const filteredBundles = computed(() => {
  if (!searchTerm.value) return bundles.value
  const term = searchTerm.value.toLowerCase()
  return bundles.value.filter(b => b.name.toLowerCase().includes(term))
})

// ── Form ─────────────────────────────────────────────────────────────────────
const form = reactive({
  name: '',
  items: [{ productId: '', qty: 1, name: '', price: 0, hpp: 0 }],
  bundlePrice: 0,
  bundleStock: 0,
  imageFile: null,
  imagePreview: null,
})

// ── Computed: auto-calculated HPP & pricing ──────────────────────────────────
/**
 * Total HPP Paket = Σ (HPP Average produk komponen × qty)
 * Reaktif: berubah otomatis setiap kali items / qty berubah.
 */
const calculatedBundleHpp = computed(() =>
  form.items.reduce((sum, c) => {
    const p = productsStore.products.find(x => x.id === c.productId)
    const hpp = p?.hpp ?? c.hpp ?? 0
    return sum + hpp * (c.qty || 1)
  }, 0)
)

/** Total harga normal (sellingPrice × qty) */
const calcTotal = computed(() =>
  form.items.reduce((sum, c) => {
    const p = productsStore.products.find(x => x.id === c.productId)
    return sum + (p ? p.sellingPrice * (c.qty || 1) : 0)
  }, 0)
)

/** True jika harga jual paket di bawah HPP */
const bundleLoss = computed(() =>
  form.bundlePrice > 0 && calculatedBundleHpp.value > 0 && form.bundlePrice < calculatedBundleHpp.value
)

/** Margin laba sebagai % dari HPP */
const bundleMarginPct = computed(() => {
  if (!calculatedBundleHpp.value || !form.bundlePrice) return 0
  return Math.round(((form.bundlePrice - calculatedBundleHpp.value) / calculatedBundleHpp.value) * 10000) / 100
})

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (v) => Math.round(v || 0).toLocaleString('id-ID')

const getProductHpp = (productId) => {
  const p = productsStore.products.find(x => x.id === productId)
  return p?.hpp ?? 0
}

// ── Component CRUD ────────────────────────────────────────────────────────────
const addComponent = () => form.items.push({ productId: '', qty: 1, name: '', price: 0, hpp: 0 })
const removeComponent = (i) => { if (form.items.length > 1) form.items.splice(i, 1) }

const onComponentSelectById = (i, val) => {
  const p = productsStore.products.find(x => x.id === val)
  if (p) {
    form.items[i].name  = p.name
    form.items[i].price = p.sellingPrice ?? p.price ?? 0
    form.items[i].hpp   = p.hpp ?? 0
  } else {
    form.items[i].name  = ''
    form.items[i].price = 0
    form.items[i].hpp   = 0
  }
}

// ── Image upload ──────────────────────────────────────────────────────────────
const triggerFileInput = () => fileInputRef.value?.click()

const processImageFile = (file) => {
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    formError.value = 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    formError.value = 'Ukuran gambar maks. 2MB.'
    return
  }
  form.imageFile = file
  const reader = new FileReader()
  reader.onload = (e) => { form.imagePreview = e.target.result }
  reader.readAsDataURL(file)
  formError.value = ''
}

const onImageChange = (e) => processImageFile(e.target.files?.[0])
const onImageDrop = (e) => processImageFile(e.dataTransfer.files?.[0])
const removeImage = () => {
  form.imageFile    = null
  form.imagePreview = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const openModal = (b = null) => {
  editTarget.value = b
  formError.value  = ''
  if (b) {
    form.name         = b.name
    form.bundlePrice  = b.bundlePrice
    form.bundleStock  = b.bundleStock ?? 0
    form.items        = b.items.map(i => ({ ...i }))
    form.imageFile    = null
    form.imagePreview = b.imageUrl || null
  } else {
    form.name         = ''
    form.bundlePrice  = 0
    form.bundleStock  = 0
    form.items        = [{ productId: '', qty: 1, name: '', price: 0, hpp: 0 }]
    form.imageFile    = null
    form.imagePreview = null
  }
  showModal.value = true
}
const closeModal = () => { showModal.value = false; editTarget.value = null }

// ── Submit ────────────────────────────────────────────────────────────────────
const handleSubmit = () => {
  formError.value = ''
  const validItems = form.items.filter(c => c.productId && c.qty > 0)
  if (validItems.length < 2) { formError.value = 'Paket harus berisi minimal 2 produk'; return }
  if (form.bundlePrice <= 0) { formError.value = 'Harga paket harus lebih dari 0'; return }
  if (form.bundleStock < 0)  { formError.value = 'Stok paket tidak boleh negatif'; return }

  // Snapshot setiap komponen dengan nama, harga, dan HPP saat ini
  const items = validItems.map(c => {
    const p = productsStore.products.find(x => x.id === c.productId)
    return {
      productId: c.productId,
      name:      p?.name || c.name,
      qty:       c.qty,
      price:     p?.sellingPrice ?? c.price,
      hpp:       p?.hpp ?? c.hpp ?? 0,
    }
  })

  const totalOriginal = items.reduce((s, i) => s + i.price * i.qty, 0)

  /**
   * Langkah 4 – Sinkronisasi HPP ke laporan:
   * bundleHpp adalah snapshot Total HPP saat paket disimpan.
   * Nilai ini akan digunakan oleh cart.js sebagai hpp item bundle
   * agar finance.vue tetap akurat meski harga komponen berubah di masa depan.
   */
  const bundleHpp = calculatedBundleHpp.value

  // Handle imageUrl (dalam production: upload ke server, kembalikan URL)
  // Dalam mode mock: gunakan Base64 preview sebagai URL sementara
  const imageUrl = form.imageFile ? form.imagePreview : (editTarget.value?.imageUrl || null)

  const bundleData = {
    name: form.name.trim(),
    items,
    totalOriginal,
    bundlePrice: form.bundlePrice,
    bundleStock: form.bundleStock,
    bundleHpp,     // ← snapshot HPP untuk laporan
    imageUrl,      // ← URL gambar paket
    type: 'BUNDLE',
    bundleItems: items, // alias untuk kompatibilitas cart.js
  }

  if (editTarget.value) {
    const idx = bundles.value.findIndex(b => b.id === editTarget.value.id)
    if (idx !== -1) bundles.value[idx] = { ...bundles.value[idx], ...bundleData }
  } else {
    bundles.value.push({ id: `bnd-${nextId++}`, ...bundleData })
  }
  closeModal()
}

const handleDelete = () => {
  bundles.value = bundles.value.filter(b => b.id !== deleteTarget.value.id)
  deleteTarget.value = null
}

onMounted(() => productsStore.fetchProducts())
</script>

<style scoped>
.module-page {
  padding: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}
.module-page[data-theme="dark"] { background: linear-gradient(135deg, #0f172a, #1e293b); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.module-page[data-theme="dark"] .page-title { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.page-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.375rem; }

/* Toolbar */
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: #fff; padding: 1rem 1.5rem; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .toolbar { background: #1e293b; border-color: #334155; }
.search-wrap { display: flex; align-items: center; gap: 0.75rem; background: #f8fafc; padding: 0.75rem 1.25rem; border-radius: 12px; flex: 1; max-width: 400px; border: 1.5px solid transparent; transition: all 0.3s; }
.search-wrap:focus-within { background: #fff; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.module-page[data-theme="dark"] .search-wrap { background: #0f172a; }
.search-ico { color: #64748b; }
.search-input { border: none; background: transparent; padding: 0; width: 100%; font-size: 0.95rem; color: #1e293b; outline: none; }
.module-page[data-theme="dark"] .search-input { color: #f1f5f9; }

/* Bundle grid */
.bundle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
.bundle-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: all 0.3s; }
.bundle-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
.module-page[data-theme="dark"] .bundle-card { background: #1e293b; border-color: #334155; }

.bundle-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.bundle-visual { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
.bundle-image { width: 100%; height: 100%; object-fit: cover; }
.bundle-badge { font-size: 2rem; }
.bundle-actions { display: flex; gap: 0.375rem; }
.bundle-name { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.75rem; }
.module-page[data-theme="dark"] .bundle-name { color: #f1f5f9; }
.bundle-items { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 1rem; }
.item-chip { padding: 0.3rem 0.75rem; border-radius: 999px; background: rgba(99,102,241,0.1); color: #6366f1; font-size: 0.75rem; font-weight: 600; }

.bundle-pricing { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.harga-asli { text-decoration: line-through; color: #94a3b8; font-size: 0.85rem; }
.harga-paket { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
.module-page[data-theme="dark"] .harga-paket { color: #f1f5f9; }
.saving-badge { padding: 0.25rem 0.625rem; border-radius: 999px; background: rgba(16,185,129,0.12); color: #059669; font-size: 0.72rem; font-weight: 700; }

/* HPP row on card */
.bundle-hpp-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.625rem; padding-top: 0.625rem; border-top: 1px dashed #e2e8f0; }
.module-page[data-theme="dark"] .bundle-hpp-row { border-top-color: #334155; }
.hpp-label { font-size: 0.72rem; color: #94a3b8; font-weight: 500; }
.hpp-val { font-size: 0.82rem; font-weight: 700; color: #64748b; }
.module-page[data-theme="dark"] .hpp-val { color: #94a3b8; }
.margin-chip { margin-left: auto; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 999px; }
.chip-profit { background: rgba(5,150,105,0.12); color: #059669; }
.chip-loss   { background: rgba(220,38,38,0.1); color: #dc2626; }

.bundle-stock { display: flex; align-items: center; gap: 0.375rem; margin-top: 0.625rem; padding-top: 0.625rem; border-top: 1px solid #f1f5f9; font-size: 0.78rem; font-weight: 600; }
.stock-ok { color: #059669; }
.stock-low { color: #ef4444; }
.module-page[data-theme="dark"] .bundle-stock { border-top-color: #334155; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 0.625rem; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4); }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-ghost { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
.module-page[data-theme="dark"] .btn-ghost { background: #334155; color: #cbd5e1; border-color: #475569; }
.btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }

.action-btn { width: 2rem; height: 2rem; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; }
.module-page[data-theme="dark"] .action-btn { background: #334155; border-color: #475569; color: #94a3b8; }
.action-btn.edit:hover { border-color: #6366f1; color: #6366f1; }
.action-btn.danger:hover { border-color: #ef4444; color: #ef4444; }

/* Loading / empty */
.state-loading { grid-column: 1/-1; display: flex; align-items: center; gap: 1rem; justify-content: center; padding: 4rem; color: #64748b; }
.spinner-ring { width: 1.5rem; height: 1.5rem; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
.spinner-sm { width: 0.9rem; height: 0.9rem; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
.empty-state { grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 4rem; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; }
.modal-box { background: #fff; border-radius: 24px; width: 100%; max-width: 520px; box-shadow: 0 25px 80px rgba(0,0,0,0.25); overflow: hidden; }
.modal-lg { max-width: 640px; }
.modal-sm { max-width: 420px; }
.module-page[data-theme="dark"] .modal-box { background: #1e293b; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.75rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .modal-header { background: #0f172a; border-bottom-color: #334155; }
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 700; color: #1e293b; margin: 0; }
.module-page[data-theme="dark"] .modal-title { color: #f1f5f9; }
.danger-title { color: #ef4444; }
.modal-close { width: 2.25rem; height: 2.25rem; border: none; background: #fff; border-radius: 10px; cursor: pointer; font-size: 1.5rem; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
.module-page[data-theme="dark"] .modal-close { background: #334155; color: #94a3b8; }
.modal-close:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
.modal-form { padding: 2rem; max-height: 74vh; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.875rem; padding: 1.25rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.module-page[data-theme="dark"] .modal-footer { background: #0f172a; border-top-color: #334155; }

/* Form */
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-label { font-size: 0.825rem; font-weight: 600; color: #475569; }
.module-page[data-theme="dark"] .form-label { color: #cbd5e1; }
.req { color: #ef4444; }
.input-field { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; color: #1e293b; font-size: 0.9rem; transition: all 0.3s; outline: none; font-weight: 500; width: 100%; box-sizing: border-box; }
.input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.module-page[data-theme="dark"] .input-field { background: #0f172a; border-color: #334155; color: #f1f5f9; }

/* Image upload */
.image-upload-area {
  border: 2px dashed #c7d2fe;
  border-radius: 14px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 130px;
  background: rgba(99,102,241,0.03);
  position: relative;
}
.image-upload-area:hover { border-color: #6366f1; background: rgba(99,102,241,0.07); }
.module-page[data-theme="dark"] .image-upload-area { border-color: #4f46e5; background: rgba(99,102,241,0.05); }
.image-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: #94a3b8; text-align: center; }
.image-placeholder svg { color: #c7d2fe; }
.image-placeholder span { font-size: 0.85rem; font-weight: 500; }
.upload-hint { font-size: 0.72rem !important; font-weight: 400 !important; color: #c4c9d1 !important; }
.image-preview { max-width: 100%; max-height: 160px; object-fit: cover; border-radius: 10px; display: block; }
.hidden-file-input { display: none; }
.btn-remove-image { margin-top: 0.5rem; padding: 0.35rem 0.875rem; border-radius: 999px; border: 1.5px solid rgba(239,68,68,0.4); background: rgba(239,68,68,0.06); color: #ef4444; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.25rem; }
.btn-remove-image:hover { background: rgba(239,68,68,0.12); }

/* Comp row */
.comp-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: flex-start; }
.comp-combobox-wrap { flex: 3; min-width: 0; }
.comp-right { flex: 1.5; display: flex; flex-direction: column; gap: 0.25rem; min-width: 90px; }
.comp-qty { min-width: 70px; text-align: center; }
.comp-hpp-hint { font-size: 0.7rem; color: #94a3b8; text-align: center; font-weight: 500; }
.comp-remove { width: 2rem; height: 2rem; border-radius: 8px; border: 1.5px solid #fecaca; background: rgba(239,68,68,0.05); color: #ef4444; font-size: 1.2rem; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-top: 0.75rem; }
.comp-remove:hover { background: #ef4444; color: #fff; }
.btn-add-comp { padding: 0.5rem 1rem; border: 2px dashed #e2e8f0; border-radius: 10px; background: transparent; color: #6366f1; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-bottom: 0.5rem; }
.btn-add-comp:hover { border-color: #6366f1; background: rgba(99,102,241,0.05); }

/* HPP Section */
.hpp-section {
  background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06));
  border: 1.5px solid rgba(99,102,241,0.2);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
}
.hpp-row { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.hpp-stat { display: flex; flex-direction: column; gap: 0.25rem; }
.hpp-stat-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.hpp-stat-val { font-size: 1.05rem; font-weight: 800; color: #1e293b; }
.module-page[data-theme="dark"] .hpp-stat-val { color: #f1f5f9; }
.hpp-val-color { color: #6366f1 !important; }

/* Loss Alert / Profit Preview */
.bundle-loss-alert {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  background: rgba(239,68,68,0.08);
  border: 1.5px solid rgba(239,68,68,0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  color: #dc2626;
}
.bundle-loss-alert p { margin: 0.25rem 0 0; font-size: 0.83rem; }
.bundle-loss-alert strong { font-size: 0.9rem; }

.bundle-profit-preview {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  background: rgba(5,150,105,0.08);
  border: 1.5px solid rgba(5,150,105,0.25);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: #059669;
  margin-bottom: 0.75rem;
}

.readonly-val { padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: #f8fafc; color: #64748b; font-size: 0.9rem; font-weight: 600; }
.module-page[data-theme="dark"] .readonly-val { background: #0f172a; border-color: #334155; color: #94a3b8; }

.form-hint { font-size: 0.76rem; color: #64748b; margin-bottom: 0.5rem; }
.form-error { color: #dc2626; font-size: 0.825rem; background: rgba(239,68,68,0.1); border-radius: 10px; padding: 0.75rem; margin-bottom: 0.5rem; }

.confirm-text { padding: 1.75rem 2rem; font-size: 0.925rem; color: #475569; line-height: 1.7; text-align: center; }
.module-page[data-theme="dark"] .confirm-text { color: #cbd5e1; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
