import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['tiwari.shop', 'www.tiwari.shop'],
  },

  // ===================== PRODUCTION BUILD OPTIMIZATION =====================
  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for production debugging (disable if concerned about code exposure)
    sourcemap: false,

    // Minification
    minify: 'terser', // Use terser for better compression than esbuild

    // Terser options for aggressive minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove all console.* statements
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Multiple passes for better compression
      },
      format: {
        comments: false, // Remove all comments
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // Warn for chunks larger than 1MB

    // Rollup options for code splitting and optimization
    rollupOptions: {
      output: {
        // Manual chunking strategy for better caching
        manualChunks: (id) => {
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            // Separate large libraries into their own chunks
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@mui') || id.includes('@material-ui')) {
              return 'mui-vendor';
            }
            if (id.includes('leaflet')) {
              return 'leaflet-vendor';
            }
            if (id.includes('socket.io')) {
              return 'socket-vendor';
            }
            // All other node_modules go into general vendor chunk
            return 'vendor';
          }
        },

        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];

          // Organize assets by type
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },

        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // CSS code splitting
    cssCodeSplit: true,

    // Optimize CSS
    cssMinify: true,

    // Report compressed size
    reportCompressedSize: true,

    // Target modern browsers for smaller bundles
    target: 'es2015',
  },

  // ===================== OPTIMIZATION OPTIONS =====================
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'socket.io-client',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },

  // ===================== PERFORMANCE HINTS =====================
  esbuild: {
    // Remove console and debugger in production
    drop: ['console', 'debugger'],
    // Minimize identifiers
    minifyIdentifiers: true,
    // Minimize whitespace
    minifyWhitespace: true,
    // Minimize syntax
    minifySyntax: true,
  },
});
