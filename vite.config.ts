
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  // Production uses the custom-domain root; development uses the repository prefix.
  base: command === 'build' ? '/' : '/SAU-SOLUTIONS-WEB/',
  plugins: [react(), tailwindcss()],
}))
