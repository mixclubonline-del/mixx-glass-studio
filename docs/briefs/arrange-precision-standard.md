# Arrange Precision Standards vs Current Implementation

## Snapshot of the Studio Today
| Capability | Current Behaviour (2025-11-13) | Notes |
| --- | --- | --- |
| **Zoom depth** | Zoom factor capped via `ppsAPI` (min 10 px/s, max 500 px/s) with sample-level rendering and zero-cross markers once zoomed beyond 420 px/s. | Still no transient inspector or scrub magnifier.[^musictech] |
| **Grid + snap** | Adaptive beat grid (bars / beats / subdivision) driven by master level. Grid toggle and alt ripple remain unchanged. | Needs independent micro grid + quick snap toggle. |
| **Scroll + navigation** | Timeline gains the **Glass Rail Navigator** overview bar with draggable window, click-to-jump, and ratio-based zoom selection. | Still missing pinned playhead option and keyboard jump shortcuts.[^journalism] |
| **Clip fades** | Overlapping clips auto-crossfade (up to 30 ms) and surface an `XF` tag when applied. Manual fades still honoured. | Need editable fade curves and per-clip auto-crossfade preferences.[^musicradar] |
| **Zero-crossing support** | Resize-left/right snaps to nearest zero crossing within 6 ms (Shift to bypass), with cyan edge markers for aligned clips. | Extend to splits/moves and expose zero-lock toggle in UI.[^hooksounds] |
| **Gain fine control** | Control-drag on gain line reduces sensitivity to 0.002 per pixel (vs 0.01 default). | Provide numeric entry or double-click reset for absolute precision. |
| **Spectral / energy cues** | ALS ribbon + waveform gradient plus zero-cross highlight stripes at extreme zoom. | Need transient detection or spectral heat-map overlay for deep edits.[^musictech] |
| **Automation & stretch** | Automation lanes exist; clip warp anchors display but editing anchors is manual. No sample-accurate anchor snapping. | Consider aligning warp anchor moves to zero crossings to avoid phase clicks. |

## Industry Bar Raised
1. **Sample-Level Navigation** – Editors expect to zoom to sample granularity and scrub precisely.[^musictech]
2. **Zero-Crossing-Aware Editing** – Provide detection/toggle so that splits and fades start at zero amplitude to prevent clicks.[^hooksounds]
3. **Automatic Crossfades** – Default crossfades on overlap, with editable curves, are standard in Logic, Pro Tools, Ableton.[^musicradar]
4. **Stationary Playhead / Navigator Bar** – Timeline should expose a horizontal overview with draggable window; optional fixed playhead keeps focus during dense edits.[^journalism][^sfxengine]
5. **Flexible Snap & Groove** – Grid resolutions spanning bars → 1/128, triplets, swing % controls and fast on/off toggle.[^sounddesign]
6. **Humanised Quantise Strength** – Partial quantise sliders (0–100%) preserve feel while tightening timing.[^audiofanzine]
7. **Spectral Insight** – Optional spectral overlay or transient marking supports forensic edits without leaving arrange.[^musictech]

## Gaps To Close
1. **Navigation** – Add pinned playhead / keyboard jog plus quick toggle for follow-playhead while keeping Glass Rail Navigator in sync.
2. **Precision API** – Extend zero-cross search to splits and warps; expose tolerance controls per clip.
3. **Clip UX** – Editable crossfade curves, double-click reset on gain/fade, per-clip zero-lock toggle in the HUD.
4. **Rendering** – Layer transient heat-map or spectral tint when zoomed in; optional RMS overlay for balance checks.
5. **Docs & Training** – Keep playbook + probe guidance current; collect navigator/zero-lock usage telemetry during rehearsals.

[^musictech]: https://musictech.com/guides/essential-guide/20-audio-editing-tips/
[^hooksounds]: https://www.hooksounds.com/blog/edit-audio-with-precision-trick-every-editor-should-know/
[^musicradar]: https://www.musicradar.com/how-to/10-ways-to-up-your-daw-recording-and-editing-game
[^journalism]: https://journalism.university/audio-podcast/mastering-timeline-digital-audio-editing/
[^sfxengine]: https://sfxengine.com/blog/digital-audio-workstation-comparison
[^sounddesign]: https://sound-design.lsupathways.org/sound-design/daw-instructions/the-grid/
[^audiofanzine]: https://en.audiofanzine.com/computer-music/editorial/articles/quantizing-basics.html

