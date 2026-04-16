<template>
  <div class="module-page" :data-theme="theme">
    
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="page-header">
      <div class="header-content">
        <div class="breadcrumb">
          <span>Master Data</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span>Produk</span>
        </div>
        <h1 class="page-title">Manajemen Produk</h1>
        <p class="page-subtitle">{{ store.products.length }} produk terdaftar dalam katalog Anda</p>
      </div>
      <button class="btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Tambah Produk
      </button>
    </header>

    <!-- ── Toolbar ───────────────────────────────────────────────────────── -->
    <div class="toolbar">
      <div class="search-wrap">
        <input 
          v-model="store.filters.searchTerm" 
          @input="store.setSearchFilter($event.target.value)" 
          class="input-field search-input" 
          type="text" 
          placeholder="Cari Produk atau SKU..." 
        />
      </div>
      <div class="filter-row">
        <button 
          class="filter-pill" 
          :class="{ active: !store.filters.category }" 
          @click="store.setCategoryFilter(null)" 
        >
          <span class="pill-dot"></span>
          Semua
        </button>
        <button
          v-for="cat in store.categories"
          :key="cat.id"
          class="filter-pill"
          :class="{ active: store.filters.category === cat.name }"
          @click="store.setCategoryFilter(cat.name)"
        >
          <span class="pill-dot"></span>
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- ── Table ─────────────────────────────────────────────────────────── -->
    <div class="table-card">
      <div v-if="store.loading" class="state-loading">
        <div class="loader-wrapper">
          <span class="spinner-ring"></span>
          <div class="loader-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
        <span>Memuat data produk...</span>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th class="th-product">Produk</th>
            <th class="th-sku">SKU</th>
            <th class="th-category">Kategori</th>
            <th class="th-price">Harga Jual</th>
            <th class="th-hpp">HPP</th>
            <th class="th-margin">Margin</th>
            <th class="th-stock">Stok</th>
            <th class="th-status">Status</th>
            <th class="th-actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.filteredProducts.length === 0">
            <td colspan="9" class="empty-row">
              <div class="empty-visual">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <p>Tidak ada produk yang ditemukan</p>
              <span class="empty-hint">Coba ubah kata kunci atau filter kategori</span>
            </td>
          </tr>
          <tr v-for="product in store.filteredProducts" :key="product.id" class="table-row">
            <td>
              <div class="cell-product">
                <div class="product-avatar" :style="{ background: getProductColor(product.name) }">
                  <span class="product-emoji">{{ productEmoji(product) }}</span>
                </div>
                <div class="product-details">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-id">ID: #{{ product.id.toString().slice(-4) }}</span>
                </div>
              </div>
            </td>
            <td><code class="sku-code">{{ product.sku || '—' }}</code></td>
            <td><span class="cat-chip">{{ product.category?.name || '—' }}</span></td>
            <td class="col-price">
              <div class="price-cell">
                <span>Rp {{ fmt(store.getActivePrice(product.id)?.price ?? product.sellingPrice) }}</span>
              </div>
            </td>
            <td class="col-hpp">
              <span :class="product.hpp > (product.sellingPrice ?? product.price ?? 0) ? 'hpp-loss' : ''">
                Rp {{ fmt(product.hpp) }}
              </span>
            </td>
            <!-- C7: Margin column -->
            <td class="col-margin">
              <span class="margin-pill" :class="marginClass(store.profitMargin(product.id))">
                {{ store.profitMargin(product.id) }}%
              </span>
            </td>
            <td class="col-stock"><span :class="stockClass(product)" class="stock-value">{{ product.stock }}</span></td>
            <td>
              <span class="status-badge" :class="stockBadgeClass(product)">
                {{ product.stock === 0 ? 'Habis' : product.isLowStock ? 'Menipis' : 'Tersedia' }}
              </span>
            </td>
            <td class="col-actions">
              <button class="action-btn history" @click="openPriceHistory(product)" title="Riwayat Harga">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </button>
              <button class="action-btn edit" @click="openModal(product)" title="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn danger" @click="confirmDelete(product)" title="Hapus">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <AppPagination 
        :current-page="store.pagination.page"
        :total-pages="store.pagination.totalPages"
        :limit="store.pagination.limit"
        :total-items="store.pagination.totalItems"
        @page-change="(p) => store.fetchProducts({ page: p })"
      />
    </div>
    <!-- ── Modal: Add / Edit ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box modal-lg">
            <div class="modal-header">
              <div class="header-text">
                <h2 class="modal-title">{{ editTarget ? 'Edit Produk' : 'Tambah Produk Baru' }}</h2>
                <p class="modal-subtitle">{{ editTarget ? 'Perbarui informasi produk' : 'Isi formulir untuk menambahkan produk ke katalog' }}</p>
              </div>
              <button class="modal-close" @click="closeModal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-form">
              <div class="form-grid">
                <div class="form-group span-2">
                  <label class="form-label">
                    Nama Produk
                    <span class="required">*</span>
                  </label>
                  <input 
                    v-model="form.name" 
                    class="input-field" 
                    :class="{ 'input-error': touched.name && fieldErrors.name }"
                    type="text" 
                    placeholder="Contoh: Nasi Goreng Spesial" 
                    maxlength="100"
                    @blur="touched.name = true"
                    @input="fieldErrors.name = ''"
                  />
                  <span v-if="touched.name && fieldErrors.name" class="field-error">{{ fieldErrors.name }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">SKU <span class="required">*</span></label>
                  <input 
                    v-model="form.sku" 
                    class="input-field" 
                    :class="{ 'input-error': touched.sku && fieldErrors.sku }"
                    type="text" 
                    placeholder="MKN-001"
                    maxlength="100"
                    @blur="touched.sku = true"
                    @input="fieldErrors.sku = ''"
                  />
                  <span v-if="touched.sku && fieldErrors.sku" class="field-error">{{ fieldErrors.sku }}</span>
                  <span v-else class="field-hint">Kode unik, tanpa spasi</span>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    Kategori
                    <span class="required">*</span>
                  </label>
                  <AppCombobox
                    v-model="form.categoryId"
                    :options="store.categories"
                    option-key="id"
                    option-label="name"
                    placeholder="-- Pilih Kategori --"
                    search-placeholder="Cari Kategori..."
                    :clearable="false"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    Harga Jual (Rp)
                    <span class="required">*</span>
                  </label>
                  <div class="input-with-prefix">
                    <span class="prefix">Rp</span>
                    <input 
                      v-model.number="form.price" 
                      class="input-field" 
                      :class="{ 'input-error': touched.price && fieldErrors.price }"
                      type="number" 
                      min="1" 
                      placeholder="25000"
                      @blur="touched.price = true"
                      @input="fieldErrors.price = ''"
                    />
                  </div>
                  <span v-if="touched.price && fieldErrors.price" class="field-error">{{ fieldErrors.price }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Upload Gambar</label>
                  <input 
                    type="file" 
                    accept=".jpg,.jpeg,.png,.webp" 
                    class="input-field input-file" 
                    @change="onImageChange"
                  />
                  <span v-if="fieldErrors.imageFile" class="field-error">{{ fieldErrors.imageFile }}</span>
                  <span v-else-if="form.imagePreview" class="field-hint">Gambar dipilih ✓</span>
                  <span v-else class="field-hint">JPG, PNG, atau WebP. Maks. 2MB</span>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    Stok Awal
                    <span class="required">*</span>
                  </label>
                  <input 
                    v-model.number="form.stock" 
                    class="input-field" 
                    type="number" 
                    min="0" 
                    placeholder="50" 
                    required 
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Batas Stok Rendah</label>
                  <input 
                    v-model.number="form.lowStockThreshold" 
                    class="input-field" 
                    :class="{ 'input-error': touched.lowStockThreshold && fieldErrors.lowStockThreshold }"
                    type="number" 
                    min="0" 
                    placeholder="10" 
                    @blur="touched.lowStockThreshold = true"
                    @input="fieldErrors.lowStockThreshold = ''"
                  />
                  <span v-if="touched.lowStockThreshold && fieldErrors.lowStockThreshold" class="field-error">{{ fieldErrors.lowStockThreshold }}</span>
                  <span v-else class="field-hint">Notifikasi saat stok ≤ nilai ini</span>
                </div>
              </div>
              

              
              <div v-if="formError" class="form-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{{ formError }}</span>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading || !isValid">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  {{ editTarget ? 'Simpan Perubahan' : 'Tambah Produk' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ── Modal: Delete ─────────────────────────────────────────────────── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
          <div class="modal-box modal-sm modal-danger">
            <div class="modal-header modal-header-danger">
              <div class="danger-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="header-text">
                <h2 class="modal-title danger-title">Hapus Produk?</h2>
                <p class="modal-subtitle">Tindakan ini tidak dapat dibatalkan</p>
              </div>
              <button class="modal-close" @click="deleteTarget = null">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body-danger">
              <p class="confirm-text">
                Produk <strong>"{{ deleteTarget.name }}"</strong> akan dihapus permanen dari sistem.
              </p>
              <div class="confirm-details">
                <span class="detail-item">SKU: <code>{{ deleteTarget.sku || '—' }}</code></span>
                <span class="detail-item">Stok: <strong>{{ deleteTarget.stock }}</strong></span>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="deleteTarget = null">Batal</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span>
                Ya, Hapus Produk
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ── Modal: Price History ──────────────────────────────────────────── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="priceHistoryTarget" class="modal-overlay" @click.self="priceHistoryTarget = null">
          <div class="modal-box">
            <div class="modal-header">
              <div class="header-text">
                <h2 class="modal-title">Riwayat Harga</h2>
                <p class="modal-subtitle">{{ priceHistoryTarget.name }}</p>
              </div>
              <button class="modal-close" @click="priceHistoryTarget = null">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="history-list">
              <div v-if="priceHistoryList.length === 0" class="history-empty">Belum ada riwayat perubahan harga.</div>
              <div v-for="h in priceHistoryList" :key="h.id" class="history-item" :class="{ active: h.is_active }">
                <div class="history-price">
                  <span class="h-price">Rp {{ fmt(h.price) }}</span>
                  <span v-if="h.is_active" class="h-active-badge">Aktif</span>
                </div>
                <div class="history-meta">
                  <span v-if="h.previousPrice" class="h-prev">sebelumnya: Rp {{ fmt(h.previousPrice) }}</span>
                  <span class="h-date">{{ fmtDate(h.effectiveDate) }}</span>
                </div>
              </div>
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
import { usePricelistStore } from '@/stores/pricelist'
import AppCombobox from '@/components/AppCombobox.vue'
import AppPagination from '@/components/AppPagination.vue'
import { validateAll, validate, isFormValid, rules } from '@/utils/validators'

const store = useProductsStore()
const pricelistStore = usePricelistStore()
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
window.addEventListener('nextore-theme-change', (e) => { theme.value = e.detail })

const activeTab = ref('products')

const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const formError = ref('')
const priceHistoryTarget = ref(null)
const priceHistoryList = ref([])

const form = reactive({ name: '', sku: '', categoryId: '', price: null, stock: null, lowStockThreshold: 10, imageFile: null, imagePreview: false })
const fieldErrors = reactive({ name: '', sku: '', price: '', imageFile: '', lowStockThreshold: '' })
const touched = reactive({ name: false, sku: false, price: false, lowStockThreshold: false })

const productValidationRules = () => ({
  name: {
    value: form.name.trim(),
    rules: [
      rules.required('Nama produk wajib diisi.'),
      rules.minLength(3, 'Nama produk minimal 3 karakter.'),
      rules.maxLength(100, 'Nama produk maksimal 100 karakter.'),
    ],
  },
  sku: {
    value: form.sku.trim(),
    rules: [
      rules.required('SKU wajib diisi.'),
      rules.minLength(3, 'SKU minimal 3 karakter.'),
      rules.maxLength(100, 'SKU maksimal 100 karakter.'),
      rules.pattern(/^\S+$/, 'SKU tidak boleh mengandung spasi.'),
    ],
  },
  price: {
    value: form.price,
    rules: [
      rules.required('Harga jual wajib diisi.'),
      rules.minValue(1, 'Harga jual harus lebih dari 0.'),
    ],
  },
  lowStockThreshold: {
    value: form.lowStockThreshold,
    rules: [
      rules.minValue(0, 'Batas stok rendah minimal 0.'),
    ],
  },
})

const isValid = computed(() => isFormValid(productValidationRules()))

onMounted(async () => {
  await Promise.all([
    store.fetchProducts(),
    store.fetchCategories(),
    pricelistStore.fetchPricelists(),
  ])
})

const fmt = (n) => (n ?? 0).toLocaleString('id-ID')

const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

const onImageChange = (e) => {
  const file = e.target.files?.[0]
  fieldErrors.imageFile = ''
  if (file) {
    // Validate type
    const typeErr = validate(file, [rules.fileType(ALLOWED_IMAGE_EXTS, 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.')])
    if (typeErr) { fieldErrors.imageFile = typeErr; form.imageFile = null; form.imagePreview = false; return }
    // Validate size
    const sizeErr = validate(file, [rules.fileSize(MAX_IMAGE_SIZE, 'Ukuran gambar maks. 2MB.')])
    if (sizeErr) { fieldErrors.imageFile = sizeErr; form.imageFile = null; form.imagePreview = false; return }
    form.imageFile = file
    form.imagePreview = true
  }
}

const productEmoji = (p) => {
  const cat = p.category?.name?.toLowerCase() || ''
  if (cat.includes('minum')) return '🥤'
  if (cat.includes('snack') || cat.includes('camil')) return '🍟'
  if (cat.includes('dessert') || cat.includes('kue')) return '🍰'
  return '🍽️'
}

const stockClass = (p) => p.stock === 0 ? 'stock-out' : p.isLowStock ? 'stock-low' : 'stock-ok'
const stockBadgeClass = (p) => p.stock === 0 ? 'badge-danger' : p.isLowStock ? 'badge-warning' : 'badge-success'

const openModal = (product = null) => {
  editTarget.value = product
  formError.value = ''
  if (product) {
    Object.assign(form, { name: product.name, sku: product.sku || '', categoryId: product.categoryId || '', price: product.sellingPrice ?? product.price, stock: product.stock, lowStockThreshold: product.lowStockThreshold ?? 10, imageFile: null, imagePreview: false })
  } else {
    Object.assign(form, { name: '', sku: '', categoryId: '', price: null, stock: null, lowStockThreshold: 10, imageFile: null, imagePreview: false })
  }
  Object.assign(fieldErrors, { name: '', sku: '', price: '', imageFile: '', lowStockThreshold: '' })
  Object.assign(touched, { name: false, sku: false, price: false, lowStockThreshold: false })
  showModal.value = true
}

const closeModal = () => { showModal.value = false; editTarget.value = null }

const handleSubmit = async () => {
  formError.value = ''
  // Mark all touched
  Object.keys(touched).forEach(k => touched[k] = true)

  // ── Per-field validation ──
  const { valid, errors } = validateAll(productValidationRules())
  Object.assign(fieldErrors, errors)
  if (!valid) return

  const payload = {
    name: form.name.trim(), sku: form.sku.trim(), categoryId: form.categoryId,
    price: form.price, stock: form.stock ?? 0,
    lowStockThreshold: form.lowStockThreshold ?? 10,
  }
  if (form.imageFile) payload.imageFile = form.imageFile
  const result = editTarget.value
    ? await store.updateProduct(editTarget.value.id, payload)
    : await store.addProduct(payload)
  if (result.success) {
    closeModal()
  } else {
    formError.value = result.message
  }
}

const confirmDelete = (product) => { deleteTarget.value = product }
const handleDelete = async () => {
  const result = await store.deleteProduct(deleteTarget.value.id)
  if (result.success) deleteTarget.value = null
}

const getProductColor = (name) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#14b8a6', '#06b6d4', '#84cc16']
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return colors[index]
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const openPriceHistory = (product) => {
  priceHistoryTarget.value = product
  priceHistoryList.value = store.getPriceHistory(product.id)
}

// C7: Margin classification helper
const marginClass = (pct) => {
  if (pct >= 25) return 'margin-good'
  if (pct >= 10) return 'margin-moderate'
  return 'margin-low'
}

// ── Pricelist helpers ──────────────────────────────────────────────────────
const getProductHpp = (productId) => {
  const p = store.getProductById(productId)
  return p?.hpp ?? 0
}
const getProductNormalPrice = (productId) => {
  const p = store.getProductById(productId)
  return p?.sellingPrice ?? p?.price ?? 0
}

// ── Pricelist CRUD state ───────────────────────────────────────────────────
const expandedPlId    = ref(null)
const showPlModal     = ref(false)
const plEditTarget    = ref(null)
const plFormError     = ref('')
const plForm          = reactive({ name: '', description: '' })

const showAddItemModal  = ref(false)
const addItemTargetPl   = ref(null)
const addItemFormError  = ref('')
const addItemForm       = reactive({ productId: '', eventPrice: 0 })

// Products not yet in the target pricelist
const availableProductsForPl = computed(() => {
  if (!addItemTargetPl.value) return store.products
  const existingIds = pricelistStore.getItemsByPricelist(addItemTargetPl.value.id)
    .map(i => i.productId)
  return store.products.filter(p => !existingIds.includes(p.id))
})

const openPlModal = (pl = null) => {
  plEditTarget.value = pl
  plFormError.value = ''
  Object.assign(plForm, { name: pl?.name ?? '', description: pl?.description ?? '' })
  showPlModal.value = true
}

const handlePlSubmit = async () => {
  plFormError.value = ''
  const result = plEditTarget.value
    ? await pricelistStore.updatePricelist(plEditTarget.value.id, { name: plForm.name, description: plForm.description })
    : await pricelistStore.addPricelist({ name: plForm.name, description: plForm.description })
  if (result.success) { showPlModal.value = false }
  else { plFormError.value = result.message }
}

const handleTogglePricelist = async (pl) => {
  if (pl.is_active) {
    if (confirm('Nonaktifkan event ini?')) await pricelistStore.deactivateAll()
  } else {
    if (confirm(`Aktifkan "${pl.name}"? Event lain yang sedang aktif akan dinonaktifkan.`)) {
      await pricelistStore.activatePricelist(pl.id)
    }
  }
}

const handleDeactivateAll = async () => {
  if (confirm('Nonaktifkan semua event?')) await pricelistStore.deactivateAll()
}

const handleDeletePricelist = async (pl) => {
  if (confirm(`Hapus event "${pl.name}"? Semua harga event di dalamnya juga akan dihapus.`)) {
    await pricelistStore.deletePricelist(pl.id)
    if (expandedPlId.value === pl.id) expandedPlId.value = null
  }
}

const openAddItemModal = (pl) => {
  addItemTargetPl.value = pl
  addItemFormError.value = ''
  Object.assign(addItemForm, { productId: '', eventPrice: 0 })
  showAddItemModal.value = true
}

const onAddItemProductSelect = (product) => {
  if (!product) return
  addItemForm.productId = product.id
  // Pre-fill with normal selling price as starting point
  addItemForm.eventPrice = product.sellingPrice ?? product.price ?? 0
}

const handleAddPlItem = async () => {
  addItemFormError.value = ''
  const product = store.getProductById(addItemForm.productId)
  if (!product) { addItemFormError.value = 'Produk tidak valid'; return }
  const result = await pricelistStore.addPricelistItem(
    addItemTargetPl.value.id,
    product,
    addItemForm.eventPrice
  )
  if (result.success) { showAddItemModal.value = false }
  else { addItemFormError.value = result.message }
}

const handleUpdateItemPrice = async (pli, rawValue) => {
  const newPrice = parseInt(rawValue)
  if (isNaN(newPrice) || newPrice < 0) return
  await pricelistStore.updatePricelistItem(pli.id, newPrice)
}

const handleRemovePlItem = async (pli) => {
  if (confirm(`Hapus "${pli.productName}" dari pricelist ini?`)) {
    await pricelistStore.removePricelistItem(pli.id)
  }
}

</script>

<style scoped>
/* C7: Margin pill */
.col-margin { text-align: center; }
.margin-pill {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
}
.margin-good { background: rgba(5,150,105,0.12); color: #059669; }
.margin-moderate { background: rgba(217,119,6,0.12); color: #d97706; }
.margin-low { background: rgba(220,38,38,0.12); color: #dc2626; }

/* C8: Active price badge + HPP loss */
.price-cell { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.price-active-badge {
  font-size: 0.63rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 20px;
  background: rgba(5,150,105,0.12);
  color: #059669;
  letter-spacing: 0.03em;
}
.hpp-loss { color: #dc2626; font-weight: 700; }

/* ── CSS Variables: Fixed Contrast & Color Hierarchy ───────────────────── */
.module-page {
  /* Surface Colors - Proper Hierarchy */
  --surface-base: #ffffff;
  --surface-card: #f8fafc;
  --surface-elevated: #f1f5f9;
  --surface-input: #ffffff;
  
  /* Dark Mode Surfaces - NO Pure White */
  --surface-base-dark: #0f172a;
  --surface-card-dark: #1e293b;
  --surface-elevated-dark: #334155;
  --surface-input-dark: #1e293b;
  
  /* Text Colors - WCAG Compliant */
  --text-primary: #0f172a;
  --text-primary-dark: #f1f5f9;
  --text-secondary: #475569;
  --text-secondary-dark: #cbd5e1;
  --text-tertiary: #94a3b8;
  --text-tertiary-dark: #94a3b8;
  
  /* Border Colors */
  --border-light: #e2e8f0;
  --border-dark: #334155;
  --border-strong: #cbd5e1;
  --border-strong-dark: #475569;
  
  /* Accent Colors */
  --accent: #6366f1;
  --accent-dark: #818cf8;
  --accent-soft: rgba(99, 102, 241, 0.1);
  --accent-soft-dark: rgba(129, 140, 248, 0.15);
  
  /* Status Colors */
  --success: #059669;
  --success-dark: #34d399;
  --success-soft: rgba(5, 150, 105, 0.1);
  --success-soft-dark: rgba(52, 211, 153, 0.15);
  
  --warning: #d97706;
  --warning-dark: #fbbf24;
  --warning-soft: rgba(217, 119, 6, 0.1);
  --warning-soft-dark: rgba(251, 191, 36, 0.15);
  
  --danger: #dc2626;
  --danger-dark: #f87171;
  --danger-soft: rgba(220, 38, 38, 0.1);
  --danger-soft-dark: rgba(248, 113, 113, 0.15);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.12);
  --shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.25);
  --shadow-modal-dark: 0 20px 60px rgba(0, 0, 0, 0.5);
  
  /* Transitions */
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --focus-ring: 0 0 0 3px rgba(99, 102, 241, 0.2);
  --focus-ring-dark: 0 0 0 3px rgba(129, 140, 248, 0.25);
  
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}

/* Dark Mode Overrides */
.module-page[data-theme="dark"] {
  --surface-base: var(--surface-base-dark);
  --surface-card: var(--surface-card-dark);
  --surface-elevated: var(--surface-elevated-dark);
  --surface-input: var(--surface-input-dark);
  
  --text-primary: var(--text-primary-dark);
  --text-secondary: var(--text-secondary-dark);
  --text-tertiary: var(--text-tertiary-dark);
  
  --border-light: var(--border-dark);
  --border-strong: var(--border-strong-dark);
  
  --accent: var(--accent-dark);
  --accent-soft: var(--accent-soft-dark);
  
  --success: var(--success-dark);
  --success-soft: var(--success-soft-dark);
  
  --warning: var(--warning-dark);
  --warning-soft: var(--warning-soft-dark);
  
  --danger: var(--danger-dark);
  --danger-soft: var(--danger-soft-dark);
  
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.4);
  --shadow-modal: var(--shadow-modal-dark);
  --focus-ring: var(--focus-ring-dark);
}

/* ── Layout ─────────────────────────────────────────────────────────────── */
.module-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--surface-base);
  min-height: 100vh;
}

/* ── Page Header ────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.75rem;
  gap: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-light);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.breadcrumb svg {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.page-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

/* ── Toolbar ───────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.search-wrap {
  position: relative;
  max-width: 420px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-ico {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--surface-input);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: var(--transition);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.search-input:hover {
  border-color: var(--border-strong);
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.search-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.filter-row {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border-radius: 999px;
  border: 1.5px solid var(--border-light);
  background: var(--surface-card);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.filter-pill:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.filter-pill.active {
  background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
  border-color: transparent;
  color: #ffffff;
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

.filter-pill.active .pill-dot {
  opacity: 1;
}

/* ── Table Card ─────────────────────────────────────────────────────────── */
.table-card {
  background: var(--surface-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: var(--shadow-md);
}

.state-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--text-tertiary);
}

.loader-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner-ring {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-light);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.loader-dots {
  display: flex;
  gap: 2px;
}

.loader-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 1.4s ease-in-out infinite both;
}

.loader-dots span:nth-child(1) { animation-delay: -0.32s; }
.loader-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes pulse {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Data Table */
.data-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--surface-elevated);
}

.data-table th {
  padding: 0.875rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  text-align: left;
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
}

.data-table th.th-hpp,
.data-table th.th-stock,
.data-table th.th-actions {
  text-align: center;
}

.data-table td {
  padding: 0.875rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  font-size: 0.875rem;
  color: var(--text-primary);
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--surface-elevated);
}

.empty-row {
  text-align: center;
  color: var(--text-tertiary);
  padding: 3rem !important;
}

.empty-visual {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  color: var(--text-tertiary);
}

.empty-row p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.empty-hint {
  font-size: 0.8rem;
  display: block;
}

/* Table Columns */
.th-product { min-width: 240px; }
.th-sku { min-width: 110px; }
.th-category { min-width: 130px; }
.th-price { 
  min-width: 140px; 
  text-align: left;
}
.th-hpp { 
  min-width: 130px; 
  text-align: center;
}
.th-stock { 
  min-width: 80px; 
  text-align: center; 
}
.th-status { min-width: 110px; }
.th-actions { 
  min-width: 90px; 
  text-align: center; 
}

/* Product Cell */
.cell-product {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.product-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  font-size: 1.25rem;
}

.product-emoji {
  transition: transform 0.15s ease;
}

.table-row:hover .product-emoji {
  transform: scale(1.1);
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.product-name {
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.product-id {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

/* SKU Code */
.sku-code {
  background: var(--surface-elevated);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-secondary);
}

/* Category Chip */
.cat-chip {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.2rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Price & HPP */
.col-price {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 700;
  color: var(--accent);
  text-align: left;
  padding: 0.875rem 0.75rem;
  letter-spacing: -0.3px;
}

.col-hpp {
  color: var(--text-secondary);
  font-size: 0.825rem;
  text-align: center;
  padding: 0.875rem 0.5rem;
  font-weight: 500;
}

/* Stock Values */
.stock-value {
  font-weight: 600;
}

.col-stock {
  text-align: center;
}

.col-hpp {
  text-align: center;
}

.stock-ok { color: var(--success); }
.stock-low { color: var(--warning); }
.stock-out { color: var(--danger); }

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-success { background: var(--success-soft); color: var(--success); }
.badge-warning { background: var(--warning-soft); color: var(--warning); }
.badge-danger { background: var(--danger-soft); color: var(--danger); }

/* Action Buttons */
.col-actions {
  white-space: nowrap;
}

.action-btn {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: var(--transition);
  margin-left: 0.25rem;
}

.action-btn.edit:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.action-btn.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: var(--danger-soft);
}

/* ── Modal System - IMPROVED CONTRAST ───────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75); /* Increased from 0.5 to 0.75 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(8px); /* Increased blur */
}

.modal-box {
  background: #ffffff; /* Solid white for light mode */
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 680px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35); /* Stronger shadow */
  overflow: hidden;
  animation: modalIn 0.25s ease forwards;
  border: 1px solid #e2e8f0; /* Solid border */
}

.module-page[data-theme="dark"] .modal-box {
  background: #1e293b; /* Solid dark for dark mode */
  border-color: #334155;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
  border-bottom: 2px solid #e2e8f0; /* Thicker border */
  background: #f8fafc; /* Solid background */
}

.module-page[data-theme="dark"] .modal-header {
  background: #0f172a;
  border-bottom-color: #334155;
}

.modal-header-danger {
  background: #fef2f2; /* More visible danger background */
  border-bottom-color: #dc2626;
}

.module-page[data-theme="dark"] .modal-header-danger {
  background: #450a0a;
  border-bottom-color: #f87171;
}

.modal-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.35rem; /* Slightly larger */
  font-weight: 700;
  color: #0f172a; /* Ensure dark text */
  margin: 0 0 0.25rem 0;
}

.module-page[data-theme="dark"] .modal-title {
  color: #f1f5f9;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #475569; /* Better contrast */
  margin: 0;
}

.module-page[data-theme="dark"] .modal-subtitle {
  color: #cbd5e1;
}

.modal-form {
  padding: 1.75rem;
  max-height: 65vh;
  overflow-y: auto;
  background: #ffffff; /* Solid background */
}

.module-page[data-theme="dark"] .modal-form {
  background: #1e293b;
}

/* ── Form Inputs - IMPROVED VISIBILITY ──────────────────────────────── */
.form-label {
  font-size: 0.85rem;
  font-weight: 700; /* Bolder */
  color: #1e293b; /* Darker text */
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.module-page[data-theme="dark"] .form-label {
  color: #f1f5f9;
}

.required {
  color: #dc2626;
  font-weight: 800;
  font-size: 1rem;
}

.input-field {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0; /* Thicker border */
  border-radius: var(--radius-sm);
  background: #ffffff;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 500;
  transition: var(--transition);
  outline: none;
}

.module-page[data-theme="dark"] .input-field {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.input-field::placeholder {
  color: #94a3b8;
  opacity: 1; /* Full opacity */
}

.input-field:hover {
  border-color: #94a3b8;
}

.input-field:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25); /* Stronger focus ring */
  background: #ffffff;
}

.module-page[data-theme="dark"] .input-field:focus {
  background: #0f172a;
  box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.35);
}

.select-field {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
}

.field-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  font-weight: 500;
}

