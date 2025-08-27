import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind is processed via PostCSS (postcss.config.js). Keep Vite plugins minimal.
  plugins: [react()],
})
