# Trap Piano Roll Upgrade Brief

## Mission
- Deliver a hip-hop native roll experience that mirrors MPC instincts while amplifying Flow and Mixx Recall.
- Keep FL Studio and Ableton muscle memory in reach without copying their scaffolding—temperature, motion, and ALS ribbons do the talking.

## Core Enhancements
1. **Ghost Strata Overlay**  
   - Borrow FL Studio's “ghost channels” concept to project inactive clips as translucent lanes.  
   - ALS tint ties ghost intensity to clip energy so producers see where drums punch without numbers.

2. **Hi-Hat & Snare Glide Toolkit**  
   - Dedicated roll palette (1/8T, 1/16T, 1/32T, burst triplets) mapped to Bloom quick actions.  
   - Note-repeat latch with pressure-sensitive velocity ramps when triggered from Trap Pad Matrix.

3. **Probability & Humanize Layers**  
   - Per-note chance slider plus micro-timing shuffle borrowed from Ableton Live 12's MIDI Transformations (released Feb 2024).  
   - ALS pulse widens when randomness is active to warn of evolving grooves.

4. **Ghost Velocity Guides**  
   - Dual-height velocity contour showing both committed velocity and MPC pad strike preview (live strike glows over committed bar).  
   - Works with Trap Pad Matrix overdubs to ensure take-lock precision.

5. **Pattern Recall & Mixx Recall Hooks**  
   - Snapshot manager for 808, hi-hat, snare grids with subgenre tags (plugg, rage, sigilkore, corridos tumbados).  
   - ALS communicates snapshot intent via color shifts instead of dropdowns.

## Implementation Notes
- Extend `PianoRollPanel` with overlay layer inside the grid loop for ghost strata and velocity guides.  
- Add trap roll command set (roll palette + probability tools) to Bloom menu definitions.  
- Wire `usePianoRoll` state to accept probability, humanize, and ghost overlays; persist snapshots for Mixx Recall integration.  
- Sync Trap Pad Matrix velocity + timing data through the upcoming TrapClipOrchestrator so overdubs respect the new toolkit.

## Reference Signals
- FL Studio “Ghost Channels” (Image-Line manual) — inspiration for layered previews, but rendered with ALS hues.  
- Ableton Live 12 MIDI Transformations — probability + humanize as baseline behaviour, launched Feb 2024.  
- Akai MPC note repeat + pad pressure workflows — informs roll palette UX.

Documented to uphold Reductionist Engineering, Flow continuity, and Mixx Recall memory.

