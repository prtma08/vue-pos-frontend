<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <RouterView />
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { onMounted } from 'vue'

const authStore = useAuthStore()
const cartStore = useCartStore()

// Initialize cart from storage on app startup
onMounted(async () => {
  // Try to restore pending orders
  cartStore.initializeFromStorage()
  
  // Check if user is still authenticated
  if (!authStore.isAuthenticated) {
    await authStore.checkAuth()
  }
})
</script>

<style scoped>
/* App-level styles */
</style>
