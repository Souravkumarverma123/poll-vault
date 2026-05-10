import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', () => { /* suppress ECONNREFUSED / ECONNRESET noise */ });
        },
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewriteWsOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => { /* suppress ws proxy errors when server is down */ });
        },
      },
    },
  },
})
