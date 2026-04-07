import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'nextore-settings'

const DEFAULTS = {
    expiryNotificationDays: 30,    // D2: Days before expiry to warn
    lowStockThreshold: 10,    // Global low-stock minimum
    taxPercent: 0,     // Tax applied on transactions
    posName: 'Nextore POS',
    currencySymbol: 'Rp',
    receiptFooter: 'Terima kasih atas kunjungan Anda!',
}

const load = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
    } catch { return { ...DEFAULTS } }
}

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref(load())

    // Auto-persist on change
    watch(settings, (val) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    }, { deep: true })

    const update = (patch) => {
        settings.value = { ...settings.value, ...patch }
    }

    const reset = () => {
        settings.value = { ...DEFAULTS }
    }

    // Convenient getters
    const expiryDays = () => settings.value.expiryNotificationDays
    const lowStockMin = () => settings.value.lowStockThreshold
    const taxPercent = () => settings.value.taxPercent

    return { settings, update, reset, expiryDays, lowStockMin, taxPercent }
})
