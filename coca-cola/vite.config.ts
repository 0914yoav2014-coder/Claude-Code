import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the build works from any static host or sub-path (HashRouter handles routes).
export default defineConfig({
  base: './',
  plugins: [react()],
})
