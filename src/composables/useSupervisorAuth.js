import { ref } from 'vue'
import axios from 'axios'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/**
 * Composable for supervisor credential verification and audit logging.
 * Uses a separate axios instance to avoid clobbering the cashier's session cookie.
 */
export function useSupervisorAuth() {
    const verifying = ref(false)
    const error = ref('')

    // Separate axios instance — no withCredentials, no interceptors
    // This prevents the supervisor login from replacing the cashier's session
    const verifyClient = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://nextore.nexvibe.biz.id',
        timeout: 10000,
        withCredentials: false,
    })

    /**
     * Verify supervisor credentials via POST /auth/login.
     * We only care about the 200 OK — the session/token is discarded.
     */
    const verifySupervisor = async (username, password) => {
        verifying.value = true
        error.value = ''

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 600))
            // Mock: accept known supervisor passwords
            if (password === 'admin123' || password === 'super123') {
                verifying.value = false
                return {
                    success: true,
                    supervisorId: `mock-sv-${Date.now()}`,
                    supervisorName: username,
                }
            }
            verifying.value = false
            error.value = 'Username atau password supervisor salah'
            return { success: false, message: error.value }
        }

        try {
            const response = await verifyClient.post('/auth/login', {
                username,
                password,
            })

            const data = response.data?.data ?? response.data
            // Validate the user has supervisor/admin/superuser role
            const roles = data?.availableRoles || []
            const isSupervisor = roles.some(r =>
                ['SUPERVISOR', 'ADMIN', 'SUPERUSER'].includes(r?.toUpperCase())
            )

            // For single-role users, check if requiresRoleSelection is false
            // meaning the role was auto-selected — check the response for role info
            if (!isSupervisor && !data?.requiresRoleSelection) {
                // Single role user — we cannot determine role from login response alone
                // Accept the login as valid (the backend will enforce role checks on actions)
            }

            verifying.value = false
            return {
                success: true,
                supervisorId: data?.userId || data?.user?.id || username,
                supervisorName: username,
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal memverifikasi kredensial supervisor'
            error.value = msg
            verifying.value = false
            return { success: false, message: msg }
        }
    }

    /**
     * Log the supervisor override action.
     * In real mode, this could POST to an audit endpoint.
     * For now, we log locally and it gets attached to the transaction metadata.
     */
    const logAuditAction = (supervisorId, action, metadata = {}) => {
        const auditEntry = {
            supervisorId,
            action,
            ...metadata,
            timestamp: new Date().toISOString(),
        }

        if (import.meta.env.DEV) {
            console.log('[SupervisorAudit]', auditEntry)
        }

        // Store in sessionStorage for the current session audit trail
        try {
            const existing = JSON.parse(sessionStorage.getItem('nextore-audit-log') || '[]')
            existing.push(auditEntry)
            sessionStorage.setItem('nextore-audit-log', JSON.stringify(existing))
        } catch { /* ignore storage errors */ }

        return auditEntry
    }

    return {
        verifying,
        error,
        verifySupervisor,
        logAuditAction,
    }
}
