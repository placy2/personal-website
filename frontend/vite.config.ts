import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // Build optimizations. The SSR build (`vite build --ssr src/entry-server.tsx`,
    // driven by scripts/prerender.mjs) outputs a single predictably-named entry
    // to dist-ssr/ instead of the hashed, chunk-split client bundle.
    build: {
      target: 'esnext',
      minify: 'oxc',
      outDir: isSsrBuild ? 'dist-ssr' : 'dist',
      rollupOptions: {
        output: isSsrBuild
          ? { entryFileNames: 'entry-server.js' }
          : {
              manualChunks: id => {
                if (id.includes('node_modules/react-router-dom')) {
                  return 'router';
                }
                if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                  return 'vendor';
                }
              },
            },
      },
    },

    // Development server configuration
    server: {
      port: 5173,
      host: true, // Allow external connections (for Docker)
      open: false, // Don't auto-open browser in container
      hmr: {
        port: 5173,
      },
    },

    // Resolve aliases for cleaner imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@styles': path.resolve(__dirname, 'src/stylesheets'),
      },
    },

    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
    },
  };
});
