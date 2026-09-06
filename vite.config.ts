import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * Chemins relatifs par défaut, pour que le site soit hébergeable partout.
 *
 * Un `base` absolu fige l'emplacement au moment de la compilation : le même
 * dossier `dist` ne fonctionne alors qu'à l'adresse prévue, et changer
 * d'hébergeur oblige à recompiler. En relatif, l'archive produite fonctionne
 * telle quelle à la racine d'un domaine, dans un sous-répertoire, ou même
 * ouverte depuis un disque — ce qui rend l'hébergeur interchangeable.
 *
 * C'est le routage par fragment (`HashRouter`) qui le permet : le chemin du
 * document ne change jamais pendant la navigation, donc une adresse relative
 * s'y résout toujours de la même façon.
 *
 * `BASE_PATH` reste disponible pour forcer un chemin absolu si un hébergeur
 * l'exige.
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
