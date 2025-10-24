# Arrange Window, Timeline & Playhead — Behavior Documentation

## Overview

The Mixx Club Pro Studio timeline implements professional DAW behavior with precise BBT (Bars:Beats:Ticks) conversion, adaptive grids, intelligent snapping, and industry-standard keyboard shortcuts.

---

## 1. Timeline Ruler

### Display Modes
- **Bars:Beats** - Shows musical time with bar numbers and beat subdivisions
- **Seconds** - Shows absolute time in MM:SS format
- Toggle between modes in View settings

### Adaptive Grid
Grid resolution automatically adjusts based on zoom level:
- **Wide zoom** (< 30px/s) → Bars only
- **Medium zoom** (30-80px/s) → Quarter notes
- **Close zoom** (80-200px/s) → 16th notes
- **Deep zoom** (> 200px/s) → 32nd notes

### Manual Grid Units
Override adaptive grid with fixed units:
- Bar, Beat, 1/2, 1/4, 1/8, 1/16, 1/32, 1/64
- Triplet variants: Triplet 1/4, 1/8, 1/16
- Frame (30 fps) or Sample-accurate

### Interactions
- **Click** - Seek playhead to clicked position
- **Alt + Drag** - Scrub timeline with audio preview (coming soon)
- **Ctrl + Drag** - Set loop range (coming soon)

---

## 2. Playhead & Transport

### Source of Truth
- Playhead position stored in **samples** (44.1kHz standard)
- BBT and time values are derived views, always accurate
- Maintained by Prime Brain clock system

### Play/Stop Behavior

**Space** - Play/Pause
- If playing: Pause at current position
- If stopped: Resume from current position

**Enter/Return** - Play from position
- Plays from current playhead or selection start

**S or 0** - Stop
- Stops playback
- If "Return on Stop" enabled: Returns to last start position
- If disabled: Stays at current position

### Loop (Cycle) Mode

**L** - Toggle Loop
- Enables/disables loop playback
- On first enable with no range: Creates 8-second loop at playhead
- Playback wraps seamlessly between [Loop Start, Loop End)
- Loop boundaries respect grid snap settings

**Setting Loop Range**
- Ctrl + Drag in ruler (coming soon)
- Manually set in Loop panel
- Minimum loop length: 10ms (prevents zero-length loops)

### Follow Modes

**None** (Default)
- Canvas stays fixed during playback
- User manually scrolls timeline

**Page**
- Playhead scrolls to next "page" when reaching 90% of viewport
- Smooth page transitions without jarring jumps

**Smooth/Continuous**
- Playhead stays centered during playback
- Canvas scrolls continuously to follow

**Toggle**: View → Auto-scroll settings

---

## 3. Snap & Quantize

### Snap Modes

**Grid Snap** (Default)
- Regions/edits snap to current grid unit
- Respects adaptive or manual grid setting

**Relative Snap**
- Maintains relative offset while snapping (coming soon)

**Transient Snap**
- Snaps to audio transients (coming soon)

**Marker Snap**
- Snaps to timeline markers

**Region Snap**
- Snaps to other region boundaries (coming soon)

**Snap Off**
- Free positioning, no snapping
- Hold **Shift** while dragging to temporarily disable snap

### Quantize Strength
- **0%** - Completely free, no snap
- **50%** - Gentle magnetic snap
- **100%** - Hard snap to grid (default)

Blend between free and snapped positioning for natural feel.

---

## 4. Markers

**M** - Drop Marker
- Creates marker at current playhead position
- Markers visible in ruler lane
- Double-click to rename (coming soon)
- Useful for song sections (Intro, Verse, Chorus, etc.)

**Types**
- **Marker** - Single point reference (purple)
- **Section** - Named song sections (cyan, coming soon)

---

## 5. Editing Tools

### Select Tool (V)
- Default tool for region manipulation
- Click to select region
- Drag to move region
- Near edges: Trim region
- Near fade handles: Adjust fades

### Trim Tool (T)
- Dedicated edge trimming
- Adjusts region start/end without moving

### Fade Tool (F)
- Create and edit crossfades
- Linear fades by default
- Curve customization (coming soon)

### Split Tool (B)
- Click region to split at playhead
- Creates two separate regions
- Useful for removing sections

### Zoom Tool (Z)
- Click and drag to zoom to selection
- Double-click to zoom fit (coming soon)

### Multi Tool (coming soon)
- Context-sensitive tool that combines all tools
- Behavior changes based on mouse position

---

## 6. Region Editing

### Moving Regions
- Drag with Select tool
- Respects snap settings
- Cannot move before 0:00 (clamped)
- Alt + Drag to duplicate (coming soon)

