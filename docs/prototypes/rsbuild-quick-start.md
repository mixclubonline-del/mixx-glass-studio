# Rspack/Rsbuild Quick Start Guide
## Non-Destructive Migration for Mixx Club Studio

**Prime, here's the exact steps to test Rspack alongside your current Vite setup.**

---

## Step 1: Install Dependencies

```bash
npm install -D @rsbuild/core @rsbuild/plugin-react
```

This adds Rsbuild without removing Vite. Both can coexist.

---

## Step 2: Add Parallel Scripts to package.json

Add these scripts to your `package.json` (keep existing ones):

```json
{
  "scripts": {
    "dev": "vite",  // Keep existing
    "dev:rsbuild": "rsbuild dev",  // New: test Rspack dev server
    "build": "tsc && vite build",  // Keep existing
    "build:rsbuild": "tsc && rsbuild build",  // New: test Rspack build
    "preview": "vite preview",  // Keep existing
    "lint": "eslint . --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "tauri:dev": "tauri dev",  // Keep existing
    "tauri:dev:rsbuild": "TAURI_BEFORE_DEV_COMMAND='npm run dev:rsbuild' tauri dev",  // New: test Tauri with Rspack
    "tauri:build": "tauri build"  // Keep existing
  }
}
```

---

## Step 3: Test Rspack Dev Server

```bash
npm run dev:rsbuild
```

This will:
- Start Rspack dev server on port 3002 (different from Vite's 3001)
- Output to `dist-rsbuild` (different from Vite's `dist`)
- Run alongside Vite (you can have both running)

**Test:** Open `http://localhost:3002` and verify everything works.

---

## Step 4: Test Rspack Production Build

```bash
npm run build:rsbuild
```

This will:
- Type-check with TypeScript
- Build with Rspack to `dist-rsbuild/`
- Your Vite build in `dist/` remains untouched

**Compare:**
- Build times (Rspack should be faster for large codebases)
- Bundle sizes (should be similar or smaller)
- Check that all assets are included

---

## Step 5: Test Tauri with Rspack (Optional)

If you want to test the full Tauri integration:

1. **Temporarily update `src-tauri/tauri.conf.json`:**
```json
{
  "build": {
    "beforeDevCommand": "npm run dev:rsbuild",
    "beforeBuildCommand": "npm run build:rsbuild",
    "devUrl": "http://localhost:3002",
    "frontendDist": "../dist-rsbuild"
  }
}
```

2. **Run Tauri dev:**
```bash
npm run tauri:dev
```

3. **Revert when done testing** (or keep if you like it)

---

## Step 6: Verify Critical Features

Test these specifically (they're the most likely to need adjustments):

### ✅ Web Workers
- Stem separation worker should load
- Check browser console for worker errors

### ✅ WASM Modules
- `fake-demucs.wasm` should load correctly
- Check network tab for WASM requests

### ✅ Audio Worklets
- True peak processor
- Velvet dither processor
- Velvet true peak limiter

### ✅ Dynamic Imports
- Any code splitting or lazy loading
- Route-based code splitting (if using React Router)

---

## Common Issues & Fixes

### Issue: Workers not loading
**Fix:** Rspack handles workers differently. May need to adjust worker import pattern.

### Issue: WASM not found
**Fix:** Rspack handles `.wasm` natively, but check import paths.

### Issue: Tailwind styles missing
**Fix:** PostCSS config should work, but verify `tailwind.config.ts` is being read.

### Issue: TypeScript errors
**Fix:** Rspack uses the same TypeScript config, but check `tsconfig.json` paths.

---

## When Ready to Switch

Once you've tested and everything works:

1. **Update `tauri.conf.json`** to use Rspack commands
2. **Update main scripts** in `package.json`:
   ```json
   {
     "scripts": {
       "dev": "rsbuild dev",  // Switch from vite
       "build": "tsc && rsbuild build",  // Switch from vite build
       // ... keep other scripts
     }
   }
   ```
3. **Update output directory** in `rsbuild.config.ts`:
   ```typescript
   output: {
     distPath: {
       root: 'dist',  // Change from 'dist-rsbuild'
     },
   },
   ```
4. **Update server port** in `rsbuild.config.ts`:
   ```typescript
   server: {
     port: 3001,  // Change from 3002 to match Tauri config
   },
   ```

---

## Rollback (If Needed)

If you encounter issues:

1. **Revert `package.json` scripts** to use `vite`
2. **Revert `tauri.conf.json`** to original settings
3. **Keep `rsbuild.config.ts`** for future reference
4. **No code changes needed** - everything is config-only

---

## Expected Results

### Build Performance
- **Cold build**: 20-40% faster (especially for large codebases)
- **Incremental build**: Better caching, faster rebuilds
- **HMR**: More reliable for deep component trees

### Bundle Size
- **Similar or smaller**: Better tree-shaking
- **Single bundle**: Optimized for desktop (no code splitting needed)

### Developer Experience
- **Better error messages**: More detailed build errors
- **More stable**: Less fragile with complex dependency graphs

---

**This approach lets you test everything without breaking your current workflow.**

*Context improved by Giga AI — Used Tauri desktop app patterns and Rspack migration best practices.*










