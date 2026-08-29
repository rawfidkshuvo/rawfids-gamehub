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
        colony: resolve(__dirname, 'colony/index.html'),
        conspiracy: resolve(__dirname, 'conspiracy/index.html'),
        contraband: resolve(__dirname, 'contraband/index.html'),
        cryptAndCrimson: resolve(__dirname, 'crypt-and-crimson/index.html'),
        dark: resolve(__dirname, 'dark/index.html'),
        emperor: resolve(__dirname, 'emperor/index.html'),
        equilibrium: resolve(__dirname, 'equilibrium/index.html'),
        fructoseFury: resolve(__dirname, 'fructose-fury/index.html'),
        fruitSeller: resolve(__dirname, 'fruit-seller/index.html'),
        ghostDice: resolve(__dirname, 'ghost-dice/index.html'),
        guildOfShadows: resolve(__dirname, 'guild-of-shadows/index.html'),
        immune: resolve(__dirname, 'immune/index.html'),
        investigation: resolve(__dirname, 'investigation/index.html'),
        lastOfUs: resolve(__dirname, 'last-of-us/index.html'),
        luckySeven: resolve(__dirname, 'lucky-seven/index.html'),
        masqueradeProtocol: resolve(__dirname, 'masquerade-protocol/index.html'),
        neonDraft: resolve(__dirname, 'neon-draft/index.html'),
        outbreak: resolve(__dirname, 'outbreak/index.html'),
        paperOceans: resolve(__dirname, 'paper-oceans/index.html'),
        policeHunt: resolve(__dirname, 'police-hunt/index.html'),
        pirates: resolve(__dirname, 'pirates/index.html'),
        protocol: resolve(__dirname, 'protocol/index.html'),
        reverie: resolve(__dirname, 'reverie/index.html'),
        royalMenagerie: resolve(__dirname, 'royal-menagerie/index.html'),
        spectrum: resolve(__dirname, 'spectrum/index.html'),
        together: resolve(__dirname, 'together/index.html'),
      },
    },
  },
})