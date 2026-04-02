<template>
  <div class="role-selector-page" :data-theme="theme">
    <!-- Theme Toggle -->
    <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'">
      <span v-if="theme === 'light'">🌙</span>
      <span v-else>☀️</span>
    </button>

    <!-- Background decoration -->
    <div class="rs-bg-decoration" aria-hidden="true">
      <div class="decoration-orb orb-1"></div>
      <div class="decoration-orb orb-2"></div>
      <div class="decoration-orb orb-3"></div>
    </div>

    <!-- Content -->
    <div class="rs-container animate-fadeIn">
      <!-- Header -->
      <div class="rs-header">
        <div class="rs-avatar">
          <span>{{ userInitials }}</span>
        </div>
        <h1 class="rs-title">Halo, {{ authStore.user?.name || 'User' }} 👋</h1>
        <p class="rs-subtitle">Pilih role untuk melanjutkan sesi Anda</p>
      </div>

      <!-- Role Cards -->
      <div class="rs-grid">
        <button
          v-for="role in authStore.roles"
          :key="role"
          class="rs-card"
          :class="{ 'rs-card--selected': hoveredRole === role }"
          @mouseenter="hoveredRole = role"
          @mouseleave="hoveredRole = null"
          @click="handleSelectRole(role)"
        >
          <div class="rs-card-icon">
            <span>{{ getRoleMeta(role).icon }}</span>
          </div>
          <div class="rs-card-body">
            <h3 class="rs-card-label">{{ getRoleMeta(role).label }}</h3>
            <p class="rs-card-desc">{{ getRoleMeta(role).description }}</p>
          </div>
          <div class="rs-card-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </button>
      </div>

      <!-- Logout -->
      <button class="rs-logout" @click="handleLogout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const hoveredRole = ref(null)
const theme = ref(localStorage.getItem('nextore-theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('nextore-theme', theme.value)
}

const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

const getRoleMeta = (role) => authStore.getRoleMeta(role)

const handleSelectRole = (role) => {
  authStore.selectRole(role)

  if (role === 'kasir') {
    router.push('/cashier/device-select')
  } else {
    const redirects = {
      superuser: '/admin/dashboard',
      admin: '/admin/dashboard',
      supervisor: '/admin/transactions',
    }
    router.push(redirects[role] || '/admin/dashboard')
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ── Page ── */
.role-selector-page {
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
.rs-bg-decoration { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.decoration-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.45;
}
.orb-1 { width: 500px; height: 500px; top: -150px; right: -100px; background: radial-gradient(circle, var(--accent-muted), transparent 70%); }
.orb-2 { width: 350px; height: 350px; bottom: -100px; left: -80px; background: radial-gradient(circle, var(--accent-soft), transparent 70%); }
.orb-3 { width: 250px; height: 250px; top: 40%; left: 50%; transform: translateX(-50%); background: radial-gradient(circle, hsl(270 60% 60% / 0.15), transparent 70%); }

/* ── Theme Toggle ── */
.theme-toggle {
  position: fixed; top: 1.25rem; right: 1.25rem;
  width: 2.5rem; height: 2.5rem;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  z-index: 100;
}
.theme-toggle:hover { transform: scale(1.1); box-shadow: var(--shadow-md); }

/* ── Container ── */
.rs-container {
  position: relative; z-index: 1;
  width: 100%; max-width: 520px;
}

/* ── Header ── */
.rs-header { text-align: center; margin-bottom: 2rem; }
.rs-avatar {
  width: 4rem; height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.25rem; font-weight: 700;
  margin-bottom: 1rem;
  box-shadow: 0 4px 24px hsl(var(--accent-hsl) / 0.3);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}
.rs-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 0.375rem;
}
.rs-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: var(--text-tertiary);
}

/* ── Grid ── */
.rs-grid {
  display: flex; flex-direction: column;
  gap: 0.75rem;
}

/* ── Card ── */
.rs-card {
  display: flex; align-items: center; gap: 1rem;
  width: 100%;
  padding: 1.25rem 1.5rem;
  background: var(--bg-surface);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  box-shadow: var(--shadow-sm);
  font-family: 'Inter', sans-serif;
}
.rs-card:hover, .rs-card--selected {
  border-color: var(--accent);
  box-shadow: 0 4px 24px hsl(var(--accent-hsl) / 0.12);
  transform: translateY(-2px);
  background: var(--bg-elevated);
}
.rs-card:active { transform: translateY(0); }

.rs-card-icon {
  width: 3rem; height: 3rem;
  border-radius: 12px;
  background: var(--accent-soft);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
  border: 1px solid var(--accent-muted);
}

.rs-card-body { flex: 1; min-width: 0; }
.rs-card-label {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.rs-card-desc {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  line-height: 1.3;
}

.rs-card-arrow {
  color: var(--text-quaternary);
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.rs-card:hover .rs-card-arrow {
  color: var(--accent);
  transform: translateX(3px);
}

/* ── Logout ── */
.rs-logout {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  margin: 2rem auto 0;
  padding: 0.625rem 1.5rem;
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.rs-logout:hover {
  color: var(--danger);
  border-color: var(--danger);
  background: var(--danger-soft);
}

/* ── Animation ── */
.animate-fadeIn {
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
