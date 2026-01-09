import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // ✅ Proxy para API - Redireciona /api para backend na porta 3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      // ✅ Proxy para Socket.io
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true, // WebSocket support
        secure: false
      }
    }
  }
})
