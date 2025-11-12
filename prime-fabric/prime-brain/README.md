## Prime Brain Fabric Workspace

This package houses all Prime Fabric–side logic for training and evaluating Prime Brain. It never ships with Mixx Club Studio builds and intentionally omits any runtime dependencies used inside the customer product.

### Goals
- Ingest sanitized Studio snapshots exported via Fabric jobs.
- Engineer features that preserve Flow, Reductionist Engineering, and Mixx Recall doctrines.
- Produce instruction-tuning datasets, fine-tune base LLM checkpoints, and run regression/evaluation suites.
- Emit transportable artifacts (`weights/`, `reports/`, `manifests/`) that downstream Studio builds can consume.

### Structure
- `src/schema.ts`: Type-safe schemas describing raw exports and sanitized records.
- `src/sanitizeSnapshot.ts`: Guardrail enforcement and redaction.
- `src/featureEngineer.ts`: Feature extraction and pairing logic for Prime Brain prompts/responses.
- `src/datasetBuilder.ts`: Assembly of train/validation splits with manifests.
- `src/trainPrimeBrain.ts`: Node wrapper that invokes Fabric Python fine-tune script.
- `src/evaluation.ts`: Regression + qualitative checks for tone, command compliance, ALS/Bloom constraints.
- `src/cli.ts`: Runnable orchestrator for end-to-end flows.
- `training/train_prime_brain.py`: Hugging Face `transformers` fine-tuning entrypoint (Fabric-only).
- `artifacts/`: Generated datasets, reports, weight deltas (gitignored).

### Running Jobs
All commands run from this directory with Fabric credentials loaded. Example:

```
pnpm ts-node cli.ts run \
  --snapshotDir /fabric/exports/prime-brain \
  --outputDir ./artifacts/run-2025-11-12
```

### Dataset Hygiene
- Never ingest raw audio, real track names, or personal identifiers.
- Limit history windows to 10 interactions.
- Preserve mode boundaries and ALS channel semantics.
- Version every dataset and weight bundle with hashes in `artifacts/manifests`.

### Next Steps
- Implement schema, sanitization, feature engineering, dataset assembly, training, evaluation, and CLI modules.
- Coordinate with Studio ingestion team for snapshot export format validation.
- Document every addition with purpose and doctrine alignment.

