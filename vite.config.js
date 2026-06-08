import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/apirest.php': {
        target: 'http://glpi.localhost',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
