import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CATEGORIES = [
    { id: 'cat-1', name: 'Makanan', description: 'Produk makanan & sajian utama', hasExpiry: true, createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'cat-2', name: 'Minuman', description: 'Berbagai pilihan minuman segar', hasExpiry: true, createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'cat-3', name: 'Snack', description: 'Camilan dan makanan ringan', hasExpiry: false, createdAt: '2024-01-02T00:00:00.000Z' },
    { id: 'cat-4', name: 'Dessert', description: 'Pencuci mulut dan es krim', hasExpiry: true, createdAt: '2024-01-03T00:00:00.000Z' },
]
// ─────────────────────────────────────────────────────────────────────────────

export const useCategoriesStore = defineStore('categories', () => {
    const categories = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false })
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
    const fetchAll = async (params = {}) => {
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
            const res = await apiClient.get('/categories', {
                params: {
                    page: params.page ?? pagination.value.page,
                    limit: params.limit ?? pagination.value.limit,
                    search: params.search || undefined,
                }
            })
            categories.value = res.data.data ?? []
            if (res.data.meta) {
                pagination.value = { ...pagination.value, ...res.data.meta }
            }
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            error.value = errMsg
            return { success: false, message: errMsg, errors: validationErrors }
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
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
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
            const res = await apiClient.patch(`/categories/${id}`, payload)
            const idx = categories.value.findIndex(c => c.id === id)
            if (idx !== -1) categories.value[idx] = { ...categories.value[idx], ...(res.data.data ?? res.data) }
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
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
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    let searchTimeout
    watch(searchTerm, (newVal) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            fetchAll({ search: newVal, page: 1 })
        }, 500)
    })

    return { categories, loading, error, pagination, searchTerm, filtered, fetchAll, add, update, remove }
})
