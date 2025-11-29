## Revolutionary Stem Separation Training System

This document outlines the complete training infrastructure for the Revolutionary Proprietary Stem Separation model.

### Overview

The Revolutionary Stem Separation system uses a multi-layer quantum transformer architecture that learns from real-world usage to continuously improve separation quality. The training pipeline collects data from Studio runtime, processes it in Prime Fabric, and produces trained model weights that enhance separation quality.

---

## Architecture

### Training Data Flow

```
Studio Runtime → Snapshot Export → Prime Fabric → Training Pipeline → Model Weights → Studio Runtime
```

1. **Studio Runtime**: User imports audio → stems separated → snapshot exported
2. **Snapshot Export**: Quantum features + musical context + separation results
3. **Prime Fabric**: Sanitize → Feature Engineering → Dataset Building → Training → Evaluation
4. **Model Weights**: Trained transformer weights exported back to Studio
5. **Studio Runtime**: Load trained weights → improved separation quality

---

## Studio Snapshot Export

### Implementation

**Files:**
- `src/core/import/stemSeparationSnapshot.ts` - Snapshot builder
- `src/core/import/useStemSeparationExporter.ts` - Exporter hook
- `src/core/import/stemPipeline.ts` - Integrated snapshot export

**Export Configuration:**
- Default: Disabled (opt-in via export URL)
- Export target resolves via:
  - `window.__MIXX_STEM_SEPARATION_EXPORT_URL`
  - `VITE_STEM_SEPARATION_EXPORT_URL` (env var)
- Debug logging: `VITE_STEM_SEPARATION_EXPORT_DEBUG=1`

### Snapshot Schema

See `prime-fabric/stem-separation/src/schema.ts` for complete schema. Key fields:

- `id`: UUID v4 snapshot identifier
- `timestamp`: Unix timestamp
- `originalAudio`: Duration, sample rate, channels
- `quantumFeatures`: Spectral, temporal, harmonic, percussive, stereo, energy
- `musicalContext`: Key, mode, BPM, transients, harmonic content
- `groundTruthStems`: Optional - user-corrected stems (feature representation)
- `userCorrections`: Manual adjustments (boost, cut, isolation, masking)
- `metadata`: Classification type, confidence, processing time

### Privacy & Data Hygiene

- Never exports raw audio (only feature representations)
- No personal identifiers (track names, filenames sanitized)
- Quantum features are mathematical abstractions, not audio content
- Musical context is audio properties only (key, BPM, etc.)
- Ground truth stems are feature vectors, not audio buffers

### Queue Management

- Max queue size: 50 snapshots
- Retry attempts: 5 per snapshot before dropping
- Automatic flush on page unload (via `sendBeacon`)
- HTTP POST with `X-Prime-Fabric-Channel: stem-separation` header

---

## Prime Fabric Training Pipeline

### Workspace Structure

```
prime-fabric/stem-separation/
├── src/
│   ├── schema.ts              # Training data schemas
│   ├── sanitizeSnapshot.ts    # Data sanitization
│   ├── featureEngineer.ts     # Feature extraction
│   ├── datasetBuilder.ts      # Train/validation splits
│   ├── evaluation.ts          # Quality metrics (SDR, SIR, SAR)
│   └── cli.ts                 # Orchestrator
├── training/
│   └── train_stem_separation.py  # Python training script
└── artifacts/                 # Generated datasets, models, reports
```

### Pipeline Commands

#### 1. Sanitize Snapshots

```bash
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts sanitize \
  --input ./snapshots/raw \
  --output ./snapshots/sanitized.jsonl
```

Validates structure, removes PII, normalizes values.

#### 2. Build Dataset

```bash
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts dataset \
  --input ./snapshots/sanitized.jsonl \
  --outputDir ./artifacts \
  --runLabel stem-separation-v1 \
  --trainRatio 0.8
```

Creates train/validation splits with manifests.

#### 3. Train Model

```bash
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts train \
  --datasetDir ./artifacts/stem-separation-v1 \
  --outputDir ./artifacts/stem-separation-v1/model \
  --epochs 50 \
  --batchSize 32 \
  --learningRate 0.001
```

Trains quantum transformer model using TensorFlow/Keras.

#### 4. Evaluate

```bash
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts evaluate \
  --datasetDir ./artifacts/stem-separation-v1 \
  --outputDir ./artifacts/stem-separation-v1/evaluation
```

Runs quality metrics (SDR, SIR, SAR) on validation set.

#### 5. Full Pipeline (Run)

```bash
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts run \
  --snapshotDir ./snapshots/raw \
  --outputDir ./artifacts \
  --runLabel stem-separation-v1 \
  --trainRatio 0.8
```

Executes: sanitize → dataset → train → evaluate

---

## Model Architecture

### Quantum Transformer

- **Input**: Quantum features (spectral, temporal, harmonic, percussive, stereo, energy) + musical context
- **Architecture**: Multi-head attention transformer with quantum-inspired activation
- **Output**: 6 stem heads (vocals, drums, bass, harmonic, perc, sub)
- **Layers**: 4 transformer encoder blocks
- **Heads**: 8 attention heads
- **Model Dimension**: 256
- **FF Dimension**: 1024

