import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // When VITE_USE_MOCK is not set, default to false in production builds.
    // Set VITE_USE_MOCK=true in .env.local or via the dev:mock script.
  },
  server: {
    proxy: {
      // Forward /api/finance/* to the local Express proxy (when not using mock)
      '/api/finance': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
