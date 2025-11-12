# Plugin Stack Specialist Playbook

## Mission
- Curate and ship the Flow insert experience (picker, presets, lifecycle feedback).
- Keep the Flow console responsive while mirroring actions through ALS and Bloom surfaces.

## Primary Deliverables
1. **Insert Picker**  
   - Highlight top six Flow modules + searchable list.  
   - Provide one-click “quick add” slots.  
   - Respect existing mixer strip sizing (see `src/components/mixer/mixerConstants.ts`).
2. **Preset Save/Recall**  
   - Per-plugin local preset bank (3–5 slots).  
   - ALS/Bloom notifications (no toast popups).
3. **Lifecycle Telemetry**  
   - `add / move / bypass / remove` events pulse ALS + log into import history once available.  
   - Emit short status strings for Bloom petals (no numeric readouts).
4. **Send Matrix Hook (Prep)**  
   - Expose send-level state in each channel strip.  
   - UI can ship with disabled sliders until bus wiring lands.

## Guardrails
- Zero changes to strip width, fullscreen layout, or Bloom positions.  
- No raw numbers—communicate status via color, glow, or motion.  
- Studio-only: do not touch Prime Fabric or orchestrator code.  
- Document every addition (what / why / how; tag Reduction, Flow, or Recall).  
- Keep transitions adaptive—no abrupt UI swaps.

## Key Files & State
- `src/components/mixer/FlowChannelStrip.tsx` – insert list, inline controls.  
- `src/components/PluginBrowser.tsx` – candidate picker shell.  
- `src/App.tsx` – `handleAddPlugin`, `handleRemovePlugin`, `handleMovePlugin`, `setFxBypassState`, ALS wiring.  
- `src/utils/ALS.ts` – palette helpers for pulses.  
- Future: ingest history store (cycling through `ingestSnapshot` once persisted).

## Hand-off Signals
- Each user-facing change emits ALS/Bloom feedback (use `upsertImportProgress`, queue snapshots, or new helpers).  
- Provide a regression checklist covering: add, remove, move, bypass, preset load/save while playback is active.  
- Include short changelog snippets referencing Reduction / Flow / Recall.  
- Coordinate with Arrange Specialist on shared Bloom actions (e.g., “Recall last import”).

Stay aligned with Reductionist Engineering, keep Flow frictionless, and make sure Mixx Recall can remember every tweak.


