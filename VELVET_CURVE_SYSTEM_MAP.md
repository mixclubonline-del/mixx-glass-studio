# 🎵 VELVET CURVE SYSTEM — COMPLETE MAP

## 📁 FILE LOCATIONS

### Core Engine

```text
src/audio/VelvetCurveEngine.ts
├── VelvetCurveEngine class (implements IAudioEngine)
├── Singleton pattern: getVelvetCurveEngine()
├── Initialization: initializeVelvetCurveEngine()
└── State: VelvetCurveState interface
```

### Master Chain Integration

```text
src/audio/masterChain.ts
├── buildMasterChain() function
├── VelvetMasterChain interface
└── Line 82-84: Initializes and activates VelvetCurveEngine
└── Line 184: Connects in audio chain
```

### Related Velvet Systems

```text
src/audio/VelvetFloor.ts (Five Pillars)
src/audio/VelvetProcessor.ts
src/audio/VelvetLoudnessMeter.ts
src/audio/VelvetTruePeakLimiter.ts
src/audio/VelvetValidator.ts
```

### UI Components

```text
src/components/VelvetCurveVisualizer.tsx
├── Visualizes warmth, silkEdge, emotion, power curves
├── Connected to: App.tsx (line 2451)
└── Controls: Sliders for all 4 parameters

src/components/ALS/VelvetComplianceHUD.tsx
└── ALS integration for Velvet Curve compliance
```

### State Management

```text
src/App.tsx
├── Line 6: Imports VelvetCurveEngine
├── Line 2367-2374: State hooks and change handlers
├── Line 2404-2410: Context change handler
├── Line 5027-5031: Beat-locked clock sync
└── Line 4791: Master chain initialization
```

---

## 🔌 AUDIO ROUTING PATH

### Master Chain Signal Flow

```text
AudioContext.destination
    ↑
TranslationMatrix
    ↑
Master Gain Node
    ↑
Stereo Panner
    ↑
Dither Node
    ↑
Post-Limiter Analyser
    ↑
True Peak Limiter
    ↑
Soft Limiter
    ↑
Pre-Limiter Tap
    ↑
Color Shaper (WaveShaper)
    ↑
Color Drive (Gain)
    ↑
Glue Compressor
    ↑
Multi-Band Stage
    ↑
Mid/Side Stage
    ↑
[VELVET CURVE ENGINE] ← YOU ARE HERE
    ↑
Phase Weave Stage
    ↑
Harmonic Lattice Stage
    ↑
Velvet Floor Stage
    ↑
DC Blocker
    ↑
Master Input (all tracks connect here)
```

### VelvetCurveEngine Internal Routing

```text
Public Input (GainNode)
    ↓
Internal Input Gain
    ↓
Warmth Filter (BiquadFilter @ 250Hz, peaking)
    ↓
Silk Edge Filter (BiquadFilter @ 3000Hz, peaking)
    ↓
Emotion Filter (BiquadFilter @ 1000Hz, peaking)
    ↓
Power Compressor (DynamicsCompressor)
    ↓
Harmonic Enhancer (BiquadFilter, highpass @ 80Hz)
    ↓
Internal Output Gain
    ↓
Makeup Gain
    ↓
Public Output (GainNode)
```

---

## 🎛️ PARAMETER CONTROL

### VelvetCurveEngine Parameters

1. **warmth** (0-1)
   - Controls: Warmth Filter gain
   - Frequency: 250Hz peaking
   - Effect: Low-mid enhancement for velvet smoothness

2. **silkEdge** (0-1)
   - Controls: Silk Edge Filter gain
   - Frequency: 3000Hz peaking
   - Effect: High-mid enhancement for clarity

3. **emotion** (0-1)
   - Controls: Emotion Filter gain
   - Frequency: 1000Hz peaking
   - Effect: Mid enhancement for musical expression

4. **power** (0-1)
   - Controls: Power Compressor threshold/ratio
   - Effect: Dynamic compression for impact

5. **balance** (0-1)
   - Controls: Overall balance between curves
   - Effect: Mix between warmth/silk/emotion

### State Management Flow

```text
UI Slider (VelvetCurveVisualizer)
    ↓
onChange('warmth', value)
    ↓
handleVelvetCurveChange() [App.tsx:2370]
    ↓
engine.setParameter('warmth', value)
    ↓
updateProcessingParameters() [VelvetCurveEngine.ts]
    ↓
warmthFilter.gain.setValueAtTime(...)
    ↓
setVelvetCurveState(engine.getState())
    ↓
UI Updates (React re-render)
```

---

## ⚙️ INITIALIZATION SEQUENCE

### 1. Master Chain Build (App.tsx:4791)

```typescript
masterNodesRef.current = await buildMasterChain(createdCtx);
```

### 2. VelvetCurveEngine Init (masterChain.ts:82-84)

```typescript
await initializeVelvetCurveEngine(ctx);
const velvetCurve = getVelvetCurveEngine(ctx);
velvetCurve.setActive(true);
```