### Trimming
- Drag region edges
- Non-destructive (audio buffer unchanged)
- Adjusts visible portion only

### Fades
- Fade In: Drag left fade handle
- Fade Out: Drag right fade handle
- Crossfades: Overlapping regions (coming soon)

### Ripple Edit
**R** - Toggle Ripple Edit
- When enabled: Moving/deleting regions shifts all following content
- When disabled: Creates gaps
- Useful for podcast editing and arrangement changes

---

## 7. Keyboard Shortcuts

### Transport
| Key | Action |
|-----|--------|
| **Space** | Play/Pause |
| **Enter** | Play from position |
| **S** or **0** | Stop (return to start if enabled) |
| **L** | Toggle Loop |
| **Home** | Jump to start |
| **End** | Jump to end |
| **←** | Previous bar |
| **→** | Next bar |

### Tools
| Key | Tool |
|-----|------|
| **V** | Select Tool |
| **T** | Trim Tool |
| **F** | Fade Tool |
| **B** | Split Tool |
| **Z** | Zoom Tool |

### Editing
| Key | Action |
|-----|--------|
| **M** | Drop Marker |
| **G** | Toggle Grid Snap |
| **R** | Toggle Ripple Edit |
| **Delete/Backspace** | Delete selected regions |
| **Ctrl+Z** | Undo (coming soon) |
| **Ctrl+Shift+Z** | Redo (coming soon) |
| **Ctrl+D** | Duplicate (coming soon) |

### View
| Key | Action |
|-----|--------|
| **Ctrl+Shift+D** | Toggle Debug Overlay |
| **Ctrl + Scroll** | Zoom in/out |
| **Alt + Scroll** | Scroll timeline horizontally |

---

## 8. Debug Overlay

Press **Ctrl+Shift+D** to show real-time timeline internals:
- Playhead position (seconds, BBT, samples)
- Grid mode and active unit
- Snap settings and quantize strength
- Loop status and range
- View mode and follow settings
- FPS counter for performance monitoring

Useful for QA, debugging, and understanding timeline state.

---

## 9. Technical Details

### Time Conversion
- Sample Rate: 44,100 Hz (standard)
- BBT Resolution: 960 PPQN (ticks per beat)
- BPM Range: 20-300
- Time Signatures: Configurable (default 4/4)

### Performance
- Canvas rendering: 60+ FPS target
- RAF-based transport tick
- No main thread blocking on scroll/zoom
- Smart waveform caching

### Precision
- Playhead position: Sample-accurate
- Grid snapping: Sub-millisecond precision
- BBT conversion: Floating-point accurate

---

## 10. Known Limitations

### Current Implementation
✅ Basic playback and transport  
✅ Grid snap with adaptive units  
✅ Loop mode with seamless wrap  
✅ Keyboard shortcuts  
✅ Debug overlay  
✅ Marker system  

### Coming Soon
🔜 Ruler scrub (Alt + Drag)  
🔜 Loop range selection (Ctrl + Drag ruler)  
🔜 Tempo map / time signature changes  
🔜 Transient detection for snap  
🔜 Undo/Redo system  
🔜 Region comping lanes  
🔜 SMPTE timecode display  
🔜 Warp markers (audio warping)  

---

## 11. Best Practices

### For Best Performance
- Use adaptive grid at high zoom levels
- Enable auto-scroll only when needed
- Close debug overlay when not debugging
- Use keyboard shortcuts for faster workflow

### For Precise Editing
- Zoom in for sample-accurate edits
- Use frame or sample grid for video sync
- Enable grid snap for musical alignment
- Use markers for song structure reference

### For Creative Flow
- Use follow mode during composition
- Ripple edit for quick arrangements
- Loop sections while crafting
- Keyboard shortcuts for hands-on-keys workflow

---

## 12. Troubleshooting

**Playhead not moving during playback?**
- Check Prime Brain clock is running
- Look for errors in console
- Verify audio context is started

**Snap not working?**
- Press **G** to enable grid snap
- Check snap mode in toolbar
- Verify quantize strength > 0%

**Loop not working?**
- Press **L** to enable loop
- Check loop range is valid (end > start)
- Minimum loop length is 10ms

**Keyboard shortcuts not responding?**
- Ensure focus is not in an input field
- Check console for "Timeline Shortcuts" logs
- Verify shortcuts hook is enabled

---

## Support

For issues, feature requests, or questions:
- Check console logs with Debug Overlay (Ctrl+Shift+D)
- Report bugs with timeline state snapshot
- Include browser, OS, and audio hardware info

**Built with ❤️ for producers, by producers.**
