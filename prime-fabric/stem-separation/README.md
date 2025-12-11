## Stem Separation Fabric Workspace

This package houses all Prime Fabric–side logic for training and evaluating the Revolutionary Stem Separation model. It never ships with Mixx Club Studio builds and intentionally omits any runtime dependencies used inside the customer product.

### Goals
- Ingest sanitized stem separation snapshots exported via Fabric jobs
- Engineer features from quantum feature extraction and musical context
- Produce training datasets for fine-tuning the quantum transformer model
- Run evaluation suites to assess separation quality
- Emit transportable artifacts (`weights/`, `reports/`, `manifests/`) that downstream Studio builds can consume

### Structure
- `src/schema.ts`: Type-safe schemas describing raw stem separation exports and sanitized records
- `src/sanitizeSnapshot.ts`: Guardrail enforcement and redaction
- `src/featureEngineer.ts`: Feature extraction from quantum features and musical context
- `src/datasetBuilder.ts`: Assembly of train/validation splits with manifests
- `src/trainStemModel.ts`: Node wrapper that invokes Fabric Python training script
- `src/evaluation.ts`: Regression + qualitative checks for separation quality metrics
- `src/cli.ts`: Runnable orchestrator for end-to-end flows
- `training/train_stem_separation.py`: TensorFlow.js/Python fine-tuning entrypoint (Fabric-only)
- `artifacts/`: Generated datasets, reports, weight deltas (gitignored)

### Running Jobs
All commands run from this directory with Fabric credentials loaded. Example:

```
pnpm ts-node cli.ts run \
  --snapshotDir /fabric/exports/stem-separation \
  --outputDir ./artifacts/run-2025-11-12
```

### Dataset Hygiene
- Never ingest raw audio or personal identifiers
- Only use quantum features, musical context, and separation results
- Version every dataset and weight bundle with hashes in `artifacts/manifests`

### Next Steps
- Implement schema, sanitization, feature engineering, dataset assembly, training, evaluation, and CLI modules
- Coordinate with Studio ingestion team for snapshot export format validation
- Document every addition with purpose and doctrine alignment