.module-page[data-theme="dark"] .field-hint {
  color: #94a3b8;
}

/* ── Input with Prefix ───────────────────────────────────────────────── */
.input-with-prefix {
  position: relative;
}

.prefix {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
  pointer-events: none;
}

.module-page[data-theme="dark"] .prefix {
  color: #94a3b8;
}

.input-with-prefix .input-field {
  padding-left: 2.5rem;
}

/* ── Profit Preview - HIGHER CONTRAST ───────────────────────────────── */
.profit-preview {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: #f0fdf4; /* More solid green */
  border: 2px solid #059669; /* Thicker border */
  border-radius: var(--radius-md);
  margin: 1rem 0 1.25rem;
}

.module-page[data-theme="dark"] .profit-preview {
  background: #064e3b;
  border-color: #34d399;
}

.preview-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: #059669;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-page[data-theme="dark"] .preview-icon {
  background: #34d399;
}

.preview-label {
  font-size: 0.85rem;
  color: #374151;
  font-weight: 600;
}

.module-page[data-theme="dark"] .preview-label {
  color: #d1fae5;
}

.preview-value {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 700;
  color: #059669;
  font-size: 1.05rem;
}

.module-page[data-theme="dark"] .preview-value {
  color: #34d399;
}

.preview-percent {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  opacity: 1;
  color: #059669;
  font-weight: 600;
}

