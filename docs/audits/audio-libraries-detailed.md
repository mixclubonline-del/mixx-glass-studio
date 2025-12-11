# Audio Libraries - Detailed Technical Audit

## Rust Audio Libraries

### Current Dependencies (Cargo.toml)

#### Audio I/O
- **cpal (0.15)** - Cross-platform audio I/O
  - Purpose: Device enumeration, stream creation
  - Used for: Audio input/output device management
  - Replacement: Custom `MixxAudioIO` layer

- **portaudio-rs (0.3)** - PortAudio bindings
  - Purpose: Alternative audio I/O backend
  - Used for: Cross-platform audio streaming
  - Replacement: Integrated into `MixxAudioIO`

#### Sample Processing
- **dasp_sample (0.11)** - Sample format conversion
  - Purpose: Convert between sample formats (f32, i16, etc.)
  - Used for: Format conversions in audio pipeline
  - Replacement: Custom format conversion utilities

#### File I/O
- **hound (3.5)** - WAV file reading/writing
  - Purpose: WAV file format support
  - Used for: Loading/saving audio files
  - Replacement: Custom `MixxAudioFormat` with extended metadata support

#### Resampling
- **rubato (0.14)** - Audio resampling
  - Purpose: Sample rate conversion
  - Used for: Converting between different sample rates
  - Replacement: Proprietary `MixxResampler` with musical quality preservation

#### Math/DSP
- **nalgebra (0.32)** - Linear algebra library
  - Purpose: Matrix operations, vector math
  - Used for: DSP calculations, filter design
  - Replacement: Custom `MixxDSPMath` optimized for audio

- **num-complex (0.4)** - Complex number math
  - Purpose: Complex number operations
  - Used for: FFT, frequency domain processing
  - Replacement: Integrated into `MixxDSPMath`

- **num-traits (0.2)** - Numeric traits
  - Purpose: Generic numeric operations
  - Used for: Type-safe numeric operations
  - Replacement: Custom traits in `MixxDSPMath`

#### SIMD
- **wide (0.7)** - SIMD operations
  - Purpose: Vectorized operations
  - Used for: Performance-critical DSP
  - Replacement: Custom SIMD utilities in `MixxAudioCore`

### Usage Patterns

All Rust audio libraries are used in the core audio engine (`mixx-glass-studio-core`), which provides:
- Low-level audio I/O
- Sample rate conversion
- File format handling
- DSP operations
- Performance optimizations

### Proprietary Replacement Strategy

#### Phase 1: Resampling Engine (3-4 months)
- Build `MixxResampler` with:
  - Musical quality preservation
  - Zero-latency design
  - Optimized for real-time processing
  - Support for common sample rates (44.1k, 48k, 96k, 192k)

#### Phase 2: Audio I/O Layer (4-6 months)
- Build `MixxAudioIO` with:
  - Cross-platform device management
  - Low-latency streaming
  - Buffer management optimized for DAW workflows
  - Support for multiple I/O formats

#### Phase 3: DSP Math Library (2-3 months)
- Build `MixxDSPMath` with:
  - Audio-optimized matrix operations
  - Complex number utilities for FFT
  - SIMD-optimized primitives
  - Five Pillars specific operations

#### Phase 4: Format Handling (2-3 months)
- Build `MixxAudioFormat` with:
  - WAV file support (replace hound)
  - Extended metadata support
  - Support for additional formats (FLAC, AIFF)
  - Project file integration

---

## Web Audio API Usage

### Current API Usage

#### Core APIs
- **AudioContext / OfflineAudioContext** - Audio processing contexts
- **AudioWorklet / AudioWorkletNode** - Real-time audio processing
- **AudioBuffer / AudioBufferSourceNode** - Audio data and playback
- **GainNode** - Gain/volume control
- **BiquadFilterNode** - Filtering operations
- **AnalyserNode** - Audio analysis
- **DynamicsCompressorNode** - Compression
- **DelayNode** - Delay effects
- **ConvolverNode** - Reverb/convolution
- **StereoPannerNode** - Panning
- **WaveShaperNode** - Distortion/saturation
- **ChannelSplitterNode / ChannelMergerNode** - Multi-channel routing
- **ScriptProcessorNode** - Legacy processing (deprecated)

### Usage Locations

#### Core Audio Processing (`src/audio/`)
- **VelvetCurveEngine.ts** - Five Pillars processing
  - Uses: GainNode, BiquadFilterNode, DynamicsCompressorNode
  - Pattern: Complex processing chain with multiple filters

- **HarmonicLattice.ts** - Harmonic enhancement
  - Uses: BiquadFilterNode, GainNode, WaveShaperNode
  - Pattern: Multi-stage harmonic processing

- **masterChain.ts** - Master bus processing
  - Uses: All node types extensively
  - Pattern: Complex multi-band processing with routing

- **MixxDelayEngine.ts** - Delay effects
  - Uses: DelayNode, BiquadFilterNode, GainNode
  - Pattern: Feedback delay with tone control

- **VelvetProcessor.ts** - Complete processing chain
  - Uses: OfflineAudioContext, all node types
  - Pattern: Offline rendering with full Five Pillars chain

