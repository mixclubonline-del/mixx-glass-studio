# Rsbuild Error Deep Dive
## handleMenuSelect - Persistent Error Analysis

**Status:** Error persists after multiple fix attempts

---

## Error Details (Consistent)

```
ReferenceError: handleMenuSelect is not defined
Location: WelcomeScreen component (but source uses FlowWelcomeHub)
Error Boundary: Shows "Prime Brain Recovery" 
Console: "🔒 ErrorBoundary caught error" at index.js:24385
```

## Fixes Attempted (All Failed)

1. ❌ Disabled minification (`minimize: false`)
2. ❌ Improved source maps (`devtool: 'eval-source-map'`)
3. ❌ Disabled aggressive tree-shaking (`sideEffects: true`)
4. ❌ Added displayName to FlowWelcomeHub
5. ❌ Removed Vite-specific script tag from HTML

## Key Observations

1. **Function doesn't exist in source** - No `handleMenuSelect` anywhere
2. **Component name mismatch** - Error says "WelcomeScreen", code uses "FlowWelcomeHub"
3. **Error message anomaly** - Says "i not defined" instead of "is not defined"
4. **ErrorBoundary not in source** - Can't find the ErrorBoundary that's catching it
5. **Vite works perfectly** - Same code, no errors

## Current Hypothesis

### Most Likely: Bundled Code Issue

The error is in the **bundled JavaScript**, not the source. This suggests:

1. **Variable name mangling** - Rsbuild might be mangling names incorrectly
2. **Module resolution order** - Different import order causing issues
3. **Code transformation** - Rsbuild transforming code differently than Vite
4. **Hidden dependency** - A library or dependency that has this function

### Secondary: Source Map Issue

The error location might be completely wrong:
- Source maps pointing to wrong component
- Actual error in different file
- Component name inference failing

## Next Investigation Steps

1. **Check bundled output directly** - Look at dist-rsbuild/static/js/index.js around line 24385
2. **Compare with Vite bundle** - See what Vite produces vs Rsbuild
3. **Check for dynamic imports** - Any dynamic imports that might be failing
4. **Check React DevTools** - See actual component tree when error occurs
5. **Check for third-party ErrorBoundary** - Might be in a library

## Critical Question

**Where is the ErrorBoundary that's catching this?**

The console shows "🔒 ErrorBoundary caught error" but we can't find it in source. This suggests:
- It's in a third-party library
- It's generated code
- It's in a file we haven't checked
- It's React's development mode error overlay

---

**Next Action:** Check the actual bundled JavaScript file to see what's happening at the error location.

*Context improved by Giga AI — Documented persistent error and all attempted fixes.*



