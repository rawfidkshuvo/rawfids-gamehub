import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(),tailwindcss(),],
  base: '/rawfids-gamehub/', // MUST match your repo name
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        angryVirus: resolve(__dirname, 'angry-virus/index.html'),
        conspiracy: resolve(__dirname, 'conspiracy/index.html'),
      },
    },
  },
})