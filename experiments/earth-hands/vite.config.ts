import { defineConfig } from 'vite'

/**
 * Projet autonome (hors du site All Neat) : « Terre 3D pilotée aux mains ».
 *
 * - `host: true` + `allowedHosts: true` : indispensable pour l'aperçu en ligne,
 *   qui arrive avec un nom de domaine inconnu (proxy du bac à sable).
 * - Les polices ne sont pas chargées depuis un CDN : tout est local, aucune
 *   requête vers l'extérieur (ni vidéo, ni modèle d'IA).
 */
export default defineConfig({
  base: './',
  server: {
    host: true,
    allowedHosts: true,
    port: 5199,
    strictPort: false,
    hmr: { overlay: true },
  },
  preview: {
    host: true,
    allowedHosts: true,
    port: 5199,
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2500,
  },
})