.module-page[data-theme="dark"] .preview-percent {
  color: #34d399;
}

/* ── Form Error - MORE VISIBLE ──────────────────────────────────────── */
.form-error {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border: 2px solid #dc2626;
  border-left: 5px solid #dc2626;
  border-radius: var(--radius-sm);
  color: #991b1b;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.module-page[data-theme="dark"] .form-error {
  background: #450a0a;
  border-color: #f87171;
  color: #fecaca;
}

/* ── Modal Footer - SOLID BACKGROUND ────────────────────────────────── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.875rem;
  padding: 1.25rem 1.75rem;
  border-top: 2px solid #e2e8f0;
  background: #f8fafc;
}

.module-page[data-theme="dark"] .modal-footer {
  background: #0f172a;
  border-top-color: #334155;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  letter-spacing: 0.02em;
}

.btn-ghost {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
}

.module-page[data-theme="dark"] .btn-ghost {
  background: #1e293b;
  border-color: #475569;
  color: #cbd5e1;
}

.btn-ghost:hover {
  border-color: #64748b;
  color: #1e293b;
  background: #f1f5f9;
}

.module-page[data-theme="dark"] .btn-ghost:hover {
  background: #334155;
  color: #f1f5f9;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-danger {
  background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
}

/* ── Modal Close Button ─────────────────────────────────────────────── */
.modal-close {
  width: 2.25rem;
  height: 2.25rem;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.module-page[data-theme="dark"] .modal-close {
  background: #1e293b;
  border-color: #475569;
  color: #94a3b8;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.module-page[data-theme="dark"] .modal-close:hover {
  background: #334155;
  color: #f1f5f9;
}

/* ── Delete Modal Specific ──────────────────────────────────────────── */
.danger-icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #dc2626;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.module-page[data-theme="dark"] .danger-icon-wrapper {
  background: #ef4444;
}

