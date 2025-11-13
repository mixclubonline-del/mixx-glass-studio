# Arrange Grid Playbook

## TL;DR
- The arrange canvas fuses an adaptive beat/bar lattice with ALS ribbons so precision edits always respect Flow.
- Glass Rail Navigator overview (bottom bar) delivers instant scroll + zoom while protecting follow-playhead logic.
- Clips carry glass-grade affordances: grab zone, resize edges, fade halos, gain ribbons, zero-cross beacons, and auto-XF tags.
- Alt activates ripple moves; Meta duplicates; Ctrl fine-tunes gain; Shift temporarily disables zero-lock.
- Track lanes breathe: collapsible heights, automation sub-lanes, ALS reinforcement, and context-aware playhead choreography.
- Waveforms render from live `AudioBuffer` data with gradient temperature cues and zero-cross stripes at extreme zoom.

---

## 1. Arrange Visual System

### Glass Rail Grid
- Bars, beats, and micro-guides spawn from `bpm`, `beatsPerBar`, and `pixelsPerSecond`, creating a “Glass Rail Grid” that tightens with zoom.
- The master analysis level modulates division density so transient-heavy passages automatically surface finer guides without toggles.

### ALS Energy Ribbon
- Every track lane projects an ALS ribbon (linear gradient + blur) keyed to `deriveTrackALSFeedback`. Intensity, glow color, and pulse factor drive ribbon opacity and trailing light.
- Selection overlays (with magenta energy for drag range) keep Flow without numeric readouts.

### Glass Rail Navigator
- Bottom overview bar mirrors the entire timeline; drag the glass window to scroll, click-drag to marquee zoom, click to center.
- Session Probe records every navigator scroll/zoom when instrumentation is enabled, feeding Flow retrospectives.

### Playhead Choreography
- The playhead inherits current clip color context and emits a plasma trail + transient sparks when `masterAnalysis.transient` fires.
- Auto-scroll gently eases into place when Follow is active, preserving spatial recall.

---

## 2. Clip Interaction Suite

### Core Gestures
| Motion | Gesture | Flow Cue |
| ------ | ------- | -------- |
| Move | Click-drag | Glass cursor shifts to `grab`; snap line pulses cyan |
| Resize (L/R) | Edge drag | Cursor switches to `ew-resize`; cyan dot confirms zero-lock alignment |
| Fade In/Out | Drag top halos | White orb appears; gradient widens; `XF` text lights on automatic crossfades |
| Gain | Vertical drag near center line | Cursor flips to `ns-resize`; hold **Ctrl** for micro moves |
| Piano Roll | Double-click | Brief ALS highlight, then lane context shifts to “edit” |
| Warp Anchors | Display only | Anchors emit vertical ion beams marking stretch points |

### Precision Utilities
- **Snap line**: Quantizes using adaptive division; indicator labels “snap”.
- **Ripple (Alt)**: Moves downstream clips on the same lane with preserved spacing.
- **Duplicate (Meta)**: First drag spawns mirrored clips, selects them, and locks to snap.
- **Selection Drag**: Background drag paints magenta window; shift-click toggles membership.
- **Zero-lock**: Edge drags auto-snap to nearest zero crossing within ±6 ms; hold **Shift** to bypass.
- **Auto-XF**: Overlapping clips gain 30 ms (max) crossfades automatically; `XF` badge confirms.
- **Navigator Zoom**: Drag a region inside Glass Rail Navigator to auto-rescale the view.

---

## 3. Track Logic + Lanes

- Headers run glass controls (arm, solo, insert Bloom) while lane bodies stay clean.
- Track heights are resizable; collapsed lanes shrink to capsule stripes but keep ALS glow.
- Automation lanes slide under the clip lane when requested, sharing colors with parent track.
- Each drag begins with `onSetTrackContext(trackId, "edit")` so ALS, Bloom, and Prime agents know the active intent.

---

## 4. Waveform Rendering

- Clips forward their `AudioBuffer` into `WaveformRenderer`, which samples data according to zoom, drawing peak/RMS envelopes with temperature gradients.
- Max amplitude detection nudges gradient stops from cool cyan → violet → fire glow, aligning with ALS energy language.
- Canvas pixels scale with device pixel ratio to keep glass edges crisp.

---

## 5. Bloom + ALS Integration

- Bloom Timeline actions (split, consolidate, recall) consume the same clip state manipulated here; selection logic always updates before Bloom fires.
- ALS temperature badges in the clip footer show color-coded energy without numbers; track ribbons sync with global ALS pulses.
- Ripple, duplication, zero-lock snaps, and navigator gestures all emit probe-friendly events, keeping Mixx Recall in sync with user context.

---

## 6. Quick Reference Checklist

- [ ] Zoom with `Ctrl/⌘ + Wheel`; grid adapts immediately.
- [ ] Use Glass Rail Navigator for instant jumps or marquee zoom; follow toggles pause automatically.
- [ ] Drag clip with snap; confirm cyan “snap” spine appears.
- [ ] Hold `Alt` while moving to ripple downstream clips.
- [ ] Hold `Meta` on drag start to duplicate selection, then continue move.
- [ ] Fade handles (top corners) respond with white orb; auto-XF badge confirms overlap blend.
- [ ] Gain ribbon follows vertical drag; hold **Ctrl** for micro adjustments.
- [ ] Resize edges: cyan dot = zero-lock; hold **Shift** to freehand.
- [ ] Double-click clip to open piano roll; ALS context switches to edit.
- [ ] Resize track via bottom halo; ensure ALS ribbon persists after change.
- [ ] Collapse/expand through header control; verify automation lane hides/reveals smoothly.
- [ ] Watch transient sparks at playhead during high ALS events to confirm follow behavior.

---

## 7. Doctrine Alignment Notes

- **Reductionist Engineering**: Interactive affordances are embedded in the clip surface; no extra panels, no numeric overlays.
- **Flow**: Snap, ripple, and duplication use the same drag gesture + modifiers to keep muscle memory frictionless; grid adapts instead of requiring manual toggles.
- **Mixx Recall**: Track contexts, selection state, and ALS energy metadata refresh on every gesture so Bloom and Prime recommendations remember user intent.


