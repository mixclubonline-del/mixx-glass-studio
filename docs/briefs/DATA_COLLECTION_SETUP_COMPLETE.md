# ✅ Data Collection Setup - COMPLETE

## 🎯 Mission Accomplished

The **Revolutionary Stem Separation Data Collection System** is now fully set up and ready to collect training data. This document summarizes everything that's been configured.

---

## 📦 What's Been Set Up

### 1. Exporter Hook Integration ✅

**Location**: `src/App.tsx`

- **Stem Separation Exporter** initialized alongside Prime Brain exporter
- Exporter exposed to `window.__mixx_stem_separation_exporter` for pipeline callback
- Export URL configuration from multiple sources:
  - `localStorage: mixxclub:stem-separation-export-url`
  - `window.__MIXX_STEM_SEPARATION_EXPORT_URL`
  - `VITE_STEM_SEPARATION_EXPORT_URL` environment variable

### 2. Pipeline Integration ✅

**Location**: `src/components/import/FileInput.tsx`

- Snapshot callback automatically wired to exporter
- Exports snapshots during stem separation
- No manual intervention required

### 3. Test Infrastructure ✅

**Test Scripts**:
- `scripts/test-revolutionary-stem-system.ts` - End-to-end system test
- `scripts/setup-data-collection.ts` - Data collection setup wizard
- `scripts/test-endpoint-simulator.js` - Local test server

**NPM Scripts**:
- `npm run test:stem-system` - Test revolutionary system
- `npm run setup:data-collection` - Run setup wizard
- `npm run test:endpoint` - Start test endpoint server

---

## 🚀 How to Use

### Quick Start (3 Steps)

#### 1. Start Test Endpoint (Local Testing)

```bash
npm run test:endpoint
```

This starts a local server on `http://localhost:3002` that receives and saves snapshots.

#### 2. Enable Data Collection in Studio

Open browser console and run:

```javascript
window.__MIXX_STEM_SEPARATION_EXPORT_URL = "http://localhost:3002"
```

Or set via localStorage:

```javascript
localStorage.setItem('mixxclub:stem-separation-export-url', 'http://localhost:3002')
```

#### 3. Import Audio Files

Import audio files in Studio. Snapshots will automatically export during stem separation.

**Verify**: Check console for `[STEM SEPARATION] Snapshot queued` messages.

---

## 📋 Configuration Options

### Environment Variables

```bash
# Export URL
VITE_STEM_SEPARATION_EXPORT_URL=https://your-endpoint/stem-separation

# Debug logging
VITE_STEM_SEPARATION_EXPORT_DEBUG=1
```

### Browser Console

```javascript
// Set export URL
window.__MIXX_STEM_SEPARATION_EXPORT_URL = "https://your-endpoint/stem-separation"

// Enable debug mode
localStorage.setItem('mixxclub:stem-separation-telemetry-enabled', 'enabled')
```

### Local Storage

```javascript
// Export URL
localStorage.setItem('mixxclub:stem-separation-export-url', 'https://your-endpoint')

// Enable/disable telemetry
localStorage.setItem('mixxclub:stem-separation-telemetry-enabled', 'enabled')
localStorage.setItem('mixxclub:stem-separation-telemetry-enabled', 'disabled')
```

---

## 🧪 Testing

### Test Revolutionary System

```bash
npm run test:stem-system
```

This validates:
- ✅ Quantum feature extraction
- ✅ Musical context analysis
- ✅ Stem separation
- ✅ Snapshot export

### Setup Data Collection

```bash
npm run setup:data-collection
```

This wizard:
- ✅ Checks environment configuration
- ✅ Creates test export directory
- ✅ Generates setup instructions
- ✅ Creates test endpoint simulator

### Start Test Endpoint

```bash
npm run test:endpoint
```

This starts a local HTTP server that:
- ✅ Receives snapshots via POST
- ✅ Saves to `test-snapshots/` directory
- ✅ Logs receipt confirmations
- ✅ Handles CORS for browser requests

