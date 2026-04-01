import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CATEGORIES = [
    { id: 'cat-1', name: 'Makanan', description: 'Produk makanan & sajian utama', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'cat-2', name: 'Minuman', description: 'Berbagai pilihan minuman segar', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'cat-3', name: 'Snack', description: 'Camilan dan makanan ringan', createdAt: '2024-01-02T00:00:00.000Z' },
    { id: 'cat-4', name: 'Dessert', description: 'Pencuci mulut dan es krim', createdAt: '2024-01-03T00:00:00.000Z' },
]
// ─────────────────────────────────────────────────────────────────────────────

export const useCategoriesStore = defineStore('categories', () => {
    const categories = ref([])
    const loading = ref(false)
    const error = ref(null)
    let nextMockId = 5

    const searchTerm = ref('')
    const filtered = computed(() => {
        if (!searchTerm.value) return categories.value
        const q = searchTerm.value.toLowerCase()
        return categories.value.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        )
    })

    // ── fetchAll ───────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            categories.value = [...MOCK_CATEGORIES]
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get('/categories')
            const raw = Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.categories ?? [])
            categories.value = raw
            return { success: true }
        } catch (err) {
            error.value = err.response?.data?.message || 'Gagal memuat kategori'
            return { success: false, message: error.value }
        } finally { loading.value = false }
    }

    // ── add ────────────────────────────────────────────────────────────────────
    const add = async (payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const newCat = { ...payload, id: `cat-${nextMockId++}`, createdAt: new Date().toISOString() }
            MOCK_CATEGORIES.push(newCat)
            categories.value.push(newCat)
            loading.value = false
            return { success: true, data: newCat }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post('/categories', payload)
            const created = res.data.data ?? res.data
            categories.value.push(created)
            return { success: true, data: created }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menambah kategori' }
        } finally { loading.value = false }
    }

    // ── update ─────────────────────────────────────────────────────────────────
    const update = async (id, payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const idx = categories.value.findIndex(c => c.id === id)
            const mockIdx = MOCK_CATEGORIES.findIndex(c => c.id === id)
            if (idx !== -1) { categories.value[idx] = { ...categories.value[idx], ...payload } }
            if (mockIdx !== -1) { MOCK_CATEGORIES[mockIdx] = { ...MOCK_CATEGORIES[mockIdx], ...payload } }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.put(`/categories/${id}`, payload)
            const idx = categories.value.findIndex(c => c.id === id)
            if (idx !== -1) categories.value[idx] = { ...categories.value[idx], ...(res.data.data ?? res.data) }
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal mengupdate kategori' }
        } finally { loading.value = false }
    }

    // ── delete ─────────────────────────────────────────────────────────────────
    const remove = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const idx = categories.value.findIndex(c => c.id === id)
            const mockIdx = MOCK_CATEGORIES.findIndex(c => c.id === id)
            if (idx !== -1) categories.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_CATEGORIES.splice(mockIdx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/categories/${id}`)
            const idx = categories.value.findIndex(c => c.id === id)
            if (idx !== -1) categories.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menghapus kategori' }
        } finally { loading.value = false }
    }

    return { categories, loading, error, searchTerm, filtered, fetchAll, add, update, remove }
})
