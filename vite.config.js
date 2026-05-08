import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8080",
      "/properties": "http://localhost:8080",
      "/room-types": "http://localhost:8080",
      "/rooms": "http://localhost:8080",
      "/guests": "http://localhost:8080",
      "/reservations": "http://localhost:8080",
      "/policies": "http://localhost:8080",
      "/rate-plans": "http://localhost:8080",
      "/folio-transactions": "http://localhost:8080",
      "/user-properties": "http://localhost:8080",
      "/license-transactions": "http://localhost:8080",
      "/users": "http://localhost:8080",
      "/invoices": "http://localhost:8080",
      "/integrations": "http://localhost:8080",
      "/uploads": "http://localhost:8080"
    }
  }
});
