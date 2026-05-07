import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/menti-pdf2.0/', // must match your GitHub repo name
})
