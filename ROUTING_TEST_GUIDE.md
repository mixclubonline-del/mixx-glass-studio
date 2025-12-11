# Routing Verification Test Guide

## Quick Test

After the app loads, open the browser console and run:

```javascript
window.__mixx_verifyRouting()
```

This will:
1. ✅ Verify all buses are properly configured
2. ✅ Test routing for known track patterns
3. ✅ Verify bus gain staging values
4. ✅ Show pass/fail results

## Expected Output

```
[ROUTING VERIFICATION]
✅ Available buses: twoTrack, vocals, drums, bass, music, stemMix, masterTap, air
✅ track-two-track (role: none) → twoTrack
✅ track-stem-vocals (role: none) → vocals
✅ track-stem-drums (role: none) → drums
✅ track-stem-bass (role: none) → bass
✅ track-stem-harmonic (role: none) → music
✅ track-hush-record (role: none) → vocals
✅ track-unknown (role: standard) → stemMix

📊 Results: 7 passed, 0 failed

Bus Gain Staging:
  twoTrack: 0.65 (expected: 0.65)
  vocals: 1.15 (expected: 1.15)
  drums: 1.0 (expected: 1.0)
  bass: 0.85 (expected: 0.85)
  music: 0.9 (expected: 0.9)
  stemMix: 1.0 (expected: 1.0)
  masterTap: 1.0 (expected: 1.0)
  air: 0.5 (expected: 0.5)
```

## Runtime Verification

The routing code now includes console logging that shows actual routing as tracks connect:

```
[MIXER ROUTING] Track "TWO TRACK" (track-two-track, role: two-track) → twoTrack bus
[MIXER ROUTING] Track "VOCALS" (track-stem-vocals, role: vocals) → vocals bus
[MIXER ROUTING] Track "DRUMS" (track-stem-drums, role: drums) → drums bus
```

## Manual Testing Checklist

1. **Load the app** - Wait for audio context initialization
2. **Check console** - Look for `[MIXER ROUTING]` logs when tracks are created
3. **Run verification** - Execute `window.__mixx_verifyRouting()` in console
4. **Verify bus routing** - All tracks should route to correct buses:
   - `track-two-track` → `twoTrack` bus
   - `track-stem-vocals` → `vocals` bus
   - `track-stem-drums` → `drums` bus
   - `track-stem-bass` → `bass` bus
   - `track-stem-harmonic` → `music` bus
   - `track-stem-perc` → `music` bus
   - `track-stem-sub` → `music` bus
   - `track-hush-record` → `vocals` bus
   - Unknown tracks → `stemMix` bus (fallback)

## Bus Signal Flow

```
Track → Bus → Stem Mix → Master Tap → Master Chain → Output
```

All stem buses (twoTrack, vocals, drums, bass, music) feed into `stemMix`, which then feeds into `masterTap`, which connects to the master chain input.

## Troubleshooting

**If routing test fails:**
- Check that SignalMatrix is initialized (should see buses in console)
- Verify audio context is running (not suspended)
- Check browser console for errors during initialization

**If tracks don't route:**
- Check `masterReady` state - routing only happens when master chain is ready
- Verify `signalMatrixRef.current` exists
- Check for connection errors in console

**If bus gain staging is wrong:**
- SignalMatrix should set default gains on creation
- Check that buses are created with correct gain values (see SignalMatrix.ts)

## Advanced Testing

For more comprehensive testing, use the full test suite:

```typescript
import { runRoutingTests } from './src/utils/routingTest';
runRoutingTests();
```

This runs all test cases including edge cases and connectivity verification.
