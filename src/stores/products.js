import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Makanan', description: 'Produk makanan' },
  { id: 'cat-2', name: 'Minuman', description: 'Produk minuman' },
  { id: 'cat-3', name: 'Snack', description: 'Camilan ringan' },
  { id: 'cat-4', name: 'Dessert', description: 'Pencuci mulut dan es krim' },
]

let MOCK_PRODUCTS = [
  { id: 'prod-1', sku: 'MKN-001', name: 'Nasi Goreng Spesial', price: 25000, hpp: 12000, stock: 50, lowStockThreshold: 10, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Makanan' }, images: [] },
  { id: 'prod-2', sku: 'MKN-002', name: 'Mie Ayam Bakso', price: 18000, hpp: 8500, stock: 40, lowStockThreshold: 10, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Makanan' }, images: [] },
  { id: 'prod-3', sku: 'MKN-003', name: 'Ayam Bakar', price: 32000, hpp: 15000, stock: 8, lowStockThreshold: 10, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Makanan' }, images: [] },
  { id: 'prod-4', sku: 'MNM-001', name: 'Es Teh Manis', price: 5000, hpp: 1500, stock: 100, lowStockThreshold: 20, categoryId: 'cat-2', category: { id: 'cat-2', name: 'Minuman' }, images: [] },
  { id: 'prod-5', sku: 'MNM-002', name: 'Jus Alpukat', price: 15000, hpp: 7000, stock: 30, lowStockThreshold: 10, categoryId: 'cat-2', category: { id: 'cat-2', name: 'Minuman' }, images: [] },
  { id: 'prod-6', sku: 'MNM-003', name: 'Kopi Hitam', price: 8000, hpp: 2500, stock: 5, lowStockThreshold: 10, categoryId: 'cat-2', category: { id: 'cat-2', name: 'Minuman' }, images: [] },
  { id: 'prod-7', sku: 'SNK-001', name: 'Kentang Goreng', price: 12000, hpp: 4500, stock: 25, lowStockThreshold: 10, categoryId: 'cat-3', category: { id: 'cat-3', name: 'Snack' }, images: [] },
  { id: 'prod-8', sku: 'SNK-002', name: 'Cireng Bumbu', price: 10000, hpp: 3500, stock: 35, lowStockThreshold: 10, categoryId: 'cat-3', category: { id: 'cat-3', name: 'Snack' }, images: [] },
]
let nextMockId = 9
// ─────────────────────────────────────────────────────────────────────────────

export const useProductsStore = defineStore('products', () => {
  // State
  const products = ref([])
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lowStockThreshold = ref(parseInt(import.meta.env.VITE_LOW_STOCK_THRESHOLD) || 10)
  const filters = ref({ category: null, searchTerm: '' })

  // Computed
  const filteredProducts = computed(() => products.value.filter(product => {
    const matchCategory = !filters.value.category || product.categoryId === filters.value.category || product.category?.name === filters.value.category
    const matchSearch = !filters.value.searchTerm || product.name.toLowerCase().includes(filters.value.searchTerm.toLowerCase()) || product.sku?.toLowerCase().includes(filters.value.searchTerm.toLowerCase())
    return matchCategory && matchSearch
  }))

  const lowStockProducts = computed(() => products.value.filter(p => p.stock <= p.lowStockThreshold))
  const getProductById = (id) => products.value.find(p => p.id === id)

  // Normalize API → internal (backend sends `price` for selling price)
  const normalizeProduct = (p) => ({
    ...p,
    sellingPrice: p.price ?? p.sellingPrice,
    isLowStock: p.stock <= (p.lowStockThreshold ?? lowStockThreshold.value),
  })

  // ── fetchProducts ──────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    loading.value = true
    error.value = null
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      products.value = MOCK_PRODUCTS.map(normalizeProduct)
      categories.value = MOCK_CATEGORIES
      loading.value = false
      return { success: true }
    }
    try {
      const response = await apiClient.get('/products')
      const raw = Array.isArray(response.data) ? response.data : (response.data.data ?? response.data.products ?? [])
      products.value = raw.map(normalizeProduct)
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal memuat produk'
      return { success: false, message: error.value }
    } finally { loading.value = false }
  }

  // ── fetchCategories ────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    if (USE_MOCK) { categories.value = MOCK_CATEGORIES; return { success: true } }
    try {
      const response = await apiClient.get('/categories')
      const raw = Array.isArray(response.data) ? response.data : (response.data.data ?? response.data.categories ?? [])
      categories.value = raw
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Gagal memuat kategori' }
    }
  }

  // ── addProduct  ────────────────────────────────────────────────────────────
  const addProduct = async (payload) => {
    loading.value = true
    // Ensure API field mapping: internalSellingPrice → price
    const body = { ...payload, price: payload.price ?? payload.sellingPrice }
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 350))
      const cat = MOCK_CATEGORIES.find(c => c.id === body.categoryId)
      const newProd = { ...body, id: `prod-${nextMockId++}`, category: cat ?? null, images: [] }
      MOCK_PRODUCTS.push(newProd)
      products.value.push(normalizeProduct(newProd))
      loading.value = false
      return { success: true, data: newProd }
    }
    try {
      const res = await apiClient.post('/products', body)
      const created = res.data.data ?? res.data
      products.value.push(normalizeProduct(created))
      return { success: true, data: created }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Gagal menambah produk' }
    } finally { loading.value = false }
  }

  // ── updateProduct ──────────────────────────────────────────────────────────
  const updateProduct = async (productId, updates) => {
    loading.value = true
    error.value = null
    const body = { ...updates, price: updates.price ?? updates.sellingPrice }
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      const idx = products.value.findIndex(p => p.id === productId)
      const mockIdx = MOCK_PRODUCTS.findIndex(p => p.id === productId)
      if (idx !== -1) {
        const cat = MOCK_CATEGORIES.find(c => c.id === body.categoryId)
        const merged = { ...products.value[idx], ...body, category: cat ?? products.value[idx].category }
        products.value[idx] = normalizeProduct(merged)
        if (mockIdx !== -1) MOCK_PRODUCTS[mockIdx] = merged
      }
      loading.value = false
      return { success: true }
    }
    try {
      const response = await apiClient.put(`/products/${productId}`, body)
      const idx = products.value.findIndex(p => p.id === productId)
      if (idx !== -1) products.value[idx] = normalizeProduct({ ...products.value[idx], ...response.data })
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal mengupdate produk'
      return { success: false, message: error.value }
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
      return { success: false, message: err.response?.data?.message || 'Gagal menghapus produk' }
    } finally { loading.value = false }
  }

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

  return {
    products, categories, loading, error, lowStockThreshold, filters,
    filteredProducts, lowStockProducts,
    fetchProducts, fetchCategories, addProduct, updateProduct, deleteProduct,
    updateHPP, setLowStockThreshold, setSearchFilter, setCategoryFilter, clearFilters,
    getProductById, profitMargin, isLowStock,
  }
})
