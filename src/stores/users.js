import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data (roles[] array format, synced with auth.js) ────────────────────
const MOCK_USERS = [
    { id: 'mock-user-5', name: 'Super Admin', username: 'superuser', roles: ['SUPERUSER', 'ADMIN', 'CASHIER'], isActive: true, createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'mock-user-1', name: 'Administrator', username: 'admin', roles: ['ADMIN', 'CASHIER'], isActive: true, createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'mock-user-2', name: 'Supervisor Utama', username: 'supervisor', roles: ['SUPERVISOR', 'CASHIER'], isActive: true, createdAt: '2024-01-05T00:00:00.000Z' },
    { id: 'mock-user-3', name: 'Kasir 1', username: 'kasir', roles: ['CASHIER'], isActive: true, createdAt: '2024-01-10T00:00:00.000Z' },
    { id: 'mock-user-4', name: 'Kasir 2', username: 'kasir2', roles: ['CASHIER'], isActive: false, createdAt: '2024-01-15T00:00:00.000Z' },
]
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
    { value: 'SUPERUSER', label: 'Superuser' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'CASHIER', label: 'Kasir' },
]

const roleLabel = {
    SUPERUSER: 'Superuser',
    ADMIN: 'Admin',
    SUPERVISOR: 'Supervisor',
    CASHIER: 'Kasir',
}

export const useUsersStore = defineStore('users', () => {
    const users = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false })
    let nextMockId = 6

    const searchTerm = ref('')
    const roleFilter = ref('')

    const filtered = computed(() => {
        let list = users.value
        if (roleFilter.value) {
            list = list.filter(u => (u.roles || [u.role]).includes(roleFilter.value))
        }
        if (searchTerm.value) {
            const q = searchTerm.value.toLowerCase()
            list = list.filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q)
            )
        }
        return list
    })

    const getRoleLabel = (role) => roleLabel[role] || role
    const getRoleLabels = (roles) => (roles || []).map(r => getRoleLabel(r)).join(', ')

    // ── fetchAll ───────────────────────────────────────────────────────────────
    const fetchAll = async (params = {}) => {
        loading.value = true
        error.value = null
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 350))
            users.value = [...MOCK_USERS]
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.get('/users', {
                params: {
                    page: params.page ?? pagination.value.page,
                    limit: params.limit ?? pagination.value.limit,
                    search: params.search || undefined,
                }
            })
            users.value = res.data.data ?? []
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
    const add = async (payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const newUser = { ...payload, id: `mock-user-${nextMockId++}`, isActive: true, createdAt: new Date().toISOString() }
            delete newUser.password
            MOCK_USERS.push(newUser)
            users.value.push(newUser)
            loading.value = false
            return { success: true, data: newUser }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post('/users', payload)
            const created = res.data.data ?? res.data
            users.value.push(created)
            return { success: true, data: created }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    // ── update ─────────────────────────────────────────────────────────────────
    const update = async (id, payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const updatePayload = { ...payload }
            if (!updatePayload.password) delete updatePayload.password
            const idx = users.value.findIndex(u => u.id === id)
            const mockIdx = MOCK_USERS.findIndex(u => u.id === id)
            if (idx !== -1) users.value[idx] = { ...users.value[idx], ...updatePayload }
            if (mockIdx !== -1) MOCK_USERS[mockIdx] = { ...MOCK_USERS[mockIdx], ...updatePayload }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.put(`/users/${id}`, payload)
            const idx = users.value.findIndex(u => u.id === id)
            if (idx !== -1) users.value[idx] = { ...users.value[idx], ...(res.data.data ?? res.data) }
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
            const idx = users.value.findIndex(u => u.id === id)
            const mockIdx = MOCK_USERS.findIndex(u => u.id === id)
            if (idx !== -1) users.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_USERS.splice(mockIdx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/users/${id}`)
            const idx = users.value.findIndex(u => u.id === id)
            if (idx !== -1) users.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
            const validationErrors = err.response?.data?.errors || null
            return { success: false, message: errMsg, errors: validationErrors }
        } finally { loading.value = false }
    }

    let searchTimeout
    watch(searchTerm, (newVal) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            fetchAll({ search: newVal, page: 1 })
        }, 500)
    })

    return {
        users, loading, error, pagination, searchTerm, roleFilter, filtered,
        getRoleLabel, getRoleLabels, ROLE_OPTIONS,
        fetchAll, add, update, remove,
    }
})