.confirm-details {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f1f5f9;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  border: 2px solid #e2e8f0;
}

.module-page[data-theme="dark"] .confirm-details {
  background: #1e293b;
  border-color: #334155;
}

.detail-item {
  display: flex;
  gap: 0.375rem;
  color: #475569;
  font-weight: 600;
}

.module-page[data-theme="dark"] .detail-item {
  color: #cbd5e1;
}

.detail-item code {
  background: #ffffff;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  font-weight: 600;
}

.module-page[data-theme="dark"] .detail-item code {
  background: #0f172a;
  color: #f1f5f9;
  border-color: #334155;
}

.detail-item strong {
  color: #0f172a;
}

.module-page[data-theme="dark"] .detail-item strong {
  color: #f1f5f9;
}

.btn-danger {
  background: linear-gradient(135deg, var(--danger) 0%, #f97316 100%);
  color: #ffffff;
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.spinner-sm {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 0.375rem;
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  transform: scale(0.96) translateY(8px);
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .module-page {
    padding: 1.25rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .search-wrap {
    flex-direction: column;
    align-items: flex-start;
    max-width: 100%;
  }
  
  .search-hint {
    margin-top: 0.25rem;
  }
  
  .filter-row {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
  }
  
  .modal-box {
    max-width: 100%;
    margin: 0.5rem;
  }
  
  .modal-form {
    max-height: 55vh;
  }
}

/* ── Scrollbar Styling ──────────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* ── Animations ─────────────────────────────────────────────────────────── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.table-row {
  animation: fadeIn 0.3s ease forwards;
}

.table-row:nth-child(1) { animation-delay: 0.03s; }
.table-row:nth-child(2) { animation-delay: 0.06s; }
.table-row:nth-child(3) { animation-delay: 0.09s; }
.table-row:nth-child(4) { animation-delay: 0.12s; }
.table-row:nth-child(5) { animation-delay: 0.15s; }

/* Loss Alert */
.loss-alert { display: flex; gap: 0.75rem; padding: 1rem 1.25rem; background: rgba(239,68,68,0.08); border: 1.5px solid rgba(239,68,68,0.2); border-radius: var(--radius-md); color: #dc2626; margin-top: 0.5rem; }
.loss-alert svg { flex-shrink: 0; margin-top: 2px; }
.loss-alert-text { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.825rem; line-height: 1.5; }
.loss-alert-text strong { font-weight: 700; }

/* Price History Modal */
.history-list { padding: 1.5rem 2rem 2rem; max-height: 400px; overflow-y: auto; }
.history-empty { text-align: center; color: var(--text-tertiary); padding: 2rem; font-size: 0.875rem; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1rem; border: 1.5px solid var(--border-light); border-radius: var(--radius-md); margin-bottom: 0.75rem; transition: var(--transition); }
.history-item.active { border-color: var(--accent); background: var(--accent-soft); }
.history-price { display: flex; align-items: center; gap: 0.625rem; }
.h-price { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
.h-active-badge { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; background: var(--accent); color: #fff; text-transform: uppercase; letter-spacing: 0.04em; }
.history-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
.h-prev { font-size: 0.75rem; color: var(--text-tertiary); }
.h-date { font-size: 0.72rem; color: var(--text-tertiary); }

.action-btn.history { color: #6366f1; }
.action-btn.history:hover { background: rgba(99,102,241,0.12); }

/* ── Input File & Field Hint ── */
.input-file {
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.85rem;
}
.input-file::-webkit-file-upload-button {
  padding: 0.35rem 0.875rem;
  border-radius: 8px;
  border: 1.5px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  margin-right: 0.75rem;
}
.field-hint { font-size: 0.78rem; color: var(--success, #059669); font-weight: 500; }

/* ── Tab Navigation ─────────────────────────────────────────────────── */
.page-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid var(--border-light);
  margin-bottom: 1.5rem;
}
.page-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -2px;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: var(--transition);
}
.page-tab:hover { color: var(--accent); }
.page-tab.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--accent-soft); }
.tab-badge {
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.07em;
  padding: 0.15rem 0.45rem; border-radius: 999px;
}
.tab-badge.active-event { background: rgba(5,150,105,0.15); color: #059669; }

/* ── Pricelist Panel ────────────────────────────────────────────────── */
.pl-panel { padding-top: 0.5rem; }
.pl-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 0;
}
.pl-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.25rem; }
.pl-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }

.pl-active-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--success-soft);
  color: var(--success);
  font-size: 0.875rem;
  font-weight: 500;
}
.pl-deactivate-btn {
  margin-left: auto;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  border: 1.5px solid currentColor;
  background: transparent;
  color: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.pl-deactivate-btn:hover { background: var(--success); color: #fff; border-color: var(--success); }

/* ── Toggle Switch ──────────────────────────────────────────────────── */
.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-right: 0.5rem;
}
.toggle-switch input { display: none; }
.toggle-slider {
  position: relative;
  display: inline-block;
  width: 38px; height: 20px;
  background: var(--border-strong);
  border-radius: 999px;
  transition: var(--transition);
}
.toggle-slider::after {
  content: '';
  position: absolute;
  top: 3px; left: 3px;
  width: 14px; height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: var(--transition);
}
.toggle-switch input:checked + .toggle-slider { background: var(--success); }
.toggle-switch input:checked + .toggle-slider::after { transform: translateX(18px); }

/* ── Pricelist Items expanded row ───────────────────────────────────── */
.pl-items-row td { padding: 0 !important; }
.pl-items-cell {
  padding: 1rem 1.5rem !important;
  background: var(--surface-elevated);
  border-top: 1px solid var(--border-light);
}
.pl-items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.pl-items-title { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
.btn-add-item {
  padding: 0.35rem 0.875rem;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.btn-add-item:hover { background: var(--accent); color: #fff; }

.pl-items-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.pl-items-table th { padding: 0.5rem 0.75rem; text-align: left; color: var(--text-tertiary); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-light); }
.pl-items-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-light); color: var(--text-primary); vertical-align: middle; }
.pl-items-table tr:last-child td { border-bottom: none; }

/* ── Event price input ──────────────────────────────────────────────── */
.event-price-input { display: flex; align-items: center; gap: 0.35rem; }
.input-sm { width: 110px !important; padding: 0.35rem 0.6rem !important; font-size: 0.83rem !important; }
.input-loss { border-color: var(--danger) !important; background: var(--danger-soft) !important; }

/* ── Loss Alert ─────────────────────────────────────────────────────── */
.loss-alert {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--danger);
  background: var(--danger-soft);
  border: 1px solid rgba(220,38,38,0.25);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
}
.loss-alert-form {
  display: block;
  margin-top: 0.5rem;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-sm);
  border-radius: var(--radius-md);
  font-size: 0.825rem;
  white-space: normal;
}
.safe-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--success);
  background: var(--success-soft);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

/* ── HPP Info ───────────────────────────────────────────────────────── */
.hpp-info {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-elevated);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
}
</style>