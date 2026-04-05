import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');

  const appUrl = env.VITE_APP_URL || 'https://satgo.com';

  // Derive allowed hosts from VITE_FRONTEND env var — no hardcoding needed
  const allowedHosts = [];
  if (env.VITE_FRONTEND) {
    try {
      const hostname = new URL(env.VITE_FRONTEND).hostname;
      if (hostname && hostname !== 'localhost') {
        allowedHosts.push(hostname, `www.${hostname}`);
      }
    } catch {
      // invalid URL, skip
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Inject VITE_APP_URL into index.html with fallback so build never fails
      {
        name: 'html-env-inject',
        transformIndexHtml(html) {
          return html.replace(/__APP_URL__/g, appUrl);
        },
      },
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: allowedHosts.length ? allowedHosts : 'auto',
    },

    // ===================== PRODUCTION BUILD OPTIMIZATION =====================
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        output: {
          // Manual chunking — use exact regex to avoid circular chunk refs
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;

            if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
              return 'react-vendor';
            }
            if (/node_modules\/(@mui|@emotion)\//.test(id)) {
              return 'mui-vendor';
            }
            if (/node_modules\/(leaflet|react-leaflet)\//.test(id)) {
              return 'leaflet-vendor';
            }
            if (/node_modules\/(socket\.io-client|engine\.io-client|socket\.io-parser|@socket\.io)\//.test(id)) {
              return 'socket-vendor';
            }
            if (/node_modules\/axios\//.test(id)) {
              return 'http-vendor';
            }
            if (/node_modules\/framer-motion\//.test(id)) {
              return 'animation-vendor';
            }
            if (/node_modules\/(@lottiefiles\/|dotlottie-web\/)/.test(id)) {
              return 'lottie-vendor';
            }
            if (/node_modules\/heic2any\//.test(id)) {
              return 'heic-vendor';
            }
            if (/node_modules\/@react-google-maps\//.test(id)) {
              return 'maps-vendor';
            }
            if (/node_modules\/(react-icons|lucide-react)\//.test(id)) {
              return 'icons-vendor';
            }
            if (/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector)\//.test(id)) {
              return 'i18n-vendor';
            }
            if (/node_modules\/(@reduxjs\/toolkit|react-redux|immer)\//.test(id)) {
              return 'redux-vendor';
            }

            return 'vendor';
          },

          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? '';
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(name)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },

          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },

      cssCodeSplit: true,
      cssMinify: true,
      reportCompressedSize: true,
      target: 'es2015',
    },

    // ===================== OPTIMIZATION OPTIONS =====================
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'socket.io-client'],
      exclude: ['@vite/client', '@vite/env'],
    },

    // ===================== ESBUILD (drop console in all builds) =====================
    esbuild: {
      drop: ['console', 'debugger'],
    },
  };
});
