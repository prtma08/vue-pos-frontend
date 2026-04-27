import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DEVICES = [
    { id: 'pos-1', name: 'POS Kasir 1', location: 'Lantai 1 - Depan', isActive: true, currentCashier: null, createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'pos-2', name: 'POS Kasir 2', location: 'Lantai 1 - Belakang', isActive: true, currentCashier: null, createdAt: '2024-01-05T00:00:00.000Z' },
    { id: 'pos-3', name: 'POS Drive Thru', location: 'Drive Through', isActive: true, currentCashier: null, createdAt: '2024-02-01T00:00:00.000Z' },
    { id: 'pos-4', name: 'POS Cadangan', location: 'Gudang', isActive: false, currentCashier: null, createdAt: '2024-03-01T00:00:00.000Z' },
]
// ─────────────────────────────────────────────────────────────────────────────

export const usePosDevicesStore = defineStore('posDevices', () => {
    const devices = ref([])
    const loading = ref(false)
    const error = ref(null)
    let nextMockId = 5

    const searchTerm = ref('')
    const statusFilter = ref('') // '' | 'active' | 'inactive'

    const filtered = computed(() => {
        let list = devices.value
        if (statusFilter.value === 'active') list = list.filter(d => d.isActive)
        else if (statusFilter.value === 'inactive') list = list.filter(d => !d.isActive)
        if (searchTerm.value) {
            const q = searchTerm.value.toLowerCase()
            list = list.filter(d => d.name.toLowerCase().includes(q) || (d.location || '').toLowerCase().includes(q))
        }
        return list
    })

    const availableDevices = computed(() => devices.value.filter(d => d.isActive && !d.activeUserId && !d.currentCashier))

    // ── fetchAll ───────────────────────────────────────────────────────────────
    const fetchAll = async (params = {}) => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            devices.value = [...MOCK_DEVICES]
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get('/pos', {
                params: {
                    search: params.search || undefined,
                }
            })
            devices.value = res.data.data ?? []
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
            const newDevice = { ...payload, id: `pos-${nextMockId++}`, isActive: payload.isActive !== false, currentCashier: null, createdAt: new Date().toISOString() }
            MOCK_DEVICES.push(newDevice)
            devices.value.push(newDevice)
            loading.value = false
            return { success: true, data: newDevice }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post('/pos', payload)
            devices.value.push(res.data.data ?? res.data)
            return { success: true }
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
            const idx = devices.value.findIndex(d => d.id === id)
            const mockIdx = MOCK_DEVICES.findIndex(d => d.id === id)
            if (idx !== -1) devices.value[idx] = { ...devices.value[idx], ...payload }
            if (mockIdx !== -1) MOCK_DEVICES[mockIdx] = { ...MOCK_DEVICES[mockIdx], ...payload }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.put(`/pos/${id}`, payload)
            const idx = devices.value.findIndex(d => d.id === id)
            if (idx !== -1) devices.value[idx] = { ...devices.value[idx], ...(res.data.data ?? res.data) }
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
            const idx = devices.value.findIndex(d => d.id === id)
            const mockIdx = MOCK_DEVICES.findIndex(d => d.id === id)
            if (idx !== -1) devices.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_DEVICES.splice(mockIdx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/pos/${id}`)
            const idx = devices.value.findIndex(d => d.id === id)
            if (idx !== -1) devices.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    const toggleActive = async (id) => {
        const device = devices.value.find(d => d.id === id)
        if (!device) return { success: false }
        return update(id, { isActive: !device.isActive })
    }

    let searchTimeout
    watch(searchTerm, (newVal) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            fetchAll({ search: newVal, page: 1 })
        }, 500)
    })

    return {
        devices, loading, error, searchTerm, statusFilter,
        filtered, availableDevices,
        fetchAll, add, update, remove, toggleActive,
    }
})
