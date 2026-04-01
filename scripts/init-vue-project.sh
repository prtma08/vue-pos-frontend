#!/bin/bash

# Initialize Vue.js 3 + Vite POS System
# This script sets up the complete project structure

cd /vercel/share/v0-project

# Create package.json with all dependencies
cat > package.json << 'EOF'
{
  "name": "pos-system",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix --ignore-path .gitignore"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.0.0"
  }
}
EOF

echo "✓ package.json created"

# Create vite.config.js
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
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
EOF

echo "✓ vite.config.js created"

# Create tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
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
EOF

echo "✓ tailwind.config.js created"

# Create postcss.config.js
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo "✓ postcss.config.js created"

# Create .env.example
cat > .env.example << 'EOF'
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=POS System
VITE_SUPERVISOR_AUTH_THRESHOLD=100000
EOF

echo "✓ .env.example created"

# Create .env (local development)
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=POS System Terintegrasi
VITE_SUPERVISOR_AUTH_THRESHOLD=100000
EOF

echo "✓ .env created"

# Create index.html
cat > index.html << 'EOF'
<!doctype html>
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
EOF

echo "✓ index.html created"

# Create src directory structure
mkdir -p src/{stores,router,api,modules/{auth,cashier,admin},components/{common,cashier,admin},views,assets/css}

echo "✓ Folder structure created"

# Create src/main.js
cat > src/main.js << 'EOF'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './assets/css/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
EOF

echo "✓ src/main.js created"

# Create src/assets/css/main.css
cat > src/assets/css/main.css << 'EOF'
@tailwind base;
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
EOF

echo "✓ src/assets/css/main.css created"

echo ""
echo "================================================"
echo "✓ Vue.js 3 + Vite project initialized successfully!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Dependencies will be installed automatically"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Navigate to http://localhost:5173"
echo ""
