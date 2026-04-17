<template>
  <div class="cb-root" ref="rootRef" :class="{ 'cb-open': isOpen }">
    <!-- Trigger field -->
    <div
      class="cb-trigger"
      :class="{ 'cb-focus': isOpen, 'cb-has-value': !!displayValue }"
      @click="open"
    >
      <span v-if="selectedIcon" class="cb-sel-icon">{{ selectedIcon }}</span>
      <span class="cb-display-text" :class="{ 'cb-placeholder': !displayValue }">
        {{ displayValue || placeholder }}
      </span>
      <button v-if="modelValue && clearable" type="button" class="cb-clear" @click.stop="clearSelection" tabindex="-1" title="Hapus pilihan">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <svg class="cb-chevron" :class="{ 'cb-chevron-up': isOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>

    <!-- Dropdown panel (teleported to body for z-index safety) -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="cb-panel"
        :style="panelStyle"
        ref="panelRef"
        @mousedown.prevent
      >
        <!-- Search input -->
        <div class="cb-search-wrap">
          <svg class="cb-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="query"
            class="cb-search"
            type="text"
            :placeholder="searchPlaceholder"
            autocomplete="off"
            @keydown="onKeydown"
            @input="onInput"
          />
          <button v-if="query" type="button" class="cb-clear-query" @click="query = ''" tabindex="-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Options list -->
        <div class="cb-list" ref="listRef">
          <div
            v-for="(opt, idx) in filteredOptions"
            :key="getKey(opt)"
            class="cb-option"
            :class="{
              'cb-option-active': activeIndex === idx,
              'cb-option-selected': getKey(opt) === modelValue,
            }"
            @mousedown.prevent="select(opt)"
            @mousemove="activeIndex = idx"
          >
            <span v-if="getIcon(opt)" class="cb-opt-icon">{{ getIcon(opt) }}</span>
            <div class="cb-opt-text">
              <span class="cb-opt-label" v-html="highlight(getLabel(opt))"></span>
              <span v-if="getSubLabel(opt)" class="cb-opt-sub">{{ getSubLabel(opt) }}</span>
            </div>
            <svg v-if="getKey(opt) === modelValue" class="cb-opt-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <!-- Empty state -->
          <div v-if="filteredOptions.length === 0" class="cb-empty">
            <div class="cb-empty-icon">🔍</div>
            <p class="cb-empty-text">Data tidak ditemukan</p>
            <p v-if="query" class="cb-empty-sub">"{{ query }}" tidak tersedia</p>
            <!-- Add New button (only if addNewLabel is set) -->
            <button v-if="addNewLabel" type="button" class="cb-add-new-btn" @click="onAddNew">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ addNewLabel }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  /**
   * v-model: the selected key value (id, value, etc.)
   */
  modelValue: { type: [String, Number], default: '' },

  /**
   * Array of option objects. Each must have at least the field specified by optionKey.
   * Example: [{ id: 'u1', name: 'Andi', phone: '08xx' }]
   */
  options: { type: Array, default: () => [] },

  /** Field to use as the option's unique key (v-model value) */
  optionKey: { type: String, default: 'id' },

  /** Field to use as the primary display label */
  optionLabel: { type: String, default: 'name' },

  /** Field to use as secondary/sub label (e.g. phone number) */
  optionSubLabel: { type: String, default: '' },

  /** Field to use as emoji icon (optional) */
  optionIcon: { type: String, default: '' },

  /** Placeholder text when nothing is selected */
  placeholder: { type: String, default: 'Pilih...' },

  /** Placeholder text inside the search box */
  searchPlaceholder: { type: String, default: '🔍 Cari...' },

  /** Show X button to clear selection */
  clearable: { type: Boolean, default: true },

  /** If set, shows "Add New" button in empty state */
  addNewLabel: { type: String, default: '' },

  /**
   * Custom filter function: (opt, query) => boolean
   * Defaults to matching optionLabel + optionSubLabel with the query
   */
  filterFn: { type: Function, default: null },

  /** Auto-focus the search input when popover opens */
  autofocus: { type: Boolean, default: true },

  /**
   * Barcode scanner mode:
   * If true, listens for burst-input (≥3 chars/100ms) and auto-selects matching option by key
   */
  barcodeMode: { type: Boolean, default: false },

  /** Field to match against barcode scan (default: optionKey e.g. sku) */
  barcodeField: { type: String, default: '' },

  /** Disabled state */
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',  // selected key
  'select',             // full option object
  'add-new',            // add new clicked (carries query string)
  'barcode-scanned',    // barcode detected (carries scanned string)
])

