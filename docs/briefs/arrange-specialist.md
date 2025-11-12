# Arrange Canvas Specialist Playbook

## Mission
- Elevate timeline ergonomics (snap, ripple, grouping) without breaking Flow.  
- Surface Bloom + ALS feedback for every arrange action, including ingest recall loops.

## Primary Deliverables
1. **Smart Snap Grid**  
   - Tempo-aware zoom scaling.  
   - ALS energy ribbon that brightens on transient-heavy sections.
2. **Clip Interaction Suite**  
   - Multi-select drag with alignment guides.  
   - Ripple edits and gap-closing gestures.  
   - Group/ungroup + consolidated clip previews.
3. **Bloom Timeline Actions**  
   - Hook `Split`, `Consolidate`, `Recall Last Import`, `Re-ingest Source` into Bloom menus.  
   - Show contextual pulses (no static toolbars).
4. **Import History Bridge**  
   - Persist ingest metadata (source path, stem map) with clips.  
   - Trigger queue re-ingest flow using stored metadata.

## Guardrails
- Preserve existing Bloom dock + floating hub positions (respect `localStorage` state).  
- No raw numeric readouts—lean on color, temperature, and motion.  
- Keep transitions adaptive; avoid hard cuts or flicker.  
- Document each addition with a short “what / why / how” note tied to Reduction / Flow / Recall.

## Key Files & State
- `src/components/ArrangeWindow.tsx` – UI layer for canvas interactions.  
- `src/hooks/useArrange.ts` – selection logic, drag handlers.  
- `src/App.tsx` – clip state, ingest metadata hooks, `handleBloomAction`.  
- Future: ingest history module (`ingestSnapshot`, persisted history store).  
- ALS helpers in `src/utils/ALS.ts` for energy ribbons and clip glow.

## Integration Notes
- Coordinate with Plugin Specialist on shared Bloom actions (e.g., ingest recall).  
- Use `ingestSnapshot` + upcoming history store to re-trigger imports.  
- Provide regression checklist: snap precision, ripple behavior, undo/redo, Bloom action feedback, playback continuity.

Protect Flow, enhance Recall, and make every arrange move feel like Glass-grade choreography.


