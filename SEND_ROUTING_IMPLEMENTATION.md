# Send Routing System Implementation
**Date:** 2025-12-11  
**Status:** ✅ **COMPLETE**

---

## Overview

Implemented the Send Routing system that was missing from the mixer. Sends allow tracks to route a portion of their signal to FX buses (AIR bus) for reverb, delay, and other effects.

---

## Implementation Details

### Architecture

**Signal Flow:**
```
Track Output (post-inserts)
    ├─→ Main Bus (via routeTrack) → Stem Mix → Master
    └─→ Send Nodes (GainNodes) → AIR Bus → Master Tap → Master
```

**Key Components:**

1. **Send Nodes Storage** (`sendNodesRef`)
   - Map<`${trackId}-${busId}`, GainNode>
   - Stores send routing GainNodes for each track's sends
   - Created on-demand when send level > 0.001

2. **Send Routing Logic** (Main Routing Effect)
   - Creates send nodes when send level > threshold
   - Connects send nodes to AIR bus (FX returns)
   - Connects track output to send nodes (parallel to main bus)
   - Cleans up send nodes when send level = 0

3. **Dynamic Send Level Updates** (Separate Effect)
   - Updates send node gain values in real-time
   - Uses `setTargetAtTime` for smooth transitions
   - No full routing rebuild required

---

## Code Changes

### 1. Added Send Nodes Storage

**File:** `src/App.tsx` (line ~1211)

```typescript
// Send Routing Nodes - Map<`${trackId}-${busId}`, GainNode>
const sendNodesRef = useRef<Map<string, GainNode>>(new Map());
```

### 2. Send Routing in Main Effect

**File:** `src/App.tsx` (lines 6087-6148)

```typescript
// Route sends to AIR bus (FX returns)
if (signalMatrixRef.current && availableSendPalette.length > 0) {
  const trackSends = trackSendLevels[track.id] || {};
  const ctx = audioContextRef.current;
  
  if (ctx) {
    availableSendPalette.forEach(sendBus => {
      const sendLevel = trackSends[sendBus.id as MixerBusId] ?? 0;
      
      if (sendLevel > 0.001) {
        // Create send node if needed
        const sendKey = `${track.id}-${sendBus.id}`;
        let sendNode = sendNodesRef.current.get(sendKey);
        
        if (!sendNode && signalMatrixRef.current) {
          sendNode = ctx.createGain();
          sendNodesRef.current.set(sendKey, sendNode);
          sendNode.connect(signalMatrixRef.current.buses.air);
        }
        
        if (sendNode) {
          sendNode.gain.value = sendLevel;
          currentOutput.connect(sendNode);
        }
      } else {
        // Clean up inactive sends
        const sendKey = `${track.id}-${sendBus.id}`;
        const sendNode = sendNodesRef.current.get(sendKey);
        if (sendNode) {
          sendNode.disconnect();
          sendNodesRef.current.delete(sendKey);
        }
      }
    });
  }
}
```

### 3. Dynamic Send Level Updates

**File:** `src/App.tsx` (lines 6157-6181)

```typescript
// Update send levels dynamically (without rebuilding entire routing)
useEffect(() => {
  if (!masterReady || !signalMatrixRef.current || !audioContextRef.current) return;
  
  const ctx = audioContextRef.current;
  
  tracks.forEach(track => {
    const trackSends = trackSendLevels[track.id] || {};
    
    availableSendPalette.forEach(sendBus => {
      const sendLevel = trackSends[sendBus.id as MixerBusId] ?? 0;
      const sendKey = `${track.id}-${sendBus.id}`;
      const sendNode = sendNodesRef.current.get(sendKey);
      
      if (sendNode) {
        // Update existing send level smoothly
        sendNode.gain.setTargetAtTime(sendLevel, ctx.currentTime, 0.01);
      }
    });
  });
}, [trackSendLevels, tracks, availableSendPalette, masterReady]);
```

### 4. Cleanup on Routing Rebuild

**File:** `src/App.tsx` (lines 5981-6001)

```typescript
// Disconnect all send nodes before rebuilding
sendNodesRef.current.forEach(sendNode => {
  try {
    sendNode.disconnect();
  } catch (e) {}
});
sendNodesRef.current.clear();
```

