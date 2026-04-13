import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
let MOCK_PRICELISTS = [
    {
        id: 'pl-1',
        name: 'Promo Lebaran',
        description: 'Harga spesial Lebaran 2026',
        is_active: true,
        createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
        id: 'pl-2',
        name: 'Flash Sale Akhir Bulan',
        description: 'Diskon produk pilihan akhir bulan',
        is_active: false,
        createdAt: '2026-03-25T00:00:00.000Z',
    },
]

// pricelistItems: { id, pricelistId, productId, productName, productSku, eventPrice }
let MOCK_PRICELIST_ITEMS = [
    { id: 'pli-1', pricelistId: 'pl-1', productId: 'prod-1', productName: 'Nasi Goreng Spesial', productSku: 'MKN-001', eventPrice: 20000 },
    { id: 'pli-2', pricelistId: 'pl-1', productId: 'prod-4', productName: 'Es Teh Manis', productSku: 'MNM-001', eventPrice: 4000 },
    { id: 'pli-3', pricelistId: 'pl-1', productId: 'prod-7', productName: 'Kentang Goreng', productSku: 'SNK-001', eventPrice: 10000 },
    { id: 'pli-4', pricelistId: 'pl-2', productId: 'prod-2', productName: 'Mie Ayam Bakso', productSku: 'MKN-002', eventPrice: 15000 },
    { id: 'pli-5', pricelistId: 'pl-2', productId: 'prod-5', productName: 'Jus Alpukat', productSku: 'MNM-002', eventPrice: 12000 },
]

let nextPlId = 3
let nextPliId = 6
// ─────────────────────────────────────────────────────────────────────────────

