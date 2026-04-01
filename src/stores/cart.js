import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { useAuthStore } from './auth'

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

    const newOrder = {
      id: orderId,
      status: 'pending',
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

  const addItem = (orderId, productData) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    // FIX BUG-1: Merge duplicate products instead of creating new rows
    const existingIndex = order.items.findIndex(i => i.productId === productData.id)
    if (existingIndex !== -1) {
      const existing = order.items[existingIndex]
      existing.quantity += 1
      existing.subtotal = Math.round(existing.price * existing.quantity * 100) / 100
    } else {
      // FIX BUG-2: No per-item discount field — use order-level discountPercent only
      order.items.push({
        productId: productData.id,
        name: productData.name,
        quantity: 1,
        price: productData.sellingPrice,
        hpp: productData.hpp || 0,
        subtotal: productData.sellingPrice,
      })
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
    item.quantity = quantity
    // FIX BUG-2: No per-item discount — subtotal is price * quantity
    item.subtotal = Math.round(item.price * quantity * 100) / 100
    order.lastModified = new Date().toISOString()
    updateOrderSummary(orderId)
    persistToStorage()

    return { success: true }
  }

  const updateOrderSummary = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return

    const subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0)
    const discountAmount = (subtotal * (order.summary.discountPercent || 0)) / 100
    const taxAmount = ((subtotal - discountAmount) * (order.summary.taxPercent || 0)) / 100

    order.summary.subtotal = Math.round(subtotal * 100) / 100
    order.summary.tax = Math.round(taxAmount * 100) / 100
    order.summary.total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100

    // Calculate profit estimate
    order.metadata.profitEstimate = order.items.reduce((profit, item) => {
      const itemProfit = (item.price - item.hpp) * item.quantity
      return profit + itemProfit
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
        })),
      }
      console.log('[Mock] POST /transactions payload:', JSON.stringify(payload, null, 2))

      // Simulate 1 second network delay
      await new Promise(r => setTimeout(r, 1000))

      const mockTransactionId = `mock-txn-${Date.now()}`
      order.status = 'submitted'
      order.metadata.submittedAt = new Date().toISOString()
      order.metadata.transactionId = mockTransactionId
      persistToStorage()

      console.log(`[Mock] Transaksi berhasil! ID: ${mockTransactionId}`)
      return { success: true, transactionId: mockTransactionId }
    }
    // ── REAL API ───────────────────────────────────────────────────────────

    try {
      // Backend: POST /transactions
      // Send only IDs and qty — backend recalculates prices server-side
      const response = await apiClient.post('/transactions', {
        paymentMethod: order.paymentMethod || 'CASH',
        status: 'COMPLETED',
        memberId: order.member?.id || undefined,
        items: order.items.map(item => ({
          productId: item.productId,
          qty: item.quantity,  // Backend uses 'qty' not 'quantity'
        })),
      })

      order.status = 'submitted'
      order.metadata.submittedAt = new Date().toISOString()
      order.metadata.transactionId = response.data?.id || response.data?.data?.id
      persistToStorage()

      return { success: true, transactionId: order.metadata.transactionId }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Gagal submit transaksi' }
    }
  }

  const clearOrder = (orderId) => {
    const index = orders.value.findIndex(o => o.id === orderId)
    if (index === -1) {
      return { success: false, message: 'Order not found' }
    }

    orders.value.splice(index, 1)

    if (activeOrderId.value === orderId) {
      activeOrderId.value = orders.value[0]?.id || null
    }

    persistToStorage()
    return { success: true }
  }

  const clearAllOrders = () => {
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
