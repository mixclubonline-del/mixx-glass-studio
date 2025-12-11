# Build Tool Migration Plan: Vite → Rspack/Rsbuild
## For Mixx Club Studio Desktop Application

**Prime, here's a non-destructive migration path tailored for your Tauri desktop app.**

---

## Why Rspack/Rsbuild for Desktop Apps?

### Key Advantages for Tauri Desktop Applications

1. **Rust-Native Performance**
   - Written in Rust (aligns with your Tauri backend)
   - Faster cold starts and incremental builds
   - Better memory efficiency for large codebases

2. **Desktop-Optimized Bundling**
   - No need for web-optimized lazy loading (everything is local)
   - Better tree-shaking for desktop apps
   - Single-bundle optimization (no CDN concerns)

3. **Complex Application Support**
   - Handles large dependency graphs better than Vite
   - Superior WASM/Worker/Worklet support
   - Better handling of dynamic imports

4. **Webpack-Compatible**
   - Easier migration path (uses Webpack plugin ecosystem)
   - Mature plugin support for complex workflows
   - Better debugging tools

5. **Tauri Integration**
   - Growing adoption in Tauri community
   - Better handling of native module boundaries
   - Optimized for desktop app distribution

---

## Current State Analysis

### What You Have:
- **Vite 4.5.14** with React plugin
- **WASM modules** (`fake-demucs.wasm`) with `?url` imports
- **Web Workers** using `new URL(..., import.meta.url)` pattern
- **Audio Worklets** (3 worklet files)
- **Tauri 2.9** integration
- **TypeScript** with bundler mode
- **Tailwind CSS** with PostCSS

### Potential Issues with Vite:
- Complex dependency resolution can be slow
- WASM/Worker handling can be fragile in large apps
- HMR can struggle with deep component trees
- Build optimization not ideal for desktop (web-focused)

---

## Migration Strategy: Non-Destructive Approach

### Phase 1: Parallel Setup (Zero Risk)

**Goal:** Set up Rspack alongside Vite, test in parallel

1. **Install Rsbuild (Rspack wrapper)**
```bash
npm install -D @rsbuild/core @rsbuild/plugin-react
npm install -D @rsbuild/plugin-sass  # if needed
```

2. **Create `rsbuild.config.ts`** (parallel to `vite.config.ts`)
```typescript
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/index.tsx',
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  html: {
    template: './index.html',
  },
  output: {
    distPath: {
      root: 'dist-rsbuild', // Different output dir for testing
    },
  },
  server: {
    port: 3002, // Different port for parallel testing
  },
  tools: {
    rspack: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.wasm'],
      },
      experiments: {
        asyncWebAssembly: true,
      },
    },
  },
});
```

3. **Add parallel scripts to `package.json`**
```json
{
  "scripts": {
    "dev": "vite",  // Keep existing
    "dev:rsbuild": "rsbuild dev",  // New parallel option
    "build": "tsc && vite build",  // Keep existing
    "build:rsbuild": "tsc && rsbuild build",  // New parallel option
    "test:rsbuild": "npm run build:rsbuild && npm run tauri:build"  // Test build
  }
}
```

### Phase 2: Worker/WASM Migration

**Goal:** Ensure Workers and WASM work correctly

1. **Update Worker imports** (Rspack handles this differently)
```typescript
// Current (Vite):
this.processingWorker = new Worker(
  new URL('../workers/stemSeparation.worker.ts', import.meta.url),
  { type: 'module' }
);

// Rspack-compatible (works with both):
const workerUrl = import.meta.env.DEV
  ? new URL('../workers/stemSeparation.worker.ts', import.meta.url)
  : new URL('../workers/stemSeparation.worker.ts', import.meta.url);
this.processingWorker = new Worker(workerUrl, { type: 'module' });
```

2. **WASM import handling**
```typescript
// Current (Vite):
import demucsWasmUrl from '../ai/models/fake-demucs.wasm?url';

// Rspack-compatible:
// Rspack handles .wasm files natively, but you may need:
import demucsWasmUrl from '../ai/models/fake-demucs.wasm';
// Or use dynamic import if needed
```

3. **Audio Worklet handling**
```typescript
// Rspack needs explicit worklet loader configuration
// Add to rsbuild.config.ts:
tools: {
  rspack: {
    module: {
      rules: [
        {
          test: /\.worklet\.js$/,
          type: 'asset/resource',
        },
      ],
    },
  },
}
```

### Phase 3: Tauri Integration Update

