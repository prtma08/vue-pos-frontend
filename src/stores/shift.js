import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const useShiftStore = defineStore('shift', () => {
    // State
    const currentShift = ref(null)
    const shiftHistory = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Computed
    const isShiftOpen = computed(() => currentShift.value?.status === 'OPEN')
    const shiftDuration = computed(() => {
        const startField = currentShift.value?.startedAt || currentShift.value?.startTime
        if (!startField) return '—'
        const diffMs = Date.now() - new Date(startField).getTime()
        const hrs = Math.floor(diffMs / 3600000)
        const mins = Math.floor((diffMs % 3600000) / 60000)
        return `${hrs}j ${mins}m`
    })

    // ── Open Shift ─────────────────────────────────────────────────────────────
    // Called internally after POST /auth/select-pos succeeds.
    // The backend opens the shift as part of POS selection, so we just hydrate local state.
    const hydrateShift = (shiftData) => {
        const normalized = {
            id: shiftData.id,
            userId: shiftData.userId,
            startingCash: shiftData.startingCash ?? shiftData.openingBalance ?? 0,
            startTime: shiftData.startTime || shiftData.startedAt || new Date().toISOString(),
            status: shiftData.status || 'OPEN',
            // Local tracking
            transactions: [],
            totalSales: 0,
            expectedCash: shiftData.expectedCash ?? null,
            currentSales: shiftData.currentSales ?? 0,
        }
        currentShift.value = normalized
        localStorage.setItem('nextore-current-shift', JSON.stringify(normalized))

        if (import.meta.env.DEV) {
            console.log('[Shift] Shift hydrated:', normalized)
        }
    }

    // Legacy openShift — for MOCK mode and backwards compat
    const openShift = async (openingBalance) => {
        if (isShiftOpen.value) {
            return { success: false, message: 'Shift sudah berjalan' }
        }

        if (openingBalance < 0) {
            return { success: false, message: 'Modal awal tidak boleh negatif' }
        }

        const authStore = useAuthStore()
        loading.value = true
        error.value = null

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 500))
            const shiftData = {
                id: `shift-${Date.now()}`,
                userId: authStore.user?.id || 'unknown',
                startingCash: Math.round(openingBalance),
                startTime: new Date().toISOString(),
                status: 'OPEN',
                transactions: [],
                totalSales: 0,
            }
            currentShift.value = shiftData
            localStorage.setItem('nextore-current-shift', JSON.stringify(shiftData))
            loading.value = false

            if (import.meta.env.DEV) {
                console.log('[Shift] Shift opened (mock):', shiftData)
            }

            return { success: true, shift: shiftData }
        }

        // Real mode — shift is opened via authStore.selectPosDevice()
        // This function should not be called directly in real mode
        loading.value = false
        return { success: false, message: 'Shift dibuka melalui pemilihan terminal POS' }
    }

    // ── Record Transaction in Shift ────────────────────────────────────────────
    const recordTransaction = (transactionId, amount) => {
        if (!currentShift.value) return
        if (!currentShift.value.transactions) currentShift.value.transactions = []
        currentShift.value.transactions.push({
            id: transactionId,
            amount,
            timestamp: new Date().toISOString(),
        })
        currentShift.value.totalSales = (currentShift.value.totalSales || 0) + amount
        localStorage.setItem('nextore-current-shift', JSON.stringify(currentShift.value))
    }

    // ── Shift Summary ──────────────────────────────────────────────────────────
    const getShiftSummary = computed(() => {
        if (!currentShift.value) return null
        const startingCash = currentShift.value.startingCash || currentShift.value.openingBalance || 0
        const totalSales = currentShift.value.totalSales || currentShift.value.currentSales || 0
        const txCount = currentShift.value.transactions?.length || 0
        const expectedCash = currentShift.value.expectedCash ?? (startingCash + totalSales)
        return {
            openingBalance: startingCash,
            totalSales,
            transactionCount: txCount,
            expectedCash,
        }
    })

    // ── Fetch Current Shift Status from Backend ────────────────────────────────
    const fetchCurrentStatus = async () => {
        if (USE_MOCK) return { success: false }
        loading.value = true
        error.value = null
        try {
            const { default: apiClient } = await import('@/api/client')
            // Use the session endpoint to get shift info
            const res = await apiClient.get('/api/auth/get-session', { timeout: 5000 })
            const payload = res.data?.data ?? res.data
            const { session } = payload

            if (session?.activeShiftId) {
                // We have an active shift — hydrate
                const shiftData = {
                    id: session.activeShiftId,
                    userId: payload.user?.id,
                    startingCash: currentShift.value?.startingCash || 0,
                    startTime: currentShift.value?.startTime || new Date().toISOString(),
                    status: 'OPEN',
                    transactions: currentShift.value?.transactions || [],
                    totalSales: currentShift.value?.totalSales || 0,
                }
                currentShift.value = shiftData
                localStorage.setItem('nextore-current-shift', JSON.stringify(shiftData))
                return { success: true }
            }
            return { success: false }
        } catch (err) {
            error.value = err.response?.data?.message || 'Gagal mengambil status shift'
            return { success: false, message: error.value }
        } finally { loading.value = false }
    }

    // ── Close Shift ────────────────────────────────────────────────────────────
    // In real mode, closing shift is done via authStore.logout(actualCash).
    // This method is for MOCK mode and internal state management.
    const closeShift = async (physicalCash) => {
        if (!isShiftOpen.value) {
            return { success: false, message: 'Tidak ada shift yang aktif' }
        }

        if (physicalCash < 0) {
            return { success: false, message: 'Jumlah uang fisik tidak valid' }
        }

        loading.value = true
        error.value = null

        const summary = getShiftSummary.value
        const expectedCash = summary.expectedCash
        const difference = Math.round(physicalCash) - expectedCash

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 600))
            const closedShift = {
                ...currentShift.value,
                actualCash: Math.round(physicalCash),
                expectedCash,
                difference,
                endTime: new Date().toISOString(),
                status: 'CLOSED',
            }
            shiftHistory.value.unshift(closedShift)
            currentShift.value = null
            localStorage.removeItem('nextore-current-shift')
            loading.value = false

            if (import.meta.env.DEV) {
                console.log('[Shift] Shift closed (mock):', closedShift)
            }

            return {
                success: true,
                shift: closedShift,
                deficit: difference < 0 ? Math.abs(difference) : 0,
                surplus: difference > 0 ? difference : 0,
                difference,
                hasDeficit: difference < 0,
            }
        }

        // Real mode — close shift is done via authStore.logout(actualCash)
        loading.value = false
        return { success: false, message: 'Gunakan tombol Tutup Shift & Logout' }
    }

    // ── Clear shift state (called after successful logout) ─────────────────────
    const clearShift = () => {
        currentShift.value = null
        localStorage.removeItem('nextore-current-shift')
    }

    // ── Restore from localStorage ──────────────────────────────────────────────
    const restoreShift = () => {
        try {
            const saved = localStorage.getItem('nextore-current-shift')
            if (saved) {
                currentShift.value = JSON.parse(saved)
                return true
            }
        } catch { /* ignore parse errors */ }
        return false
    }

    return {
        currentShift, shiftHistory, loading, error,
        isShiftOpen, shiftDuration, getShiftSummary,
        openShift, closeShift, clearShift,
        hydrateShift, fetchCurrentStatus,
        recordTransaction, restoreShift,
    }
})
