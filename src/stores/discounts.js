import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DISCOUNTS = [
    {
        id: 'disc-1',
        name: 'Diskon Member Gold',
        type: 'PERCENTAGE',
        value: 10,
        target: 'MEMBER',
        appliedProductIds: [],  // digunakan hanya saat target === 'PRODUCT'
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
        target: 'TRANSACTION',
        appliedProductIds: [],
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        isActive: true,
        createdAt: '2024-11-15T00:00:00.000Z',
    },
    {
        id: 'disc-3',
        name: 'Diskon Produk Makanan',
        type: 'NOMINAL',
        value: 2000,
        target: 'PRODUCT',
        // Contoh: berlaku untuk Nasi Goreng Spesial & Mie Ayam Bakso
        appliedProductIds: ['prod-1', 'prod-2'],
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: '2024-05-28T00:00:00.000Z',
    },
]

const DISCOUNT_TYPES = [
    { value: 'PERCENTAGE', label: 'Persentase (%)' },
    { value: 'NOMINAL', label: 'Nominal (Rp)' },
]

const DISCOUNT_TARGETS = [
    { value: 'PRODUCT', label: 'Per Produk' },
    { value: 'MEMBER', label: 'Per Member' },
    { value: 'TRANSACTION', label: 'Per Transaksi' },
]

// ─────────────────────────────────────────────────────────────────────────────

export const useDiscountsStore = defineStore('discounts', () => {
    const discounts = ref([])
    const loading = ref(false)
    const error = ref(null)
    let nextMockId = 4

    const searchTerm = ref('')
    const targetFilter = ref('')

    const filtered = computed(() => {
        let list = discounts.value
        if (targetFilter.value) {
            list = list.filter(d => d.target === targetFilter.value)
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

    const getTargetLabel = (target) => {
        const map = { PRODUCT: 'Per Produk', MEMBER: 'Per Member', TRANSACTION: 'Per Transaksi' }
        return map[target] || target
    }

    // ── fetchAll ───────────────────────────────────────────────────────────────
    const fetchAll = async () => {
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
            const res = await apiClient.get('/discounts')
            discounts.value = Array.isArray(res.data) ? res.data : (res.data.data ?? [])
            return { success: true }
        } catch (err) {
            error.value = err.response?.data?.message || 'Gagal memuat data diskon'
            return { success: false, message: error.value }
        } finally { loading.value = false }
    }

    // ── add ────────────────────────────────────────────────────────────────────
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
            const res = await apiClient.post('/discounts', payload)
            discounts.value.push(res.data.data ?? res.data)
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menambah diskon' }
        } finally { loading.value = false }
    }

    // ── update ─────────────────────────────────────────────────────────────────
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
            const res = await apiClient.put(`/discounts/${id}`, payload)
            const idx = discounts.value.findIndex(d => d.id === id)
            if (idx !== -1) discounts.value[idx] = { ...discounts.value[idx], ...(res.data.data ?? res.data) }
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal mengupdate diskon' }
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
            return { success: false, message: err.response?.data?.message || 'Gagal menghapus diskon' }
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
            d.target === 'PRODUCT' &&
            d.startDate <= now &&
            d.endDate >= now &&
            Array.isArray(d.appliedProductIds) &&
            d.appliedProductIds.includes(productId)
        )
    }

    return {
        discounts, loading, error, searchTerm, targetFilter,
        filtered, activeDiscounts,
        DISCOUNT_TYPES, DISCOUNT_TARGETS,
        getDiscountLabel, getTargetLabel,
        fetchAll, add, update, remove, toggleActive,
        getActiveProductDiscounts,
    }
})
