import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

function createFile(filePath, content) {
  const fullPath = path.join(projectRoot, filePath)
  const dir = path.dirname(fullPath)
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(fullPath, content, 'utf-8')
  console.log(`✓ ${filePath} created`)
}

function createDirectory(dirPath) {
  const fullPath = path.join(projectRoot, dirPath)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
    console.log(`✓ ${dirPath} created`)
  }
}

// Create package.json
const packageJson = {
  name: "pos-system",
  version: "1.0.0",
  type: "module",
  scripts: {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix --ignore-path .gitignore"
  },
  dependencies: {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0"
  },
  devDependencies: {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.0.0"
  }
}

createFile('package.json', JSON.stringify(packageJson, null, 2))

// Create vite.config.js
const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})
`

createFile('vite.config.js', viteConfig)

// Create tailwind.config.js
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
`

createFile('tailwind.config.js', tailwindConfig)

// Create postcss.config.js
const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

createFile('postcss.config.js', postcssConfig)

// Create .env files
const envExample = `VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=POS System
VITE_SUPERVISOR_AUTH_THRESHOLD=100000
`

createFile('.env.example', envExample)
createFile('.env', envExample)

// Create index.html
const indexHtml = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>POS System Terintegrasi</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`

createFile('index.html', indexHtml)

// Create directory structure
const dirs = [
  'src',
  'src/stores',
  'src/router',
  'src/api',
  'src/modules/auth',
  'src/modules/cashier',
  'src/modules/admin',
  'src/components/common',
  'src/components/cashier',
  'src/components/admin',
  'src/views',
  'src/assets/css',
  'public',
]

dirs.forEach(dir => createDirectory(dir))

// Create src/main.js
const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './assets/css/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
`

createFile('src/main.js', mainJs)

// Create src/assets/css/main.css
const mainCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: system-ui, -apple-system, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}
`

createFile('src/assets/css/main.css', mainCss)

console.log('')
console.log('================================================')
console.log('✓ Vue.js 3 + Vite project initialized successfully!')
console.log('================================================')
console.log('')
console.log('Next steps:')
console.log('1. Dependencies will be installed automatically')
console.log('2. Run pnpm dev to start the development server')
console.log('3. Navigate to http://localhost:5173')
console.log('')
