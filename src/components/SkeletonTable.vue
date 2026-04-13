<template>
  <div class="nx-table-card">
    <div class="nx-table-scroll">
      <table class="nx-table">
        <thead>
          <tr>
            <th v-for="n in columns" :key="n" :style="{ width: n === 1 ? '45px' : 'auto' }">
              <div class="nx-skeleton nx-skeleton-line" style="width: 60%; height: 0.625rem;"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r">
            <td v-for="c in columns" :key="c">
              <div v-if="c === 1" style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="nx-skeleton nx-skeleton-circle"></div>
                <div style="flex: 1;">
                  <div class="nx-skeleton nx-skeleton-line" style="width: 70%; height: 0.75rem;"></div>
                </div>
              </div>
              <div v-else class="nx-skeleton nx-skeleton-line" :style="{ width: randomWidth(c) }"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows:    { type: Number, default: 5 },
  columns: { type: Number, default: 5 },
})

const widths = ['50%', '65%', '40%', '75%', '55%']
const randomWidth = (c) => widths[(c - 1) % widths.length]
</script>
