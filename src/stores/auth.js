import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// Base URL: empty string = use Vite dev proxy (same origin), avoids CORS
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ACCOUNTS = [
  {
    username: 'superuser',
    password: 'super123',
    user: { id: 'mock-user-5', name: 'Super Admin', username: 'superuser', roles: ['SUPERUSER', 'ADMIN', 'CASHIER'] },
  },
  {
    username: 'admin',
    password: 'admin123',
    user: { id: 'mock-user-1', name: 'Administrator', username: 'admin', roles: ['ADMIN', 'CASHIER'] },
  },
  {
    username: 'supervisor',
    password: 'supervisor123',
    user: { id: 'mock-user-2', name: 'Supervisor Utama', username: 'supervisor', roles: ['SUPERVISOR', 'CASHIER'] },
  },
  {
    username: 'kasir',
    password: 'kasir123',
    user: { id: 'mock-user-3', name: 'Kasir 1', username: 'kasir', roles: ['CASHIER'] },
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
  const needsPosDevice = computed(() => activeRole.value === 'kasir' && !posDevice.value)

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
    // ── REAL API ───────────────────────────────────────────────────────────

    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/sign-in/username`,
        { username, password },
        { withCredentials: true }
      )

      const { user: userData } = response.data

      user.value = userData
      const normalizedRoles = (userData.roles || [userData.role]).map(normalizeRole).filter(Boolean)
      roles.value = normalizedRoles
      isAuthenticated.value = true

      if (normalizedRoles.length === 1) {
        activeRole.value = normalizedRoles[0]
        localStorage.setItem(ACTIVE_ROLE_KEY, normalizedRoles[0])
      }

      return { success: true, message: 'Login successful' }
    } catch (err) {
      error.value = err.response?.data?.message || 'Login gagal. Periksa username dan password.'
      isAuthenticated.value = false
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const selectRole = (role) => {
    if (!roles.value.includes(role)) {
      return { success: false, message: 'Role tidak tersedia untuk user ini' }
    }
    activeRole.value = role
    localStorage.setItem(ACTIVE_ROLE_KEY, role)

    // Clear POS device when switching to non-kasir role
    if (role !== 'kasir') {
      posDevice.value = null
      localStorage.removeItem(POS_DEVICE_KEY)
    }

    return { success: true }
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
    try {
      const { default: apiClient } = await import('@/api/client')
      const res = await apiClient.get('/pos-devices')
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? [])
      posDevices.value = data
      return { success: true, data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Gagal memuat POS devices' }
    }
  }

  const selectPosDevice = (device) => {
    posDevice.value = device
    localStorage.setItem(POS_DEVICE_KEY, JSON.stringify(device))
    return { success: true }
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

    try {
      await axios.post(
        `${BASE_URL}/api/auth/sign-out`,
        {},
        { withCredentials: true }
      )
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
    // ── REAL API ───────────────────────────────────────────────────────────

    try {
      const response = await axios.get(`${BASE_URL}/api/auth/get-session`, {
        withCredentials: true,
        timeout: 5000,
      })

      const { user: userData, session } = response.data

      if (!session || !userData) {
        clearAuth()
        return { success: false }
      }

      user.value = userData
      const normalizedRoles = (userData.roles || [userData.role]).map(normalizeRole).filter(Boolean)
      roles.value = normalizedRoles
      isAuthenticated.value = true

      // Restore active role
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

      return { success: true }
    } catch {
      clearAuth()
      return { success: false }
    } finally {
      loading.value = false
    }
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
