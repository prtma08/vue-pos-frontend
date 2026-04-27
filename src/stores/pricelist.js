import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
let MOCK_PRICELISTS = [
    {
        id: 'pl-1',
        name: 'Promo Lebaran',
        description: 'Harga spesial Lebaran 2026',
        isActive: true,
        createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
        id: 'pl-2',
        name: 'Flash Sale Akhir Bulan',
        description: 'Diskon produk pilihan akhir bulan',
        isActive: false,
        createdAt: '2026-03-25T00:00:00.000Z',
    },
]

// pricelistItems: { id, pricelistId, productId, productName, productSku, newPrice }
let MOCK_PRICELIST_ITEMS = [
    { id: 'pli-1', pricelistId: 'pl-1', productId: 'prod-1', productName: 'Nasi Goreng Spesial', productSku: 'MKN-001', newPrice: 20000 },
    { id: 'pli-2', pricelistId: 'pl-1', productId: 'prod-4', productName: 'Es Teh Manis', productSku: 'MNM-001', newPrice: 4000 },
    { id: 'pli-3', pricelistId: 'pl-1', productId: 'prod-7', productName: 'Kentang Goreng', productSku: 'SNK-001', newPrice: 10000 },
    { id: 'pli-4', pricelistId: 'pl-2', productId: 'prod-2', productName: 'Mie Ayam Bakso', productSku: 'MKN-002', newPrice: 15000 },
    { id: 'pli-5', pricelistId: 'pl-2', productId: 'prod-5', productName: 'Jus Alpukat', productSku: 'MNM-002', newPrice: 12000 },
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

    const normalizePricelist = (pl) => ({
        id: pl?.ID ?? pl?.id ?? '',
        name: pl?.Name ?? pl?.name ?? '',
        description: pl?.Description ?? pl?.description ?? '',
        isActive: pl?.IsActive ?? pl?.isActive ?? false,
        createdAt: pl?.CreatedAt ?? pl?.createdAt ?? new Date().toISOString()
    })

    const normalizePricelistItem = (pli, plId) => ({
        id: pli?.ID ?? pli?.id ?? '',
        pricelistId: pli?.PricelistId ?? pli?.PricelistID ?? pli?.pricelistId ?? plId ?? '',
        productId: pli?.ProductId ?? pli?.ProductID ?? pli?.productId ?? '',
        productName: pli?.product?.name ?? pli?.ProductName ?? pli?.productName ?? '',
        productSku: pli?.product?.sku ?? pli?.ProductSku ?? pli?.ProductSKU ?? pli?.productSku ?? '',
        newPrice: Number(pli?.NewPrice ?? pli?.newPrice ?? 0),
        // Snapshot the true normal price & HPP from the product object embedded in the item response.
        // This is immune to the backend active-pricelist price override on the main /products endpoint.
        normalPrice: Number(pli?.product?.price ?? pli?.product?.sellingPrice ?? pli?.ProductPrice ?? pli?.normalPrice ?? 0),
        hppSnapshot: Number(pli?.product?.hppAverage ?? pli?.product?.hpp ?? pli?.HPP ?? pli?.hppSnapshot ?? 0),
    })

    /**
     * Persistent cache of { [productId]: { normalPrice, hpp } } stored in localStorage.
     * This allows us to remember the REAL selling price of each product independent of
     * whether the backend's /products endpoint overrides it with an active event price.
     */
    const CACHE_KEY = 'nx-price-base-cache'
    const normalPriceCache = ref(
        (() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} } })()
    )
    const persistCache = () => {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(normalPriceCache.value)) } catch { }
    }
    /**
     * Seed the cache for a product from the productsStore.
     * Should be called BEFORE the active pricelist can override the product's price.
     */
    const seedNormalPrice = (productId, normalPrice, hpp) => {
        if (!normalPriceCache.value[productId]) {
            normalPriceCache.value[productId] = { normalPrice: Number(normalPrice || 0), hpp: Number(hpp || 0) }
            persistCache()
        }
    }
    const getCachedNormalPrice = (productId) => normalPriceCache.value[productId]?.normalPrice ?? 0
    const getCachedHpp = (productId) => normalPriceCache.value[productId]?.hpp ?? 0

    // ── Computed ──────────────────────────────────────────────────────────────
    const activePricelist = computed(() =>
        pricelists.value.find(pl => pl.isActive) ?? null
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
        return item ? item.newPrice : null
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
            const plRes = await apiClient.get('/price-lists').catch(() => ({ data: [] }))
            const rawPls = plRes.data?.data ?? plRes.data ?? []

            pricelists.value = Array.isArray(rawPls) ? rawPls.map(normalizePricelist) : []

            const newItems = []

            // Auto fetch active pricelist explicitly to init cart prices correctly since index doesn't return items
            const activePl = pricelists.value.find(p => p.isActive)
            if (activePl) {
                const activeRes = await apiClient.get(`/price-lists/${activePl.id}`).catch(() => null)
                const detailedPl = activeRes?.data?.data ?? activeRes?.data
                if (detailedPl && Array.isArray(detailedPl.items)) {
                    detailedPl.items.forEach(item => {
                        newItems.push(normalizePricelistItem(item, activePl.id))
                    })
                }
            }
            pricelistItems.value = newItems
            return { success: true }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            error.value = errMsg
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    const fetchPricelistById = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 150))
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get(`/price-lists/${id}`)
            const pl = res.data?.data ?? res.data
            if (pl && Array.isArray(pl.items)) {
                pricelistItems.value = pricelistItems.value.filter(i => i.pricelistId !== id)
                const newItems = pl.items.map(item => {
                    const normalized = normalizePricelistItem(item, id)
                    // Backfill normalPrice/hppSnapshot from persistent localStorage cache if available
                    // (set when the product was first-added to a pricelist or when products were first loaded)
                    if (!normalized.normalPrice && getCachedNormalPrice(normalized.productId)) {
                        normalized.normalPrice = getCachedNormalPrice(normalized.productId)
                        normalized.hppSnapshot = getCachedHpp(normalized.productId)
                    }
                    return normalized
                })
                pricelistItems.value.push(...newItems)
            }
            return { success: true, data: pl }
        } catch (err) {
            console.error(err)
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            error.value = errMsg
            return { success: false, message: errMsg }
        } finally { loading.value = false }
    }

    /**
     * Activate one pricelist and deactivate all others (single-active constraint).
     */
    const activatePricelist = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 150))
            pricelists.value.forEach(pl => { pl.isActive = pl.id === id })
            MOCK_PRICELISTS.forEach(pl => { pl.isActive = pl.id === id })
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.put(`/price-lists/${id}/activate`)
            pricelists.value.forEach(pl => { pl.isActive = pl.id === id })
            return { success: true }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    /**
     * Deactivate all pricelists.
     */
    const deactivateAll = async () => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 100))
            pricelists.value.forEach(pl => { pl.isActive = false })
            MOCK_PRICELISTS.forEach(pl => { pl.isActive = false })
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.put('/price-lists/default')
            pricelists.value.forEach(pl => { pl.isActive = false })
            return { success: true }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
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
                isActive: payload.isActive ?? false,
                createdAt: new Date().toISOString(),
            }
            MOCK_PRICELISTS.push(newPl)
            pricelists.value.push({ ...newPl })
            // Items are empty on mock add
            loading.value = false
            return { success: true, data: newPl }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const finalPayload = { ...payload, isActive: payload.isActive ?? false, items: payload.items ?? [] }
            const res = await apiClient.post('/price-lists', finalPayload)
            const created = res.data?.data ?? res.data
            pricelists.value.push(normalizePricelist(created))
            return { success: true, data: created }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
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
            // Get full items array from state to send via PUT
            let items = payload.items
            if (!items) {
                // If not provided in payload, gather from state
                items = pricelistItems.value
                    .filter(i => i.pricelistId === id)
                    .map(i => ({ productId: i.productId, newPrice: i.newPrice }))
            }
            const finalPayload = { ...payload, isActive: payload.isActive ?? false, items }
            await apiClient.put(`/price-lists/${id}`, finalPayload)
            const idx = pricelists.value.findIndex(pl => pl.id === id)
            if (idx !== -1) pricelists.value[idx] = { ...pricelists.value[idx], ...payload }
            return { success: true }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
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
            await apiClient.delete(`/price-lists/${id}`)
            const idx = pricelists.value.findIndex(pl => pl.id === id)
            if (idx !== -1) pricelists.value.splice(idx, 1)
            pricelistItems.value = pricelistItems.value.filter(i => i.pricelistId !== id)
            return { success: true }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── PricelistItem CRUD ────────────────────────────────────────────────────

    /**
     * Helper to sync items of a single pricelist to backend using PUT /price-lists/{id}
     */
    const syncPricelistItemsToBackend = async (pricelistId, newItemsArrayRaw) => {
        const pl = pricelists.value.find(p => p.id === pricelistId)
        if (!pl) return { success: false, message: 'Pricelist tidak ditemukan' }

        const { default: apiClient } = await import('@/api/client')
        const itemsPayload = newItemsArrayRaw.map(i => ({ productId: i.productId, newPrice: i.newPrice }))

        const payload = {
            name: pl.name,
            description: pl.description,
            isActive: pl.isActive,
            items: itemsPayload
        }

        const res = await apiClient.put(`/price-lists/${pricelistId}`, payload)
        return res
    }

    /**
     * Add a product to a pricelist.
     * @param {string} pricelistId
     * @param {Object} product      — { id, name, sku }
     * @param {number} newPrice
     */
    const addPricelistItem = async (pricelistId, product, newPrice) => {
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
                newPrice,
            }
            MOCK_PRICELIST_ITEMS.push(newItem)
            pricelistItems.value.push({ ...newItem })
            loading.value = false
            return { success: true, data: newItem }
        }
        try {
            // Seed normalPriceCache for this product using the product object from productsStore
            // This is called BEFORE any backend PUT that might trigger overrides, so prices are accurate
            seedNormalPrice(product.id, product.sellingPrice ?? product.price ?? 0, product.hpp ?? 0)

            // Need to build the entire new properties array
            const currentItems = pricelistItems.value.filter(i => i.pricelistId === pricelistId)
            const newItem = {
                id: `TEMP-${Date.now()}`,
                pricelistId,
                productId: product.id,
                productName: product.name,
                productSku: product.sku || '',
                newPrice,
                normalPrice: getCachedNormalPrice(product.id),
                hppSnapshot: getCachedHpp(product.id),
            }

            const nextItemsArray = [...currentItems, newItem]
            await syncPricelistItemsToBackend(pricelistId, nextItemsArray)

            // Re-fetch all to get authoritative IDs from backend or just optimistic update
            // Since there's no unique ID returned just append
            pricelistItems.value.push(newItem)
            return { success: true, data: newItem }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    /**
     * Update event price for a pricelist item.
     */
    const updatePricelistItem = async (itemId, newPrice) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 100))
            const idx = pricelistItems.value.findIndex(i => i.id === itemId)
            const mockIdx = MOCK_PRICELIST_ITEMS.findIndex(i => i.id === itemId)
            if (idx !== -1) pricelistItems.value[idx].newPrice = newPrice
            if (mockIdx !== -1) MOCK_PRICELIST_ITEMS[mockIdx].newPrice = newPrice
            loading.value = false
            return { success: true }
        }
        try {
            const targetItem = pricelistItems.value.find(i => i.id === itemId)
            if (!targetItem) throw new Error("Item not found")
            const pricelistId = targetItem.pricelistId

            const currentItems = pricelistItems.value.filter(i => i.pricelistId === pricelistId)
            const nextItemsArray = currentItems.map(i => i.id === itemId ? { ...i, newPrice } : i)

            await syncPricelistItemsToBackend(pricelistId, nextItemsArray)

            const idx = pricelistItems.value.findIndex(i => i.id === itemId)
            if (idx !== -1) pricelistItems.value[idx].newPrice = newPrice
            return { success: true }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
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
            const targetItem = pricelistItems.value.find(i => i.id === itemId)
            if (!targetItem) throw new Error("Item not found")
            const pricelistId = targetItem.pricelistId

            const nextItemsArray = pricelistItems.value.filter(i => i.pricelistId === pricelistId && i.id !== itemId)

            await syncPricelistItemsToBackend(pricelistId, nextItemsArray)

            const idx = pricelistItems.value.findIndex(i => i.id === itemId)
            if (idx !== -1) pricelistItems.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || err.response?.statusText || err.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    return {
        // State
        pricelists,
        pricelistItems,
        loading,
        error,

        // Normal price cache (localStorage-backed)
        seedNormalPrice,
        getCachedNormalPrice,
        getCachedHpp,

        // Computed
        activePricelist,
        hasActiveEvent,

        // Price resolver (used by cart.js)
        getCurrentPrice,
        getEventPrice,
        getItemsByPricelist,

        // Actions
        fetchPricelists,
        fetchPricelistById,
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
