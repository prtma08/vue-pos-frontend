import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { useAuthStore } from './auth'
import { useProductsStore } from './products'
import { useShiftStore } from './shift'
import { usePricelistStore } from './pricelist'
import { useDiscountsStore } from './discounts'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const useCartStore = defineStore('cart', () => {
  // Constants
  const STORAGE_KEY = 'pos_pending_orders_v1'
  const SUPERVISOR_AUTH_THRESHOLD = 100000 // Rp 100.000
  const MAX_PENDING_ORDERS = 5

  // State
  const orders = ref([])
  const activeOrderId = ref(null)
  const supervisorAuthPending = ref(null)
  const persistenceEnabled = ref(true)

  // Computed
  const activeOrder = computed(() => {
    return orders.value.find(o => o.id === activeOrderId.value)
  })

  const pendingOrderCount = computed(() => {
    return orders.value.length
  })

  const canCreateNewOrder = computed(() => {
    return orders.value.length < MAX_PENDING_ORDERS
  })

  const allOrdersTotal = computed(() => {
    return orders.value.reduce((sum, order) => sum + (order.summary?.total || 0), 0)
  })

  const orderTotal = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return 0
    return calculateOrderTotal(order)
  }

  const orderProfit = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return 0

    return order.items.reduce((profit, item) => {
      const itemProfit = (item.price - (item.hpp || 0)) * item.quantity
      return profit + itemProfit
    }, 0)
  }

  // Helper functions
  const generateOrderId = () => {
    return `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const calculateOrderTotal = (order) => {
    const subtotal = order.items.reduce((sum, item) => {
      return sum + (item.subtotal || 0)
    }, 0)

    const discountAmount = (subtotal * (order.summary?.discountPercent || 0)) / 100
    const taxAmount = ((subtotal - discountAmount) * (order.summary?.taxPercent || 0)) / 100

    return Math.round((subtotal - discountAmount + taxAmount) * 100) / 100
  }

  const requiresSupervisorAuth = (action, amount = 0) => {
    return amount >= SUPERVISOR_AUTH_THRESHOLD
  }

  const persistToStorage = () => {
    if (!persistenceEnabled.value) return

    try {
      const data = {
        orders: orders.value,
        activeOrderId: activeOrderId.value,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('[Cart] Failed to persist to storage:', err)
    }
  }

  const initializeFromStorage = () => {
    if (!persistenceEnabled.value) return

    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        orders.value = parsed.orders || []
        activeOrderId.value = parsed.activeOrderId || (orders.value[0]?.id || null)
        return true
      }
    } catch (err) {
      console.error('[Cart] Failed to restore from storage:', err)
    }
    return false
  }

  // Actions
  const createOrder = () => {
    if (!canCreateNewOrder.value) {
      return { success: false, message: `Maximum ${MAX_PENDING_ORDERS} orders allowed` }
    }

    const authStore = useAuthStore()
    const orderId = generateOrderId()

    // ── Langkah 4 URD: Lock stok order yang sedang aktif saat kasir membuat order baru ──
    // Saat ada order ke-2 dibuat, order yang sedang aktif dijadikan "pending" secara permanent
    // Stok-nya di-deduct (bukan hanya reserve) agar barang tidak terjual ke order lain
    if (orders.value.length >= 1 && activeOrderId.value) {
      const currentOrder = orders.value.find(o => o.id === activeOrderId.value)
      if (currentOrder && !currentOrder.stockLocked && currentOrder.items.length > 0) {
        const productsStore = useProductsStore()
        for (const item of currentOrder.items) {
          // Release reservation kemudian deduct permanent
          if (item.isBundle && item.bundleItems) {
            for (const comp of item.bundleItems) {
              productsStore.releaseReservedStock(comp.productId, (comp.qty || 1) * item.quantity)
              productsStore.deductStock(comp.productId, (comp.qty || 1) * item.quantity)
            }
          } else {
            productsStore.releaseReservedStock(item.productId, item.quantity)
            productsStore.deductStock(item.productId, item.quantity)
          }
        }
        currentOrder.stockLocked = true
        if (import.meta.env.DEV) {
          console.log('[Cart] Pending stock locked for order:', currentOrder.id)
        }
      }
    }

    const newOrder = {
      id: orderId,
      status: 'pending',
      customerName: '', // D7: nama customer untuk pending order
      paymentMethod: 'CASH', // Default; selectable by kasir: CASH | TRANSFER | QRIS
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      items: [],
      summary: {
        subtotal: 0,
        tax: 0,
        discountPercent: 0,
        total: 0,
        notes: '',
        taxPercent: 0,
      },
      member: null,
      metadata: {
        createdBy: authStore.user?.id || 'unknown',
        profitEstimate: 0,
      },
    }

    orders.value.push(newOrder)
    activeOrderId.value = orderId
    persistToStorage()

    return { success: true, orderId }
  }

  const setActiveOrder = (orderId) => {
    if (orders.value.find(o => o.id === orderId)) {
      activeOrderId.value = orderId
      persistToStorage()
      return { success: true }
    }
    return { success: false, message: 'Order not found' }
  }

  // ── Stacked price helper ───────────────────────────────────────────────────
  // Stacking order (akumulatif sesuai URD):
  //   1. Base Price   → dari pricelist event aktif, atau harga normal
  //   2. Event Flag   → tandai apakah sedang event
  //   3. Member Disc  → potongan % member dari base price
  //   4. Product Disc → potongan diskon per-produk setelah member discount
  const _computeItemPrices = (productData, order) => {
    const pricelistStore = usePricelistStore()
    const basePrice = pricelistStore.getCurrentPrice(productData)
    const isEventPrice = pricelistStore.hasActiveEvent &&
      pricelistStore.getEventPrice(productData.id) !== null

    // Step 3: Member discount
    const memberDiscountPct = order.member?.discountPercent ?? 0
    const priceAfterMember = Math.round(basePrice * (1 - memberDiscountPct / 100) * 100) / 100

    // Step 4: Per-product discount (Langkah 3 URD)
    // useDiscountsStore() is a sync Pinia singleton — safely callable here
    let priceAfterProductDisc = priceAfterMember
    let itemPromoDiscount = 0
    let itemPromoLabel = null

    try {
      const discStore = useDiscountsStore()
      const activeProductDiscs = discStore.getActiveProductDiscounts(productData.id)
      if (activeProductDiscs.length > 0) {
        const disc = activeProductDiscs[0]
        itemPromoDiscount = disc.type === 'PERCENTAGE'
          ? Math.round(priceAfterMember * disc.value / 100 * 100) / 100
          : Math.min(disc.value, priceAfterMember)
        priceAfterProductDisc = Math.max(0, Math.round((priceAfterMember - itemPromoDiscount) * 100) / 100)
        itemPromoLabel = disc.name
      }
    } catch (_) {
      // discountsStore belum terinisialisasi — lewati saja
    }

    return { basePrice, isEventPrice, priceAfterMember, priceAfterProductDisc, itemPromoDiscount, itemPromoLabel }
  }

  const addItem = (orderId, productData) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    // Detect bundle/package products
    const isBundle = productData.type === 'BUNDLE' && Array.isArray(productData.bundleItems)

    const { basePrice, isEventPrice, priceAfterMember, priceAfterProductDisc, itemPromoDiscount, itemPromoLabel } = _computeItemPrices(productData, order)

    // FIX BUG-1: Merge duplicate products instead of creating new rows
    const existingIndex = order.items.findIndex(i => i.productId === productData.id)
    if (existingIndex !== -1) {
      const existing = order.items[existingIndex]
      existing.quantity += 1
      existing.subtotal = Math.round(existing.price * existing.quantity * 100) / 100
      // E2 FIX: For bundles, reserve each component's stock; for regulars reserve own stock
      if (isBundle && existing.bundleItems) {
        for (const comp of existing.bundleItems) {
          useProductsStore().reserveStock(comp.productId, comp.qty || 1)
        }
      } else {
        useProductsStore().reserveStock(productData.id, 1)
      }
    } else {
      order.items.push({
        productId: productData.id,
        name: productData.name,
        quantity: 1,
        // Pricing snapshot at time of add
        basePrice,                    // Harga normal / event pricelist
        isEventPrice,                 // true jika menggunakan harga event
        priceAfterMember,             // Harga setelah diskon member
        price: priceAfterProductDisc, // Harga FINAL per unit (setelah semua diskon)
        // Diskon per-produk (Langkah 3 & 4 URD)
        itemPromoDiscount: itemPromoDiscount || 0,  // Nominal potongan per unit
        itemPromoLabel: itemPromoLabel || null,   // Label "Diskon Promo" di kasir
        // HPP snapshot
        hpp: isBundle ? (productData.bundleHpp ?? 0) : (productData.hpp || 0),
        subtotal: priceAfterProductDisc, // 1 × price final
        // Bundle metadata
        isBundle,
        bundleItems: isBundle ? productData.bundleItems : undefined,
      })
      // E2 FIX: For bundles, reserve each component's stock; for regulars reserve own stock
      if (isBundle && productData.bundleItems) {
        for (const comp of productData.bundleItems) {
          useProductsStore().reserveStock(comp.productId, comp.qty || 1)
        }
      } else {
        useProductsStore().reserveStock(productData.id, 1)
      }
    }

    order.lastModified = new Date().toISOString()
    updateOrderSummary(orderId)
    persistToStorage()

    return { success: true }
  }

  const removeItem = (orderId, itemIndex) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || itemIndex < 0 || itemIndex >= order.items.length) {
      return { success: false, message: 'Invalid order or item' }
    }

    const item = order.items[itemIndex]
    // E2 FIX: Release component stocks for bundles
    if (item.isBundle && item.bundleItems) {
      for (const comp of item.bundleItems) {
        useProductsStore().releaseReservedStock(comp.productId, (comp.qty || 1) * item.quantity)
      }
    } else {
      useProductsStore().releaseReservedStock(item.productId, item.quantity)
    }
    order.items.splice(itemIndex, 1)
    order.lastModified = new Date().toISOString()
    updateOrderSummary(orderId)
    persistToStorage()

    return { success: true }
  }

  const updateQuantity = (orderId, itemIndex, quantity) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || itemIndex < 0 || itemIndex >= order.items.length) {
      return { success: false, message: 'Invalid order or item' }
    }

    if (quantity <= 0) {
      return removeItem(orderId, itemIndex)
    }

    const item = order.items[itemIndex]
    const diff = quantity - item.quantity
    // E2 FIX: Reserve/release component stocks for bundles
    if (item.isBundle && item.bundleItems) {
      for (const comp of item.bundleItems) {
        if (diff > 0) useProductsStore().reserveStock(comp.productId, (comp.qty || 1) * diff)
        else if (diff < 0) useProductsStore().releaseReservedStock(comp.productId, (comp.qty || 1) * Math.abs(diff))
      }
    } else {
      if (diff > 0) useProductsStore().reserveStock(item.productId, diff)
      else if (diff < 0) useProductsStore().releaseReservedStock(item.productId, Math.abs(diff))
    }

    item.quantity = quantity
    // Subtotal uses priceAfterMember (stored in `price`) × qty
    item.subtotal = Math.round(item.price * quantity * 100) / 100
    order.lastModified = new Date().toISOString()
    updateOrderSummary(orderId)
    persistToStorage()

    return { success: true }
  }

  const updateOrderSummary = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return

    // subtotal = ∑ (priceAfterMember × qty) — already stored in item.subtotal
    const subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0)

    // Transaction-level discount applied on top of member-discounted subtotal
    const discountAmount = (subtotal * (order.summary.discountPercent || 0)) / 100
    const taxAmount = ((subtotal - discountAmount) * (order.summary.taxPercent || 0)) / 100

    order.summary.subtotal = Math.round(subtotal * 100) / 100
    order.summary.tax = Math.round(taxAmount * 100) / 100
    order.summary.total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100

    // Profit estimate uses basePrice (before member discount) vs hpp
    order.metadata.profitEstimate = order.items.reduce((profit, item) => {
      const unitBase = item.basePrice ?? item.price  // fall back for legacy items
      return profit + (unitBase - (item.hpp || 0)) * item.quantity
    }, 0)
  }

  const applyDiscount = async (orderId, discountPercent, requireAuth = false) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    const discountAmount = (order.summary.subtotal * discountPercent) / 100

    if (requireAuth && requiresSupervisorAuth('discount', discountAmount)) {
      supervisorAuthPending.value = {
        orderId,
        action: 'discount',
        discountPercent,
        amount: discountAmount,
        reason: `Apply ${discountPercent}% discount (Rp ${Math.round(discountAmount).toLocaleString('id-ID')})`,
        timestamp: new Date().toISOString(),
      }
      return { success: false, requiresAuth: true, message: 'Supervisor authorization required' }
    }

    order.summary.discountPercent = discountPercent
    order.lastModified = new Date().toISOString()
    updateOrderSummary(orderId)
    persistToStorage()

    return { success: true }
  }

  const changePriceItem = async (orderId, itemIndex, newPrice, requireAuth = false) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || itemIndex < 0 || itemIndex >= order.items.length) {
      return { success: false, message: 'Invalid order or item' }
    }

    const item = order.items[itemIndex]
    const priceChange = (newPrice - item.price) * item.quantity

    if (requireAuth && requiresSupervisorAuth('priceChange', Math.abs(priceChange))) {
      supervisorAuthPending.value = {
        orderId,
        action: 'priceChange',
        itemIndex,
        oldPrice: item.price,
        newPrice,
        amount: Math.abs(priceChange),
        reason: `Change price from Rp ${Math.round(item.price).toLocaleString('id-ID')} to Rp ${Math.round(newPrice).toLocaleString('id-ID')}`,
        timestamp: new Date().toISOString(),
      }
      return { success: false, requiresAuth: true, message: 'Supervisor authorization required' }
    }

    item.price = newPrice
    item.subtotal = Math.round(newPrice * item.quantity * 100) / 100
    order.lastModified = new Date().toISOString()
    updateOrderSummary(orderId)
    persistToStorage()

    return { success: true }
  }

  const setMember = (orderId, memberData) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    order.member = memberData
    order.lastModified = new Date().toISOString()
    persistToStorage()

    return { success: true }
  }

  const requestSupervisorAuth = (orderId, action, metadata) => {
    supervisorAuthPending.value = {
      orderId,
      action,
      ...metadata,
      timestamp: new Date().toISOString(),
    }
  }

  const completeSupervisorAuth = async (approved, supervisorId = null) => {
    if (!supervisorAuthPending.value) {
      return { success: false, message: 'No pending authorization' }
    }

    if (!approved) {
      supervisorAuthPending.value = null
      return { success: false, message: 'Authorization rejected' }
    }

    const pending = { ...supervisorAuthPending.value }

    // Apply the approved action directly
    const order = orders.value.find(o => o.id === pending.orderId)

    if (pending.action === 'discount' && order) {
      order.summary.discountPercent = pending.discountPercent
      updateOrderSummary(pending.orderId)
    } else if (pending.action === 'priceChange' && order && pending.itemIndex !== undefined) {
      const item = order.items[pending.itemIndex]
      if (item) {
        item.price = pending.newPrice
        item.subtotal = Math.round(pending.newPrice * item.quantity * 100) / 100
        updateOrderSummary(pending.orderId)
      }
    }

    persistToStorage()
    supervisorAuthPending.value = null

    return { success: true, message: 'Action authorized and applied' }
  }

  const setPaymentMethod = (orderId, method) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return { success: false, message: 'Order not found' }
    order.paymentMethod = method // 'CASH' | 'TRANSFER' | 'QRIS'
    persistToStorage()
    return { success: true }
  }

  // ── Deduct stock for all items (handles bundles) ──────────────────────────
  const deductOrderStock = (order) => {
    const productsStore = useProductsStore()
    for (const item of order.items) {
      productsStore.releaseReservedStock(item.productId, item.quantity)
      if (item.isBundle && item.bundleItems) {
        // Bundle: deduct each component product's stock
        for (const component of item.bundleItems) {
          productsStore.deductStock(component.productId, component.qty * item.quantity)
        }
      } else {
        // Regular product: deduct its own stock
        productsStore.deductStock(item.productId, item.quantity)
      }
    }
    if (import.meta.env.DEV) {
      console.log('[Cart] Stock deducted for order:', order.id)
    }
  }

  const submitOrder = async (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    // ── MOCK MODE ──────────────────────────────────────────────────────────
    if (USE_MOCK) {
      const payload = {
        paymentMethod: order.paymentMethod || 'CASH',
        status: 'COMPLETED',
        memberId: order.member?.id || undefined,
        items: order.items.map(item => ({
          productId: item.productId,
          qty: item.quantity,
          isBundle: item.isBundle || false,
          bundleItems: item.bundleItems || undefined,
        })),
      }
      console.log('[Mock] POST /transactions payload:', JSON.stringify(payload, null, 2))

      // Simulate 1 second network delay
      await new Promise(r => setTimeout(r, 1000))

      // Deduct stock (bundle components + regular items)
      deductOrderStock(order)

      const mockTransactionId = `mock-txn-${Date.now()}`
      order.status = 'submitted'
      order.metadata.submittedAt = new Date().toISOString()
      order.metadata.transactionId = mockTransactionId
      persistToStorage()

      // B7 FIX: Record transaction in active shift so totalSales is accurate
      try { useShiftStore().recordTransaction(mockTransactionId, order.summary.total) } catch { /* shift may not be open */ }

      console.log(`[Mock] Transaksi berhasil! ID: ${mockTransactionId}`)
      return { success: true, transactionId: mockTransactionId }
    }
    // ── REAL API ───────────────────────────────────────────────────────────

    try {
      // Backend: POST /transactions
      // Send only IDs and qty — backend recalculates prices server-side
      const response = await apiClient.post('/transactions', {
        paymentMethod: order.paymentMethod || 'CASH',
        status: order.status || 'COMPLETED',
        memberId: order.member?.id || undefined,
        customerName: order.customerName || undefined,
        items: order.items.map(item => ({
          productId: item.productId,
          qty: item.quantity,
        })),
      })

      const txData = response.data.data ?? response.data

      // Deduct stock locally after successful API response
      deductOrderStock(order)

      order.status = 'submitted'
      order.metadata.submittedAt = new Date().toISOString()
      order.metadata.transactionId = txData?.id
      persistToStorage()

      // B7 FIX: Record transaction in active shift so totalSales is accurate
      try { useShiftStore().recordTransaction(order.metadata.transactionId, order.summary.total) } catch { /* shift may not be open */ }

      return { success: true, transactionId: order.metadata.transactionId }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    }
  }

  const clearOrder = (orderId) => {
    const index = orders.value.findIndex(o => o.id === orderId)
    if (index === -1) {
      return { success: false, message: 'Order not found' }
    }

    const orderToClear = orders.value[index]
    // Jika stok sudah di-lock (deduct), jangan release — stoknya sudah terpotong permanent
    if (!orderToClear.stockLocked) {
      orderToClear.items.forEach(item => {
        useProductsStore().releaseReservedStock(item.productId, item.quantity)
      })
    }
    orders.value.splice(index, 1)

    if (activeOrderId.value === orderId) {
      activeOrderId.value = orders.value[0]?.id || null
    }

    persistToStorage()
    return { success: true }
  }

  const clearAllOrders = () => {
    orders.value.forEach(order => {
      order.items.forEach(item => {
        useProductsStore().releaseReservedStock(item.productId, item.quantity)
      })
    })
    orders.value = []
    activeOrderId.value = null
    supervisorAuthPending.value = null
    persistToStorage()
    return { success: true }
  }

  return {
    // State
    orders,
    activeOrderId,
    supervisorAuthPending,
    persistenceEnabled,

    // Computed
    activeOrder,
    pendingOrderCount,
    canCreateNewOrder,
    allOrdersTotal,

    // Actions
    createOrder,
    setActiveOrder,
    addItem,
    removeItem,
    updateQuantity,
    applyDiscount,
    changePriceItem,
    setMember,
    setPaymentMethod,
    requestSupervisorAuth,
    completeSupervisorAuth,
    submitOrder,
    clearOrder,
    clearAllOrders,
    initializeFromStorage,
    persistToStorage,

    // Getters
    orderTotal,
    orderProfit,
    requiresSupervisorAuth,
  }
})
