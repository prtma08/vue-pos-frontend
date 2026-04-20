/**
 * Shared Validation Utility — Nextore POS
 * Matches Swagger "Nextore API" constraints.
 * Usage: import { validate, rules } from '@/utils/validators'
 */

// ── Rule Factories ──────────────────────────────────────────────────────────

export const rules = {
    /** Field wajib diisi */
    required: (msg = 'Field ini wajib diisi.') =>
        (v) => (!v && v !== 0) ? msg : '',

    /** Panjang minimal */
    minLength: (n, msg) =>
        (v) => (v && v.length < n) ? (msg || `Minimal ${n} karakter.`) : '',

    /** Panjang maksimal */
    maxLength: (n, msg) =>
        (v) => (v && v.length > n) ? (msg || `Maksimal ${n} karakter.`) : '',

    /** Pola regex */
    pattern: (regex, msg = 'Format tidak valid.') =>
        (v) => (v && !regex.test(v)) ? msg : '',

    /** Nama hanya boleh huruf, angka, spasi, dan tanda baca dasar (.,'-) */
    noSpecialChars: (msg = "Nama hanya boleh berisi huruf, angka, spasi, dan simbol dasar (.,'-)") =>
        (v) => (v && !/^[a-zA-Z0-9\s.,'\-]+$/.test(v)) ? msg : '',

    /** Cegah input hanya berisi spasi kosong */
    noWhitespaceOnly: (msg = 'Input tidak boleh hanya berisi spasi.') =>
        (v) => (typeof v === 'string' && v.length > 0 && v.trim().length === 0) ? msg : '',

    /** Nilai numerik minimal */
    minValue: (n, msg) =>
        (v) => (v != null && v !== '' && Number(v) < n) ? (msg || `Nilai minimal ${n}.`) : '',

    /** Validasi tipe file (ekstensi) */
    fileType: (allowedExts, msg) => (file) => {
        if (!file) return ''
        const ext = file.name.split('.').pop().toLowerCase()
        if (!allowedExts.includes(ext)) {
            return msg || `Format file tidak didukung. Gunakan: ${allowedExts.join(', ')}.`
        }
        return ''
    },

    /** Validasi ukuran file (bytes) */
    fileSize: (maxBytes, msg) => (file) => {
        if (!file) return ''
        if (file.size > maxBytes) {
            const mb = (maxBytes / (1024 * 1024)).toFixed(0)
            return msg || `Ukuran file maks. ${mb}MB.`
        }
        return ''
    },

    /** Nilai numerik maksimal */
    maxValue: (n, msg) =>
        (v) => (v != null && v !== '' && Number(v) > n) ? (msg || `Nilai maksimal ${n}.`) : '',

    /** Tanggal tidak boleh sebelum tanggal referensi (string YYYY-MM-DD) */
    dateNotBefore: (refDateOrFn, msg) => (v) => {
        if (!v) return ''
        const ref = typeof refDateOrFn === 'function' ? refDateOrFn() : refDateOrFn
        if (!ref) return ''
        return v < ref ? (msg || `Tanggal tidak boleh sebelum ${ref}.`) : ''
    },

    /** Tanggal harus setelah tanggal referensi */
    dateAfter: (refDateOrFn, msg) => (v) => {
        if (!v) return ''
        const ref = typeof refDateOrFn === 'function' ? refDateOrFn() : refDateOrFn
        if (!ref) return ''
        return v <= ref ? (msg || `Tanggal harus setelah ${ref}.`) : ''
    },
}

/**
 * Jalankan array of rule functions pada sebuah value.
 * Mengembalikan pesan error pertama yang ditemukan, atau string kosong jika valid.
 * @param {*} value
 * @param {Function[]} ruleFns
 * @returns {string}
 */
export const validate = (value, ruleFns) => {
    for (const fn of ruleFns) {
        const err = fn(value)
        if (err) return err
    }
    return ''
}

/**
 * Validasi semua field sekaligus.
 * @param {Record<string, {value: *, rules: Function[]}>} fieldMap
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export const validateAll = (fieldMap) => {
    const errors = {}
    let valid = true
    for (const [key, { value, rules: ruleFns }] of Object.entries(fieldMap)) {
        const err = validate(value, ruleFns)
        errors[key] = err
        if (err) valid = false
    }
    return { valid, errors }
}

/**
 * Cek apakah form valid (tanpa side effects). Cocok untuk computed :disabled.
 * @param {Record<string, {value: *, rules: Function[]}>} fieldMap
 * @returns {boolean}
 */
export const isFormValid = (fieldMap) => {
    for (const { value, rules: ruleFns } of Object.values(fieldMap)) {
        for (const fn of ruleFns) {
            if (fn(value)) return false
        }
    }
    return true
}
