import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const makeTx = (id, userId, userName, memberId, memberName, amount, payment, daysAgo, items) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))
    return {
        id,
        status: 'COMPLETED',
        paymentMethod: payment,
        total: amount,
        userId,
        cashierName: userName,
        memberId: memberId || null,
        memberName: memberName || null,
        createdAt: d.toISOString(),
        items: items || [
            { productId: 'prod-1', name: 'Nasi Goreng Spesial', qty: 1, price: 25000, subtotal: 25000 },
        ],
    }
}

const MOCK_TRANSACTIONS = [
    makeTx('txn-001', 'mock-user-3', 'Kasir 1', 'mbr-1', 'Budi Santoso', 63000, 'CASH', 0),
    makeTx('txn-002', 'mock-user-3', 'Kasir 1', null, null, 35000, 'QRIS', 0, [
        { productId: 'prod-4', name: 'Es Teh Manis', qty: 2, price: 5000, subtotal: 10000 },
        { productId: 'prod-7', name: 'Kentang Goreng', qty: 2, price: 12000, subtotal: 24000 },
    ]),
    makeTx('txn-003', 'mock-user-2', 'Supervisor Utama', 'mbr-2', 'Siti Rahayu', 128000, 'TRANSFER', 1),
    makeTx('txn-004', 'mock-user-3', 'Kasir 1', null, null, 45000, 'CASH', 1),
    makeTx('txn-005', 'mock-user-2', 'Supervisor Utama', null, null, 89000, 'QRIS', 1),
    makeTx('txn-006', 'mock-user-4', 'Kasir 2', 'mbr-3', 'Ahmad Fauzi', 32000, 'CASH', 2),
    makeTx('txn-007', 'mock-user-3', 'Kasir 1', null, null, 75000, 'TRANSFER', 2),
    makeTx('txn-008', 'mock-user-1', 'Administrator', null, null, 52000, 'CASH', 3),
    makeTx('txn-009', 'mock-user-4', 'Kasir 2', 'mbr-4', 'Dewi Lestari', 115000, 'QRIS', 3),
    makeTx('txn-010', 'mock-user-3', 'Kasir 1', null, null, 26000, 'CASH', 4),
    makeTx('txn-011', 'mock-user-2', 'Supervisor Utama', null, null, 145000, 'TRANSFER', 5),
    makeTx('txn-012', 'mock-user-3', 'Kasir 1', 'mbr-1', 'Budi Santoso', 68000, 'CASH', 5),
    makeTx('txn-013', 'mock-user-4', 'Kasir 2', null, null, 38000, 'QRIS', 6),
    makeTx('txn-014', 'mock-user-3', 'Kasir 1', null, null, 95000, 'CASH', 7),
    makeTx('txn-015', 'mock-user-2', 'Supervisor Utama', null, null, 210000, 'TRANSFER', 7),
]
// ─────────────────────────────────────────────────────────────────────────────

export const useTransactionsStore = defineStore('transactions', () => {
    const transactions = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false })

    const searchTerm = ref('')
    const paymentFilter = ref('')
    const dateFrom = ref('')
    const dateTo = ref('')

    const filtered = computed(() => {
        let list = [...transactions.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        if (searchTerm.value) {
            const q = searchTerm.value.toLowerCase()
            list = list.filter(t =>
                t.id?.toLowerCase().includes(q) ||
                t.cashierName?.toLowerCase().includes(q) ||
                t.memberName?.toLowerCase().includes(q)
            )
        }
        if (paymentFilter.value) list = list.filter(t => t.paymentMethod === paymentFilter.value)
        if (dateFrom.value) list = list.filter(t => new Date(t.createdAt) >= new Date(dateFrom.value))
        if (dateTo.value) {
            const until = new Date(dateTo.value)
            until.setHours(23, 59, 59)
            list = list.filter(t => new Date(t.createdAt) <= until)
        }
        return list
    })

    const totalRevenue = computed(() => filtered.value.reduce((s, t) => s + t.total, 0))

    // ── fetchAll ───────────────────────────────────────────────────────────────
    const fetchAll = async (params = {}) => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 400))
            transactions.value = [...MOCK_TRANSACTIONS]
            pagination.value.total = MOCK_TRANSACTIONS.length
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get('/transactions', {
                params: {
                    page: params.page ?? pagination.value.page,
                    limit: params.limit ?? pagination.value.limit,
                    search: params.search || undefined,
                }
            })
            transactions.value = res.data.data ?? []
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

    // ── completeTransaction (PATCH /transactions/{id}) ────────────────────────
    // Used for: Hold Order (PENDING→COMPLETED), update items, cancel
    const completeTransaction = async (id, payload = {}) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const idx = transactions.value.findIndex(t => t.id === id)
            if (idx !== -1) transactions.value[idx] = { ...transactions.value[idx], ...payload }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.patch(`/transactions/${id}`, payload)
            const updated = res.data.data ?? res.data
            const idx = transactions.value.findIndex(t => t.id === id)
            if (idx !== -1) transactions.value[idx] = { ...transactions.value[idx], ...updated }
            return { success: true, data: updated }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── deleteTransaction (DELETE /transactions/{id}) ─────────────────────────
    const deleteTransaction = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            const idx = transactions.value.findIndex(t => t.id === id)
            if (idx !== -1) transactions.value.splice(idx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/transactions/${id}`)
            const idx = transactions.value.findIndex(t => t.id === id)
            if (idx !== -1) transactions.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    const getById = (id) => transactions.value.find(t => t.id === id)

    const formatDate = (iso) => {
        if (!iso) return '-'
        return new Date(iso).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    let searchTimeout
    watch(searchTerm, (newVal) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            fetchAll({ search: newVal, page: 1 })
        }, 500)
    })

    return {
        transactions, loading, error, pagination,
        searchTerm, paymentFilter, dateFrom, dateTo,
        filtered, totalRevenue,
        fetchAll, getById, formatDate,
        completeTransaction, deleteTransaction,
    }
})
