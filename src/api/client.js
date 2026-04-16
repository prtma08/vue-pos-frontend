import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Create axios instance with backend-aligned config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://nextore.nexvibe.biz.id',
  withCredentials: true, // Required: sends better-auth.session-token cookie on every request
  timeout: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 10000,
})

// Request interceptor: Handle URL prefix inconsistencies explicitly
apiClient.interceptors.request.use(
  (config) => {
    // Detect URL inconsistencies as per backend requirements:
    // /auth/* endpoints are mapped directly to the root, whereas /api/auth/* are mapped to /api base.
    // Ensure that if VITE_API_BASE_URL ends with /api, we strip it for /auth/ endpoints (like /auth/login)
    const urlStr = config.url || '';
    if (urlStr.startsWith('/auth/') && config.baseURL?.endsWith('/api')) {
      config.baseURL = config.baseURL.replace(/\/api\/?$/, '');
    }

    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: Handle common error cases globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    // Handle 401 Unauthorized — session expired or invalid
    if (status === 401) {
      // Avoid redirect loops: only redirect if NOT already on a public/auth route
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && !currentPath.startsWith('/cashier/cfd')) {
        const authStore = useAuthStore()
        authStore.clearAuth()

        // Use Vue Router for SPA navigation instead of hard window.location.href
        const { default: router } = await import('@/router')
        router.push('/login')
      }
      return Promise.reject(error)
    }

    // Handle 403 Forbidden — permission denied
    if (status === 403) {
      console.error('[API] Permission denied:', error.response?.data?.message)
    }

    // Handle 500 Internal Server Error
    if (status === 500) {
      console.error('[API] Server error:', error.response?.data?.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
