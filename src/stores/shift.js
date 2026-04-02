import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const useShiftStore = defineStore('shift', () => {
    // State
    const currentShift = ref(null) // { id, posDeviceId, cashierId, cashierName, openingBalance, startedAt, closingBalance, endedAt, status }
    const shiftHistory = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Computed
    const isShiftOpen = computed(() => currentShift.value?.status === 'OPEN')
    const shiftDuration = computed(() => {
        if (!currentShift.value?.startedAt) return '—'
        const diffMs = Date.now() - new Date(currentShift.value.startedAt).getTime()
        const hrs = Math.floor(diffMs / 3600000)
        const mins = Math.floor((diffMs % 3600000) / 60000)
        return `${hrs}j ${mins}m`
    })

    // ── Open Shift ─────────────────────────────────────────────────────────────
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

        const shiftData = {
            id: `shift-${Date.now()}`,
            posDeviceId: authStore.posDevice?.id || null,
            posDeviceName: authStore.posDevice?.name || 'Unknown POS',
            cashierId: authStore.user?.id || 'unknown',
            cashierName: authStore.user?.name || authStore.user?.username || 'Kasir',
            openingBalance: Math.round(openingBalance),
            startedAt: new Date().toISOString(),
            closingBalance: null,
            endedAt: null,
            status: 'OPEN',
            transactions: [], // will be populated during shift
            totalSales: 0,
        }

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 500))
            currentShift.value = shiftData
            // Persist to localStorage
            localStorage.setItem('nextore-current-shift', JSON.stringify(shiftData))
            loading.value = false

            if (import.meta.env.DEV) {
                console.log('[Shift] Shift opened:', shiftData)
            }

            return { success: true, shift: shiftData }
        }

        // REAL API
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post('/shifts/open', {
                posDeviceId: shiftData.posDeviceId,
                openingBalance: shiftData.openingBalance,
            })
            const data = res.data.data ?? res.data
            currentShift.value = data
            localStorage.setItem('nextore-current-shift', JSON.stringify(data))
            return { success: true, shift: data }
        } catch (err) {
            error.value = err.response?.data?.message || 'Gagal membuka shift'
            return { success: false, message: error.value }
        } finally { loading.value = false }
    }

    // ── Record Transaction in Shift ────────────────────────────────────────────
    const recordTransaction = (transactionId, amount) => {
        if (!currentShift.value) return
        currentShift.value.transactions.push({
            id: transactionId,
            amount,
            timestamp: new Date().toISOString(),
        })
        currentShift.value.totalSales += amount
        localStorage.setItem('nextore-current-shift', JSON.stringify(currentShift.value))
    }

    // ── Shift Summary (computed on-the-fly) ────────────────────────────────────
    const getShiftSummary = computed(() => {
        if (!currentShift.value) return null
        const totalSales = currentShift.value.totalSales || 0
        const txCount = currentShift.value.transactions?.length || 0
        const expectedCash = currentShift.value.openingBalance + totalSales
        return {
            openingBalance: currentShift.value.openingBalance,
            totalSales,
            transactionCount: txCount,
            expectedCash, // modal awal + total penjualan
        }
    })

    // ── Close Shift ────────────────────────────────────────────────────────────
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
        const deficit = expectedCash - Math.round(physicalCash)

        const closeData = {
            closingBalance: Math.round(physicalCash),
            endedAt: new Date().toISOString(),
            status: 'CLOSED',
            expectedCash,
            deficit,   // positive = kekurangan, negative = kelebihan
            hasDeficit: deficit > 0,
        }

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 600))
            const closedShift = { ...currentShift.value, ...closeData }
            shiftHistory.value.unshift(closedShift)
            currentShift.value = null
            localStorage.removeItem('nextore-current-shift')
            loading.value = false

            if (import.meta.env.DEV) {
                console.log('[Shift] Shift closed:', closedShift)
                if (closeData.hasDeficit) console.warn(`[Shift] DEFICIT: Rp ${deficit.toLocaleString('id-ID')}`)
            }

            return { success: true, shift: closedShift, deficit, hasDeficit: closeData.hasDeficit }
        }

        // REAL API
        try {
            const { default: apiClient } = await import('@/api/client')
            const res = await apiClient.post(`/shifts/${currentShift.value.id}/close`, {
                closingBalance: Math.round(physicalCash),
            })
            const data = res.data.data ?? res.data
            shiftHistory.value.unshift(data)
            currentShift.value = null
            localStorage.removeItem('nextore-current-shift')
            return { success: true, shift: data, deficit: data.deficit, hasDeficit: data.deficit > 0 }
        } catch (err) {
            error.value = err.response?.data?.message || 'Gagal menutup shift'
            return { success: false, message: error.value }
        } finally { loading.value = false }
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
        openShift, closeShift, recordTransaction, restoreShift,
    }
})
