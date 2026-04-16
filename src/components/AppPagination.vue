<template>
  <div class="app-pagination" v-if="totalPages > 1 || totalItems > 0">
    <div class="pagination-info">
      <template v-if="totalItems > 0">
        Menampilkan {{ startItem }} - {{ endItem }} dari <strong>{{ totalItems }}</strong> data
      </template>
      <template v-else>
        Belum ada data
      </template>
    </div>
    
    <div class="pagination-controls" v-if="totalPages > 1">
      <button 
        class="page-btn page-nav" 
        :disabled="currentPage <= 1"
        @click="$emit('page-change', currentPage - 1)"
        title="Halaman Sebelumnya"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      
      <button 
        v-for="(p, index) in visiblePages" 
        :key="index"
        class="page-btn" 
        :class="{ active: p === currentPage, ellipsis: p === '...' }"
        :disabled="p === '...'"
        @click="p !== '...' && $emit('page-change', p)"
      >
        {{ p }}
      </button>
      
      <button 
        class="page-btn page-nav" 
        :disabled="currentPage >= totalPages"
        @click="$emit('page-change', currentPage + 1)"
        title="Halaman Selanjutnya"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  limit: { type: Number, default: 10 },
  totalItems: { type: Number, required: true },
})

defineEmits(['page-change'])

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return ((props.currentPage - 1) * props.limit) + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.limit, props.totalItems)
})

const visiblePages = computed(() => {
  const current = props.currentPage
  const total = props.totalPages
  
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }
  
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }
  
  return [1, '...', current - 1, current, current + 1, '...', total]
})
</script>

<style>
/* ── AppPagination — uses CSS variables that auto-switch with [data-theme] ── */
.app-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
}

@media (max-width: 640px) {
  .app-pagination {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  .pagination-controls {
    width: 100%;
    justify-content: space-between;
  }
}

.pagination-info {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.pagination-info strong {
  color: var(--text-primary);
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.page-btn {
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1.5px solid var(--border);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.page-btn.active {
  background: var(--accent);
  color: var(--text-inverse);
  border-color: var(--accent);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.ellipsis {
  border: none;
  background: transparent;
  pointer-events: none;
  min-width: 1.5rem;
  color: var(--text-tertiary);
}
</style>
