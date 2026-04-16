import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import apiClient from '@/api/client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

import { useCategoriesStore } from './categories'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Makanan', description: 'Produk makanan', hasExpiry: true },
  { id: 'cat-2', name: 'Minuman', description: 'Produk minuman', hasExpiry: true },
  { id: 'cat-3', name: 'Snack', description: 'Camilan ringan', hasExpiry: false },
  { id: 'cat-4', name: 'Dessert', description: 'Pencuci mulut dan es krim', hasExpiry: true },
]

let MOCK_PRODUCTS = [
  { id: 'prod-1', sku: 'MKN-001', name: 'Nasi Goreng Spesial', price: 25000, hpp: 12000, stock: 50, lowStockThreshold: 10, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Makanan' }, type: 'SINGLE', images: [] },
  { id: 'prod-2', sku: 'MKN-002', name: 'Mie Ayam Bakso', price: 18000, hpp: 8500, stock: 40, lowStockThreshold: 10, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Makanan' }, type: 'SINGLE', images: [] },
  { id: 'prod-3', sku: 'MKN-003', name: 'Ayam Bakar', price: 32000, hpp: 15000, stock: 8, lowStockThreshold: 10, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Makanan' }, type: 'SINGLE', images: [] },
  { id: 'prod-4', sku: 'MNM-001', name: 'Es Teh Manis', price: 5000, hpp: 1500, stock: 100, lowStockThreshold: 20, categoryId: 'cat-2', category: { id: 'cat-2', name: 'Minuman' }, type: 'SINGLE', images: [] },
  { id: 'prod-5', sku: 'MNM-002', name: 'Jus Alpukat', price: 15000, hpp: 7000, stock: 30, lowStockThreshold: 10, categoryId: 'cat-2', category: { id: 'cat-2', name: 'Minuman' }, type: 'SINGLE', images: [] },
  { id: 'prod-6', sku: 'MNM-003', name: 'Kopi Hitam', price: 8000, hpp: 2500, stock: 5, lowStockThreshold: 10, categoryId: 'cat-2', category: { id: 'cat-2', name: 'Minuman' }, type: 'SINGLE', images: [] },
  { id: 'prod-7', sku: 'SNK-001', name: 'Kentang Goreng', price: 12000, hpp: 4500, stock: 25, lowStockThreshold: 10, categoryId: 'cat-3', category: { id: 'cat-3', name: 'Snack' }, type: 'SINGLE', images: [] },
  { id: 'prod-8', sku: 'SNK-002', name: 'Cireng Bumbu', price: 10000, hpp: 3500, stock: 35, lowStockThreshold: 10, categoryId: 'cat-3', category: { id: 'cat-3', name: 'Snack' }, type: 'SINGLE', images: [] },
  // ── Bundle / Paket ──
  {
    id: 'prod-9', sku: 'PKT-001', name: 'Paket Hemat A', price: 35000, hpp: 13500, stock: 99,
    lowStockThreshold: 5, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Makanan' },
    type: 'BUNDLE', images: [],
    bundleItems: [
      { productId: 'prod-1', qty: 1, name: 'Nasi Goreng Spesial' },
      { productId: 'prod-4', qty: 1, name: 'Es Teh Manis' },
    ],
  },
  {
    id: 'prod-10', sku: 'PKT-002', name: 'Paket Combo B', price: 42000, hpp: 19000, stock: 99,
    lowStockThreshold: 5, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Makanan' },
    type: 'BUNDLE', images: [],
    bundleItems: [
      { productId: 'prod-3', qty: 1, name: 'Ayam Bakar' },
      { productId: 'prod-5', qty: 1, name: 'Jus Alpukat' },
    ],
  },
]
let nextMockId = 11

// ─── Mock price history ───────────────────────────────────────────────────────
let MOCK_PRICE_HISTORY = [
  { id: 'ph-1', productId: 'prod-1', price: 25000, is_active: true, effectiveDate: '2026-01-01T00:00:00.000Z' },
  { id: 'ph-2', productId: 'prod-1', price: 22000, is_active: false, effectiveDate: '2025-06-01T00:00:00.000Z' },
]
let nextPriceHistId = 3

// ─── Mock purchase records ────────────────────────────────────────────────────
let MOCK_PURCHASES = []
let nextPurchaseId = 1
// ─────────────────────────────────────────────────────────────────────────────

export const useProductsStore = defineStore('products', () => {
  // State
  const products = ref([])
  const categories = ref([])
  const productPrices = ref([])   // price history records
  const purchaseRecords = ref([]) // purchase / stock-in records
  const loading = ref(false)
  const error = ref(null)
  const lowStockThreshold = ref(parseInt(import.meta.env.VITE_LOW_STOCK_THRESHOLD) || 10)
  const filters = ref({ category: null, searchTerm: '' })
  const pagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false })

  // Computed
  const filteredProducts = computed(() => products.value.filter(product => {
    const matchCategory = !filters.value.category || product.categoryId === filters.value.category || product.category?.name === filters.value.category
    const matchSearch = !filters.value.searchTerm || product.name.toLowerCase().includes(filters.value.searchTerm.toLowerCase()) || product.sku?.toLowerCase().includes(filters.value.searchTerm.toLowerCase())
    return matchCategory && matchSearch
  }))

  const lowStockProducts = computed(() => products.value.filter(p => p.stock <= p.lowStockThreshold))
  const getProductById = (id) => products.value.find(p => p.id === id)
  const getProductBySku = (sku) => products.value.find(p => p.sku === sku)

  // Normalize API → internal (backend sends `price` for selling price)
  const normalizeProduct = (p) => ({
    ...p,
    sellingPrice: p.price ?? p.sellingPrice,
    isLowStock: p.stock <= (p.lowStockThreshold ?? lowStockThreshold.value),
  })

  // ── fetchProducts ──────────────────────────────────────────────────────────
  const fetchProducts = async (params = {}) => {
    loading.value = true
    error.value = null
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      products.value = MOCK_PRODUCTS.map(normalizeProduct)
      categories.value = MOCK_CATEGORIES
      productPrices.value = [...MOCK_PRICE_HISTORY]
      loading.value = false
      return { success: true }
    }
    try {
      const response = await apiClient.get('/products', {
        params: {
          page: params.page ?? pagination.value.page,
          limit: params.limit ?? pagination.value.limit,
          search: params.search || undefined,
          categoryId: params.categoryId || undefined,
        }
      })
      const raw = response.data.data ?? []
      products.value = raw.map(normalizeProduct)
      if (response.data.meta) {
        pagination.value = { ...pagination.value, ...response.data.meta }
      }
      return { success: true }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      error.value = errMsg
      return { success: false, message: errMsg, errors: validationErrors }
    } finally { loading.value = false }
  }

  // ── fetchCategories ────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    if (USE_MOCK) { categories.value = MOCK_CATEGORIES; return { success: true } }
    try {
      const response = await apiClient.get('/categories')
      categories.value = response.data.data ?? []
      return { success: true }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    }
  }

  // ── addProduct  ────────────────────────────────────────────────────────────
  const addProduct = async (payload) => {
    loading.value = true
    // Backend POST /products → multipart/form-data
    // Allowed fields: name, sku, price, lowStockThreshold, categoryId, images
    // HPP & stock diinisialisasi 0 oleh backend, diupdate via POST /stock-batches
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 350))
      const cat = MOCK_CATEGORIES.find(c => c.id === payload.categoryId)
      const newProd = {
        name: payload.name, sku: payload.sku,
        price: payload.price ?? payload.sellingPrice,
        lowStockThreshold: payload.lowStockThreshold,
        categoryId: payload.categoryId,
        id: `prod-${nextMockId++}`, category: cat ?? null,
        type: payload.type || 'SINGLE', images: [], hpp: 0, stock: 0,
      }
      MOCK_PRODUCTS.push(newProd)
      products.value.push(normalizeProduct(newProd))
      loading.value = false
      return { success: true, data: newProd }
    }
    try {
      const fd = new FormData()
      fd.append('name', payload.name)
      fd.append('sku', payload.sku)
      fd.append('price', String(payload.price ?? payload.sellingPrice))
      fd.append('lowStockThreshold', String(payload.lowStockThreshold ?? 0))
      if (payload.categoryId) fd.append('categoryId', payload.categoryId)
      // Append image files (File objects from <input type="file">)
      if (Array.isArray(payload.images)) {
        payload.images.forEach(file => fd.append('images', file))
      }
      const res = await apiClient.post('/products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const created = res.data.data ?? res.data
      products.value.push(normalizeProduct(created))
      return { success: true, data: created }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    } finally { loading.value = false }
  }

  // ── updateProduct ──────────────────────────────────────────────────────────
  const updateProduct = async (productId, updates) => {
    loading.value = true
    error.value = null

    // Strip fields the backend controls — HPP, stock, totalStock, hppAverage
    // HPP must only change via POST /stock-batches (weighted-average)
    let hppWarning = false
    const safeUpdates = { ...updates }
    for (const forbidden of ['hpp', 'hppAverage', 'stock', 'totalStock', 'initialQuantity']) {
      if (forbidden in safeUpdates) {
        if (forbidden === 'hpp') hppWarning = true
        delete safeUpdates[forbidden]
      }
    }
    if (hppWarning && import.meta.env.DEV) {
      console.warn('[Products] updateProduct: HPP field stripped — gunakan POST /stock-batches untuk mengubah HPP via weighted average.')
    }

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      const idx = products.value.findIndex(p => p.id === productId)
      const mockIdx = MOCK_PRODUCTS.findIndex(p => p.id === productId)
      if (idx !== -1) {
        const cat = MOCK_CATEGORIES.find(c => c.id === safeUpdates.categoryId)
        const merged = { ...products.value[idx], ...safeUpdates, price: safeUpdates.price ?? safeUpdates.sellingPrice, category: cat ?? products.value[idx].category }
        products.value[idx] = normalizeProduct(merged)
        if (mockIdx !== -1) MOCK_PRODUCTS[mockIdx] = merged
      }
      loading.value = false
      return { success: true, hppWarning }
    }
    try {
      // Backend PUT /products/{id} → multipart/form-data
      const fd = new FormData()
      if (safeUpdates.name) fd.append('name', safeUpdates.name)
      if (safeUpdates.sku) fd.append('sku', safeUpdates.sku)
      const price = safeUpdates.price ?? safeUpdates.sellingPrice
      if (price != null) fd.append('price', String(price))
      if (safeUpdates.lowStockThreshold != null) fd.append('lowStockThreshold', String(safeUpdates.lowStockThreshold))
      if (safeUpdates.categoryId) fd.append('categoryId', safeUpdates.categoryId)
      if (Array.isArray(safeUpdates.images)) {
        safeUpdates.images.forEach(file => fd.append('images', file))
      }
      const response = await apiClient.put(`/products/${productId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updated = response.data.data ?? response.data
      const idx = products.value.findIndex(p => p.id === productId)
      if (idx !== -1) products.value[idx] = normalizeProduct({ ...products.value[idx], ...updated })
      return { success: true, hppWarning }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      error.value = errMsg
      return { success: false, message: errMsg, errors: validationErrors }
    } finally { loading.value = false }
  }

  // ── deleteProduct ──────────────────────────────────────────────────────────
  const deleteProduct = async (productId) => {
    loading.value = true
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      const idx = products.value.findIndex(p => p.id === productId)
      const mockIdx = MOCK_PRODUCTS.findIndex(p => p.id === productId)
      if (idx !== -1) products.value.splice(idx, 1)
      if (mockIdx !== -1) MOCK_PRODUCTS.splice(mockIdx, 1)
      loading.value = false
      return { success: true }
    }
    try {
      await apiClient.delete(`/products/${productId}`)
      const idx = products.value.findIndex(p => p.id === productId)
      if (idx !== -1) products.value.splice(idx, 1)
      return { success: true }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    } finally { loading.value = false }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  HPP WEIGHTED AVERAGE — PURCHASE STOCK
  // ══════════════════════════════════════════════════════════════════════════
  const purchaseStock = async (productId, newQty, buyPrice, expiryDate = null) => {
    const product = getProductById(productId)
    if (!product) return { success: false, message: 'Produk tidak ditemukan' }

    if (newQty <= 0 || buyPrice <= 0) {
      return { success: false, message: 'Jumlah dan harga beli harus lebih dari 0' }
    }

    // Validate: expiryDate mandatory for hasExpiry categories
    const categoriesStore = useCategoriesStore()
    const category = categoriesStore.categories.find(c => c.id === product.categoryId)

    if (category?.hasExpiry && !expiryDate) {
      return { success: false, message: `Tanggal kadaluarsa wajib diisi untuk kategori ${category?.name || ''}` }
    }

    const oldStock = product.stock
    const oldHpp = product.hpp || 0

    // ── Weighted Average HPP formula ──
    // HPP_baru = [(Stok_sisa × HPP_lama) + (Stok_baru × Harga_beli)] / (Stok_sisa + Stok_baru)
    const totalCost = (oldStock * oldHpp) + (newQty * buyPrice)
    const totalStock = oldStock + newQty
    const newHpp = Math.round(totalCost / totalStock)

    const purchaseRecord = {
      id: `prc-${nextPurchaseId++}`,
      productId,
      qty: newQty,
      buyPrice,
      expiryDate: expiryDate || null,
      previousHpp: oldHpp,
      newHpp,
      previousStock: oldStock,
      newStock: totalStock,
      purchasedAt: new Date().toISOString(),
    }

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))

      // Update product in-place
      product.hpp = newHpp
      product.stock = totalStock
      product.isLowStock = totalStock <= (product.lowStockThreshold ?? lowStockThreshold.value)

      // Store purchase record
      MOCK_PURCHASES.push(purchaseRecord)
      purchaseRecords.value.push(purchaseRecord)

      // Sync mock array
      const mockIdx = MOCK_PRODUCTS.findIndex(p => p.id === productId)
      if (mockIdx !== -1) {
        MOCK_PRODUCTS[mockIdx].hpp = newHpp
        MOCK_PRODUCTS[mockIdx].stock = totalStock
      }

      if (import.meta.env.DEV) {
        console.log(`[Products] purchaseStock: ${product.name}`)
        console.log(`  Stok: ${oldStock} → ${totalStock}, HPP: ${oldHpp} → ${newHpp}`)
        if (expiryDate) console.log(`  Expired: ${expiryDate}`)
      }

      return { success: true, data: purchaseRecord }
    }

    // ── REAL API — Swagger: POST /stock-batches ──
    try {
      // Auto-generate batchNumber: BATCH-YYYYMMDD-{seq}
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const batchNumber = `BATCH-${dateStr}-${nextPurchaseId++}`

      const res = await apiClient.post('/stock-batches', {
        productId,
        batchNumber,
        initialQuantity: newQty,
        purchasePrice: buyPrice,
        expiryDate: expiryDate || undefined,
      })
      const stockBatch = res.data.data ?? res.data

      // Update local product state from batch response
      product.stock = (product.stock || 0) + newQty
      const totalCostCalc = ((product.stock - newQty) * (product.hpp || 0)) + (newQty * buyPrice)
      product.hpp = Math.round(totalCostCalc / product.stock)
      product.isLowStock = product.stock <= (product.lowStockThreshold ?? lowStockThreshold.value)

      const record = {
        ...purchaseRecord,
        id: stockBatch.id || purchaseRecord.id,
        newHpp: product.hpp,
        newStock: product.stock,
      }
      purchaseRecords.value.push(record)

      return { success: true, data: record }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRICE HISTORY — UPDATE SELLING PRICE
  // ══════════════════════════════════════════════════════════════════════════
  const updateSellingPrice = async (productId, newPrice) => {
    const product = getProductById(productId)
    if (!product) return { success: false, message: 'Produk tidak ditemukan' }

    if (newPrice <= 0) return { success: false, message: 'Harga jual harus lebih dari 0' }

    // ── Loss Alert: selling below HPP ──
    const lossWarning = newPrice < (product.hpp || 0)
      ? { isLoss: true, lossMessage: `⚠️ Harga jual (Rp ${newPrice.toLocaleString('id-ID')}) di bawah HPP (Rp ${(product.hpp || 0).toLocaleString('id-ID')}). Anda akan mengalami kerugian.` }
      : { isLoss: false, lossMessage: null }

    const oldPrice = product.price ?? product.sellingPrice

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))

      // 1. Deactivate all current active prices for this product
      productPrices.value.forEach(pp => {
        if (pp.productId === productId && pp.is_active) {
          pp.is_active = false
        }
      })
      MOCK_PRICE_HISTORY.forEach(pp => {
        if (pp.productId === productId && pp.is_active) {
          pp.is_active = false
        }
      })

      // 2. Create new active price record
      const newRecord = {
        id: `ph-${nextPriceHistId++}`,
        productId,
        price: newPrice,
        previousPrice: oldPrice,
        is_active: true,
        effectiveDate: new Date().toISOString(),
      }
      MOCK_PRICE_HISTORY.push(newRecord)
      productPrices.value.push(newRecord)

      // 3. Update product selling price
      product.price = newPrice
      product.sellingPrice = newPrice

      // Sync mock array
      const mockIdx = MOCK_PRODUCTS.findIndex(p => p.id === productId)
      if (mockIdx !== -1) {
        MOCK_PRODUCTS[mockIdx].price = newPrice
      }

      if (import.meta.env.DEV) {
        console.log(`[Products] updateSellingPrice: ${product.name}`)
        console.log(`  Price: ${oldPrice} → ${newPrice}`)
        if (lossWarning.isLoss) console.warn(`  ${lossWarning.lossMessage}`)
      }

      return { success: true, data: newRecord, ...lossWarning }
    }

    // ── REAL API ──
    try {
      const res = await apiClient.post(`/products/${productId}/price`, { price: newPrice })
      const data = res.data.data ?? res.data

      // Deactivate old prices locally
      productPrices.value.forEach(pp => {
        if (pp.productId === productId) pp.is_active = false
      })

      // Add new price record
      const newRecord = data.priceRecord ?? { id: data.id, productId, price: newPrice, is_active: true, effectiveDate: new Date().toISOString() }
      productPrices.value.push(newRecord)

      // Update product
      product.price = newPrice
      product.sellingPrice = newPrice

      return { success: true, data: newRecord, ...lossWarning }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    }
  }

  // ── getPriceHistory ─────────────────────────────────────────────────────────
  const getPriceHistory = (productId) => {
    return productPrices.value
      .filter(p => p.productId === productId)
      .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate))
  }

  // ── getActivePrice ──────────────────────────────────────────────────────────
  const getActivePrice = (productId) => {
    return productPrices.value.find(p => p.productId === productId && p.is_active) || null
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STOCK DEDUCTION (used by cart after transaction)
  // ══════════════════════════════════════════════════════════════════════════
  const deductStock = (productId, qty) => {
    const product = getProductById(productId)
    if (!product) return

    product.stock = Math.max(0, product.stock - qty)
    product.isLowStock = product.stock <= (product.lowStockThreshold ?? lowStockThreshold.value)

    // Sync mock
    if (USE_MOCK) {
      const mockIdx = MOCK_PRODUCTS.findIndex(p => p.id === productId)
      if (mockIdx !== -1) {
        MOCK_PRODUCTS[mockIdx].stock = product.stock
      }
    }
  }

  // ── Utility helpers ─────────────────────────────────────────────────────────
  const updateHPP = async (productId, newHPP) => updateProduct(productId, { hpp: newHPP })
  const setLowStockThreshold = (threshold) => { lowStockThreshold.value = threshold; products.value.forEach(p => { p.isLowStock = p.stock <= threshold }) }
  const setSearchFilter = (searchTerm) => { filters.value.searchTerm = searchTerm }
  const setCategoryFilter = (category) => { filters.value.category = category }
  const clearFilters = () => { filters.value.category = null; filters.value.searchTerm = '' }
  const profitMargin = (productId) => {
    const p = getProductById(productId)
    if (!p) return 0
    const sp = p.sellingPrice || p.price || 0
    const margin = sp - (p.hpp || 0)
    return sp > 0 ? Math.round((margin / sp) * 10000) / 100 : 0
  }
  const isLowStock = (productId) => { const p = getProductById(productId); return p && p.stock <= lowStockThreshold.value }

  // ══════════════════════════════════════════════════════════════════════════
  //  EXPIRING PRODUCTS — find products approaching expiry
  // ══════════════════════════════════════════════════════════════════════════
  const getExpiringProducts = (days = 30) => {
    const now = new Date()
    const threshold = new Date(now.getTime() + days * 86400000)
    const results = []
    purchaseRecords.value.forEach(pr => {
      if (!pr.expiryDate) return
      const exp = new Date(pr.expiryDate)
      const product = getProductById(pr.productId)
      if (!product) return
      let status = 'ok'
      if (exp <= now) status = 'expired'
      else if (exp <= threshold) status = 'warning'
      else return // not within threshold
      results.push({ ...pr, productName: product.name, productSku: product.sku, currentStock: product.stock, expiryStatus: status })
    })
    return results.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STOCK RESERVATION — for pending orders
  // ══════════════════════════════════════════════════════════════════════════
  const reserveStock = (productId, qty) => {
    const product = getProductById(productId)
    if (!product) return false
    if (product.stock < qty) return false
    product.stock -= qty
    product.reservedStock = (product.reservedStock || 0) + qty
    product.isLowStock = product.stock <= (product.lowStockThreshold ?? lowStockThreshold.value)
    return true
  }

  const releaseReservedStock = (productId, qty) => {
    const product = getProductById(productId)
    if (!product) return
    const releaseQty = Math.min(qty, product.reservedStock || 0)
    product.reservedStock = (product.reservedStock || 0) - releaseQty
    product.stock += releaseQty
    product.isLowStock = product.stock <= (product.lowStockThreshold ?? lowStockThreshold.value)
  }

  let searchTimeout
  watch(() => filters.value.searchTerm, (newVal) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
          fetchProducts({ search: newVal, page: 1 })
      }, 500)
  })

  return {
    // State
    products, categories, productPrices, purchaseRecords, loading, error, lowStockThreshold, filters, pagination,

    // Computed
    filteredProducts, lowStockProducts,

    // CRUD
    fetchProducts, fetchCategories, addProduct, updateProduct, deleteProduct,

    // Accounting — HPP & Price History
    purchaseStock, updateSellingPrice, getPriceHistory, getActivePrice,

    // Stock
    deductStock,

    // Utility
    updateHPP, setLowStockThreshold, setSearchFilter, setCategoryFilter, clearFilters,
    getProductById, getProductBySku, profitMargin, isLowStock,
    getExpiringProducts, reserveStock, releaseReservedStock,
  }
})
