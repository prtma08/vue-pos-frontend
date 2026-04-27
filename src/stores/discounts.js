import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DISCOUNTS = [
    {
        id: 'disc-1',
        name: 'Diskon Member Gold',
        type: 'PERCENTAGE',
        value: 10,
        isTransactionLevel: false,
        isMemberLevel: true,
        appliedProductIds: [],
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
        id: 'disc-2',
        name: 'Promo Akhir Tahun',
        type: 'PERCENTAGE',
        value: 15,
        isTransactionLevel: true,
        isMemberLevel: false,
        appliedProductIds: [],
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        isActive: true,
        createdAt: '2024-11-15T00:00:00.000Z',
    },
    {
        id: 'disc-3',
        name: 'Diskon Produk Makanan',
        type: 'FIXED_AMOUNT',
        value: 2000,
        isTransactionLevel: false,
        isMemberLevel: false,
        appliedProductIds: ['prod-1', 'prod-2'],
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: '2024-05-28T00:00:00.000Z',
    },
]

const DISCOUNT_TYPES = [
    { value: 'PERCENTAGE', label: 'Persentase (%)' },
    { value: 'FIXED_AMOUNT', label: 'Nominal (Rp)' },
]

const DISCOUNT_LEVELS = [
    { value: 'product', label: 'Produk' },
    { value: 'member', label: 'Member' },
    { value: 'transaction', label: 'Transaksi' },
]

// ─────────────────────────────────────────────────────────────────────────────

