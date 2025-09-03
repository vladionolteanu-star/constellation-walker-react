import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox': ['mapbox-gl'],
          'vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 2000
  },
  optimizeDeps: {
    exclude: ['mapbox-gl']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
