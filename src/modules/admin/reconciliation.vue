<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-4xl mx-auto">
      <header class="mb-6 flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Cash Reconciliation</h1>
        <router-link
          to="/admin"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Back to Dashboard
        </router-link>
      </header>

      <!-- Reconciliation Form -->
      <div class="bg-white rounded-lg shadow p-8 mb-6">
        <h2 class="text-2xl font-semibold mb-6">Daily Cash Reconciliation</h2>

        <div class="space-y-6">
          <!-- Physical Cash Input -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-2">
              💵 Physical Cash (Uang Fisik)
            </label>
            <input
              v-model.number="form.physicalCash"
              type="number"
              step="100"
              placeholder="Enter amount in IDR"
              class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p class="text-sm text-gray-600 mt-1">Amount of physical cash counted</p>
          </div>

          <!-- System Total (Read-only) -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-2">
              💻 System Total (Dari Sistem)
            </label>
            <input
              v-model.number="systemTotal"
              type="number"
              disabled
              class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
            <p class="text-sm text-gray-600 mt-1">Total from POS system (calculated automatically)</p>
          </div>

          <!-- Difference Display -->
          <div v-if="form.physicalCash > 0" class="p-6 rounded-lg" :class="differenceStatus.bgClass">
            <div class="grid grid-cols-2 gap-6">
              <div>
                <p class="text-sm text-gray-700 mb-1">Difference (Selisih)</p>
                <p class="text-3xl font-bold" :class="differenceStatus.textClass">
                  Rp {{ formatCurrency(difference) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-700 mb-1">Difference Percent</p>
                <p class="text-3xl font-bold" :class="differenceStatus.textClass">
                  {{ differencePercent }}%
                </p>
              </div>
            </div>
            <p class="text-sm mt-3 font-semibold" :class="differenceStatus.statusClass">
              Status: {{ differenceStatus.status }}
            </p>
          </div>

          <!-- Reconciliation Formula -->
          <div class="bg-gray-100 border border-gray-300 rounded-lg p-4 text-sm font-mono text-gray-700">
            <p>Difference (Selisih) = Physical Cash - System Total</p>
            <p>{{ formatCurrency(form.physicalCash) }} - {{ formatCurrency(systemTotal) }} = {{ formatCurrency(difference) }}</p>
            <br />
            <p>Difference % = (Difference / System Total) × 100</p>
            <p>({{ formatCurrency(difference) }} / {{ formatCurrency(systemTotal) }}) × 100 = {{ differencePercent }}%</p>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-2">
              📝 Notes (Optional)
            </label>
            <textarea
              v-model="form.notes"
              placeholder="Enter any notes about the reconciliation..."
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-vertical"
              rows="4"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button
            @click="handleSubmitReconciliation"
            :disabled="form.physicalCash <= 0 || submitting"
            class="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ submitting ? 'Submitting...' : '✓ Submit Reconciliation' }}
          </button>
        </div>
      </div>

      <!-- Reconciliation History -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-2xl font-semibold mb-6">Reconciliation History</h2>

        <div v-if="historyLoading" class="text-center py-8">
          <p class="text-gray-600">Loading history...</p>
        </div>

        <table v-else-if="reconciliationHistory.length > 0" class="w-full border-collapse">
          <thead>
            <tr class="border-b-2 border-gray-300">
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-900">Physical</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-900">System Total</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-900">Difference</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-900">Approved</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in reconciliationHistory" :key="index" class="border-b border-gray-200 hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-900">{{ formatDate(record.date) }}</td>
              <td class="px-4 py-3 text-right text-gray-900">Rp {{ formatCurrency(record.physicalCash) }}</td>
              <td class="px-4 py-3 text-right text-gray-900">Rp {{ formatCurrency(record.systemTotal) }}</td>
              <td class="px-4 py-3 text-right font-semibold" :class="getStatusClass(record.status)">
                Rp {{ formatCurrency(record.difference) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span class="px-3 py-1 rounded-full text-sm font-semibold" :class="getStatusBadgeClass(record.status)">
                  {{ record.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span v-if="record.approvedBy" class="text-green-600 font-semibold">✓ Yes</span>
                <span v-else class="text-yellow-600 font-semibold">Pending</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="text-center py-8 text-gray-600">
          No reconciliation records found.
        </div>
      </div>

      <!-- Information Box -->
      <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 class="font-semibold text-yellow-900 mb-2">⚠️ Reconciliation Rules</h3>
        <ul class="text-sm text-yellow-900 space-y-1 list-disc list-inside">
          <li>Reconciliation must be completed at the end of each business day</li>
          <li>Balanced status: Difference must be ±Rp 1,000 or less</li>
          <li>Differences exceeding ±5% require supervisor approval</li>
          <li>All reconciliation records are permanent and auditable</li>
          <li>Previous day reconciliation cannot be modified</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/client'

const form = ref({
  physicalCash: 0,
  notes: '',
})

const systemTotal = ref(2480000) // Would be fetched from backend
const submitting = ref(false)
const historyLoading = ref(false)
const reconciliationHistory = ref([])

const BALANCE_THRESHOLD = 1000
const APPROVAL_THRESHOLD_PERCENT = 5

const difference = computed(() => {
  return form.value.physicalCash - systemTotal.value
})

const differencePercent = computed(() => {
  if (systemTotal.value === 0) return 0
  return Math.round((Math.abs(difference.value) / systemTotal.value) * 100 * 100) / 100
})

const differenceStatus = computed(() => {
  const diff = difference.value
  const diffPercent = differencePercent.value

  if (Math.abs(diff) <= BALANCE_THRESHOLD) {
    return {
      status: 'BALANCED ✓',
      statusClass: 'text-green-700',
      bgClass: 'bg-green-50 border-2 border-green-300',
      textClass: 'text-green-700',
    }
  } else if (diff < 0) {
    return {
      status: `SHORTAGE (${diffPercent}%)${diffPercent > APPROVAL_THRESHOLD_PERCENT ? ' - REQUIRES APPROVAL' : ''}`,
      statusClass: 'text-red-700',
      bgClass: 'bg-red-50 border-2 border-red-300',
      textClass: 'text-red-700',
    }
  } else {
    return {
      status: `SURPLUS (${diffPercent}%)${diffPercent > APPROVAL_THRESHOLD_PERCENT ? ' - REQUIRES APPROVAL' : ''}`,
      statusClass: 'text-blue-700',
      bgClass: 'bg-blue-50 border-2 border-blue-300',
      textClass: 'text-blue-700',
    }
  }
})

const formatCurrency = (value) => {
  return Math.round(value).toLocaleString('id-ID')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getStatusClass = (status) => {
  if (status === 'balanced') return 'text-green-700'
  if (status === 'shortage') return 'text-red-700'
  return 'text-blue-700'
}

const getStatusBadgeClass = (status) => {
  if (status === 'balanced') return 'bg-green-100 text-green-800'
  if (status === 'shortage') return 'bg-red-100 text-red-800'
  return 'bg-blue-100 text-blue-800'
}

const handleSubmitReconciliation = async () => {
  if (form.value.physicalCash <= 0) {
    alert('Please enter a valid physical cash amount')
    return
  }

  submitting.value = true
  try {
    const response = await apiClient.post('/api/finance/reconciliation', {
      physicalCash: form.value.physicalCash,
      systemTotal: systemTotal.value,
      cashierNotes: form.value.notes,
      supervisorId: 'current-user-id',
    })

    alert(`Reconciliation submitted!\nStatus: ${response.data.status}\nDifference: Rp ${formatCurrency(response.data.difference)}`)
    
    // Reset form
    form.value.physicalCash = 0
    form.value.notes = ''
    
    // Reload history
    await fetchHistory()
  } catch (error) {
    alert(`Error: ${error.response?.data?.message || 'Failed to submit reconciliation'}`)
  } finally {
    submitting.value = false
  }
}

const fetchHistory = async () => {
  historyLoading.value = true
  try {
    const response = await apiClient.get('/api/finance/reconciliation', {
      params: {
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
    })
    reconciliationHistory.value = response.data
  } catch (error) {
    console.error('Failed to fetch history:', error)
  } finally {
    historyLoading.value = false
  }
}

onMounted(async () => {
  await fetchHistory()
})
</script>
