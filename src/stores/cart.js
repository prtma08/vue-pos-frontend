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
      cashReceived: 0, // Track cash received for CASH payments
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
  //   4. Product Disc → BEST item-level discount (max amount, member-aware)
  const _computeItemPrices = (productData, order) => {
    const pricelistStore = usePricelistStore()
    const basePrice = pricelistStore.getCurrentPrice(productData)
    const isEventPrice = pricelistStore.hasActiveEvent &&
      pricelistStore.getEventPrice(productData.id) !== null

    // Step 3: Member discount
    const memberDiscountPct = order.member?.discountPercent ?? 0
    const priceAfterMember = Math.round(basePrice * (1 - memberDiscountPct / 100) * 100) / 100

    // Phase 3 – Step 4: Best item-level discount
    // Rules:
    //   - Only include discounts where isMemberLevel=true if member is set
    //   - Pick the discount with the MAXIMUM nominal amount (not just first)
    let priceAfterProductDisc = priceAfterMember
    let itemPromoDiscount = 0
    let itemPromoLabel = null

    try {
      const discStore = useDiscountsStore()
      const hasMember = !!order.member
      const candidateDiscs = discStore.getActiveProductDiscounts(productData.id).filter(d => {
        // If isMemberLevel is true, discount only applies when member is selected
        if (d.isMemberLevel && !hasMember) return false
        return true
      })

      if (candidateDiscs.length > 0) {
        // Compute nominal discount for each candidate, pick the maximum
        let bestDisc = null
        let bestAmount = 0
        for (const disc of candidateDiscs) {
          const amount = disc.type === 'PERCENTAGE'
            ? Math.round(priceAfterMember * disc.value / 100 * 100) / 100
            : Math.min(disc.value, priceAfterMember)
          if (amount > bestAmount) {
            bestAmount = amount
            bestDisc = disc
          }
        }
        if (bestDisc) {
          itemPromoDiscount = bestAmount
          priceAfterProductDisc = Math.max(0, Math.round((priceAfterMember - itemPromoDiscount) * 100) / 100)
          itemPromoLabel = bestDisc.name
        }
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
    const isBundle = (productData.type === 'BUNDLE' || productData.isBundle) && Array.isArray(productData.bundleItems)

    // ── Phase 2: Pre-add stock validation ────────────────────────────────────
    const productsStore = useProductsStore()
    const existingItem = order.items.find(i => i.productId === productData.id)
    const currentQty = existingItem ? existingItem.quantity : 0

    if (isBundle) {
      const maxQty = productsStore.getBundleMaxQty(productData.id)
      if (maxQty <= 0) {
        return { success: false, message: `Stok komponen bundle "${productData.name}" habis` }
      }
      if (currentQty + 1 > maxQty) {
        return { success: false, message: `Stok bundle "${productData.name}" tidak mencukupi (maks: ${maxQty})` }
      }
    } else {
      const liveProduct = productsStore.getProductById(productData.id)
      const available = liveProduct?.stock ?? productData.stock ?? 0
      if (available <= 0) {
        return { success: false, message: `Stok "${productData.name}" habis` }
      }
      if (currentQty + 1 > available) {
        return { success: false, message: `Stok "${productData.name}" tidak mencukupi (tersisa: ${available})` }
      }
    }

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
        // Phase 2: Loss alert snapshot (used to disable manual discount in cart row)
        hasLossAlert: productData.hasLossAlert ?? false,
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

    // ─── Phase 3: Layered discount accounting ────────────────────────────────
    // Gross subtotal (base prices × qty, before any discount)
    const subtotal = order.items.reduce((sum, item) => {
      const baseLineTotal = (item.basePrice ?? item.price) * item.quantity
      return sum + baseLineTotal
    }, 0)

    // Step A: Total item-level discounts = Σ (itemPromoDiscount × qty)
    const totalItemDiscount = order.items.reduce((sum, item) => {
      return sum + ((item.itemPromoDiscount || 0) * item.quantity)
    }, 0)

    // Step B: Subtotal after item discounts (= what backend calls "subtotal")
    const subtotalAfterItemDiscount = Math.round((subtotal - totalItemDiscount) * 100) / 100

    // Step C: Auto-apply best transaction-level discount
    let autoTransactionDiscountPct = 0
    let autoTransactionDiscountId = null
    try {
      const discStore = useDiscountsStore()
      const hasMember = !!order.member
      const txDiscs = discStore.activeDiscounts.filter(d => {
        if (!d.isTransactionLevel) return false
        if (d.isMemberLevel && !hasMember) return false
        return true
      })
      let bestTxDisc = null
      let bestTxPct = 0
      for (const d of txDiscs) {
        // Normalize to percentage for comparison
        const pct = d.type === 'PERCENTAGE'
          ? d.value
          : (subtotalAfterItemDiscount > 0 ? Math.round(d.value / subtotalAfterItemDiscount * 10000) / 100 : 0)
        if (pct > bestTxPct) {
          bestTxPct = pct
          bestTxDisc = d
        }
      }
      if (bestTxDisc) {
        autoTransactionDiscountPct = bestTxPct
        autoTransactionDiscountId = bestTxDisc.id
      }
    } catch (_) { /* discountsStore not ready */ }

    // Effective transaction discount = max(auto, manual supervisor override)
    const effectiveTransactionDiscountPct = Math.max(
      autoTransactionDiscountPct,
      order.summary.discountPercent || 0
    )

    // Step D: Transaction discount nominal
    const transactionDiscountAmount = Math.round(
      subtotalAfterItemDiscount * effectiveTransactionDiscountPct / 100 * 100
    ) / 100

    // Step E: Tax on net (after both discount layers)
    const taxableAmount = subtotalAfterItemDiscount - transactionDiscountAmount
    const taxAmount = Math.round(taxableAmount * (order.summary.taxPercent || 0) / 100 * 100) / 100

    // ─── Write to summary ────────────────────────────────────────────────────
    order.summary.subtotal = Math.round(subtotal * 100) / 100
    order.summary.totalItemDiscount = Math.round(totalItemDiscount * 100) / 100
    order.summary.subtotalAfterItemDiscount = subtotalAfterItemDiscount
    order.summary.autoTransactionDiscountPct = autoTransactionDiscountPct
    order.summary.autoTransactionDiscountId = autoTransactionDiscountId
    order.summary.effectiveTransactionDiscountPct = effectiveTransactionDiscountPct
    order.summary.transactionDiscountAmount = transactionDiscountAmount
    order.summary.tax = taxAmount
    order.summary.total = Math.round((taxableAmount + taxAmount) * 100) / 100

    // Profit estimate uses basePrice vs hpp
    order.metadata.profitEstimate = order.items.reduce((profit, item) => {
      const unitBase = item.basePrice ?? item.price
      return profit + (unitBase - (item.hpp || 0)) * item.quantity
    }, 0)
  }

  const applyDiscount = async (orderId, discountPercent, requireAuth = false) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    // Phase 4: Block discount on items with loss alert
    const productsStore = useProductsStore()
    const lossItems = order.items.filter(item => {
      const product = productsStore.products.find(p => p.id === item.productId)
      return product?.hasLossAlert === true
    })
    if (lossItems.length > 0) {
      const names = lossItems.map(i => i.name).join(', ')
      return { success: false, message: `Diskon tidak dapat diterapkan — produk berikut memiliki peringatan rugi (harga jual < HPP): ${names}` }
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

    // Phase 4: Block price decrease on items with loss alert
    if (newPrice < item.price) {
      const productsStore = useProductsStore()
      const product = productsStore.products.find(p => p.id === item.productId)
      if (product?.hasLossAlert === true) {
        return { success: false, message: `Harga produk "${item.name}" tidak dapat diturunkan — produk memiliki peringatan rugi (harga jual < HPP)` }
      }
    }

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

    // Phase 3: Re-price ALL existing items when member changes
    // Member discount or member-gated product discounts may now apply/unapply
    const productsStore = useProductsStore()
    for (const item of order.items) {
      const productData = productsStore.getProductById(item.productId) ?? { id: item.productId, price: item.basePrice }
      const { priceAfterProductDisc, itemPromoDiscount, itemPromoLabel } = _computeItemPrices(productData, order)
      item.price = priceAfterProductDisc
      item.itemPromoDiscount = itemPromoDiscount
      item.itemPromoLabel = itemPromoLabel
      item.subtotal = Math.round(priceAfterProductDisc * item.quantity * 100) / 100
    }

    order.lastModified = new Date().toISOString()
    updateOrderSummary(orderId)
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

    // Audit log: record the supervisor override
    try {
      const { useSupervisorAuth } = await import('@/composables/useSupervisorAuth')
      const { logAuditAction } = useSupervisorAuth()
      logAuditAction(supervisorId, pending.action, {
        orderId: pending.orderId,
        amount: pending.amount,
        reason: pending.reason,
        discountPercent: pending.discountPercent,
        oldPrice: pending.oldPrice,
        newPrice: pending.newPrice,
      })
    } catch { /* audit logging is best-effort */ }

    // Store supervisor override info on the order for backend submission
    if (order) {
      if (!order.metadata.supervisorOverrides) order.metadata.supervisorOverrides = []
      order.metadata.supervisorOverrides.push({
        supervisorId,
        action: pending.action,
        amount: pending.amount,
        reason: pending.reason,
        timestamp: pending.timestamp,
      })
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

  const setCashReceived = (orderId, amount) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return { success: false, message: 'Order not found' }
    order.cashReceived = Math.round(amount) || 0
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
      // Determine backend-compatible status
      const backendStatus = order.customerName && order.customerName.trim()
        ? 'PENDING'
        : 'COMPLETED'

      const authStore = useAuthStore()

      // Phase 4: Strict payload schema
      const totalDiscount = Math.round(
        ((order.summary.totalItemDiscount || 0) + (order.summary.transactionDiscountAmount || 0)) * 100
      ) / 100

      const payload = {
        paymentMethod: order.paymentMethod || 'CASH',
        status: backendStatus,
        posId: authStore.posDevice?.id || undefined,
        memberId: order.member?.id || undefined,
        customerName: order.customerName || undefined,
        discountAmount: totalDiscount || undefined,
        notes: order.summary.notes || undefined,
        items: order.items.map(item => ({
          productId: item.productId,
          qty: item.quantity,
        })),
      }

      // Add cashReceived for CASH payments
      if (payload.paymentMethod === 'CASH') {
        payload.cashReceived = order.cashReceived || order.summary?.total || 0
      }

      const response = await apiClient.post('/transactions', payload)

      const txData = response.data.data ?? response.data

      // Deduct stock locally after successful API response
      deductOrderStock(order)

      order.status = 'submitted'
      order.metadata.submittedAt = new Date().toISOString()
      order.metadata.transactionId = txData?.id

      // Phase 4: Remove submitted order from localStorage only after confirmed 200 OK
      const submittedOrderId = order.id
      persistToStorage()

      // B7 FIX: Record transaction in active shift so totalSales is accurate
      try { useShiftStore().recordTransaction(order.metadata.transactionId, order.summary.total) } catch { /* shift may not be open */ }

      // Clean up: remove the successfully submitted order from the cart
      clearOrder(submittedOrderId)

      return { success: true, transactionId: txData?.id }
    } catch (err) {
      const status = err.response?.status
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null

      // Phase 4: Typed error routing — parse specific backend messages
      if (status === 400) {
        const msg = errMsg.toLowerCase()

        // Case 1: Member inactive
        if (msg.includes('member') && (msg.includes('tidak aktif') || msg.includes('inactive'))) {
          return {
            success: false,
            message: errMsg,
            errorType: 'MEMBER_INACTIVE',
          }
        }

        // Case 2: Bundle/package stock insufficient
        if (msg.includes('bundle') || msg.includes('paket') || msg.includes('komponen')) {
          // Try to find the affected item name from the error message
          const affectedItem = order.items.find(i => i.isBundle && errMsg.includes(i.name))
          // Trigger product catalog refresh
          try {
            const productsStore = useProductsStore()
            await productsStore.fetchProducts({ limit: 1000 })
          } catch { /* ignore */ }
          return {
            success: false,
            message: errMsg,
            errorType: 'BUNDLE_STOCK_ERROR',
            affectedItem: affectedItem ?? order.items.find(i => i.isBundle) ?? null,
          }
        }

        // Case 3: Regular product out of stock
        if (msg.includes('stok') || msg.includes('stock') || msg.includes('kehabisan')) {
          // Refresh catalog so UI shows updated stock
          try {
            const productsStore = useProductsStore()
            await productsStore.fetchProducts({ limit: 1000 })
          } catch { /* ignore */ }
          return {
            success: false,
            message: errMsg,
            errorType: 'STOCK_ERROR',
          }
        }
      }

      // Auto-refresh stock on 400/404 for unmatched errors
      if (status === 404) {
        try {
          const productsStore = useProductsStore()
          await productsStore.fetchProducts({ limit: 1000 })
        } catch { /* ignore refresh failure */ }
      }

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
    setCashReceived,
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
