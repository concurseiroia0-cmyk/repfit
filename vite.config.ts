import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => ({
  // Em produção (build e preview) o app é servido de https://<usuario>.github.io/repfit/
  // (GitHub Pages). No dev mantém a raiz (/).
  base: mode === 'production' ? '/repfit/' : '/',
  plugins: [
    // GitHub Pages não faz fallback SPA: copia o index.html para 404.html para
    // que rotas diretas (ex.: /repfit/novo) carreguem o app em vez de dar 404.
    {
      name: 'generate-404-html',
      apply: 'build',
      closeBundle() {
        const outDir = resolve(__dirname, 'dist');
        const index = readFileSync(resolve(outDir, 'index.html'), 'utf-8');
        writeFileSync(resolve(outDir, '404.html'), index);
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'maskable-512.png'],
      manifest: {
        name: 'RepFit',
        short_name: 'RepFit',
        description: 'RepFit — registre e acompanhe seus treinos, 100% offline e privado, direto no seu dispositivo.',
        lang: 'pt-BR',
        // Caminhos relativos: resolvem contra a URL do manifest (ex.: /repfit/manifest.webmanifest).
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#0a0a0b',
        background_color: '#0a0a0b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/repfit/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
}));