export const useDiscountsStore = defineStore('discounts', () => {
    const discounts = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false })
    let nextMockId = 4

    const searchTerm = ref('')
    const levelFilter = ref('') // '' | 'product' | 'member' | 'transaction'

    const filtered = computed(() => {
        let list = discounts.value
        if (levelFilter.value === 'transaction') {
            list = list.filter(d => d.isTransactionLevel)
        } else if (levelFilter.value === 'member') {
            list = list.filter(d => d.isMemberLevel)
        } else if (levelFilter.value === 'product') {
            list = list.filter(d => !d.isTransactionLevel && !d.isMemberLevel)
        }
        if (searchTerm.value) {
            const q = searchTerm.value.toLowerCase()
            list = list.filter(d => d.name.toLowerCase().includes(q))
        }
        return list
    })

    const activeDiscounts = computed(() => {
        const now = new Date().toISOString().split('T')[0]
        return discounts.value.filter(d => d.isActive && d.startDate <= now && d.endDate >= now)
    })

    const getDiscountLabel = (disc) => {
        if (disc.type === 'PERCENTAGE') return `${disc.value}%`
        return `Rp ${Math.round(disc.value).toLocaleString('id-ID')}`
    }

    const getLevelLabel = (disc) => {
        if (disc.isTransactionLevel) return 'Transaksi'
        if (disc.isMemberLevel) return 'Member'
        return 'Produk'
    }

    // ── fetchAll ───────────────────────────────────────────────────────────────
    const fetchAll = async (params = {}) => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 350))
            discounts.value = [...MOCK_DISCOUNTS]
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get('/discounts', {
                params: {
                    page: params.page ?? pagination.value.page,
                    limit: params.limit ?? pagination.value.limit,
                    search: params.search || undefined,
                }
            })
            const fetched = res.data.data ?? []
            discounts.value = fetched.map(d => ({
                ...d,
                appliedProductIds: d.products ? d.products.map(p => p.id) : (d.appliedProductIds || d.productIds || [])
            }))
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
    // Swagger POST /discounts:
    // Required: { name, value, endDate }
    // Optional: { description, type, startDate, isActive, isTransactionLevel, productIds }
    const add = async (payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const newDisc = {
                ...payload,
                id: `disc-${nextMockId++}`,
                isActive: true,
                createdAt: new Date().toISOString(),
            }
            MOCK_DISCOUNTS.push(newDisc)
            discounts.value.push(newDisc)
            loading.value = false
            return { success: true, data: newDisc }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            // Map frontend field names to Swagger field names
            const startD = payload.startDate ? (payload.startDate.includes('T') ? new Date(payload.startDate) : new Date(`${payload.startDate}T00:00:00Z`)).toISOString() : undefined;
            const endD = payload.endDate ? (payload.endDate.includes('T') ? new Date(payload.endDate) : new Date(`${payload.endDate}T23:59:59.999Z`)).toISOString() : undefined;

            const body = {
                name: payload.name,
                description: payload.description || undefined,
                type: payload.type,
                value: payload.value,
                startDate: startD,
                endDate: endD,
                isActive: payload.isActive ?? true,
                isTransactionLevel: payload.isTransactionLevel ?? false,
                isMemberLevel: payload.isMemberLevel ?? false,
                // Map appliedProductIds → productIds (Swagger field name)
                productIds: !payload.isTransactionLevel && !payload.isMemberLevel
                    ? (payload.productIds || payload.appliedProductIds || [])
                    : [],
            }
            const res = await apiClient.post('/discounts', body)
            discounts.value.push(res.data.data ?? res.data)
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── update ─────────────────────────────────────────────────────────────────
    // Swagger PUT /discounts/{id}
    const update = async (id, payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const idx = discounts.value.findIndex(d => d.id === id)
            const mockIdx = MOCK_DISCOUNTS.findIndex(d => d.id === id)
            if (idx !== -1) discounts.value[idx] = { ...discounts.value[idx], ...payload }
            if (mockIdx !== -1) MOCK_DISCOUNTS[mockIdx] = { ...MOCK_DISCOUNTS[mockIdx], ...payload }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            // Map frontend field names to Swagger field names
            const startD = payload.startDate ? (payload.startDate.includes('T') ? new Date(payload.startDate) : new Date(`${payload.startDate}T00:00:00Z`)).toISOString() : undefined;
            const endD = payload.endDate ? (payload.endDate.includes('T') ? new Date(payload.endDate) : new Date(`${payload.endDate}T23:59:59.999Z`)).toISOString() : undefined;

            const body = {
                name: payload.name,
                description: payload.description,
                type: payload.type,
                value: payload.value,
                startDate: startD,
                endDate: endD,
                isActive: payload.isActive,
                isTransactionLevel: payload.isTransactionLevel,
                isMemberLevel: payload.isMemberLevel ?? false,
                productIds: !payload.isTransactionLevel && !payload.isMemberLevel
                    ? (payload.productIds || payload.appliedProductIds || [])
                    : [],
            }
            const res = await apiClient.put(`/discounts/${id}`, body)
            const idx = discounts.value.findIndex(d => d.id === id)
            if (idx !== -1) discounts.value[idx] = { ...discounts.value[idx], ...(res.data.data ?? res.data) }
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
            const idx = discounts.value.findIndex(d => d.id === id)
            const mockIdx = MOCK_DISCOUNTS.findIndex(d => d.id === id)
            if (idx !== -1) discounts.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_DISCOUNTS.splice(mockIdx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/discounts/${id}`)
            const idx = discounts.value.findIndex(d => d.id === id)
            if (idx !== -1) discounts.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── toggle active ──────────────────────────────────────────────────────────
    const toggleActive = async (id) => {
        const disc = discounts.value.find(d => d.id === id)
        if (!disc) return { success: false, message: 'Diskon tidak ditemukan' }
        return update(id, { isActive: !disc.isActive })
    }

    /**
     * Langkah 3 – cart.js integration:
     * Kembalikan semua diskon aktif bertipe PRODUCT yang mencakup productId tertentu.
     * Digunakan oleh _computeItemPrices di cart.js untuk menerapkan diskon per-produk.
     */
    const getActiveProductDiscounts = (productId) => {
        const now = new Date().toISOString().split('T')[0]
        return discounts.value.filter(d =>
            d.isActive &&
            !d.isTransactionLevel && !d.isMemberLevel &&
            d.startDate <= now &&
            d.endDate >= now &&
            Array.isArray(d.appliedProductIds) &&
            d.appliedProductIds.includes(productId)
        )
    }

    let searchTimeout
    watch(searchTerm, (newVal) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            fetchAll({ search: newVal, page: 1 })
        }, 500)
    })

    return {
        discounts, loading, error, pagination, searchTerm, levelFilter,
        filtered, activeDiscounts,
        DISCOUNT_TYPES, DISCOUNT_LEVELS,
        getDiscountLabel, getLevelLabel,
        fetchAll, add, update, remove, toggleActive,
        getActiveProductDiscounts,
    }
})
