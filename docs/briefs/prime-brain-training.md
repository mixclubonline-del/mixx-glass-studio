# Prime Brain Training Brief  

## Mission
- Evolve Prime Brain from “smart assistant” to the Studio’s quiet soul: subtle guidance, Flow-safe interventions, and Mixx Recall memory.
- Preserve the doctrines from existing code (`PrimeBrainLLM`, `PrimeBrainProvider`): respect modes, stay adaptive, never steal control from the creator.

## Identity & Tone
- Prime Brain is *the soul, not just the brain*. It whispers via ALS pulses, Bloom petals, and inline recommendations—never loud UI.
- Modes (`passive | active | learning | optimizing`) govern cadence. Training outputs must honor these states and escalate only when metrics justify it.
- Language: calm, confident, reductionist. No raw numbers shown to users; translate into temperature/energy cues.

## Current Architecture Snapshot
- **LLM Layer** (`PrimeBrainLLM.ts`):
  - Uses Gemini via `getGeminiAI`, plus `userMemory` and Cognee semantic memories.
  - Builds prompts with full DAW context (transport, Four Anchors, LUFS, tracks, workflow history).
  - Extracts commands (`DAWCommand`) and suggestions, learning from every interaction.
- **Central Intelligence** (`PrimeBrainProvider.tsx`):
  - Tracks audio metrics, harmonic data, ALS visualization, AI analyses, system health.
  - Maintains recommendations with priorities, monitors performance trends, records user actions.
  - Periodic loop (2s) adjusts mode, health warnings, optimization hints.

## Training Data Sources
| Stream | Location / Producer | Notes |
| --- | --- | --- |
| Audio Metrics | `updateAudioMetrics` (latency, CPU, dropouts) | Drives performance health models |
| Harmonic Data | `updateHarmonicData` (key, tonality, consonance) | Feeds tonal suggestions |
| AI Analysis Flags | `updateAIAnalysis` (mix issues, priority) | Guides mix recommendations |
| Visualization & ALS | `updateVisualizationData` | Input for Bloom/ALS pulses |
| User Preferences & History | `userMemory`, `workflowHistory`, `recordUserAction` | Captures Mixx Recall patterns |
| Ingest Queue | `ingestSnapshot` (queued jobs, progress) | Future tie-in for recall prompts |
| Bloom Actions | `handleBloomAction` traces | Ground-truth for subtle guidance |

## Fabric Training Pipeline (Draft)
1. **Ingestion**
   - Export sanitized state snapshots (metrics + context) from Studio runtime.
   - Redact personal identifiers; map tracks/clip names to archetypes.
2. **Feature Engineering**
   - Encode mode, ALS energy, health scores, past conversation snippets.
   - Generate paired “ideal response + command JSON” using current logic as seed labels.
3. **Model Training**
   - Instruction tune the LLM on curated dialogues (commands + subtle commentary).
   - Reinforcement loop using simulated sessions (Prime Brain suggests → evaluate Flow impact).
4. **Validation**
   - Regression suite: ensure new weights obey mode boundaries, respect reduction doctrine, produce correct command JSONs.
   - Human-in-the-loop check for tone, subtlety, and adherence to ALS-based feedback.
5. **Deployment**
   - Train inside Prime Fabric only; export distilled weights to Studio (one-way flow).
   - Version artifacts with changelog, dataset hashes, evaluation scores.

## Deliverables for Training Sprint
- Dataset schema + extraction scripts (Fabric notebooks or ETL jobs).
- Fine-tuned model weights + tokenizer diffs (if needed).
- Evaluation report (quant + qualitative), including command accuracy and tone audit.
- Updated documentation: “what/why/how” for every change, aligned with Reduction/Flow/Recall.

## Safeguards & Guardrails
- No raw customer audio or identifiable data enters Fabric; only derived metrics/features.
- Maintain conversation history windows ≤ 10 turns to avoid overfitting on stale context.
- All outputs must map to actionable `DAWCommand`s or gentle recommendations—no hallucinated features.
- Respect Bloom HUD/ALS channels: no extra UI surfaces added by training.

## Future Extensions (Phase 2+)
- Chat / multimodal LLM surfaces (voice-aware Bloom chat, Prime Brain dialogue).
- Collaborative memory syncing (Shade or other remote storage once vetted).
- Advanced adaptation (per-user style fine-tunes, genre-specific coaching).

## Next Moves
1. Collect finalized legacy training notes from Prime (in progress).  
2. Wire Studio snapshot exporter to emit raw records that match `prime-fabric/prime-brain/src/schema.ts`. *(complete – see Studio Snapshot Export)*  
3. Dry-run the Fabric sanitize → dataset → evaluation flow on a limited snapshot batch; log findings.  
4. Schedule pilot fine-tune via `pnpm --dir prime-fabric/prime-brain cli run ...` once regression suite passes green.  
5. Coordinate with Plugin/Arrange specialists to ensure Bloom actions remain in sync with Prime Brain outputs.

### Fabric Implementation Snapshot
- Fabric workspace lives at `prime-fabric/prime-brain/` with TypeScript sanitization + dataset builders and Python fine-tune entrypoint.
- CLI (`src/cli.ts`) exposes `sanitize`, `dataset`, `train`, `evaluate`, and `run` commands for sealed Fabric operations.
- Evaluation suite enforces no raw numerics, ALS/Bloom alignment, and mode-aware tone guardrails.

### Studio Snapshot Export
- `src/ai/PrimeBrainSnapshot.ts` and `src/ai/usePrimeBrainExporter.ts` translate live Studio states (transport, ALS energy, harmonic cues, Bloom trace, ingest flow) into Fabric-ready snapshots.
- `src/App.tsx` instruments audio metrics, logs Bloom actions, and streams sanitized records every 2 s. Export target resolves via `window.__PRIME_FABRIC_EXPORT_URL`, `VITE_PRIME_FABRIC_EXPORT_URL`, or `PRIME_FABRIC_EXPORT_URL`.
- Snapshot builder enforces doctrine guardrails (no raw numbers in UI, ALS/Bloom channel mapping, mode derivation) and limits memory windows to Mixx Recall expectations.