### 3. Engine Internal Init (VelvetCurveEngine.ts:233-270)

```typescript
async initialize(audioContext) {
  // Create public nodes
  this.input = audioContext.createGain();
  this.output = audioContext.createGain();
  this.makeup = audioContext.createGain();
  
  // Create internal processing chain
  this.createProcessingChain();
  
  // Connect: input → warmth → silk → emotion → power → harmonic → output
  // Connect public nodes to internal chain
  
  this.isInitialized = true;
}
```

### 4. Master Chain Connection (masterChain.ts:184)

```typescript
phaseWeave.output.connect(velvetCurve.input);
velvetCurve.output.connect(midSideStage.input);
```

### 5. Clock Sync (App.tsx:5027-5031)

```typescript
const velvetCurveEngine = getVelvetCurveEngine(audioContextRef.current);
velvetCurveEngine.setClock(getBeatPhase); // Beat-locked LFO
```

---

## 🔄 BEAT-LOCKED PROCESSING

### Movement Doctrine Integration

- **Clock Source**: `getBeatPhase()` function (App.tsx:5014-5018)
- **Sync Point**: VelvetCurveEngine.setClock() (App.tsx:5030)
- **Purpose**: Musical timing alignment for emotion curves
- **Formula**: `V(t) = W(t) × S(t) × E(t) × P(t) × B(t)`
  - W(t): Warmth curve (beat-locked breathing)
  - S(t): Silk edge (beat-locked clarity)
  - E(t): Emotion curve (beat-locked expression)
  - P(t): Power curve (beat-locked impact)
  - B(t): Beat-locked breathing pattern

---

## 🎨 UI INTEGRATION

### VelvetCurveVisualizer Component

- **Location**: `src/components/VelvetCurveVisualizer.tsx`
- **Props**: `params` (VelvetCurveState), `onChange`, `isPlaying`, `currentTime`
- **Visualization**: SVG curves for warmth, silk, power
- **Controls**: 4 sliders (warmth, silkEdge, emotion, power)
- **Connected**: App.tsx line 2451 via FXWindow

### State Sync

- **App State**: `velvetCurveState` (useState hook)
- **Engine State**: `engine.getState()` (singleton)
- **Update Flow**: UI change → engine.setParameter() → engine.getState() → React state

---

## 🔗 RELATED SYSTEMS

### Five Pillars Integration

- **Velvet Floor**: `src/audio/fivePillars.ts` (createVelvetFloorStage)
  - Runs BEFORE VelvetCurve in master chain
  - Sub-harmonic foundation
  
- **Harmonic Lattice**: Runs BEFORE VelvetCurve
  - Upper harmonic processing
  
- **Phase Weave**: Runs BEFORE VelvetCurve
  - Stereo field manipulation

### Velvet Loudness Meter

- **Location**: `src/audio/VelvetLoudnessMeter.ts`
- **Purpose**: LUFS metering for Velvet Curve compliance
- **Integration**: App.tsx line 4815-4820

### Velvet True Peak Limiter

- **Location**: `src/audio/VelvetTruePeakLimiter.ts`
- **Purpose**: True peak limiting after Velvet Curve
- **Integration**: masterChain.ts line 101

---

## 📊 CURRENT STATUS

✅ **Integrated**: VelvetCurveEngine is in master chain
✅ **Active**: Engine is initialized and setActive(true)
✅ **Routed**: Connected between Phase Weave and Mid/Side Stage
✅ **Clock Sync**: Receives beat-locked timing
✅ **UI Connected**: VelvetCurveVisualizer controls parameters
✅ **State Managed**: React state syncs with engine state

---

## 🎯 KEY CONNECTIONS

1. **Audio Path**: All tracks → Master Input → Velvet Floor → Harmonic Lattice → Phase Weave → **VELVET CURVE** → Mid/Side → Multi-Band → Glue → Limiter → Output

2. **State Path**: UI Slider → handleVelvetCurveChange() → engine.setParameter() → updateProcessingParameters() → AudioNode updates

3. **Clock Path**: getBeatPhase() → engine.setClock() → Beat-locked LFO modulation

4. **Initialization Path**: buildMasterChain() → initializeVelvetCurveEngine() → engine.initialize() → createProcessingChain() → connect()

---

## 🔍 DEBUGGING CHECKLIST

- [ ] Is VelvetCurveEngine initialized? (Check console for "VELVET CURVE ENGINE INITIALIZED")
- [ ] Is engine active? (velvetCurve.setActive(true) called)
- [ ] Is engine in master chain? (Check masterChain.ts:184)
- [ ] Are parameters updating? (Check VelvetCurveVisualizer sliders)
- [ ] Is clock syncing? (Check App.tsx:5027-5031)
- [ ] Is audio passing through? (Check master chain routing)

---

## Last Updated

After VelvetCurveEngine integration into master chain