export const usePricelistStore = defineStore('pricelist', () => {
    // ── State ─────────────────────────────────────────────────────────────────
    const pricelists = ref([])
    const pricelistItems = ref([])
    const loading = ref(false)
    const error = ref(null)

    // ── Computed ──────────────────────────────────────────────────────────────
    const activePricelist = computed(() =>
        pricelists.value.find(pl => pl.is_active) ?? null
    )

    const hasActiveEvent = computed(() => activePricelist.value !== null)

    /**
     * Returns the event price for a productId if there's an active pricelist
     * that includes this product. Returns null otherwise.
     */
    const getEventPrice = (productId) => {
        if (!activePricelist.value) return null
        const item = pricelistItems.value.find(
            i => i.pricelistId === activePricelist.value.id && i.productId === productId
        )
        return item ? item.eventPrice : null
    }

    /**
     * Main price resolver used by cart.js.
     * Returns event price if active, else falls back to product.sellingPrice.
     * @param {Object} product — product object from productsStore with { id, sellingPrice, price }
     */
    const getCurrentPrice = (product) => {
        const eventPrice = getEventPrice(product.id)
        if (eventPrice !== null) return eventPrice
        return product.sellingPrice ?? product.price ?? 0
    }

    /**
     * Items belonging to a specific pricelist
     */
    const getItemsByPricelist = (pricelistId) =>
        pricelistItems.value.filter(i => i.pricelistId === pricelistId)

    // ── Actions ───────────────────────────────────────────────────────────────

    const fetchPricelists = async () => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            pricelists.value = MOCK_PRICELISTS.map(pl => ({ ...pl }))
            pricelistItems.value = MOCK_PRICELIST_ITEMS.map(i => ({ ...i }))
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const [plRes, pliRes] = await Promise.all([
                apiClient.get('/pricelists'),
                apiClient.get('/pricelist-items'),
            ])
            pricelists.value = plRes.data?.data ?? plRes.data ?? []
            pricelistItems.value = pliRes.data?.data ?? pliRes.data ?? []
            return { success: true }
        } catch (err) {
            error.value = err.response?.data?.message || 'Gagal memuat pricelist'
            return { success: false, message: error.value }
        } finally { loading.value = false }
    }

    /**
     * Activate one pricelist and deactivate all others (single-active constraint).
     */
    const activatePricelist = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 150))
            pricelists.value.forEach(pl => { pl.is_active = pl.id === id })
            MOCK_PRICELISTS.forEach(pl => { pl.is_active = pl.id === id })
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.patch(`/pricelists/${id}/activate`)
            pricelists.value.forEach(pl => { pl.is_active = pl.id === id })
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal mengaktifkan pricelist' }
        } finally { loading.value = false }
    }

    /**
     * Deactivate all pricelists.
     */
    const deactivateAll = async () => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 100))
            pricelists.value.forEach(pl => { pl.is_active = false })
            MOCK_PRICELISTS.forEach(pl => { pl.is_active = false })
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.patch('/pricelists/deactivate-all')
            pricelists.value.forEach(pl => { pl.is_active = false })
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menonaktifkan pricelists' }
        } finally { loading.value = false }
    }

    // ── Pricelist CRUD ────────────────────────────────────────────────────────

    const addPricelist = async (payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            const newPl = {
                id: `pl-${nextPlId++}`,
                name: payload.name,
                description: payload.description || '',
                is_active: false,
                createdAt: new Date().toISOString(),
            }
            MOCK_PRICELISTS.push(newPl)
            pricelists.value.push({ ...newPl })
            loading.value = false
            return { success: true, data: newPl }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post('/pricelists', payload)
            const created = res.data?.data ?? res.data
            pricelists.value.push(created)
            return { success: true, data: created }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menambah pricelist' }
        } finally { loading.value = false }
    }

    const updatePricelist = async (id, payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 150))
            const idx = pricelists.value.findIndex(pl => pl.id === id)
            const mockIdx = MOCK_PRICELISTS.findIndex(pl => pl.id === id)
            if (idx !== -1) pricelists.value[idx] = { ...pricelists.value[idx], ...payload }
            if (mockIdx !== -1) MOCK_PRICELISTS[mockIdx] = { ...MOCK_PRICELISTS[mockIdx], ...payload }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.put(`/pricelists/${id}`, payload)
            const idx = pricelists.value.findIndex(pl => pl.id === id)
            if (idx !== -1) pricelists.value[idx] = { ...pricelists.value[idx], ...payload }
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal mengupdate pricelist' }
        } finally { loading.value = false }
    }

    const deletePricelist = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            const idx = pricelists.value.findIndex(pl => pl.id === id)
            const mockIdx = MOCK_PRICELISTS.findIndex(pl => pl.id === id)
            if (idx !== -1) pricelists.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_PRICELISTS.splice(mockIdx, 1)
            // Remove all items belonging to this pricelist
            pricelistItems.value = pricelistItems.value.filter(i => i.pricelistId !== id)
            MOCK_PRICELIST_ITEMS = MOCK_PRICELIST_ITEMS.filter(i => i.pricelistId !== id)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/pricelists/${id}`)
            const idx = pricelists.value.findIndex(pl => pl.id === id)
            if (idx !== -1) pricelists.value.splice(idx, 1)
            pricelistItems.value = pricelistItems.value.filter(i => i.pricelistId !== id)
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menghapus pricelist' }
        } finally { loading.value = false }
    }

    // ── PricelistItem CRUD ────────────────────────────────────────────────────

    /**
     * Add a product to a pricelist.
     * @param {string} pricelistId
     * @param {Object} product      — { id, name, sku }
     * @param {number} eventPrice
     */
    const addPricelistItem = async (pricelistId, product, eventPrice) => {
        // Check duplicate
        const exists = pricelistItems.value.find(
            i => i.pricelistId === pricelistId && i.productId === product.id
        )
        if (exists) return { success: false, message: 'Produk sudah ada dalam pricelist ini' }

        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 150))
            const newItem = {
                id: `pli-${nextPliId++}`,
                pricelistId,
                productId: product.id,
                productName: product.name,
                productSku: product.sku || '',
                eventPrice,
            }
            MOCK_PRICELIST_ITEMS.push(newItem)
            pricelistItems.value.push({ ...newItem })
            loading.value = false
            return { success: true, data: newItem }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post('/pricelist-items', { pricelistId, productId: product.id, eventPrice })
            const created = res.data?.data ?? res.data
            pricelistItems.value.push(created)
            return { success: true, data: created }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menambah item' }
        } finally { loading.value = false }
    }

    /**
     * Update event price for a pricelist item.
     */
    const updatePricelistItem = async (itemId, eventPrice) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 100))
            const idx = pricelistItems.value.findIndex(i => i.id === itemId)
            const mockIdx = MOCK_PRICELIST_ITEMS.findIndex(i => i.id === itemId)
            if (idx !== -1) pricelistItems.value[idx].eventPrice = eventPrice
            if (mockIdx !== -1) MOCK_PRICELIST_ITEMS[mockIdx].eventPrice = eventPrice
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.put(`/pricelist-items/${itemId}`, { eventPrice })
            const idx = pricelistItems.value.findIndex(i => i.id === itemId)
            if (idx !== -1) pricelistItems.value[idx].eventPrice = eventPrice
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal mengupdate harga event' }
        } finally { loading.value = false }
    }

    const removePricelistItem = async (itemId) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 100))
            const idx = pricelistItems.value.findIndex(i => i.id === itemId)
            const mockIdx = MOCK_PRICELIST_ITEMS.findIndex(i => i.id === itemId)
            if (idx !== -1) pricelistItems.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_PRICELIST_ITEMS.splice(mockIdx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/pricelist-items/${itemId}`)
            const idx = pricelistItems.value.findIndex(i => i.id === itemId)
            if (idx !== -1) pricelistItems.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menghapus item' }
        } finally { loading.value = false }
    }

    return {
        // State
        pricelists,
        pricelistItems,
        loading,
        error,

        // Computed
        activePricelist,
        hasActiveEvent,

        // Price resolver (used by cart.js)
        getCurrentPrice,
        getEventPrice,
        getItemsByPricelist,

        // Actions
        fetchPricelists,
        activatePricelist,
        deactivateAll,
        addPricelist,
        updatePricelist,
        deletePricelist,
        addPricelistItem,
        updatePricelistItem,
        removePricelistItem,
    }
})
