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

<style scoped>
.app-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: var(--surface-card, #ffffff);
  border-top: 1px solid var(--border-light, #e2e8f0);
  font-family: 'Inter', system-ui, sans-serif;
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
  color: var(--text-secondary, #475569);
}

.pagination-info strong {
  color: var(--text-primary, #0f172a);
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
  border-radius: var(--radius-sm, 6px);
  border: 1.5px solid var(--border-light, #e2e8f0);
  background: var(--surface-base, #ffffff);
  color: var(--text-secondary, #475569);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent, #6366f1);
  color: var(--accent, #6366f1);
  background: var(--accent-soft, rgba(99, 102, 241, 0.1));
}

.page-btn.active {
  background: linear-gradient(135deg, var(--accent, #6366f1) 0%, #8b5cf6 100%);
  color: #ffffff;
  border-color: transparent;
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
  color: var(--text-tertiary, #94a3b8);
}

/* Fallbacks and Dark Mode using attributes instead of wrapper classes since it's used globally */
:global([data-theme="dark"]) .app-pagination {
  background: transparent;
}

:global([data-theme="dark"]) .page-btn {
  background: var(--surface-input-dark, #1e293b);
  border-color: var(--border-dark, #334155);
  color: var(--text-secondary-dark, #cbd5e1);
}

:global([data-theme="dark"]) .page-btn:hover:not(:disabled) {
  border-color: var(--accent-dark, #818cf8);
  color: var(--accent-dark, #818cf8);
  background: var(--accent-soft-dark, rgba(129, 140, 248, 0.15));
}
</style>
