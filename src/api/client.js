import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://nextore.nexvibe.biz.id',
  withCredentials: true, // Required for Better-Auth session cookie
  timeout: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 10000,
})

// Request interceptor: Nothing special needed — Better-Auth uses session cookie automatically
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor: Handle common error cases
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()

    // Handle 401 Unauthorized — session expired or invalid, redirect to login
    if (error.response?.status === 401) {
      // Clear local auth state
      authStore.clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Handle 403 Forbidden — permission denied
    if (error.response?.status === 403) {
      console.error('[API] Permission denied:', error.response.data?.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
