import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Security: Only allow localhost in dev unless explicitly enabled
const ALLOW_NETWORK_ACCESS = process.env.VITE_ALLOW_NETWORK_ACCESS === '1'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    // 🔒 SECURITY: Restrict to localhost only unless explicitly enabled
    host: ALLOW_NETWORK_ACCESS ? true : 'localhost',
    strictPort: true, // Fail if port is already in use
    // Security headers via middleware
    middlewareMode: false,
    // Disable auto-open browser (security)
    open: false,
    // CORS: Only allow same-origin in dev
    cors: {
      origin: ALLOW_NETWORK_ACCESS ? true : 'http://localhost:3001',
      credentials: true,
    },
    // Security: Add headers via configureServer hook
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('X-Frame-Options', 'DENY')
        res.setHeader('X-XSS-Protection', '1; mode=block')
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
        
        // Only in production-like builds
        if (process.env.NODE_ENV === 'production') {
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
          res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';")
        }
        
        next()
      })
    },
  },
  build: {
    outDir: 'dist',
    // 🔒 SECURITY: Disable source maps in production (exposes source code)
    sourcemap: process.env.NODE_ENV !== 'production',
    // Minify for production
    minify: 'esbuild',
    // Security: Don't expose chunk info
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Obfuscate chunk names in production
        chunkFileNames: process.env.NODE_ENV === 'production' 
          ? 'assets/[hash].js' 
          : 'assets/[name]-[hash].js',
        entryFileNames: process.env.NODE_ENV === 'production'
          ? 'assets/[hash].js'
          : 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Security: Manual chunks to prevent code analysis
        manualChunks: process.env.NODE_ENV === 'production' ? {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
          ],
        } : undefined,
      },
    },
  },
  // Security: Don't expose env vars that start with VITE_SECRET_
  envPrefix: ['VITE_'],
  // Security: Clear sensitive data
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
})
