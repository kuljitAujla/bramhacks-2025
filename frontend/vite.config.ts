import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Exclude threejs-earth directory from Vite's dependency scanning
  optimizeDeps: {
    exclude: ['three', 'dat.gui'],
  },
  // Exclude threejs-earth from build
  build: {
    rollupOptions: {
      external: (id) => {
        return id.includes('threejs-earth');
      },
    },
  },
})