---

## 📁 File Structure

```
mixx-glass-studio/
├── src/
│   ├── App.tsx                           ✅ Exporter initialized
│   ├── components/import/
│   │   └── FileInput.tsx                 ✅ Pipeline callback wired
│   └── core/import/
│       ├── useStemSeparationExporter.ts  ✅ Exporter hook
│       └── stemSeparationSnapshot.ts     ✅ Snapshot builder
├── scripts/
│   ├── test-revolutionary-stem-system.ts ✅ System test
│   ├── setup-data-collection.ts          ✅ Setup wizard
│   └── test-endpoint-simulator.js        ✅ Test server
├── test-snapshots/                       📁 (created on first export)
└── docs/
    └── briefs/
        └── DATA_COLLECTION_SETUP_COMPLETE.md  ✅ This file
```

---

## 🔍 Verification Checklist

### ✅ Exporter Initialized

Check browser console:
```javascript
window.__mixx_stem_separation_exporter
```

Should show:
- `exportSnapshot: function`
- `enabled: true/false`

### ✅ Export URL Set

Check browser console:
```javascript
window.__MIXX_STEM_SEPARATION_EXPORT_URL
```

Should show your endpoint URL.

### ✅ Snapshots Exporting

Check browser console for:
```
[STEM SEPARATION] Snapshot queued {id} (queue size: 1/50)
[STEM SEPARATION] Snapshot exported: {id}
```

### ✅ Test Endpoint Receiving

If using test endpoint, check terminal:
```
[TEST ENDPOINT] ✅ Received snapshot #1: {id}
[TEST ENDPOINT]    Saved to: test-snapshots/snapshot-{id}-{timestamp}.json
```

---

## 📊 Data Collection Status

### Current Status: ✅ READY

- [x] Exporter hook integrated in App.tsx
- [x] Pipeline callback wired in FileInput
- [x] Test scripts created
- [x] Test endpoint simulator ready
- [x] Documentation complete

### Next Steps

1. **Enable Export URL** (set via console or localStorage)
2. **Import Audio Files** (snapshots auto-export)
3. **Verify Collection** (check console logs)
4. **Run Training Pipeline** (sanitize → dataset → train)

---

## 🎉 Success Indicators

### ✅ Data Collection Active

- Console shows `[STEM SEPARATION] Snapshot queued` messages
- Network tab shows POST requests to export URL
- Test endpoint shows received snapshots

### ✅ System Operational

- Test script passes all checks
- Snapshots validate correctly
- Exporter initialized without errors

---

## 💡 Tips

1. **Use Test Endpoint First**: Start with local testing before deploying to production endpoint
2. **Check Debug Logs**: Enable `VITE_STEM_SEPARATION_EXPORT_DEBUG=1` for detailed logging
3. **Monitor Queue**: Queue max size is 50 snapshots (auto-flushes on unload)
4. **Batch Imports**: Import multiple files to collect diverse training data

---

## 🚨 Troubleshooting

### No Snapshots Exported

**Check:**
- Export URL is set correctly
- Exporter is enabled (`window.__mixx_stem_separation_exporter.enabled`)
- Browser console for errors

**Fix:**
```javascript
// Verify exporter
console.log(window.__mixx_stem_separation_exporter)

// Re-enable
window.__MIXX_STEM_SEPARATION_EXPORT_URL = "http://localhost:3002"
```

### Test Endpoint Not Receiving

**Check:**
- Server is running (`npm run test:endpoint`)
- Export URL points to correct port (3002)
- CORS headers are set (automatic in simulator)

**Fix:**
```bash
# Restart endpoint
npm run test:endpoint

# Verify port
curl http://localhost:3002
```

---

## ✅ Completion Status

**Data Collection Infrastructure**: ✅ COMPLETE
**Test Scripts**: ✅ COMPLETE
**Documentation**: ✅ COMPLETE

**Ready to collect training data! 🚀**

---

*Setup complete. Time to revolutionize stem separation through continuous learning.*

