import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_BATCHES = [
    {
        id: 'sb-1', productId: 'prod-1', batchNumber: 'BATCH-20240101-001',
        initialQuantity: 50, remainingQuantity: 30, purchasePrice: 12000,
        expiryDate: '2025-06-01T00:00:00.000Z', createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
        id: 'sb-2', productId: 'prod-1', batchNumber: 'BATCH-20240315-002',
        initialQuantity: 100, remainingQuantity: 100, purchasePrice: 11500,
        expiryDate: '2025-12-01T00:00:00.000Z', createdAt: '2024-03-15T00:00:00.000Z',
    },
    {
        id: 'sb-3', productId: 'prod-2', batchNumber: 'BATCH-20240201-001',
        initialQuantity: 200, remainingQuantity: 150, purchasePrice: 8000,
        expiryDate: null, createdAt: '2024-02-01T00:00:00.000Z',
    },
]
// ─────────────────────────────────────────────────────────────────────────────

export const useStockBatchesStore = defineStore('stockBatches', () => {
    const batches = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 0 })
    let nextMockId = 4

    // ── fetchAll ─────────────────────────────────────────────────────────────
    const fetchAll = async (params = {}) => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            batches.value = [...MOCK_BATCHES]
            pagination.value.totalItems = MOCK_BATCHES.length
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get('/stock-batches', { params })
            batches.value = res.data.data ?? []
            if (res.data.meta) pagination.value = { ...pagination.value, ...res.data.meta }
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            error.value = errMsg
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── fetchByProduct ───────────────────────────────────────────────────────
    const fetchByProduct = async (productId) => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 150))
            const filtered = MOCK_BATCHES.filter(b => b.productId === productId)
            loading.value = false
            return { success: true, data: filtered }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get(`/stock-batches/product/${productId}`)
            const data = res.data.data ?? []
            return { success: true, data }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── create ────────────────────────────────────────────────────────────────
    // Swagger: POST /stock-batches
    // Required: { productId, batchNumber, initialQuantity, purchasePrice }
    // Optional: { expiryDate }
    const create = async (payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const newBatch = {
                id: `sb-${nextMockId++}`,
                productId: payload.productId,
                batchNumber: payload.batchNumber,
                initialQuantity: payload.initialQuantity,
                remainingQuantity: payload.initialQuantity,
                purchasePrice: payload.purchasePrice,
                expiryDate: payload.expiryDate || null,
                createdAt: new Date().toISOString(),
            }
            MOCK_BATCHES.push(newBatch)
            batches.value.push({ ...newBatch })
            loading.value = false
            return { success: true, data: newBatch }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post('/stock-batches', {
                productId: payload.productId,
                batchNumber: payload.batchNumber,
                initialQuantity: payload.initialQuantity,
                purchasePrice: payload.purchasePrice,
                expiryDate: payload.expiryDate || undefined,
            })
            const created = res.data.data ?? res.data
            batches.value.push(created)
            return { success: true, data: created }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── update ─────────────────────────────────────────────────────────────────
    // Swagger: PATCH /stock-batches/{id}
    const update = async (id, payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            const idx = batches.value.findIndex(b => b.id === id)
            const mockIdx = MOCK_BATCHES.findIndex(b => b.id === id)
            if (idx !== -1) batches.value[idx] = { ...batches.value[idx], ...payload }
            if (mockIdx !== -1) MOCK_BATCHES[mockIdx] = { ...MOCK_BATCHES[mockIdx], ...payload }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.patch(`/stock-batches/${id}`, payload)
            const idx = batches.value.findIndex(b => b.id === id)
            if (idx !== -1) batches.value[idx] = { ...batches.value[idx], ...(res.data.data ?? res.data) }
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── remove ─────────────────────────────────────────────────────────────────
    // Swagger: DELETE /stock-batches/{id}
    const remove = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            const idx = batches.value.findIndex(b => b.id === id)
            const mockIdx = MOCK_BATCHES.findIndex(b => b.id === id)
            if (idx !== -1) batches.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_BATCHES.splice(mockIdx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/stock-batches/${id}`)
            const idx = batches.value.findIndex(b => b.id === id)
            if (idx !== -1) batches.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── Computed helpers ──────────────────────────────────────────────────────
    const getBatchesByProduct = computed(() => (productId) =>
        batches.value.filter(b => b.productId === productId)
    )

    return {
        batches, loading, error, pagination,
        fetchAll, fetchByProduct, create, update, remove,
        getBatchesByProduct,
    }
})
