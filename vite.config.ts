import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['mapbox-gl', 'supercluster'],
    exclude: []
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox': ['mapbox-gl', 'react-map-gl', 'supercluster'],
          'vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020'
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
