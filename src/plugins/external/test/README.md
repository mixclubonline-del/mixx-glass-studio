# External Plugin Test Harness

## Overview

The test harness allows you to test external plugin components with the current Studio audio engine system. This provides a non-destructive way to evaluate the external plugin system.

## How to Test

1. **Start the dev server** (if not already running)
   ```bash
   npm run dev
   ```

2. **Open the Studio** in your browser (http://localhost:3001)

3. **Look for the test button** - In development mode, you'll see a purple "🧪 Test External Plugins" button in the bottom-right corner

4. **Click the button** - This opens the test harness

5. **Select a plugin** from the dropdown in the header:
   - Plugins are organized by tier (Core, Neural, Master, Signature, System)
   - Plugins with audio engines show 🎛️ icon
   - Visual-only plugins show 🎨 icon

6. **Test the plugin**:
   - Adjust all knobs and controls
   - Change session mood (Neutral, Warm, Bright, Dark, Energetic)
   - Adjust animation intensity (+/- buttons)
   - Watch the visualizer respond to audio signal
   - Switch between plugins to compare

7. **Check the debug info** at the bottom:
   - Engine Status (✅ Connected for plugins with engines)
   - Plugin State (current parameter values)
   - Audio Signal (level, peak, transients)
   - Tier & Info (tier name, parameter count, suggested by)

## What's Being Tested

- ✅ External plugin component rendering
- ✅ Audio engine adapter (bridging external state to current engines)
- ✅ State synchronization (plugin state → audio engine parameters)
- ✅ Visualizer updates (VST Bridge architecture)
- ✅ Global settings integration
- ✅ Session context (mood) integration

## Available Plugins

The test harness supports **all 25 plugins** from the external system, organized by tier:

### Core Tier (5 plugins)
- **MixxTune** 🎛️ - AI vocal tuner (has audio engine)
- **MixxVerb** 🎛️ - Adaptive reverb (has audio engine)
- **MixxDelay** 🎛️ - Intelligent delay (has audio engine)
- **MixxDrive** 🎛️ - Harmonic saturator (has audio engine)
- **MixxGlue** 🎛️ - Bus compressor (has audio engine)

### Neural Tier (5 plugins)
- **MixxAura** 🎛️ - Width enhancer (has audio engine)
- **PrimeEQ** 🎛️ - Adaptive AI EQ (has audio engine)
- **MixxPolish** 🎛️ - Spectral enhancer (has audio engine)
- **MixxMorph** 🎨 - Transitional FX (visual only)
- **PrimeBrainStem** 🎨 - Neural router (visual only)

### Master Tier (5 plugins)
- **MixxLimiter** 🎛️ - Loudness controller (has audio engine)
- **MixxBalance** 🎨 - Stereo alignment (visual only)
- **MixxCeiling** 🎨 - Energy regulator (visual only)
- **PrimeMasterEQ** 🎨 - Mastering EQ (visual only)
- **MixxDither** 🎨 - Bit reduction (visual only)

### Signature Tier (5 plugins)
- **MixxSoul** 🎨 - Emotion mapper (visual only)
- **MixxMotion** 🎨 - LFO engine (visual only)
- **PrimeLens** 🎨 - Audio→Visual (visual only)
- **MixxBrainwave** 🎨 - Generative composer (visual only)
- **MixxSpirit** 🎨 - Crowd response (visual only)

### System Tier (5 plugins)
- **MixxAnalyzerPro** 🎨 - Spectrum monitor (visual only)
- **PrimeRouter** 🎨 - Signal matrix (visual only)
- **MixxPort** 🎨 - Export engine (visual only)
- **TelemetryCollector** 🎨 - System logger (visual only)
- **PrimeBotConsole** 🎨 - AI assistant (visual only)

**Legend:**
- 🎛️ = Has audio engine (real-time processing)
- 🎨 = Visual only (no audio engine yet)

## Architecture

```
External Plugin Component (MixxAura)
    ↓
Plugin State (MixxAuraSettings)
    ↓
Audio Engine Adapter (syncStateToEngine)
    ↓
Current Audio Engine (MixxAuraEngine)
    ↓
Audio Processing
```

## Troubleshooting

**Engine Status shows "⏳ Initializing..."**
- Wait a moment for audio context to initialize
- Check browser console for errors

**Visualizer not updating**
- Check that audio signal is being generated (should show level/peak values)
- Verify animation intensity is not 0

**Parameters not affecting audio**
- Check that engine is connected (should show "✅ Connected")
- Verify parameter mappings in `audioEngineAdapter.ts`

## Plugin Testing Tips

- **Start with plugins that have audio engines** (🎛️) to test full functionality
- **Compare visual-only plugins** (🎨) to see UI/UX differences
- **Test different tiers** to see how each tier's design language differs
- **Try different moods** to see how plugins respond to session context
- **Adjust animation intensity** to see performance impact

## Next Steps

After testing, you can:
1. ✅ Test any plugin using the dropdown selector (no code changes needed!)
2. Compare with current plugin system in `src/plugins/suite/`
3. Evaluate which system works better for your needs
4. Plan migration strategy if external system is preferred
5. Add more audio engine mappings in `audioEngineAdapter.ts` for plugins that need them

