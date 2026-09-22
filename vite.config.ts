import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const BUILD_TIME = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);

export default defineConfig({
  // Relative base so a preview build can be served from any sub-path.
  base: process.env.PREVIEW_BUILD === '1' ? './' : '/',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['lit-html', 'zod', 'idb'],
        },
      },
    },
  },
  plugins: [
    VitePWA({
      // No service worker in preview builds — they are served from a host
      // that is not the app's real origin.
      disable: process.env.PREVIEW_BUILD === '1',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'plans/*.webp'],
      manifest: {
        name: 'Marsad Field',
        short_name: 'Marsad',
        description: 'Internal inspection tool',
        theme_color: '#0B4E6A',
        background_color: '#f7f7f8',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // webp included so the marked-up level plans are available offline —
        // basements and plant rooms have no signal.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        cleanupOutdatedCaches: true,
        // Take over immediately on new deploy — no waiting for all tabs to
        // close. Critical for fast iteration; old CSS bundles must not get
        // served once a new one has been precached.
        skipWaiting: true,
        clientsClaim: true,
        // Use NetworkFirst for HTML so a fresh deploy is picked up on first
        // navigation. JS/CSS still come from precache because they carry
        // hashed filenames and are invalidated automatically.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/terms($|\/)/],
        // Don't precache the standalone /terms page — it lives outside the
        // app shell and must always be fetched fresh from the network.
        globIgnores: ['**/terms/**'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173, host: true },
});
