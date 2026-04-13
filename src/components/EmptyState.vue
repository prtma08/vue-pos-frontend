<template>
  <div class="nx-empty-state">
    <div class="nx-empty-icon">
      <slot name="icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      </slot>
    </div>
    <p class="nx-empty-title">{{ title }}</p>
    <p class="nx-empty-desc">{{ description }}</p>
    <router-link v-if="actionRoute" :to="actionRoute" class="btn btn-primary btn-sm" style="margin-top: 1.25rem;">
      {{ actionText }}
    </router-link>
  </div>
</template>

<script setup>
defineProps({
  title:       { type: String, default: 'Tidak ada data' },
  description: { type: String, default: 'Data yang Anda cari belum tersedia.' },
  actionText:  { type: String, default: '' },
  actionRoute: { type: String, default: '' },
})
</script>
