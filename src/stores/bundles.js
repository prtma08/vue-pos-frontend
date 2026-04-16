import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_BUNDLES = [
    {
        id: 'bnd-1', name: 'Paket Hemat A', sku: 'BND-001', price: 45000,
        categoryId: 'cat-1', images: [],
        components: [
            { componentId: 'prod-1', qty: 1 },
            { componentId: 'prod-4', qty: 2 },
        ],
        createdAt: '2024-01-10T00:00:00.000Z',
    },
]
let nextMockId = 2
// ─────────────────────────────────────────────────────────────────────────────

export const useBundlesStore = defineStore('bundles', () => {
    const bundles = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 0 })

    // ── fetchAll ─────────────────────────────────────────────────────────────
    const fetchAll = async (params = {}) => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 250))
            bundles.value = [...MOCK_BUNDLES]
            pagination.value.totalItems = MOCK_BUNDLES.length
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get('/bundles', {
                params: {
                    page: params.page ?? pagination.value.page,
                    limit: params.limit ?? pagination.value.limit,
                    search: params.search || undefined,
                }
            })
            bundles.value = res.data.data ?? []
            if (res.data.meta) pagination.value = { ...pagination.value, ...res.data.meta }
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            error.value = errMsg
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── fetchById ────────────────────────────────────────────────────────────
    const fetchById = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 150))
            loading.value = false
            return { success: true, data: MOCK_BUNDLES.find(b => b.id === id) || null }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get(`/bundles/${id}`)
            return { success: true, data: res.data.data ?? res.data }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── Helper: build FormData for create/update ─────────────────────────────
    const _buildBundleFormData = (payload) => {
        const fd = new FormData()
        if (payload.name) fd.append('name', payload.name)
        if (payload.sku) fd.append('sku', payload.sku)
        if (payload.price != null) fd.append('price', String(payload.price))
        if (payload.categoryId) fd.append('categoryId', payload.categoryId)
        // Images: array of File objects
        if (Array.isArray(payload.images)) {
            payload.images.forEach(file => fd.append('images', file))
        }
        // Components: must be JSON-stringified array [{componentId, qty}]
        if (Array.isArray(payload.components)) {
            fd.append('components', JSON.stringify(payload.components))
        }
        return fd
    }

    // ── create ────────────────────────────────────────────────────────────────
    // Swagger: POST /bundles (multipart/form-data)
    // Required: name, sku, price, categoryId, components (JSON string)
    const create = async (payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const newBundle = {
                id: `bnd-${nextMockId++}`,
                name: payload.name, sku: payload.sku, price: payload.price,
                categoryId: payload.categoryId, images: [],
                components: payload.components || [],
                createdAt: new Date().toISOString(),
            }
            MOCK_BUNDLES.push(newBundle)
            bundles.value.push({ ...newBundle })
            loading.value = false
            return { success: true, data: newBundle }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const fd = _buildBundleFormData(payload)
            const res = await apiClient.post('/bundles', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const created = res.data.data ?? res.data
            bundles.value.push(created)
            return { success: true, data: created }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── update ────────────────────────────────────────────────────────────────
    // Swagger: PATCH /bundles/{id} (multipart/form-data)
    const update = async (id, payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 250))
            const idx = bundles.value.findIndex(b => b.id === id)
            const mockIdx = MOCK_BUNDLES.findIndex(b => b.id === id)
            if (idx !== -1) bundles.value[idx] = { ...bundles.value[idx], ...payload }
            if (mockIdx !== -1) MOCK_BUNDLES[mockIdx] = { ...MOCK_BUNDLES[mockIdx], ...payload }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const fd = _buildBundleFormData(payload)
            const res = await apiClient.patch(`/bundles/${id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const idx = bundles.value.findIndex(b => b.id === id)
            if (idx !== -1) bundles.value[idx] = { ...bundles.value[idx], ...(res.data.data ?? res.data) }
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── remove ────────────────────────────────────────────────────────────────
    // Swagger: DELETE /bundles/{id}
    const remove = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            const idx = bundles.value.findIndex(b => b.id === id)
            const mockIdx = MOCK_BUNDLES.findIndex(b => b.id === id)
            if (idx !== -1) bundles.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_BUNDLES.splice(mockIdx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/bundles/${id}`)
            const idx = bundles.value.findIndex(b => b.id === id)
            if (idx !== -1) bundles.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    return {
        bundles, loading, error, pagination,
        fetchAll, fetchById, create, update, remove,
    }
})