// ─── State ───────────────────────────────────────────────────────────────────
const rootRef      = ref(null)
const panelRef     = ref(null)
const searchInputRef = ref(null)
const listRef      = ref(null)
const isOpen       = ref(false)
const query        = ref('')
const activeIndex  = ref(0)
const panelStyle   = ref({})

// ─── Getters ─────────────────────────────────────────────────────────────────
const getKey      = (opt) => opt?.[props.optionKey]  ?? opt
const getLabel    = (opt) => opt?.[props.optionLabel] ?? String(opt)
const getSubLabel = (opt) => props.optionSubLabel ? (opt?.[props.optionSubLabel] ?? '') : ''
const getIcon     = (opt) => props.optionIcon ? (opt?.[props.optionIcon] ?? '') : ''

// ─── Display value ────────────────────────────────────────────────────────────
const selectedOption = computed(() =>
  props.options.find(o => getKey(o) === props.modelValue) ?? null
)
const displayValue = computed(() => {
  if (!selectedOption.value) return ''
  const sub = getSubLabel(selectedOption.value)
  return getLabel(selectedOption.value) + (sub ? ` • ${sub}` : '')
})
const selectedIcon = computed(() => selectedOption.value ? getIcon(selectedOption.value) : '')

// ─── Filtered options ─────────────────────────────────────────────────────────
const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  if (props.filterFn) return props.options.filter(o => props.filterFn(o, q))
  return props.options.filter(o => {
    const main = getLabel(o).toLowerCase()
    const sub  = getSubLabel(o).toLowerCase()
    return main.includes(q) || sub.includes(q)
  })
})

// ─── Highlight matching text ──────────────────────────────────────────────────
const highlight = (text) => {
  const q = query.value.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="cb-mark">$1</mark>')
}

// ─── Panel positioning ────────────────────────────────────────────────────────
const positionPanel = () => {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const openUp = spaceBelow < 240 && spaceAbove > spaceBelow

  panelStyle.value = {
    position: 'fixed',
    minWidth: Math.max(rect.width, 200) + 'px',
    left:     rect.left + 'px',
    zIndex:   '9999',
    ...(openUp
      ? { bottom: (window.innerHeight - rect.top + 4) + 'px', top: 'auto' }
      : { top:    (rect.bottom + 4) + 'px', bottom: 'auto' }
    ),
  }
}

// ─── Open / Close ─────────────────────────────────────────────────────────────
const open = async () => {
  if (props.disabled || isOpen.value) return
  positionPanel()
  isOpen.value = true
  query.value  = ''
  activeIndex.value = 0
  await nextTick()
  if (props.autofocus && searchInputRef.value) {
    searchInputRef.value.focus()
  }
}

const close = () => {
  isOpen.value = false
  query.value  = ''
}

const toggle = () => isOpen.value ? close() : open()

// ─── Selection ────────────────────────────────────────────────────────────────
const select = (opt) => {
  emit('update:modelValue', getKey(opt))
  emit('select', opt)
  close()
}

const clearSelection = () => {
  emit('update:modelValue', '')
  emit('select', null)
}

// ─── Add New ──────────────────────────────────────────────────────────────────
const onAddNew = () => {
  emit('add-new', query.value)
  close()
}

// ─── Keyboard navigation ─────────────────────────────────────────────────────
const onKeydown = (e) => {
  if (e.key === 'Escape') { close(); return }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredOptions.value.length > 0) {
      select(filteredOptions.value[activeIndex.value])
    } else if (props.addNewLabel) {
      onAddNew()
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filteredOptions.value.length - 1)
    scrollActiveIntoView()
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollActiveIntoView()
  }
  if (e.key === 'Tab') { close() }
}

const scrollActiveIntoView = () => {
  nextTick(() => {
    const el = listRef.value?.querySelector('.cb-option-active')
    el?.scrollIntoView({ block: 'nearest' })
  })
}

// Reset active index when filtered options change
watch(filteredOptions, () => { activeIndex.value = 0 })

