# Rsbuild Error Investigation Summary
## handleMenuSelect Error - Current Status

**Prime, here's what we've found and what we're trying next.**

---

## Error Details

```
ReferenceError: handleMenuSelect is not defined
Location: WelcomeScreen component (but actual component is FlowWelcomeHub)
Error Boundary: Shows "Prime Brain Recovery" with recovery attempts
```

## Key Findings

1. **Function doesn't exist in source** - No `handleMenuSelect` found anywhere
2. **Component name mismatch** - Error says "WelcomeScreen" but code uses "FlowWelcomeHub"
3. **Vite works perfectly** - Same code, no errors with Vite
4. **Rsbuild-specific issue** - This is a bundling difference, not a code problem
5. **Error message anomaly** - Says "i not defined" instead of "is not defined" (possible mangling)

## Changes Made

1. ✅ Added `displayName` to FlowWelcomeHub (helps with debugging)
2. ✅ Disabled minification (`minimize: false`)
3. ✅ Improved source maps (`devtool: 'eval-source-map'`)
4. ✅ **Disabled aggressive tree-shaking** (`sideEffects: true`) - **JUST APPLIED**

## Current Hypothesis

**Most Likely:** Tree-shaking is removing code that's actually used, or mangling variable names incorrectly.

**Test:** Disabled `sideEffects: false` → `sideEffects: true` to prevent aggressive code elimination.

## Next Steps

1. **Wait for rebuild** - Server should rebuild with new config
2. **Test if error persists** - Check if disabling tree-shaking fixes it
3. **If fixed:** Gradually re-enable optimizations one by one
4. **If not fixed:** Check bundled output for actual error location
5. **Compare bundles** - Vite vs Rsbuild side-by-side

## If Tree-Shaking Was the Issue

We'll need to:
- Mark specific files/modules as having side effects
- Use `/*#__PURE__*/` comments for intentional tree-shaking
- Configure `sideEffects` in package.json
- Test incrementally to find the exact module causing issues

## If Tree-Shaking Was NOT the Issue

Next investigations:
- Check bundled JavaScript directly
- Look for dynamic imports that might be failing
- Check module resolution order
- Verify all imports are resolving correctly

---

**Status:** Testing tree-shaking fix. Server rebuilding now.

*Context improved by Giga AI — Documented systematic investigation and current fix attempt.*










