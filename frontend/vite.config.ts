import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Extract origin from VITE_API_BASE_URL for the dev proxy target
  // e.g., "http://localhost:5000/api" → "http://localhost:5000"
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const proxyTarget = apiBaseUrl.replace(/\/api\/?$/, '') || 'http://localhost:5000'

  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': proxyTarget,
      },
    },
  }
})
