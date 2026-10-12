import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repository from a subpath, not the domain root.
  base: '/SAU-SOLUTIONS-WEB/',
  plugins: [react()],
})
