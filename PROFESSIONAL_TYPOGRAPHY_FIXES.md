# Professional Typography Fixes
**Priority:** Critical - Replace all tiny font sizes with professional standards

## Font Size Replacements

### Current → Professional
- `0.45rem` (7.2px) → `0.6875rem` (11px) - Minimum readable
- `0.5rem` (8px) → `0.75rem` (12px) - Small labels
- `0.55rem` (8.8px) → `0.75rem` (12px) - Labels

## Files to Update

1. **FlowBusStrip.tsx** - ✅ Updated
2. **FlowChannelStrip.tsx** - Needs update
3. **FlowMasterStrip.tsx** - Needs update
4. **FlowConsoleHeader.tsx** - Needs update
5. **FlowConsoleMatrixView.tsx** - Needs update
6. **FlowConsoleAnalyzerView.tsx** - Needs update
7. **FlowConsoleCompactView.tsx** - Needs update

## Professional Typography Presets

Use these presets instead of hardcoded sizes:

```typescript
typography.preset.label()    // 12px, semibold, uppercase
typography.preset.caption()  // 11px, normal, muted
typography.preset.body()     // 13px, normal, high contrast
typography.preset.value()    // 13px, medium, tabular numbers
typography.preset.small()    // 12px, normal, secondary
```

## Implementation Strategy

1. Replace all `fontSize: '0.45rem'` with `typography.preset.caption()`
2. Replace all `fontSize: '0.5rem'` with `typography.preset.small()`
3. Replace all `fontSize: '0.55rem'` with `typography.preset.label()`
4. Ensure color contrast: `rgba(230, 240, 255, 0.85+)` for readability
