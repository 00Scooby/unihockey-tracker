import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json' // Lädt die Infos aus deiner package.json

export default defineConfig({
  plugins: [react()],
  define: {
    // Macht die Version als globale Variable im Code verfügbar
    '__APP_VERSION__': JSON.stringify(packageJson.version)
  }
})