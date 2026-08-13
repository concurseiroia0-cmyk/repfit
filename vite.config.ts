import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Versão do build (visível no modal de compartilhar): permite confirmar no
// celular/navegador que o app está rodando o build novo (o PWA cacheava o JS
// antigo por 30 dias — por isso o bug "foto preta" persistia mesmo com o
// código corrigido no servidor).
//
// IMPORTANTE: não usar `define` do Vite — em dev ele NÃO substitui (o
// plugin vite:define pula o replace quando consumer=client e !isBuild), o que
// quebrava o app. Em vez disso, um arquivo src/buildStamp.ts é reescrito em
// cada dev/build com a versão (funciona igual nos dois modos).
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const _stamp = new Date();
const _pad = (n: number) => String(n).padStart(2, '0');
const buildStamp = `${pkg.version}+${_stamp.getFullYear()}${_pad(_stamp.getMonth() + 1)}${_pad(_stamp.getDate())}-${_pad(_stamp.getHours())}${_pad(_stamp.getMinutes())}`;
const STAMP_FILE = resolve(__dirname, 'src/buildStamp.ts');

function writeBuildStamp() {
  writeFileSync(
    STAMP_FILE,
    `// Gerado automaticamente pelo vite.config.ts — não edite.\n// Versão do build, exibida no modal de compartilhar para confirmar\n// que o app está com o código mais recente.\nexport const APP_VERSION = ${JSON.stringify(buildStamp)};\n`
  );
}

export default defineConfig(({ mode }) => ({
  // Em produção (build e preview) o app é servido de https://<usuario>.github.io/repfit/
  // (GitHub Pages). No dev mantém a raiz (/).
  base: mode === 'production' ? '/repfit/' : '/',
  plugins: [
    {
      name: 'repfit-build-stamp',
      buildStart() {
        writeBuildStamp();
      },
      configureServer() {
        writeBuildStamp();
      },
    },
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
      // 'prompt' (e não 'autoUpdate'): quando uma versão nova é publicada, o
      // app mostra "Nova versão disponível — Recarregar" em vez de atualizar
      // em silêncio. Sem isso o usuário continua rodando o JS antigo na
      // memória até recarregar por conta própria — era o motivo do bug da
      // foto preta "continuar" mesmo com o código corrigido no servidor.
      registerType: 'prompt',
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
        // Acelera a primeira navegação quando há internet.
        navigationPreload: true,
        runtimeCaching: [
          {
            // Rede de segurança: QUALQUER recurso do próprio app (inclusive
            // arquivos que venham a existir em versões futuras) fica salvo
            // em cache após o primeiro acesso — o app funciona 100% offline.
            // NetworkFirst (e não CacheFirst): sempre tenta a rede primeiro e
            // usa o cache só offline — o navegador NUNCA fica preso num build
            // antigo (era o que fazia o Chrome continuar com o bug da foto
            // preta mesmo com o código corrigido no servidor).
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'repfit-app',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 96, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Sem service worker no dev: evita cache velho durante o desenvolvimento
        // (o mesmo problema de "código antigo" aparecia no servidor de dev).
        enabled: false,
      },
    }),
  ],
}));
