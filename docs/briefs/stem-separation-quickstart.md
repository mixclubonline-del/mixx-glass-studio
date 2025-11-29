# Revolutionary Stem Separation - Quick Start Guide

## 🚀 Getting Started with Training

This guide walks you through setting up and running your first training session for the Revolutionary Stem Separation model.

---

## Prerequisites

1. **Prime Fabric Environment**: Access to Prime Fabric with Python/TensorFlow setup
2. **Studio Access**: Mixx Club Studio with stem separation enabled
3. **Storage**: Directory for snapshots and artifacts

---

## Step 1: Enable Data Collection (Studio)

### Option A: Environment Variable

```bash
export VITE_STEM_SEPARATION_EXPORT_URL="https://your-fabric-endpoint/stem-separation"
```

### Option B: Browser Console

```javascript
window.__MIXX_STEM_SEPARATION_EXPORT_URL = "https://your-fabric-endpoint/stem-separation"
```

### Option C: Local Storage

```javascript
localStorage.setItem('mixxclub:stem-separation-export-url', 'https://your-fabric-endpoint/stem-separation')
```

### Enable Debug Logging

```bash
export VITE_STEM_SEPARATION_EXPORT_DEBUG=1
```

---

## Step 2: Collect Training Data

### Import Audio Files

1. Open Mixx Club Studio
2. Import audio files (MP3, WAV, etc.)
3. The revolutionary stem separation system will automatically:
   - Extract quantum features
   - Analyze musical context
   - Separate stems
   - Export snapshot for training

### Verify Data Collection

Check browser console for:
```
[STEM SEPARATION] Snapshot queued {id} (queue size: 1/50)
[STEM SEPARATION] Snapshot exported: {id}
```

---

## Step 3: Set Up Prime Fabric Workspace

### Install Dependencies

```bash
cd prime-fabric/stem-separation
pnpm install
```

### Verify Structure

```
prime-fabric/stem-separation/
├── src/
│   ├── schema.ts
│   ├── sanitizeSnapshot.ts
│   ├── featureEngineer.ts
│   ├── datasetBuilder.ts
│   ├── evaluation.ts
│   └── cli.ts
├── training/
│   └── train_stem_separation.py
└── artifacts/ (will be created)
```

---

## Step 4: Run Training Pipeline

### Full Pipeline (Recommended)

```bash
cd prime-fabric/stem-separation

pnpm ts-node src/cli.ts run \
  --snapshotDir ./snapshots/raw \
  --outputDir ./artifacts \
  --runLabel stem-separation-v1 \
  --trainRatio 0.8
```

This will:
1. ✅ Sanitize snapshots
2. ✅ Engineer features
3. ✅ Build dataset (80% train, 20% validation)
4. ✅ Train model
5. ✅ Evaluate quality

### Step-by-Step (For Debugging)

#### 1. Sanitize Snapshots

```bash
pnpm ts-node src/cli.ts sanitize \
  --input ./snapshots/raw \
  --output ./snapshots/sanitized.jsonl
```

#### 2. Build Dataset

```bash
pnpm ts-node src/cli.ts dataset \
  --input ./snapshots/sanitized.jsonl \
  --outputDir ./artifacts \
  --runLabel stem-separation-v1 \
  --trainRatio 0.8
```

#### 3. Train Model

```bash
pnpm ts-node src/cli.ts train \
  --datasetDir ./artifacts/stem-separation-v1 \
  --outputDir ./artifacts/stem-separation-v1/model
```

#### 4. Evaluate

```bash
pnpm ts-node src/cli.ts evaluate \
  --datasetDir ./artifacts/stem-separation-v1 \
  --outputDir ./artifacts/stem-separation-v1/evaluation
```

---

## Step 5: Review Results

### Training Summary

Check: `artifacts/{runLabel}/model/training_summary.json`

```json
{
  "config": {
    "num_heads": 8,
    "num_layers": 4,
    "d_model": 256,
    "epochs": 50,
    ...
  },
  "results": {
    "final_loss": 0.0234,
    "final_val_loss": 0.0287,
    ...
  }
}
```

### Evaluation Report

Check: `artifacts/{runLabel}/evaluation/evaluation_report.json`

```json
{
  "aggregateMetrics": {
    "sdr": 12.5,
    "sir": 16.2,
    "sar": 11.8,
    "overall": 0.82
  },
  ...
}
```

### Target Metrics

- **SDR** > 10dB ✅
- **SIR** > 15dB ✅  
- **SAR** > 10dB ✅
- **Overall Quality** > 0.75 ✅

---

## Step 6: Deploy Trained Model

### Export Weights

Trained model saved at:
```
artifacts/{runLabel}/model/final_model.h5
```

### Load into Studio

1. Convert to TensorFlow.js format
2. Place in Studio's model directory
3. Update `RevolutionaryStemEngine` to load weights
4. Enable transformer mode

---

## Troubleshooting

### No Snapshots Collected

**Check:**
- Export URL is set correctly
- Browser console for errors
- Network tab for POST requests

**Fix:**
```javascript
// Verify exporter is enabled
console.log(window.__mixx_stem_separation_exporter?.enabled)
```

### Training Fails

**Check:**
- Python environment has TensorFlow installed
- Dataset directory exists and has data
- Sufficient disk space

**Fix:**
```bash
# Verify Python environment
python3 --version
pip3 list | grep tensorflow

# Check dataset
ls -la artifacts/{runLabel}/train/
```

### Poor Model Quality

**Check:**
- Dataset size (need 100+ snapshots minimum)
- Ground truth data available
- Feature quality

**Fix:**
- Collect more diverse training data
- Include user corrections
- Review feature engineering

---

## Next Steps

1. **Collect More Data**: Import diverse audio files
2. **Add User Corrections**: Manually adjust stems → export corrections
3. **Iterate**: Retrain with more data → improve quality
4. **Deploy**: Load trained weights → enable transformer mode

---

## Quick Reference

### Environment Variables

```bash
# Export URL
VITE_STEM_SEPARATION_EXPORT_URL="https://endpoint/stem-separation"

# Debug mode
VITE_STEM_SEPARATION_EXPORT_DEBUG=1
```

### CLI Commands

```bash
# Full pipeline
pnpm ts-node src/cli.ts run --snapshotDir <dir> --outputDir <dir>

# Individual steps
pnpm ts-node src/cli.ts sanitize --input <dir> --output <file>
pnpm ts-node src/cli.ts dataset --input <file> --outputDir <dir>
pnpm ts-node src/cli.ts train --datasetDir <dir> --outputDir <dir>
pnpm ts-node src/cli.ts evaluate --datasetDir <dir> --outputDir <dir>
```

### File Locations

- **Snapshots**: `./snapshots/raw/*.json`
- **Sanitized**: `./snapshots/sanitized.jsonl`
- **Dataset**: `./artifacts/{runLabel}/train/` & `validation/`
- **Model**: `./artifacts/{runLabel}/model/final_model.h5`
- **Evaluation**: `./artifacts/{runLabel}/evaluation/evaluation_report.json`

---

## Success Indicators

✅ **Data Collection**
- Snapshots queued and exported successfully
- Console shows export confirmations

✅ **Training**
- Dataset built with train/validation split
- Model training completes without errors
- Loss decreases over epochs

✅ **Quality**
- SDR > 10dB
- SIR > 15dB  
- SAR > 10dB
- Overall quality > 0.75

---

## Support

For issues or questions:
- Check console logs
- Review evaluation reports
- Examine training summaries
- Verify data quality in dataset manifests

**You're now ready to revolutionize stem separation! 🚀**

