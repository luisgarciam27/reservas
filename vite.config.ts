import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      command === 'build'
        ? VitePWA({
            registerType: 'autoUpdate',
            filename: 'sw.js',
            manifestFilename: 'manifest.json',
            includeAssets: [
              'icon.svg',
              'icons/icon-192.png',
              'icons/icon-512.png',
              'icons/icon-maskable-512.png',
              'icons/apple-touch-icon.png',
            ],
            manifest: {
              id: '/',
              name: 'MarIA — Reservas y WhatsApp',
              short_name: 'MarIA',
              description:
                'Sistema inteligente de reservas y recordatorios por WhatsApp para negocios.',
              start_url: '/',
              scope: '/',
              display: 'standalone',
              orientation: 'portrait',
              theme_color: '#4F46E5',
              background_color: '#F8FAFC',
              lang: 'es-PE',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: '/icons/icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: '/icons/icon-maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
              cleanupOutdatedCaches: true,
              skipWaiting: true,
              clientsClaim: true,
              navigateFallback: '/index.html',
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                  handler: 'NetworkOnly',
                },
                {
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-stylesheets',
                    expiration: {
                      maxEntries: 10,
                      maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-webfonts',
                    expiration: {
                      maxEntries: 20,
                      maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
                {
                  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'static-assets-cache',
                    expiration: {
                      maxEntries: 40,
                      maxAgeSeconds: 60 * 60 * 24 * 30,
                    },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
                {
                  urlPattern: /^https?:\/\/.*/i,
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'runtime-network-first',
                    networkTimeoutSeconds: 4,
                    expiration: {
                      maxEntries: 30,
                      maxAgeSeconds: 60 * 60 * 24 * 7,
                    },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
              ],
            },
          })
        : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
