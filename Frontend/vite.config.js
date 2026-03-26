import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');

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
          // Manual chunking strategy for better caching
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
              if (id.includes('@mui') || id.includes('@material-ui')) return 'mui-vendor';
              if (id.includes('leaflet')) return 'leaflet-vendor';
              if (id.includes('socket.io')) return 'socket-vendor';
              return 'vendor';
            }
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