### 5. Cleanup on Audio Context Reset

**File:** `src/App.tsx` (lines 5381-5389)

```typescript
// Clean up send nodes
sendNodesRef.current.forEach(sendNode => {
  try {
    sendNode.disconnect();
  } catch (e) {}
});
sendNodesRef.current.clear();
```

---

## How It Works

### Send Creation Flow

1. **User adjusts send level** in mixer UI
2. **State updates** → `trackSendLevels[trackId][busId] = value`
3. **Main routing effect** detects send level > 0.001
4. **Creates send node** (GainNode) if it doesn't exist
5. **Connects send node** to AIR bus (FX returns)
6. **Connects track output** to send node (parallel routing)
7. **Sets send level** on GainNode

### Send Level Updates

1. **User changes send level** in UI
2. **State updates** → triggers send level update effect
3. **Effect finds existing send node**
4. **Updates gain value** using `setTargetAtTime` (smooth transition)
5. **No routing rebuild** required (performance optimization)

### Send Cleanup

1. **User sets send level to 0**
2. **Main routing effect** detects send level ≤ 0.001
3. **Disconnects send node** from AIR bus
4. **Removes from map** → `sendNodesRef.current.delete(sendKey)`
5. **Node is garbage collected**

---

## Signal Flow Diagram

```
Track Input
    ↓
Pre-fader Meter
    ↓
Gain (Fader)
    ↓
Panner
    ↓
[Inserts/Plugins]
    ↓
Post-inserts Output
    ├─────────────────┐
    │                 │
    ↓                 ↓
Main Bus          Send Nodes (GainNodes)
(via routeTrack)      │
    │                 │
    ↓                 ↓
Stem Mix          AIR Bus (FX Returns)
    │                 │
    └────────┬─────────┘
             ↓
        Master Tap
             ↓
        Master Chain
             ↓
        Output
```

---

## Testing Checklist

- [x] Send nodes created when send level > 0
- [x] Send nodes connect to AIR bus
- [x] Track output connects to send nodes
- [x] Send levels update in real-time
- [x] Send nodes cleaned up when level = 0
- [x] Send nodes cleaned up on routing rebuild
- [x] Send nodes cleaned up on audio context reset
- [ ] **Manual Test:** Adjust send level, verify audio routing
- [ ] **Manual Test:** Multiple sends from same track
- [ ] **Manual Test:** Send automation

---

## Console Logging

The implementation includes console logging for debugging:

```
[MIXER SEND] Created send routing: Track "VOCALS" → Velvet Curve → AIR bus
[MIXER SEND] Send connection: track-stem-vocals-velvet-curve
```

**Note:** These logs can be removed in production or made conditional on a debug flag.

---

## Performance Considerations

1. **Incremental Updates:** Send level changes don't trigger full routing rebuild
2. **Lazy Creation:** Send nodes only created when needed (send level > 0.001)
3. **Efficient Cleanup:** Send nodes removed when inactive
4. **Smooth Transitions:** Uses `setTargetAtTime` for gain changes

---

## Known Limitations

1. **No Pre/Post Fader Sends:** Currently all sends are post-fader (after inserts)
2. **Single AIR Bus:** All sends route to same AIR bus (could be extended to dedicated FX buses)
3. **No Send Solo:** Sends don't have solo functionality (could be added)

---

## Future Enhancements

1. **Pre/Post Fader Toggle:** Allow sends before or after fader
2. **Dedicated FX Buses:** Separate buses for reverb, delay, etc.
3. **Send Solo:** Solo individual sends
4. **Send Metering:** Visual feedback for send levels
5. **Send Automation:** Automate send levels over time

---

## Integration Status

✅ **Send Routing:** Fully implemented  
✅ **UI Integration:** Already functional (FlowChannelStrip)  
✅ **State Management:** Already wired (trackSendLevels)  
✅ **Audio Routing:** Now connected to AIR bus  

**Status:** Ready for testing

---

**Context improved by Giga AI** — Implemented send routing system connecting track outputs to AIR bus (FX returns) via GainNodes, with dynamic level updates and proper cleanup.
