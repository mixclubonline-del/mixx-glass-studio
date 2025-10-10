# Mixx Studio AI Intelligence Layers

This directory contains the core AI systems that power Mixx Studio's reactive and intelligent features.

## Architecture

### 🌊 Mixx Ambient Engine (MAE)
**File:** `ambientEngine.ts`

Mood-reactive lighting system that creates dynamic visual environments based on audio energy and user activity.

**Features:**
- 5 mood states: calm, focused, energetic, intense, creative
- 5 lighting modes: breathe, pulse, burst, ripple, static
- Real-time color palette transitions
- Subscribable state updates

**Usage:**
```typescript
import { ambientEngine } from '@/ai/ambientEngine';

// Subscribe to mood changes
const unsubscribe = ambientEngine.subscribe((state) => {
  console.log('New mood:', state.mood, 'Energy:', state.energy);
});

// Get lighting directive for UI
const directive = ambientEngine.getLightingDirective();
// { mode: 'pulse', colors: ['#FF67C7', '#A57CFF'], intensity: 0.8, speed: 1.5 }
```

### 🧠 Prime Brain Stem (PBS)
**File:** `primeBrain.ts`

Central AI router that merges telemetry from controls, audio, and scene changes. Acts as the nervous system of the studio.

**Features:**
- Control event processing (knobs, sliders, faders)
- Audio metrics analysis
- Scene change tracking
- Pattern recognition
- Energy calculation

**Usage:**
```typescript
import { primeBrain } from '@/ai/primeBrain';

// Process control input
primeBrain.processControlEvent({
  type: 'knob',
  controlId: 'reverb_mix',
  value: 0.75,
  timestamp: Date.now()
});

// Get system status
const status = primeBrain.getStatus();
```

### 🔮 Emotive Prediction Engine (EPE)
**File:** `predictionEngine.ts`

Predictive system that looks ahead 1-4 bars to pre-trigger lighting blooms and plugin pre-arms.

**Features:**
- 4-bar lookahead window
- Confidence-based predictions
- Event types: lighting_bloom, plugin_prearm, scene_transition, mood_shift
- Bar-accurate triggering

**Usage:**
```typescript
import { predictionEngine } from '@/ai/predictionEngine';

// Update playback position (call on every bar)
predictionEngine.updatePosition(currentBar, bpm);

// Get upcoming events
const upcoming = predictionEngine.getUpcomingEvents(4);
// [{ type: 'lighting_bloom', targetBar: 5, confidence: 0.8, data: {...} }]
```

### 🧬 Artist DNA System
**File:** `artistDNA.ts`

Learns and remembers user preferences, creating a personalized studio experience.

**Features:**
- Color palette memory (last 10 colors)
- Emotional bias tracking
- Control preference learning
- Scene usage patterns
- LocalStorage persistence

**Usage:**
```typescript
import { artistDNA } from '@/ai/artistDNA';

// Get user profile
const profile = artistDNA.getProfile();

// Get recommended color for mood
const color = artistDNA.getRecommendedColor('energetic');
// Returns: '#A57CFF'

// Record preferences (automatic through Prime Brain)
artistDNA.recordControlPreference('knob', 'filter_cutoff', 0.65);
```

## Integration

### React Hook
Use the `useAmbientLighting` hook to subscribe to MAE updates in components:

```typescript
import { useAmbientLighting } from '@/hooks/useAmbientLighting';

function MyComponent() {
  const { mood, energy, primaryColor, lightingDirective } = useAmbientLighting();
  
  return (
    <div style={{ backgroundColor: primaryColor }}>
      Mood: {mood} | Energy: {(energy * 100).toFixed(0)}%
    </div>
  );
}
```

### Ambient Overlay
The `MixxAmbientOverlay` component provides studio-wide reactive lighting:

```tsx
import { MixxAmbientOverlay } from '@/components/MixxAmbientOverlay';

// Add to main app container
<div className="app">
  <MixxAmbientOverlay />
  {/* Your app content */}
</div>
```

## Telemetry

All AI systems log events through the central telemetry system:

```typescript
import { telemetry } from '@/lib/telemetry';

// Console output format:
// 🧠 PBS [control]: fader volume_track1 { value: 0.75 }
// 🌊 MAE [mood]: Mood shift: calm → energetic { energy: 0.72 }
// 🔮 EPE [predict]: Predicted lighting_bloom at bar 5 { confidence: 0.80 }
// 🧬 DNA [preference]: Scene preference: mixer { count: 3 }
```

## Color Palette

The AI systems use Mixx Studio's core color palette:

- `#56C8FF` - Neon Blue (calm, focused)
- `#A57CFF` - Prime Violet (focused, energetic)  
- `#FF67C7` - Magenta (energetic, creative)
- `#FF4D8D` - Hot Pink (intense)
- `#EAF2FF` - Ice Blue (calm)

## Development Notes

- All AI systems are singleton instances
- State updates are reactive and subscribe-able
- Prime Brain automatically routes events to other systems
- Artist DNA persists to localStorage
- Prediction Engine uses bar-quantized timing
- Ambient Engine runs a continuous animation loop

## Future Enhancements

- [ ] Real audio analysis integration (FFT, onset detection)
- [ ] Multi-user Artist DNA profiles
- [ ] Cloud sync for Artist DNA
- [ ] Advanced prediction algorithms (ML-based)
- [ ] Haptic feedback integration
- [ ] VR/AR lighting projection
