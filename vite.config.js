import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BACKEND_URL = 'https://nextore.nexvibe.biz.id'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    // Proxy API requests to backend — eliminates CORS issues in development
    proxy: {
      '/auth': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/pos': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/products': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/transactions': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/categories': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/members': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/discounts': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/users': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/bundles': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/stock-batches': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/reports': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/notifications': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
      '/price-lists': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          axios: ['axios'],
        },
      },
    },
  },
})

