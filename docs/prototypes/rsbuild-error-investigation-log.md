# Rsbuild Error Investigation Log
## handleMenuSelect Error - Systematic Investigation

**Date:** Current Session
**Error:** `ReferenceError: handleMenuSelect is not defined`
**Location:** WelcomeScreen component (but actual component is FlowWelcomeHub)

---

## Investigation Steps Taken

### Step 1: Source Code Search ✅
- **Result:** No `handleMenuSelect` function found anywhere in source code
- **Result:** No `WelcomeScreen` component found (only `FlowWelcomeHub`)
- **Conclusion:** Error is not from source code directly

### Step 2: Vite Comparison ✅
- **Result:** Vite build works perfectly - no errors
- **Result:** Same source code, different bundler
- **Conclusion:** This is a Rsbuild-specific bundling issue

### Step 3: Component Name Mismatch ✅
- **Finding:** Error says "WelcomeScreen" but code uses "FlowWelcomeHub"
- **Possible Cause:** 
  - React component name inference issue
  - DisplayName not set (fixed by adding displayName)
  - Source map issue causing wrong component name

### Step 4: Error Message Anomaly ✅
- **Finding:** Error says "handleMenuSelect i not defined" (missing "is")
- **Possible Cause:**
  - Minification/mangling issue
  - Error message itself is being corrupted
  - String interpolation issue

### Step 5: ErrorBoundary Search ✅
- **Result:** No ErrorBoundary component found in codebase
- **Finding:** Error message mentions "ErrorBoundary" catching it
- **Possible Cause:**
  - React's built-in error boundary
  - Custom error boundary in a dependency
  - Error boundary in a provider component (not found yet)

---

## Current Hypothesis

### Most Likely Cause: Tree-Shaking or Code Elimination

Rsbuild might be:
1. **Removing code it thinks is unused** - The function might be called dynamically
2. **Mangling variable names incorrectly** - Function reference might be broken
3. **Resolving modules in wrong order** - Initialization order issue
4. **Handling dynamic imports differently** - If there's a dynamic import

### Secondary Hypothesis: Source Map Issue

The error location might be wrong:
- Actual error might be in a different component
- Source maps might be pointing to wrong location
- Component name inference might be failing

---

## Next Steps

1. **Add displayName to FlowWelcomeHub** ✅ (Done)
2. **Check bundled JavaScript** - Look for actual error location
3. **Disable tree-shaking temporarily** - See if that fixes it
4. **Check for dynamic imports** - Verify they work correctly
5. **Compare bundle outputs** - Vite vs Rsbuild side-by-side

---

## Configuration Changes Made

1. ✅ Disabled minification in dev (`minimize: false`)
2. ✅ Improved source maps (`devtool: 'eval-source-map'`)
3. ✅ Added displayName to FlowWelcomeHub

---

## Files to Check Next

1. `dist-rsbuild/static/js/*.js` - Bundled output
2. Any dynamic imports in the codebase
3. Provider components for ErrorBoundary
4. React error boundary setup

---

*Context improved by Giga AI — Used systematic debugging approach to document investigation progress.*



