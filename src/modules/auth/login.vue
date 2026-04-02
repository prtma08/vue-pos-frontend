<template>
  <div class="login-page" :data-theme="theme">
    <!-- Theme Toggle -->
    <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'">
      <span v-if="theme === 'light'">🌙</span>
      <span v-else>☀️</span>
    </button>

    <!-- Background decoration -->
    <div class="login-bg-decoration" aria-hidden="true">
      <div class="decoration-orb orb-1"></div>
      <div class="decoration-orb orb-2"></div>
    </div>

    <!-- Login Card -->
    <div class="login-card animate-fadeIn">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="currentColor" opacity="0.15"/>
            <path d="M7 8h14M7 14h9M7 20h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="21" cy="20" r="3" fill="currentColor"/>
          </svg>
        </div>
        <div class="logo-text">
          <h1 class="logo-brand">Nextore</h1>
          <p class="logo-tagline">Point of Sale System</p>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="text-label">Username</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              v-model="username"
              type="text"
              placeholder="Masukkan username"
              class="input-field input-with-icon"
              required
              autocomplete="username"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="text-label">Password</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="input-field input-with-icon"
              required
              autocomplete="current-password"
              :disabled="loading"
            />
            <button type="button" class="input-icon input-icon-right" @click="showPassword = !showPassword" tabindex="-1">
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Error -->
        <transition name="fade">
          <div v-if="error" class="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ error }}</span>
          </div>
        </transition>

        <button type="submit" class="btn btn-primary btn-lg login-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Masuk...' : 'Masuk' }}</span>
        </button>
      </form>

      <!-- Mock hint -->
      <p v-if="isMock" class="mock-hint">
        <span class="badge badge-accent">Mock Mode</span>
        superuser / super123 &nbsp;·&nbsp; admin / admin123 &nbsp;·&nbsp; kasir / kasir123
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const username     = ref('')
const password     = ref('')
const loading      = ref(false)
const error        = ref('')
const showPassword = ref(false)
const isMock       = import.meta.env.VITE_USE_MOCK === 'true'

// Theme — persist in localStorage
const theme = ref(localStorage.getItem('nextore-theme') || 'light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('nextore-theme', theme.value)
}

const handleLogin = async () => {
  loading.value = true
  error.value   = ''

  try {
    const result = await authStore.login(username.value, password.value)

    if (result.success) {
      // Multi-role users → role selector
      if (authStore.needsRoleSelection) {
        router.push('/role-select')
        return
      }

      // Single-role users → direct redirect
      if (authStore.activeRole === 'kasir') {
        router.push('/cashier/device-select')
      } else {
        const roleRedirects = { superuser: '/admin/dashboard', admin: '/admin', supervisor: '/admin/transactions', kasir: '/cashier' }
        router.push(roleRedirects[authStore.activeRole] || '/admin')
      }
    } else {
      error.value = result.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Page Layout ── */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

/* ── Background ── */
.login-bg-decoration { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.decoration-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}
.orb-1 {
  width: 500px; height: 500px;
  top: -150px; right: -150px;
  background: radial-gradient(circle, var(--accent-muted), transparent 70%);
}
.orb-2 {
  width: 400px; height: 400px;
  bottom: -120px; left: -100px;
  background: radial-gradient(circle, var(--accent-soft), transparent 70%);
}

/* ── Theme Toggle ── */
.theme-toggle {
  position: fixed;
  top: 1.25rem; right: 1.25rem;
  width: 2.5rem; height: 2.5rem;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  z-index: 100;
}
.theme-toggle:hover { transform: scale(1.1); box-shadow: var(--shadow-md); }

/* ── Card ── */
.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  padding: 2.5rem;
}

/* ── Logo ── */
.login-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.logo-icon {
  width: 3.25rem; height: 3.25rem;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--accent-muted);
}

.logo-brand {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.02em;
}

.logo-tagline {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 2px;
  letter-spacing: 0.04em;
}

/* ── Form ── */
.login-form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; }

.form-group { display: flex; flex-direction: column; gap: 0.5rem; }

.input-wrapper { position: relative; }

.input-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0.875rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.input-icon-right {
  left: auto;
  right: 0.875rem;
  cursor: pointer;
  pointer-events: all;
  background: none;
  border: none;
  padding: 0;
  transition: color 0.15s;
}
.input-icon-right:hover { color: var(--text-primary); }

.input-with-icon {
  padding-left: 2.75rem;
  padding-right: 2.75rem;
}

/* ── Error Banner ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--danger-soft);
  border: 1px solid var(--danger);
  border-radius: 10px;
  color: var(--danger);
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
}

/* ── Login Button ── */
.login-btn { width: 100%; margin-top: 0.5rem; gap: 0.75rem; }

/* ── Spinner ── */
.spinner {
  width: 1rem; height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Mock Hint ── */
.mock-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-family: 'Inter', sans-serif;
}

/* ── Transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
