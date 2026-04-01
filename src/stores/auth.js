import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// Base URL: empty string = use Vite dev proxy (same origin), avoids CORS
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ACCOUNTS = [
  {
    username: 'admin',
    password: 'admin123',
    user: { id: 'mock-user-1', name: 'Administrator', username: 'admin', role: 'ADMIN' },
  },
  {
    username: 'supervisor',
    password: 'supervisor123',
    user: { id: 'mock-user-2', name: 'Supervisor Utama', username: 'supervisor', role: 'SUPERVISOR' },
  },
  {
    username: 'kasir',
    password: 'kasir123',
    user: { id: 'mock-user-3', name: 'Kasir 1', username: 'kasir', role: 'CASHIER' },
  },
]

// Persistent mock session key
const MOCK_SESSION_KEY = 'pos_mock_session'

// ─── Normalize backend role strings to lowercase app roles ──────────────────
const normalizeRole = (role) => {
  const map = { ADMIN: 'admin', SUPERVISOR: 'supervisor', CASHIER: 'kasir' }
  return map[role?.toUpperCase()] || role?.toLowerCase() || null
}

// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const isAuthenticated = ref(false)
  const userRole = ref(null) // 'admin', 'supervisor', 'kasir'
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const isAdmin = computed(() => userRole.value === 'admin')
  const isSupervisor = computed(() => userRole.value === 'supervisor')
  const isKasir = computed(() => userRole.value === 'kasir')

  const canApproveDiscount = computed(() => isSupervisor.value || isAdmin.value)
  const canChangePrice = computed(() => isSupervisor.value || isAdmin.value)
  const canAccessAdmin = computed(() => isAdmin.value)

  // ── Actions ─────────────────────────────────────────────────────────────────

  const login = async (username, password) => {
    loading.value = true
    error.value = null

    // ── MOCK MODE ──────────────────────────────────────────────────────────
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500)) // simulate network delay

      const account = MOCK_ACCOUNTS.find(
        a => a.username === username && a.password === password
      )

      if (!account) {
        error.value = '[Mock] Username atau password salah.'
        loading.value = false
        return { success: false, message: error.value }
      }

      user.value = account.user
      userRole.value = normalizeRole(account.user.role)
      isAuthenticated.value = true

      // Persist mock session
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(account.user))

      loading.value = false
      return { success: true, message: 'Login berhasil (Mock Mode)' }
    }
    // ── REAL API ───────────────────────────────────────────────────────────

    try {
      // Better-Auth: sign in with username
      const response = await axios.post(
        `${BASE_URL}/api/auth/sign-in/username`,
        { username, password },
        { withCredentials: true }
      )

      // Better-Auth returns: { user: {...}, session: {...} }
      const { user: userData } = response.data

      user.value = userData
      userRole.value = normalizeRole(userData.role)
      isAuthenticated.value = true

      return { success: true, message: 'Login successful' }
    } catch (err) {
      error.value = err.response?.data?.message || 'Login gagal. Periksa username dan password.'
      isAuthenticated.value = false
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      localStorage.removeItem(MOCK_SESSION_KEY)
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
      const stored = localStorage.getItem(MOCK_SESSION_KEY)
      if (stored) {
        try {
          const userData = JSON.parse(stored)
          user.value = userData
          userRole.value = normalizeRole(userData.role)
          isAuthenticated.value = true
          loading.value = false
          return { success: true }
        } catch {
          localStorage.removeItem(MOCK_SESSION_KEY)
        }
      }
      loading.value = false
      return { success: false }
    }
    // ── REAL API ───────────────────────────────────────────────────────────

    try {
      // Better-Auth: get current session
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
      userRole.value = normalizeRole(userData.role)
      isAuthenticated.value = true

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
    userRole.value = null
    isAuthenticated.value = false
    error.value = null
  }

  return {
    // State
    user,
    isAuthenticated,
    userRole,
    loading,
    error,

    // Computed
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
  }
})
