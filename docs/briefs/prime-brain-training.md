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

---

## Studio Snapshot Export (Detailed)

**Implementation:**
- `src/ai/PrimeBrainSnapshot.ts` defines `PrimeBrainRawSnapshot` schema and `buildPrimeBrainRawSnapshot()` builder.
- `src/ai/usePrimeBrainExporter.ts` handles queue management, retry logic, and export scheduling.
- `src/App.tsx` wires Flow Context, Session Probe, ALS feedback, Bloom trace, and audio metrics into snapshot inputs.

**Export Configuration:**
- Default interval: 4 seconds (configurable via `VITE_PRIME_BRAIN_EXPORT_SAMPLE_RATE`).
- Export target resolves via `window.__MIXX_PRIME_BRAIN_EXPORT_URL`, `VITE_PRIME_BRAIN_EXPORT_URL`, or `PRIME_BRAIN_EXPORT_URL`.
- Debug logging controlled by `VITE_PRIME_BRAIN_EXPORT_DEBUG=1`.

**Snapshot Schema (`PrimeBrainRawSnapshot`):**
See `src/ai/PrimeBrainSnapshot.ts` for full TypeScript interface. Key fields:
- `snapshotId`: UUID v4 string
- `sessionId`: Persistent session identifier
- `mode`: `'passive' | 'active' | 'learning' | 'optimizing'`
- `transport`: Playback state, tempo, playhead, cycle
- `alsChannels`: Array with `channel`, `value`, `normalized` (0-1)
- `audioMetrics`: Latency, CPU load, dropouts, buffer size
- `harmonicState`: Key, scale, consonance, tension, velocity energy
- `aiAnalysisFlags`: Array with `category`, `severity`, `message` (ALS-safe)
- `userMemorySummary`: Optional, max 10 recent actions
- `bloomTrace`: Array, max 24 events
- `issuedCommands`: Optional, max 20 commands
- `conversationTurns`: Array, max 10 turns
- `guidance`: Optional guidance object

**Privacy & Redaction:**
- All clip/track names are redacted via Session Probe privacy guard.
- User-identifying text is sanitized to neutral descriptors.
- Raw filenames and paths are excluded from payloads.
- Export respects `VITE_SESSION_PROBE_ALLOW_EXPORT=1` consent flag.

**Queue Management:**
- Max queue size: 20 snapshots.
- Retry attempts: 5 per snapshot before dropping.
- Automatic flush on page visibility change and beforeunload (via `sendBeacon`).

---

## Training Loop Entry Points

### Studio → Fabric Pipeline

**1. Snapshot Collection (Studio Runtime)**
Studio exports snapshots via HTTP POST to configured endpoint:
- Method: `POST`
- Headers: `Content-Type: application/json`, `X-Prime-Fabric-Channel: prime-brain`
- Body: `PrimeBrainRawSnapshot` JSON

**2. Fabric Ingestion (`sanitize` command)**
```bash
pnpm --dir prime-fabric/prime-brain cli sanitize \
  --input-dir ./snapshots/raw \
  --output-dir ./snapshots/sanitized \
  --schema ./src/schema.ts
```
Validates structure, normalizes values, verifies no PII, filters invalid snapshots.

**3. Dataset Building (`dataset` command)**
```bash
pnpm --dir prime-fabric/prime-brain cli dataset \
  --input-dir ./snapshots/sanitized \
  --output-file ./datasets/prime-brain-v1.jsonl \
  --window-size 10 \
  --augment-mode
```
Creates JSONL format with sliding windows of 10 consecutive snapshots per training example.

**4. Model Training (`train` command)**
```bash
pnpm --dir prime-fabric/prime-brain cli train \
  --dataset ./datasets/prime-brain-v1.jsonl \
  --output-dir ./models/prime-brain-v1 \
  --base-model gemini-2.5-flash \
  --epochs 3 \
  --learning-rate 1e-5
```
Instruction tuning with mode-aware loss weighting and doctrine enforcement.

**5. Evaluation (`evaluate` command)**
```bash
pnpm --dir prime-fabric/prime-brain cli evaluate \
  --model-dir ./models/prime-brain-v1 \
  --test-dataset ./datasets/prime-brain-v1-test.jsonl \
  --output-report ./reports/eval-v1.md
```
Measures command accuracy, mode compliance, tone audit, Flow impact simulation.

**6. Deployment (`run` command)**
```bash
pnpm --dir prime-fabric/prime-brain cli run \
  --snapshots-dir ./snapshots/raw \
  --output-model ./models/prime-brain-v1 \
  --dry-run false
```
Full pipeline: sanitize → dataset → train → evaluate.

**Schema Alignment:**
Studio snapshots match Fabric schema exactly. Array limits (10/20/24) enforced in `buildPrimeBrainRawSnapshot()`. Optional fields handled gracefully.

