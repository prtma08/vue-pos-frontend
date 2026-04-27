import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ACCOUNTS = [
  {
    username: 'superuser',
    password: 'super123',
    user: { id: 'mock-user-5', name: 'Super Admin', username: 'superuser', roles: ['SUPERUSER', 'ADMIN', 'CASHIER'], status: 'READY' },
  },
  {
    username: 'admin',
    password: 'admin123',
    user: { id: 'mock-user-1', name: 'Administrator', username: 'admin', roles: ['ADMIN', 'CASHIER'], status: 'READY' },
  },
  {
    username: 'supervisor',
    password: 'supervisor123',
    user: { id: 'mock-user-2', name: 'Supervisor Utama', username: 'supervisor', roles: ['SUPERVISOR', 'CASHIER'], status: 'READY' },
  },
  {
    username: 'kasir',
    password: 'kasir123',
    user: { id: 'mock-user-3', name: 'Kasir 1', username: 'kasir', roles: ['CASHIER'], status: 'READY' },
  },
  {
    username: 'kasir2',
    password: 'kasir123',
    user: { id: 'mock-user-4', name: 'Kasir 2', username: 'kasir2', roles: ['CASHIER'], status: 'SUSPENDED' },
  },
]

// Mock POS devices
const MOCK_POS_DEVICES = [
  { id: 'pos-01', name: 'POS-01', location: 'Kasir Utama', isOccupied: false },
  { id: 'pos-02', name: 'POS-02', location: 'Kasir Samping', isOccupied: false },
  { id: 'pos-03', name: 'POS-03', location: 'Drive-Thru', isOccupied: true },
]

// Persistent session keys
const SESSION_KEY = 'pos_mock_session'
const ACTIVE_ROLE_KEY = 'pos_active_role'
const POS_DEVICE_KEY = 'pos_device'

// ─── Normalize backend role strings to lowercase app roles ──────────────────
const normalizeRole = (role) => {
  const map = { SUPERUSER: 'superuser', ADMIN: 'admin', SUPERVISOR: 'supervisor', CASHIER: 'kasir' }
  return map[role?.toUpperCase()] || role?.toLowerCase() || null
}

// ─── Denormalize app role back to backend uppercase ──────────────────────────
const denormalizeRole = (role) => {
  const map = { superuser: 'SUPERUSER', admin: 'ADMIN', supervisor: 'SUPERVISOR', kasir: 'CASHIER' }
  return map[role] || role?.toUpperCase() || null
}

// Role display labels & icons
const ROLE_META = {
  superuser: { label: 'Superuser', icon: '🛡️', description: 'Akses penuh ke seluruh sistem' },
  admin: { label: 'Admin', icon: '⚙️', description: 'Kelola produk, kategori, & laporan' },
  supervisor: { label: 'Supervisor', icon: '👔', description: 'Supervisi kasir & otorisasi' },
  kasir: { label: 'Kasir', icon: '🧾', description: 'Operasional Point of Sale' },
}

// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const isAuthenticated = ref(false)
  const roles = ref([])           // normalized role strings: ['admin', 'kasir', ...]
  const activeRole = ref(null)    // currently selected role
  const posDevice = ref(null)     // selected POS device (for kasir role)
  const posDevices = ref([])      // available POS devices
  const loading = ref(false)
  const error = ref(null)

  // ── Computed ────────────────────────────────────────────────────────────────
  const needsRoleSelection = computed(() => roles.value.length > 1 && !activeRole.value)
  const needsPosDevice = computed(() => (activeRole.value === 'kasir' || activeRole.value === 'supervisor') && !posDevice.value)

  // Auth flow stage tracking: LOGIN → ROLE_SELECT → POS_SELECT → READY
  const authStage = computed(() => {
    if (!isAuthenticated.value) return 'LOGIN'
    if (!activeRole.value) return 'ROLE_SELECT'
    if (needsPosDevice.value) return 'POS_SELECT'
    return 'READY'
  })

  const isSuperuser = computed(() => activeRole.value === 'superuser')
  const isAdmin = computed(() => activeRole.value === 'admin')
  const isSupervisor = computed(() => activeRole.value === 'supervisor')
  const isKasir = computed(() => activeRole.value === 'kasir')

  const canApproveDiscount = computed(() => isSupervisor.value || isAdmin.value || isSuperuser.value)
  const canChangePrice = computed(() => isSupervisor.value || isAdmin.value || isSuperuser.value)
  const canAccessAdmin = computed(() => isAdmin.value || isSuperuser.value)

  // Backwards compatibility alias
  const userRole = computed(() => activeRole.value)

  const getRoleMeta = (role) => ROLE_META[role] || { label: role, icon: '👤', description: '' }

  // ── Actions ─────────────────────────────────────────────────────────────────

  const login = async (username, password) => {
    loading.value = true
    error.value = null

    // ── MOCK MODE ──────────────────────────────────────────────────────────
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))

      const account = MOCK_ACCOUNTS.find(
        a => a.username === username && a.password === password
      )

      if (!account) {
        error.value = '[Mock] Username atau password salah.'
        loading.value = false
        return { success: false, message: error.value }
      }

      if (account.user.status === 'SUSPENDED') {
        error.value = 'Akun Anda telah ditangguhkan.'
        loading.value = false
        return { success: false, message: error.value }
      }

      user.value = account.user
      const normalizedRoles = (account.user.roles || [account.user.role]).map(normalizeRole).filter(Boolean)
      roles.value = normalizedRoles
      isAuthenticated.value = true

      // If user has exactly 1 role, auto-select it
      if (normalizedRoles.length === 1) {
        activeRole.value = normalizedRoles[0]
        localStorage.setItem(ACTIVE_ROLE_KEY, normalizedRoles[0])
      }

      // Persist mock session
      localStorage.setItem(SESSION_KEY, JSON.stringify(account.user))

      loading.value = false
      return { success: true, message: 'Login berhasil (Mock Mode)' }
    }
    // ── REAL API — Swagger: POST /auth/login ─────────────────────────────

    try {
      const response = await apiClient.post('/auth/login', { username, password })
      const resData = response.data // { success, message, data }

      if (!resData.success) {
        error.value = resData.message || 'Login gagal.'
        return { success: false, message: error.value }
      }

      isAuthenticated.value = true

      const { requiresRoleSelection, availableRoles } = resData.data || {}

      if (requiresRoleSelection && availableRoles?.length) {
        // Multi-role user: store available roles, wait for role selection
        const normalizedRoles = availableRoles.map(normalizeRole).filter(Boolean)
        roles.value = normalizedRoles
        // Fetch session to get user profile — but DON'T restore activeRole (user must choose)
        await _fetchSession({ skipRoleRestore: true })
        return { success: true, requiresRoleSelection: true, message: 'Pilih role aktif' }
      }

      // Single-role or auto-assigned: fetch full session
      await _fetchSession()
      return { success: true, message: 'Login berhasil' }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      error.value = errMsg
      isAuthenticated.value = false
      return { success: false, message: errMsg, errors: validationErrors }
    } finally {
      loading.value = false
    }
  }

  const selectRole = async (role) => {
    if (!roles.value.includes(role)) {
      return { success: false, message: 'Role tidak tersedia untuk user ini' }
    }

    // ── MOCK MODE ──────────────────────────────────────────────────────────
    if (USE_MOCK) {
      activeRole.value = role
      localStorage.setItem(ACTIVE_ROLE_KEY, role)
      if (role !== 'kasir') {
        posDevice.value = null
        localStorage.removeItem(POS_DEVICE_KEY)
      }
      return { success: true }
    }

    // ── REAL API — Swagger: POST /auth/select-role ─────────────────────── 
    try {
      const backendRole = denormalizeRole(role)
      const response = await apiClient.post('/auth/select-role', { role: backendRole })

      if (!response.data.success) {
        return { success: false, message: response.data.message || 'Gagal memilih role' }
      }

      activeRole.value = role
      localStorage.setItem(ACTIVE_ROLE_KEY, role)

      // Clear POS device when switching to non-kasir role
      if (role !== 'kasir') {
        posDevice.value = null
        localStorage.removeItem(POS_DEVICE_KEY)
      }

      return { success: true }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    }
  }

  const switchRole = () => {
    // Reset active role to trigger RoleSelector again, without logout
    activeRole.value = null
    posDevice.value = null
    localStorage.removeItem(ACTIVE_ROLE_KEY)
    localStorage.removeItem(POS_DEVICE_KEY)
    return { success: true }
  }

  const fetchPosDevices = async () => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      posDevices.value = MOCK_POS_DEVICES
      return { success: true, data: MOCK_POS_DEVICES }
    }
    // ── REAL API — Swagger: GET /pos ────────────────────────────────────
    try {
      const res = await apiClient.get('/pos')
      const data = res.data?.data ?? []
      posDevices.value = data
      return { success: true, data }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    }
  }

  const selectPosDevice = async (device) => {
    // ── MOCK MODE ──────────────────────────────────────────────────────────
    if (USE_MOCK) {
      posDevice.value = device
      localStorage.setItem(POS_DEVICE_KEY, JSON.stringify(device))
      return { success: true }
    }
    // ── REAL API — Swagger: POST /auth/select-pos ──────────────────────── 
    try {
      const response = await apiClient.post('/auth/select-pos', { posId: device.id })

      if (!response.data.success) {
        return { success: false, message: response.data.message || 'Gagal memilih POS' }
      }

      posDevice.value = device
      localStorage.setItem(POS_DEVICE_KEY, JSON.stringify(device))
      return { success: true }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem'
      const validationErrors = err.response?.data?.errors || null
      return { success: false, message: errMsg, errors: validationErrors }
    }
  }

  const clearPosDevice = () => {
    posDevice.value = null
    localStorage.removeItem(POS_DEVICE_KEY)
  }

  const logout = async () => {
    loading.value = true
    error.value = null

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      localStorage.removeItem(SESSION_KEY)
      clearAuth()
      loading.value = false
      return { success: true }
    }

    // ── REAL API — Swagger: POST /api/auth/sign-out ─────────────────────
    try {
      await apiClient.post('/api/auth/sign-out')
    } catch {
      // Even if logout API fails, clear local state
    } finally {
      clearAuth()
      loading.value = false
    }

    return { success: true, message: 'Logout successful' }
  }

  const checkAuth = async () => {
    loading.value = true
    error.value = null

    // ── MOCK MODE ──────────────────────────────────────────────────────────
    if (USE_MOCK) {
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) {
        try {
          const userData = JSON.parse(stored)
          user.value = userData
          const normalizedRoles = (userData.roles || [userData.role]).map(normalizeRole).filter(Boolean)
          roles.value = normalizedRoles
          isAuthenticated.value = true

          // Restore active role from localStorage
          const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY)
          if (savedRole && normalizedRoles.includes(savedRole)) {
            activeRole.value = savedRole
          } else if (normalizedRoles.length === 1) {
            activeRole.value = normalizedRoles[0]
          }

          // Restore POS device
          const savedDevice = localStorage.getItem(POS_DEVICE_KEY)
          if (savedDevice) {
            try { posDevice.value = JSON.parse(savedDevice) } catch { /* ignore */ }
          }

          loading.value = false
          return { success: true }
        } catch {
          localStorage.removeItem(SESSION_KEY)
        }
      }
      loading.value = false
      return { success: false }
    }
    // ── REAL API — Swagger: GET /api/auth/get-session ──────────────────── 
    try {
      return await _fetchSession()
    } catch {
      clearAuth()
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  // ── Internal helper: fetch & hydrate session from backend ──────────────
  // skipRoleRestore: true = don't auto-set activeRole (used after login when multi-role)
  const _fetchSession = async ({ skipRoleRestore = false } = {}) => {
    const response = await apiClient.get('/api/auth/get-session', { timeout: 5000 })

    // Swagger BaseResponse wrapper: { success, data: { user, session } }
    const payload = response.data?.data ?? response.data
    const { user: userData, session } = payload

    if (!session || !userData) {
      clearAuth()
      return { success: false }
    }

    if (userData.status === 'SUSPENDED') {
      clearAuth()
      return { success: false, message: 'Akun Anda telah ditangguhkan.' }
    }

    user.value = userData
    const normalizedRoles = (userData.roles || [userData.role]).map(normalizeRole).filter(Boolean)
    roles.value = normalizedRoles
    isAuthenticated.value = true

    if (!skipRoleRestore) {
      // If session has an activeRole from backend, use it
      if (session.activeRole) {
        const normalized = normalizeRole(session.activeRole)
        if (normalized && normalizedRoles.includes(normalized)) {
          activeRole.value = normalized
          localStorage.setItem(ACTIVE_ROLE_KEY, normalized)
        }
      }

      // Restore active role from localStorage as fallback
      if (!activeRole.value) {
        const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY)
        if (savedRole && normalizedRoles.includes(savedRole)) {
          activeRole.value = savedRole
        } else if (normalizedRoles.length === 1) {
          activeRole.value = normalizedRoles[0]
        }
      }

      // Restore POS device from localStorage
      const savedDevice = localStorage.getItem(POS_DEVICE_KEY)
      if (savedDevice) {
        try { posDevice.value = JSON.parse(savedDevice) } catch { /* ignore */ }
      }
    }

    return { success: true }
  }

  const clearAuth = () => {
    user.value = null
    roles.value = []
    activeRole.value = null
    posDevice.value = null
    isAuthenticated.value = false
    error.value = null
    localStorage.removeItem(ACTIVE_ROLE_KEY)
    localStorage.removeItem(POS_DEVICE_KEY)
    localStorage.removeItem(SESSION_KEY)
  }

  return {
    // State
    user,
    isAuthenticated,
    roles,
    activeRole,
    userRole,        // backwards-compat computed
    posDevice,
    posDevices,
    loading,
    error,

    // Computed
    authStage,
    needsRoleSelection,
    needsPosDevice,
    isSuperuser,
    isAdmin,
    isSupervisor,
    isKasir,
    canApproveDiscount,
    canChangePrice,
    canAccessAdmin,

    // Actions
    login,
    logout,
    checkAuth,
    clearAuth,
    selectRole,
    switchRole,
    fetchPosDevices,
    selectPosDevice,
    clearPosDevice,

    // Helpers
    getRoleMeta,
    ROLE_META,
  }
})
