import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Staff Data ──────────────────────────────────────────────────────────
// IDs mirror MOCK_ACCOUNTS in auth.js for cross-referencing
const MOCK_STAFF = [
    {
        id: 'mock-user-1',
        name: 'Administrator',
        username: 'admin',
        role: 'ADMIN',
        status: 'Online',
        lastLogin: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
        shiftStart: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
        avatar: 'A',
    },
    {
        id: 'mock-user-2',
        name: 'Supervisor Utama',
        username: 'supervisor',
        role: 'SUPERVISOR',
        status: 'Online',
        lastLogin: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
        shiftStart: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        avatar: 'S',
    },
    {
        id: 'mock-user-3',
        name: 'Kasir 1',
        username: 'kasir',
        role: 'CASHIER',
        status: 'Online',
        lastLogin: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
        shiftStart: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        avatar: 'K',
    },
    {
        id: 'mock-user-4',
        name: 'Kasir 2',
        username: 'kasir2',
        role: 'CASHIER',
        status: 'Offline',
        lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
        shiftStart: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
        avatar: 'K',
    },
]

// ─── Mock Transactions with userId ───────────────────────────────────────────
// Generates realistic spread across staff members
const generateMockTransactions = () => {
    const paymentMethods = ['CASH', 'QRIS', 'TRANSFER']
    const amounts = [
        25000, 35000, 45000, 52000, 68000, 75000, 89000, 95000,
        102000, 115000, 128000, 145000, 167000, 185000, 210000, 235000,
        260000, 290000, 315000, 340000,
    ]

    // Revenue distribution per user (approximate ratios)
    const userWeights = {
        'mock-user-1': 0.15,
        'mock-user-2': 0.25,
        'mock-user-3': 0.38,
        'mock-user-4': 0.22,
    }

    const transactions = []
    let txId = 1

    Object.entries(userWeights).forEach(([userId, weight]) => {
        const txCount = Math.round(weight * 90)
        for (let i = 0; i < txCount; i++) {
            const hoursAgo = Math.random() * 72
            const amount = amounts[Math.floor(Math.random() * amounts.length)]
                + Math.floor(Math.random() * 15) * 1000
            transactions.push({
                id: `mock-txn-${txId++}`,
                userId,
                total: amount,
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
                status: 'COMPLETED',
            })
        }
    })

    return transactions
}

const MOCK_TRANSACTIONS = generateMockTransactions()

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDuration = (isoString) => {
    if (!isoString) return '—'
    const diffMs = Date.now() - new Date(isoString).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 60) return `${mins} menit lalu`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} jam lalu`
    return `${Math.floor(hrs / 24)} hari lalu`
}

const roleLabel = (role) => {
    const map = { ADMIN: 'Admin', SUPERVISOR: 'Supervisor', CASHIER: 'Kasir' }
    return map[role] || role
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStaffStore = defineStore('staff', () => {
    const staff = ref([])
    const transactions = ref([])
    const loading = ref(false)
    const error = ref(null)

    // ── Computed ───────────────────────────────────────────────────────────────

    /**
     * staffPerformance — enriches each staff member with aggregated revenue data.
     * This data should ONLY be rendered in the Admin dashboard (guarded in template).
     */
    const staffPerformance = computed(() => {
        const txByUser = {}
        transactions.value.forEach(tx => {
            if (!txByUser[tx.userId]) txByUser[tx.userId] = { revenue: 0, txCount: 0 }
            txByUser[tx.userId].revenue += tx.total
            txByUser[tx.userId].txCount += 1
        })

        const allRevenues = Object.values(txByUser).map(u => u.revenue)
        const maxRevenue = Math.max(...allRevenues, 1)

        return staff.value.map(s => {
            const perf = txByUser[s.id] || { revenue: 0, txCount: 0 }
            return {
                ...s,
                revenue: perf.revenue,
                txCount: perf.txCount,
                revenuePercent: Math.round((perf.revenue / maxRevenue) * 100),
                lastLoginFormatted: formatDuration(s.lastLogin),
                shiftDuration: s.status === 'Online' && s.shiftStart
                    ? formatDuration(s.shiftStart).replace(' lalu', '')
                    : '—',
                roleLabel: roleLabel(s.role),
            }
        }).sort((a, b) => b.revenue - a.revenue)
    })

    const onlineCount = computed(() =>
        staff.value.filter(s => s.status === 'Online').length
    )

    const totalStaffRevenue = computed(() =>
        staffPerformance.value.reduce((sum, s) => sum + s.revenue, 0)
    )

    // ── Actions ────────────────────────────────────────────────────────────────
    const fetchStaff = async () => {
        loading.value = true
        error.value = null

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            staff.value = MOCK_STAFF
            transactions.value = MOCK_TRANSACTIONS
            loading.value = false
            return { success: true }
        }

        // Real API mode
        try {
            const { default: apiClient } = await import('@/api/client')
            const [usersRes, txRes] = await Promise.all([
                apiClient.get('/users'),
                apiClient.get('/transactions'),
            ])
            staff.value = Array.isArray(usersRes.data)
                ? usersRes.data
                : (usersRes.data.data ?? usersRes.data.users ?? [])
            transactions.value = Array.isArray(txRes.data)
                ? txRes.data
                : (txRes.data.data ?? txRes.data.transactions ?? [])
            return { success: true }
        } catch (err) {
            error.value = err.response?.data?.message || 'Gagal memuat data karyawan'
            return { success: false, message: error.value }
        } finally {
            loading.value = false
        }
    }

    return {
        staff,
        transactions,
        loading,
        error,

        staffPerformance,
        onlineCount,
        totalStaffRevenue,

        fetchStaff,
    }
})
