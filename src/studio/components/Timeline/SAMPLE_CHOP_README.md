# Sample Chopping - Transient Detection & Slicing

Advanced sample chopping system for trap and hip-hop production with transient detection, visual slice markers, and pattern conversion.

## Features

### 1. **Transient Detection**
- **Energy-Based Algorithm**: Detects sudden increases in audio energy
- **Adjustable Threshold**: 10-90% (higher = fewer transients detected)
- **Sensitivity Control**: 10-100% (higher = more sensitive)
- **Auto-Slice**: Automatically place markers at detected transients
- **Visual Indicators**: Yellow transient markers with strength-based opacity

### 2. **Grid-Based Slicing**
- **Auto-Slice to Grid**: Automatically slice at 16th note intervals
- **BPM Sync**: Aligned to project tempo (120 BPM default)
- **Perfect Loop Points**: Creates exact divisions for trap loops

### 3. **Visual Slice Markers**
- **Interactive Waveform Display**: Full waveform visualization
- **Click to Add**: Click anywhere on waveform to add slice marker
- **Click Marker to Remove**: Click existing marker to delete it
- **Neon Pink Markers**: High-contrast markers with glow effect
- **Real-time Updates**: Immediate visual feedback

### 4. **Convert to Pattern**
- **One-Click Pattern Creation**: Convert slices directly to pattern
- **Auto-Named Slices**: Each slice automatically numbered
- **Pattern Browser Integration**: Instant access in pattern browser
- **Drag & Drop**: Use sliced patterns on timeline immediately

## How to Use

### Opening Chop Mode
1. **Right-click** any audio region on the timeline
2. Select **"Chop Sample..."** from context menu
3. Chop mode overlay opens with full waveform

### Adding Slice Markers

#### Manual Slicing
- Click anywhere on the waveform to add a slice marker
- Click existing marker to remove it
- Perfect for custom chopping

#### Auto-Slice Transients
1. Adjust **Threshold** slider to control detection sensitivity
2. Adjust **Sensitivity** slider for fine-tuning
3. Click **"Auto-Slice Transients"** button
4. Markers appear at detected transient peaks

#### Auto-Slice to Grid
1. Click **"Slice to Grid"** button
2. Slices created at 16th note intervals
3. Perfect for creating drum patterns

### Applying Slices

#### Create Individual Regions
1. Add your slice markers
2. Click **"Apply Slices"** button
3. Original region replaced with individual sliced regions
4. Each slice is a separate, editable region

#### Convert to Pattern
1. Add your slice markers
2. Click **"Convert to Pattern"** button
3. Pattern created with all slices
4. Pattern appears in pattern browser
5. Original region removed, slices ready for arrangement

## Detection Parameters

### Threshold (Default: 30%)
- **Low (10-20%)**: Detects very subtle transients, many markers
- **Medium (30-40%)**: Balanced detection for most samples
- **High (50-90%)**: Only strong transients, fewer markers

### Sensitivity (Default: 70%)
- **Low (10-30%)**: Less sensitive, misses quiet transients
- **Medium (40-70%)**: Good balance for most samples
- **High (80-100%)**: Very sensitive, catches everything

## Best Practices

### Drum Breaks
1. Use **Auto-Slice Transients** with:
   - Threshold: 35%
   - Sensitivity: 75%
2. Review and manually adjust markers
3. **Convert to Pattern** for instant drum sequencing

### Melodic Samples
1. Use **Slice to Grid** for rhythmic slicing
2. Align with project BPM
3. Create multiple patterns with different slice arrangements

### Vocal Chops
1. Use **Manual Slicing** for precise cuts
2. Slice at syllable boundaries
3. Convert to pattern for vocal arrangement

### 808 Slides
1. Slice at note changes for sub-bass programming
2. Use with 808 panel for pitch control
3. Create patterns for different bass lines

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Click` | Add/remove slice marker |
| `Esc` | Close chop mode |
| `Space` | Preview playback (coming soon) |

## Technical Details

### Transient Detection Algorithm
- **Window Size**: 10ms analysis window
- **Hop Size**: 5ms (50% overlap)
- **Energy Calculation**: RMS of windowed signal
- **Detection Method**: Energy difference between consecutive windows
- **Minimum Interval**: 50ms between detected transients

### Grid Slicing
- **Base Unit**: Quarter note (4/4 time signature)
- **Division**: 16th notes (1/16 of quarter note)
- **Calculation**: `60 / BPM / 4` seconds per 16th note
- **Duration**: Auto-calculated to end of sample

### Performance
- **Real-time Waveform Rendering**: Canvas-based for smooth display
- **Efficient Detection**: Processes entire buffer in ~10-50ms
- **Memory Efficient**: Peak caching for large files

## Integration

### Pattern System
- Sliced patterns automatically categorized as "drums"
- Each slice becomes a pattern region
- Full pattern editing capabilities
- Drag and drop to timeline

### 808 Workflow
- Chop 808 samples for programming
- Combine with pitch slide controls
- Create unique bass patterns

### Timeline
- Slices replace original region
- Maintains track color and settings
- Respects ripple edit mode
- Undo/redo support (coming soon)

## Tips

1. **Start with Auto-Slice**: Use transient detection first, then refine manually
2. **Preview Before Converting**: Review slice markers before applying
3. **Use Grid for Loops**: Grid slicing perfect for loop-based samples
4. **Combine Methods**: Use auto-slice + manual adjustments
5. **Create Variations**: Make multiple patterns from same sample with different slices