**Goal:** Update Tauri config to support both, then switch

1. **Update `tauri.conf.json`** (support both during transition)
```json
{
  "build": {
    "beforeDevCommand": "npm run dev:rsbuild",  // Switch when ready
    "beforeBuildCommand": "npm run build:rsbuild",  // Switch when ready
    "devUrl": "http://localhost:3002",  // Update port
    "frontendDist": "../dist-rsbuild"  // Update dist path
  }
}
```

2. **Test Tauri builds with both**
```bash
# Test Vite build (current)
npm run build && npm run tauri:build

# Test Rspack build (new)
npm run build:rsbuild && npm run tauri:build
```

### Phase 4: Full Migration (When Ready)

**Goal:** Switch completely to Rspack

1. **Update all scripts**
2. **Remove Vite dependencies** (or keep for reference)
3. **Update documentation**
4. **Clean up old dist folders**

---

## Configuration Details

### Complete `rsbuild.config.ts` for Your App

```typescript
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [pluginReact()],
  
  source: {
    entry: {
      index: './src/index.tsx',
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    include: ['src'],
  },
  
  html: {
    template: './index.html',
  },
  
  output: {
    distPath: {
      root: 'dist',
    },
    // Desktop app: single bundle optimization
    filename: {
      js: 'assets/[name].[contenthash:8].js',
      css: 'assets/[name].[contenthash:8].css',
    },
  },
  
  server: {
    port: 3001,
    host: true,
  },
  
  tools: {
    rspack: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.wasm', '.json'],
      },
      experiments: {
        asyncWebAssembly: true,
      },
      // Desktop app optimizations
      optimization: {
        usedExports: true,
        sideEffects: false, // Enable tree-shaking
      },
      module: {
        rules: [
          {
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
    // Desktop app: less aggressive chunking
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        chunks: {
          // Single main bundle for desktop
          default: {
            minSize: 0,
            maxSize: Infinity,
          },
        },
      },
    },
  },
});
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current `vite.config.ts`
- [ ] Document current build times
- [ ] Note any Vite-specific workarounds

### Phase 1: Parallel Setup
- [ ] Install Rsbuild dependencies
- [ ] Create `rsbuild.config.ts`
- [ ] Add parallel dev/build scripts
- [ ] Test `npm run dev:rsbuild` (should work alongside Vite)
- [ ] Verify Workers load correctly
- [ ] Verify WASM loads correctly
- [ ] Verify Audio Worklets work

### Phase 2: Tauri Integration
- [ ] Test Tauri dev with Rspack (`npm run tauri:dev` with Rspack)
- [ ] Test Tauri build with Rspack
- [ ] Compare bundle sizes
- [ ] Compare build times
- [ ] Test all features work identically

### Phase 3: Full Migration
- [ ] Update `tauri.conf.json` to use Rspack
- [ ] Update main scripts to use Rspack
- [ ] Remove Vite dependencies (or keep for reference)
- [ ] Update CI/CD if applicable
- [ ] Update documentation

### Post-Migration
- [ ] Monitor build performance
- [ ] Monitor runtime performance
- [ ] Document any issues/solutions
- [ ] Celebrate improved build times 🎉

---

## Expected Benefits

### Build Performance
- **Faster cold builds**: 20-40% improvement for large codebases
- **Faster incremental builds**: Better caching
- **Better HMR**: More reliable for deep component trees

### Runtime Performance
- **Better tree-shaking**: Smaller bundles for desktop
- **Optimized chunking**: Single-bundle strategy for desktop apps
- **Better WASM handling**: More reliable worker/WASM integration

### Developer Experience
- **Better error messages**: More detailed build errors
- **Better debugging**: Improved source maps
- **More stable**: Less fragile with complex dependency graphs

---

## Rollback Plan

If issues arise:

1. **Keep Vite config** - Don't delete `vite.config.ts`
2. **Keep parallel scripts** - Both dev commands available
3. **Revert Tauri config** - Change `beforeDevCommand` back to `npm run dev`
4. **Document issues** - Note what didn't work for future reference

---

## Next Steps

1. **Start with Phase 1** - Set up parallel Rspack build
2. **Test thoroughly** - Ensure all features work
3. **Compare performance** - Measure build times and bundle sizes
4. **Gradual migration** - Switch when confident

**This approach lets you test Rspack without breaking your current workflow.**

---

*Context improved by Giga AI — Used Tauri desktop app requirements, WASM/Worker patterns, and build tool research to create a non-destructive migration path.*