// ─── Click outside ────────────────────────────────────────────────────────────
const onDocClick = (e) => {
  if (!rootRef.value?.contains(e.target) && !panelRef.value?.contains(e.target)) {
    close()
  }
}
const onScroll = () => { if (isOpen.value) positionPanel() }

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', positionPanel)

  // Barcode scanner burst-input detection
  if (props.barcodeMode) {
    let barcodeBuffer = ''
    let barcodeTimer  = null
    document.addEventListener('keydown', (e) => {
      if (!isOpen.value) return
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          const field = props.barcodeField || props.optionKey
          const matched = props.options.find(o =>
            String(o[field] || '').toLowerCase() === barcodeBuffer.toLowerCase()
          )
          if (matched) {
            select(matched)
            emit('barcode-scanned', barcodeBuffer)
          }
          barcodeBuffer = ''
          clearTimeout(barcodeTimer)
        }
        return
      }
      if (e.key.length === 1) {
        barcodeBuffer += e.key
        clearTimeout(barcodeTimer)
        barcodeTimer = setTimeout(() => { barcodeBuffer = '' }, 100)
      }
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocClick)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', positionPanel)
})

const onInput = () => { activeIndex.value = 0 }

// Expose open/close for parent ref usage
defineExpose({ open, close, focus: () => searchInputRef.value?.focus() })
</script>

<style scoped>
/* ── Root ── */
.cb-root { position: relative; user-select: none; }

/* ── Trigger ── */
.cb-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 44px;
  position: relative;
}
.cb-trigger:hover { border-color: #cbd5e1; }
.cb-focus { border-color: #6366f1 !important; box-shadow: 0 0 0 4px rgba(99,102,241,0.12); }

[data-theme="dark"] .cb-trigger { background: #0f172a; border-color: #334155; color: #f1f5f9; }
[data-theme="dark"] .cb-trigger:hover { border-color: #475569; }

.cb-sel-icon { font-size: 1rem; flex-shrink: 0; }
.cb-display-text { flex: 1; font-size: 0.875rem; font-weight: 500; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
[data-theme="dark"] .cb-display-text { color: #f1f5f9; }
.cb-placeholder { color: #94a3b8 !important; font-weight: 400; }

.cb-clear { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #e2e8f0; border: none; border-radius: 50%; cursor: pointer; padding: 0; color: #64748b; flex-shrink: 0; transition: background 0.15s; }
.cb-clear:hover { background: #cbd5e1; color: #1e293b; }
[data-theme="dark"] .cb-clear { background: #334155; color: #94a3b8; }

.cb-chevron { color: #94a3b8; flex-shrink: 0; transition: transform 0.2s ease; }
.cb-chevron-up { transform: rotate(180deg); }

/* ── Panel (fixed, teleported) ── */
.cb-panel {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  animation: cb-drop 0.15s ease;
  max-height: 340px;
  display: flex;
  flex-direction: column;
}
@keyframes cb-drop {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Search ── */
.cb-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.cb-search-icon { color: #94a3b8; flex-shrink: 0; }
.cb-search {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.875rem;
  background: transparent;
  color: #1e293b;
}
.cb-search::placeholder { color: #94a3b8; }
.cb-clear-query { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: #e2e8f0; border: none; border-radius: 50%; cursor: pointer; padding: 0; color: #64748b; transition: background 0.15s; }
.cb-clear-query:hover { background: #cbd5e1; }

/* ── Options list ── */
.cb-list { overflow-y: auto; flex: 1; padding: 0.375rem; }
.cb-list::-webkit-scrollbar { width: 4px; }
.cb-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

.cb-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
}
.cb-option-active  { background: #f1f5f9; }
.cb-option-selected { background: rgba(99,102,241,0.07); }
.cb-option-active.cb-option-selected { background: rgba(99,102,241,0.12); }

.cb-opt-icon { font-size: 1rem; flex-shrink: 0; }
.cb-opt-text { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; overflow: hidden; }
.cb-opt-label { font-size: 0.875rem; font-weight: 500; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cb-opt-sub   { font-size: 0.75rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cb-opt-check { color: #6366f1; flex-shrink: 0; }

/* Highlight match */
:deep(.cb-mark) { background: rgba(99,102,241,0.15); color: #4f46e5; border-radius: 3px; font-style: normal; padding: 0 1px; }

/* ── Empty state ── */
.cb-empty { text-align: center; padding: 1.5rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.375rem; }
.cb-empty-icon { font-size: 1.5rem; }
.cb-empty-text { font-size: 0.875rem; font-weight: 600; color: #475569; margin: 0; }
.cb-empty-sub  { font-size: 0.8rem; color: #94a3b8; margin: 0; }
.cb-add-new-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}
.cb-add-new-btn:hover { transform: translateY(-1px); }
</style>
