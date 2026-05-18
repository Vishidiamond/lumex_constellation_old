import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: ['rapid-generally-marlin.ngrok-free.app', 'localhost', '192.168.29.194']
  },
})
