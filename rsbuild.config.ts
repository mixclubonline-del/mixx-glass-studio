/**
 * Rsbuild Configuration for Mixx Club Studio
 * 
 * Parallel configuration to vite.config.ts for non-destructive migration.
 * This allows testing Rspack alongside Vite.
 * 
 * To use: npm run dev:rsbuild (instead of npm run dev)
 */

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [pluginReact()],
  
  source: {
    entry: {
      index: path.resolve(__dirname, './src/index.tsx'), // Use absolute path
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Restrict source to current project only
    include: [path.resolve(__dirname, 'src')],
  },
  
  html: {
    template: './index.html',
    // Rsbuild will automatically inject the entry script
    // Remove the manual script tag from HTML or let Rsbuild handle it
  },
  
  output: {
    distPath: {
      root: 'dist-rsbuild', // Different output for parallel testing
    },
    filename: {
      js: 'assets/[name].[contenthash:8].js',
      css: 'assets/[name].[contenthash:8].css',
    },
  },
  
  server: {
    port: 3004, // Different port to run alongside Vite (3001) and other services
    host: '0.0.0.0', // Listen on all interfaces (equivalent to Vite's host: true)
  },
  
  tools: {
    rspack: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.wasm', '.json'],
        // CRITICAL: Restrict module resolution to current project only
        // Prevent Rsbuild from finding files in other projects
        modules: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules'),
        ],
        // Prevent resolving symlinks that might point to other projects
        symlinks: false,
        // Don't resolve modules outside project root
        roots: [path.resolve(__dirname)],
        // Explicit alias to prevent cross-project imports
        alias: {
          // Redirect any WelcomeScreen imports to FlowWelcomeHub
          '@/components/WelcomeScreen': path.resolve(__dirname, 'src/components/FlowWelcomeHub'),
          './WelcomeScreen': path.resolve(__dirname, 'src/components/FlowWelcomeHub'),
          '../WelcomeScreen': path.resolve(__dirname, 'src/components/FlowWelcomeHub'),
        },
      },
      experiments: {
        asyncWebAssembly: true, // Enable WASM support
      },
      devtool: 'eval-source-map', // Better source maps for debugging
      optimization: {
        usedExports: true,
        sideEffects: true, // Temporarily disable aggressive tree-shaking to debug
        minimize: false, // Disable minification in dev to see real errors
      },
      module: {
        rules: [
          {
            // Handle Audio Worklets
            test: /\.worklet\.js$/,
            type: 'asset/resource',
          },
        ],
      },
    },
    postcss: {
      postcssOptions: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
        ],
      },
    },
  },
  
  performance: {
    // Desktop app: prefer single bundle over code splitting
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        chunks: {
          default: {
            minSize: 0,
            maxSize: Infinity, // Single bundle for desktop
          },
        },
      },
    },
  },
});

