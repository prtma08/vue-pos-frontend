import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
export const MOCK_MEMBERS = [
    { id: 'mbr-1', name: 'Budi Santoso', phone: '08111111111', isActive: true, createdAt: '2024-02-01T00:00:00.000Z' },
    { id: 'mbr-2', name: 'Siti Rahayu', phone: '08222222222', isActive: true, createdAt: '2024-02-10T00:00:00.000Z' },
    { id: 'mbr-3', name: 'Ahmad Fauzi', phone: '08333333333', isActive: false, createdAt: '2024-03-01T00:00:00.000Z' },
    { id: 'mbr-4', name: 'Dewi Lestari', phone: '08444444444', isActive: true, createdAt: '2024-03-15T00:00:00.000Z' },
]

export const MOCK_DISCOUNTS = [
    { id: 'disc-1', name: 'Grand Opening', code: 'GRANDOPEN', type: 'PERCENTAGE', value: 10, description: 'Diskon 10% Grand Opening', isActive: true },
    { id: 'disc-2', name: 'Member Spesial', code: 'MEMBER15', type: 'PERCENTAGE', value: 15, description: 'Diskon 15% khusus member', isActive: true },
    { id: 'disc-3', name: 'Diskon Nominal', code: 'HEMAT5K', type: 'FIXED', value: 5000, description: 'Potongan langsung Rp 5.000', isActive: true },
]
// ─────────────────────────────────────────────────────────────────────────────

export const useMembersStore = defineStore('members', () => {
    const members = ref([])
    const discounts = ref([])
    const loading = ref(false)
    const error = ref(null)
    let nextMockId = 5

    const searchTerm = ref('')
    const filtered = computed(() => {
        if (!searchTerm.value) return members.value
        const q = searchTerm.value.toLowerCase()
        return members.value.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.phone.includes(q)
        )
    })

    const fetchMembers = async () => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            members.value = [...MOCK_MEMBERS]
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const response = await apiClient.get('/members')
            const raw = Array.isArray(response.data) ? response.data : (response.data.data ?? response.data.members ?? [])
            members.value = raw
            return { success: true }
        } catch (err) {
            error.value = err.response?.data?.message || 'Gagal memuat member'
            return { success: false, message: error.value }
        } finally { loading.value = false }
    }

    const fetchDiscounts = async () => {
        if (USE_MOCK) { discounts.value = MOCK_DISCOUNTS; return { success: true } }
        try {
            const { default: apiClient } = await import('@/api/client')
            const response = await apiClient.get('/discounts')
            const raw = Array.isArray(response.data) ? response.data : (response.data.data ?? response.data.discounts ?? [])
            discounts.value = raw
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal memuat diskon' }
        }
    }

    const add = async (payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const newMember = { ...payload, id: `mbr-${nextMockId++}`, isActive: payload.isActive !== false, createdAt: new Date().toISOString() }
            MOCK_MEMBERS.push(newMember)
            members.value.push(newMember)
            loading.value = false
            return { success: true, data: newMember }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post('/members', payload)
            const created = res.data.data ?? res.data
            members.value.push(created)
            return { success: true, data: created }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menambah member' }
        } finally { loading.value = false }
    }

    const update = async (id, payload) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const idx = members.value.findIndex(m => m.id === id)
            const mockIdx = MOCK_MEMBERS.findIndex(m => m.id === id)
            if (idx !== -1) members.value[idx] = { ...members.value[idx], ...payload }
            if (mockIdx !== -1) MOCK_MEMBERS[mockIdx] = { ...MOCK_MEMBERS[mockIdx], ...payload }
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.put(`/members/${id}`, payload)
            const idx = members.value.findIndex(m => m.id === id)
            if (idx !== -1) members.value[idx] = { ...members.value[idx], ...(res.data.data ?? res.data) }
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal mengupdate member' }
        } finally { loading.value = false }
    }

    const remove = async (id) => {
        loading.value = true
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300))
            const idx = members.value.findIndex(m => m.id === id)
            const mockIdx = MOCK_MEMBERS.findIndex(m => m.id === id)
            if (idx !== -1) members.value.splice(idx, 1)
            if (mockIdx !== -1) MOCK_MEMBERS.splice(mockIdx, 1)
            loading.value = false
            return { success: true }
        }
        try {
            const { default: apiClient } = await import('@/api/client')
            await apiClient.delete(`/members/${id}`)
            const idx = members.value.findIndex(m => m.id === id)
            if (idx !== -1) members.value.splice(idx, 1)
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Gagal menghapus member' }
        } finally { loading.value = false }
    }

    const getMemberById = (id) => members.value.find(m => m.id === id)
    const searchMembers = (query) => {
        if (!query) return members.value
        const q = query.toLowerCase()
        return members.value.filter(m => m.name.toLowerCase().includes(q) || m.phone.includes(q))
    }

    return { members, discounts, loading, error, searchTerm, filtered, fetchMembers, fetchDiscounts, add, update, remove, getMemberById, searchMembers }
})
