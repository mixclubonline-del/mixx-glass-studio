# Test Script Instructions

## Running the Revolutionary Stem Separation System Test

The test script validates the complete revolutionary stem separation system. Here's how to run it:

### Option 1: Using NPM Script (Recommended)

```bash
npm run test:stem-system
```

### Option 2: Direct Execution

```bash
npx ts-node scripts/test-revolutionary-stem-system.ts
```

### Option 3: With TypeScript Compiler

```bash
ts-node --esm scripts/test-revolutionary-stem-system.ts
```

## Prerequisites

1. **Node.js** 18+ installed
2. **TypeScript** installed (`npm install -D typescript`)
3. **ts-node** installed (`npm install -D ts-node`)
4. All project dependencies installed (`npm install`)

## Expected Output

When successful, you should see:

```
🧪 Testing Revolutionary Stem Separation System...

1️⃣  Testing Quantum Feature Extraction...
   ✅ Quantum features extracted:
      - Spectral: 128 features
      - Temporal: 64 features
      - Harmonic: 64 features
      - Percussive: 64 features
      - Stereo: 2 features
      - Energy: 1 features

2️⃣  Testing Musical Context Analysis...
   ✅ Musical context analyzed:
      - Key: C
      - BPM: 120
      - Transients: 0
      - Harmonic tension: 0.500

3️⃣  Testing Stem Separation...
   ✅ Stem separation complete:
      - Vocals: ✅
      - Drums: ✅
      - Bass: ❌
      - Harmonic: ✅

4️⃣  Testing Snapshot Export...
   ✅ Snapshot built:
      - ID: abc-123-def-456
      - Timestamp: 2025-01-XX...
      - Classification: twotrack
      - Confidence: 0.8
      - Processing time: 1234ms

   📄 Test snapshot saved to: /path/to/test-output-snapshot.json

5️⃣  Validating Snapshot Structure...
   ✅ Snapshot validation: PASSED

✅ All tests passed! Revolutionary Stem Separation System is operational.

📊 Test Results:
{
  "success": true,
  "features": {
    "spectral": 128,
    "temporal": 64,
    "harmonic": 64
  },
  "context": {
    "key": "C",
    "bpm": 120,
    "transients": 0
  },
  "snapshot": {
    "id": "abc-123-def-456",
    "valid": true
  }
}
```

## Troubleshooting

### Import Errors

If you see module resolution errors, try:

1. **Check import paths**: The script uses relative imports from project root
2. **Verify TypeScript config**: Ensure `baseUrl` is set correctly in `tsconfig.json`
3. **Use absolute imports**: If relative imports fail, try using `@/` path alias

### AudioBuffer Errors

If you see `AudioBuffer is not defined`:

- This is expected in Node.js environment
- The script includes a mock `createMockAudioBuffer()` function
- If issues persist, ensure DOM types are included in TypeScript config

### Module Not Found

If dependencies are missing:

```bash
npm install
npm install -D typescript ts-node @types/node
```

### Permission Errors

Make sure the script has write permissions for `test-output-snapshot.json`:

```bash
chmod +x scripts/test-revolutionary-stem-system.ts
```

## Test Output Files

The test creates:
- `test-output-snapshot.json` - Sample snapshot for validation

These files are safe to delete after testing.

## Next Steps

After successful test:
1. ✅ System validated
2. 🔧 Setup data collection (`npm run setup:data-collection`)
3. 🚀 Start test endpoint (`npm run test:endpoint`)
4. 📊 Begin collecting training data

---

**Test validates the complete revolutionary stem separation pipeline! 🚀**