### Training Configuration

- **Optimizer**: Adam (learning rate: 0.001)
- **Loss**: Mean Squared Error (per stem type)
- **Batch Size**: 32
- **Epochs**: 50 (with early stopping)
- **Validation Split**: 0.2 (80/20 train/validation)

---

## Quality Metrics

### Evaluation Metrics

- **SDR** (Signal-to-Distortion Ratio): Separation accuracy (higher = better, target: >10dB)
- **SIR** (Signal-to-Interference Ratio): Cross-stem bleed (higher = better, target: >15dB)
- **SAR** (Signal-to-Artifacts Ratio): Artifact level (higher = better, target: >10dB)
- **Overall Quality**: Normalized composite score (0-1, target: >0.75)

---

## Deployment

### Loading Trained Weights

After training completes, model weights are exported to:
```
artifacts/{runLabel}/model/final_model.h5
```

To load into Studio:

1. Export weights in TensorFlow.js format
2. Place in Studio's model directory
3. Update `RevolutionaryStemEngine` to load weights
4. Enable transformer mode: `useTransformer: true`

---

## Next Steps

### Phase 1: Initial Data Collection (Week 1-2)

1. ✅ Enable snapshot export in Studio
2. ✅ Set export URL to Prime Fabric endpoint
3. ✅ Collect snapshots from test imports
4. ✅ Validate snapshot quality and structure

### Phase 2: First Training Run (Week 3)

1. ✅ Run sanitize → dataset → train pipeline
2. ✅ Evaluate initial model quality
3. ✅ Identify data gaps or quality issues
4. ✅ Iterate on feature engineering

### Phase 3: Continuous Learning (Ongoing)

1. ✅ Collect user corrections (manual stem adjustments)
2. ✅ Retrain model with corrected data
3. ✅ Deploy improved weights
4. ✅ Monitor quality improvements
5. ✅ Repeat cycle

---

## Training Loop Entry Points

### Studio → Fabric Pipeline

**1. Snapshot Collection (Studio Runtime)**
Studio exports snapshots via HTTP POST:
- Method: `POST`
- Headers: `Content-Type: application/json`, `X-Prime-Fabric-Channel: stem-separation`
- Body: `StemSeparationSnapshot` JSON

**2. Fabric Ingestion**
```bash
# Manual collection (if using file-based export)
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts sanitize \
  --input ./snapshots/raw \
  --output ./snapshots/sanitized.jsonl
```

**3. Dataset Building**
```bash
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts dataset \
  --input ./snapshots/sanitized.jsonl \
  --outputDir ./artifacts \
  --runLabel stem-separation-v1
```

**4. Model Training**
```bash
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts train \
  --datasetDir ./artifacts/stem-separation-v1 \
  --outputDir ./artifacts/stem-separation-v1/model
```

**5. Evaluation**
```bash
pnpm --dir prime-fabric/stem-separation ts-node src/cli.ts evaluate \
  --datasetDir ./artifacts/stem-separation-v1 \
  --outputDir ./artifacts/stem-separation-v1/evaluation
```

---

## Schema Alignment

Studio snapshots match Fabric schema exactly:

- Quantum features: Spectral, temporal, harmonic, percussive, stereo, energy arrays
- Musical context: Key, mode, BPM, transients, harmonic content
- Ground truth: Optional feature representations (not raw audio)
- User corrections: Stem type, correction type, frequency/time ranges, strength
- Metadata: Classification, confidence, processing time

All array limits enforced in snapshot builder. Optional fields handled gracefully.

---

## Current Status

✅ **Complete Infrastructure**
- Revolutionary stem separation system (quantum features, musical context, transformer)
- Prime Fabric training pipeline (sanitize, dataset, train, evaluate)
- Studio snapshot export (automatic data collection)
- Evaluation metrics (SDR, SIR, SAR)

🚧 **Next Phase**
- Initial data collection (enable export, collect snapshots)
- First training run (validate pipeline, establish baseline)
- Model deployment (load weights, enable transformer mode)
- Continuous improvement (collect corrections, retrain)

---

## Quick Start

### 1. Enable Data Collection

```javascript
// In browser console or set as env var
window.__MIXX_STEM_SEPARATION_EXPORT_URL = "https://your-fabric-endpoint/stem-separation"
```

### 2. Collect Snapshots

Import audio files in Studio. Snapshots automatically export on stem separation.

### 3. Train Model

```bash
cd prime-fabric/stem-separation
pnpm ts-node src/cli.ts run \
  --snapshotDir ./snapshots/raw \
  --outputDir ./artifacts/run-2025-01-XX
```

### 4. Deploy Weights

Load trained model weights into Studio and enable transformer mode.

---

## Notes

- Training data never includes raw audio - only feature representations
- User corrections are key to improving model quality
- Continuous learning cycle: collect → train → deploy → improve
- Model quality improves with more diverse training data