#### Stem Separation (`src/core/import/`)
- **stemEngine.ts** - Stem separation pipeline
  - Uses: OfflineAudioContext, BiquadFilterNode, GainNode
  - Pattern: Multi-pass offline processing

- **hpss.ts** - Harmonic/percussive separation
  - Uses: OfflineAudioContext, BiquadFilterNode, GainNode
  - Pattern: Parallel processing paths

- **vocalModel.ts** - Vocal extraction
  - Uses: OfflineAudioContext, BiquadFilterNode, GainNode
  - Pattern: Spectral processing for vocal isolation

- **extractSubBass.ts** - Sub-bass extraction
  - Uses: OfflineAudioContext, BiquadFilterNode, GainNode
  - Pattern: Frequency-specific extraction

#### AI Audio Processing (`src/components/AIHub/`)
- **AudioProcessor.tsx** - Live audio transcription
  - Uses: AudioContext, ScriptProcessorNode, GainNode
  - Pattern: Real-time audio capture and processing

### Node Usage Statistics

Based on codebase analysis:
- **GainNode**: ~50+ instances (most common)
- **BiquadFilterNode**: ~40+ instances
- **AudioBufferSourceNode**: ~30+ instances
- **AnalyserNode**: ~15+ instances
- **DynamicsCompressorNode**: ~10+ instances
- **DelayNode**: ~5+ instances
- **ConvolverNode**: ~3+ instances
- **Other nodes**: ~10+ instances

### Limitations Identified

1. **Latency**: Web Audio API has inherent latency (typically 5-10ms)
2. **Buffer Management**: Limited control over buffer sizes
3. **Processing Precision**: Fixed 32-bit float processing
4. **Node Limitations**: Some operations require workarounds
5. **Browser Compatibility**: Varying support across browsers

### Proprietary Replacement Strategy

#### Phase 1: Abstraction Layer (2-3 months)
- Build `PrimeFabricAudioContext` that:
  - Wraps Web Audio API
  - Provides unified interface
  - Adds proprietary extensions
  - Maintains compatibility

#### Phase 2: Custom Audio Graph (3-4 months)
- Build `PrimeFabricAudioGraph` that:
  - Custom node system
  - Advanced routing capabilities
  - Lower latency processing
  - Better buffer management

#### Phase 3: WASM Integration (2-3 months)
- Integrate Rust core via WASM:
  - Bridge to `MixxAudioCore`
  - Native processing nodes
  - Performance optimizations

#### Phase 4: Five Pillars Native (4-6 months)
- Implement Five Pillars natively:
  - Velvet Curve as native node
  - Harmonic Lattice as native node
  - Phase Weave as native node
  - Velvet Floor as native node
  - Optimized processing chain

### Implementation Notes

- Start with abstraction layer to maintain compatibility
- Gradually migrate to proprietary implementations
- Test extensively across browsers
- Maintain fallback to Web Audio API
- Optimize for DAW-specific workflows

---

## Audio Processing Patterns

### Common Patterns

#### Pattern 1: Processing Chain
```typescript
// Common pattern: Input -> Process -> Output
const input = ctx.createGain();
const processor = ctx.createBiquadFilter();
const output = ctx.createGain();
input.connect(processor);
processor.connect(output);
```

#### Pattern 2: Parallel Processing
```typescript
// Common pattern: Split -> Process -> Merge
const splitter = ctx.createChannelSplitter();
const processor1 = ctx.createBiquadFilter();
const processor2 = ctx.createBiquadFilter();
const merger = ctx.createChannelMerger();
splitter.connect(processor1, 0);
splitter.connect(processor2, 1);
processor1.connect(merger, 0, 0);
processor2.connect(merger, 0, 1);
```

#### Pattern 3: Feedback Loop
```typescript
// Common pattern: Delay with feedback
const delay = ctx.createDelay();
const feedback = ctx.createGain();
const wet = ctx.createGain();
input.connect(delay);
delay.connect(feedback);
feedback.connect(delay); // Feedback loop
delay.connect(wet);
```

### Proprietary Optimizations

1. **Buffer Pooling**: Reuse buffers to reduce allocations
2. **SIMD Operations**: Vectorize common operations
3. **Zero-Copy Processing**: Minimize data copying
4. **Predictive Allocation**: Pre-allocate based on usage patterns
5. **Custom Scheduling**: Optimize node scheduling for DAW workflows

---

## Migration Strategy

### Phase 1: Foundation (Months 1-3)
- Create abstraction layers
- Build resampling engine
- Implement basic audio I/O

### Phase 2: Core Processing (Months 4-6)
- Complete audio I/O layer
- Build DSP math library
- Implement format handling

### Phase 3: Integration (Months 7-9)
- WASM integration
- Custom audio graph
- Five Pillars native nodes

### Phase 4: Optimization (Months 10-12)
- Performance tuning
- Browser compatibility
- Production hardening

---

## Risk Mitigation

1. **Maintain Compatibility**: Keep Web Audio API as fallback
2. **Incremental Migration**: Replace one component at a time
3. **Extensive Testing**: Test all audio paths thoroughly
4. **Performance Monitoring**: Track latency and CPU usage
5. **User Feedback**: Gather feedback during migration

---

*Context improved by Giga AI - Used comprehensive codebase analysis to document all Web Audio API usage patterns and Rust audio library dependencies.*



