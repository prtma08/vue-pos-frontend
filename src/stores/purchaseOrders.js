import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'

export const usePurchaseOrdersStore = defineStore('purchaseOrders', () => {
  const orders = ref([])
  const loading = ref(false)
  const error = ref(null)

  const pendingOrders = computed(() => 
    orders.value.filter(o => o.status === 'PENDING').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
  )
  const historyOrders = computed(() => 
    orders.value.filter(o => o.status !== 'PENDING').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
  )

  const fetchPurchaseOrders = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/purchase-orders')
      orders.value = response.data.data ?? []
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal memuat purchase orders'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const createPurchaseOrder = async (payload) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/purchase-orders', payload)
      // Usually POST returns the newly created item. Refresh list to get relationships mapped.
      await fetchPurchaseOrders()
      return { success: true, data: response.data.data }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membuat purchase order'
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  const updatePurchaseOrder = async (id, payload) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put(`/purchase-orders/${id}`, payload)
      await fetchPurchaseOrders()
      return { success: true, data: response.data.data }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah purchase order'
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  const deletePurchaseOrder = async (id) => {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/purchase-orders/${id}`)
      orders.value = orders.value.filter(o => o.id !== id)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus purchase order'
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  const confirmPurchaseOrder = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.patch(`/purchase-orders/${id}/approve`)
      await fetchPurchaseOrders()
      return { success: true, data: response.data.data }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengkonfirmasi purchase order'
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    loading,
    error,
    pendingOrders,
    historyOrders,
    fetchPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    confirmPurchaseOrder
  }
})
