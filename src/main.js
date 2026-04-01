import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/styles/index.css'

// Import axios globally
import apiClient from '@/api/client'

const app = createApp(App)

// Use plugins
app.use(createPinia())
app.use(router)

// Make axios available globally
app.config.globalProperties.$api = apiClient

// Mount app
app.mount('#app')
