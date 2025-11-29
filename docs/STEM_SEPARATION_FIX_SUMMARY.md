# 🔧 STEM SEPARATION FIX — SUMMARY
## Making Import Deterministic & Consistent

**Date:** 2025-11-16  
**Issue Fixed:** "Depending on that type of file that I choose it's sort of picks and chooses which ones it wants to separate"

---

## 🎯 THE PROBLEM

**What Was Happening:**
- File type A → Only vocals stem created
- File type B → Only music stem created  
- File type C → All stems created (sometimes)
- File type D → No stems created (broken)

**Root Cause:**
1. Classification determined mode → Simple spectral analysis was inconsistent
2. Different modes = different stems → `vocal` mode only creates vocals, `2track` only creates music
3. Silent failures → When HPSS failed, fallback might also fail
4. No guarantee → Some files ended up with zero stems

---

## ✅ THE FIX

### **1. Deterministic Mode Selection**
- **All files now use `full` separation mode**
- Classification is a hint, not a decision
- `determineOptimalMode()` always returns `'full'`
- Special modes (`vocal`, `2track`) only used if explicitly requested

### **2. Improved Classification**
- More robust thresholds (multiple factors)
- Better confidence calculation
- Logging for debugging
- Still used as hint, but doesn't limit stems

### **3. Guaranteed Stem Creation**
- **Always ensure at least one stem exists** (music = original buffer)
- Multiple fallback layers:
  1. HPSS + vocal extraction (primary)
  2. Frequency filtering (fallback 1)
  3. Original buffer as music (fallback 2 - guaranteed)
- No file leaves without stems

### **4. Comprehensive Diagnostics**
- Track every step: file type, classification, mode, stems created/failed
- Error logging with timestamps
- Pattern analysis to identify issues
- Exposed to `window.__stem_separation_diagnostics`

### **5. Better Error Handling**
- Each stem hydration wrapped in try/catch
- Continue processing even if one stem fails
- All errors logged in diagnostic

---

## 📊 FILES MODIFIED

1. **`src/core/import/stemEngine.ts`**
   - Auto mode always uses `full` separation
   - Guaranteed stem creation (at least music)
   - Better error handling
   - Final guarantee check

2. **`src/core/import/classifier.ts`**
   - Improved classification logic
   - Multiple factors (spectral + transients + RMS)
   - Better thresholds
   - Logging

3. **`src/core/import/stemPipeline.ts`**
   - Diagnostic tracking
   - Error handling per stem
   - Comprehensive logging

4. **`src/core/import/stemSeparationDiagnostics.ts`** (NEW)
   - Diagnostic system
   - Pattern analysis
   - Error tracking

---

## 🔍 DEBUGGING

**Check Diagnostics:**
```javascript
// In browser console
window.__stem_separation_diagnostics

// Analyze patterns
const diag = getStemSeparationDiagnostics();
const patterns = diag.analyzePatterns();
console.log('File type success rates:', patterns.fileTypes);
console.log('Common errors:', patterns.commonErrors);
```

**What's Logged:**
- File name, type, size, duration
- Classification (type, confidence, spectral)
- Mode selection and reason
- Stems attempted, created, failed
- All errors with timestamps
- Processing timings
- Final success status

---

## ✅ EXPECTED BEHAVIOR NOW

**Before (Inconsistent):**
- MP3 → Sometimes vocals only
- WAV → Sometimes music only
- M4A → Sometimes all stems, sometimes none

**After (Deterministic):**
- **All files** → Always attempt full separation
- **All files** → Always get at least music stem (original buffer)
- **All files** → Same processing path
- **All files** → Consistent behavior

---

## 🚀 READY FOR TESTING

**The fix is complete.** Stem separation is now deterministic and consistent.

**Test with:**
- Different file types (MP3, WAV, M4A, FLAC)
- Different file sizes
- Different audio content

**Monitor:**
- Check `window.__stem_separation_diagnostics` after imports
- Look for patterns in failures
- Verify all files get stems

---

*Stem Separation Fix — Deterministic & Consistent*  
*Foundation: restore-2025-11-16 + All Phases*  
*Status: Fixed & Ready for Testing*

