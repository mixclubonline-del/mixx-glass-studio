# Flow Contract – F.L.O.W. Ecosystem  

> “No lone soldiers.” Every surface breathes with the others.  

## Core Principles
- **ALS is the bloodstream**: All sonic energy, status, and urgency flow through ALS fields (level, temperature, pulse, halo).  
- **Bloom is the nervous system**: Actions originate or return to Bloom; petals and dock UI are the only “command panels.”  
- **Prime Brain is the soul**: Context, counsel, and subtle automation originate here—never raw UI prompts elsewhere.  
- **Ingest Queue is the heartbeat**: Import, stem, and history data route through the queue so every subsystem can react.  
- **Arrange & Mixer are the limbs**: They consume ALS/Bloom/Prime Brain cues and emit back signals via ALS + ingest metadata.  
- **Prime Fabric remains sealed**: Training/export jobs stay one-way; Studio runtime only consumes structured artifacts.

## Surface → Channel Map

| Surface | Emits | Consumes | Notes |
| --- | --- | --- | --- |
| Arrange Window | `ALS` (playhead energy, clip focus), `Bloom` (selection actions), `Ingest` (re-ingest triggers) | `ALS` (master level), `Bloom` (transport/menu), `Prime Brain` (analysis prompts) | Arrange never exposes controls outside Bloom; hover/selection pulses ride ALS colors. |
| Flow Mixer | `ALS` (track intensity, automation flags), `Bloom` (plugin actions, send tweaks) | `ALS` (feedback), `Bloom` (mode toggles), `Prime Brain` (recommendations) | No standalone modules; inserts/sends must call Bloom actions for major operations. |
| Bloom Dock & Floating Hub | `Bloom` (action events), `ALS` (petal pulses), `Prime Brain` (status handshake) | `ALS` (playback/import pulses), `Ingest` (job progress), `Prime Brain` (context prompts) | Dock & hub are the only explicit command surfaces. |
| Prime Brain | `Bloom` (subtle prompts), `ALS` (status pulses), `Ingest` (queue intents) | `ALS` (metric streams), `Bloom` (user commands), `Arrange/Mixer` state snapshots | No direct UI; communicates via ALS glow, Bloom hints, and verbal cues. |
| Ingest Queue | `Bloom` (status petals), `ALS` (import glows), `Prime Brain` (training snippets) | `Bloom` (user cancel/confirm), `Prime Brain` (analysis), `Arrange/Mixer` (clip metadata) | All import operations must enqueue here; no direct file actions elsewhere. |
| Header (ALS Intel Hub) | `ALS` readout only | `ALS` (master anchors), `Prime Brain` (status) | Pure telemetry—no buttons—ensures ALS stays the canonical feedback layer. |

## Signal Standards
- **ALS Payload**: `{ level, intensity, pulse, temperature, color, glow, halo }`
- **Bloom Action Envelope**: `{ id, type, source, payload, timestamp }`
- **Ingest Job Snapshot**: `{ id, status, progress, metadata, historyEntry? }`
- **Prime Brain Prompt Context**: merges ALS snapshot + Bloom action history + user preferences before any response.

## Implementation Checklist
1. **Instrument current surfaces**  
   - Ensure Arrange + Mixer emit ALS snapshots (per track/master) and publish to Bloom for major actions.  
   - Verify Bloom petals always call handlers that pass through Prime Brain or the ingest queue.
2. **Normalise listeners**  
   - Subscribe Arrange/Mixer to ingest queue updates via ALS/Bloom (no direct queue polling).  
   - Route Prime Brain suggestions through Bloom: e.g. “Prime Brain wants to solo vocals” → Bloom prompt → Mixer response → ALS pulse.
3. **Remove free-floating UI**  
   - No modal or panel should exist without a Bloom entry point or ALS telemetry response.  
   - Any new component must declare its channels (emit/consume) before implementation.
4. **Document every new feature**  
   - Update this contract with source/target signals.  
   - Reject pull requests lacking channel mapping.

## Next Steps
- Produce a runtime dependency diagram (state stores, hooks) showing signal flow.  
- Add automated tests to ensure critical events (e.g. clip split, send change, ingest complete) emit both ALS and Bloom signals.  
- Brief incoming specialists (plugin, arrange, Prime Brain training) with this contract—every task must reference the table above.  
- Set up a linter rule or review checklist: “What ALS signal did you send? Which Bloom action processed it?”

Flow remains collaborative; every element listens, speaks, and remembers. No overrides, no orphaned UI—just the orchestra.


