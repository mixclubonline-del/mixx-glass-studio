# MixxClub Pro Studio - Layout System Documentation

## 🎯 Overview
This document defines the unified layout system implemented across the entire DAW to ensure perfect alignment, proportions, and visual consistency.

## 📐 Layout Constants

### Header Heights (Standardized)
- **Main View Headers**: 72px - Timeline and Mixer headers
- **Toolbars/Secondary Bars**: 48px - Contextual toolbars
- **Transport Controls**: 64px - Global transport bar
- **Timeline Ruler**: 40px - Time/bar ruler

### Panel Widths (Standardized)
- **Small Panels**: 280px - Metering, browser panels
- **Medium Panels**: 320px - AI assistant, extended features
- **Large Panels**: 400px - Full-featured panels
- **Track List**: 280px expanded, 48px collapsed
- **Master Channel**: 110px fixed width

### Channel Strip Sizing
- **Minimum Width**: 80px
- **Default Width**: 90px (standard for all channel strips)
- **Maximum Width**: 120px

### Track Heights
- **Standard Track**: 100px (timeline track lanes)
- **Minimum Track**: 60px
- **Maximum Track**: 200px

### Spacing Scale (4px Grid System)
All spacing follows multiples of 4px:
- **XS**: 4px (0.5rem) - Minimal gaps
- **SM**: 8px (1rem) - Default component gaps
- **MD**: 12px (1.5rem) - Section spacing
- **LG**: 16px (2rem) - Major section breaks
- **XL**: 24px (3rem) - View-level spacing
- **XXL**: 32px (4rem) - Maximum spacing

## 🎨 Implementation

### Using Layout Constants

```typescript
import { 
  HEADER_HEIGHT, 
  PANEL_WIDTH_SM,
  SPACING,
  TRACK_HEIGHT 
} from '@/lib/layout-constants';

// In your component:
<div 
  style={{ 
    height: `${HEADER_HEIGHT}px`,
    padding: `${SPACING.lg}px`,
    gap: `${SPACING.sm}px`
  }}
>
```

## ✅ Alignment Checklist

### View Headers
- [x] Timeline header: 72px
- [x] Mixer header: 72px
- [x] Consistent logo size: h-10 (40px)
- [x] Consistent title font sizes

### Panel Widths
- [x] Metering dashboard: 280px
- [x] Track list: 280px (expanded)
- [x] Master channel: 110px
- [x] Channel strips: 90px

### Spacing
- [x] Right panel stack: 8px gaps
- [x] View switcher bar: 12px padding
- [x] Main content gaps: 8px
- [x] All measurements on 4px grid

### Track System
- [x] Timeline tracks: 100px height
- [x] Track list items: 100px height
- [x] Consistent track controls across views

## 🔧 Benefits

1. **Visual Harmony**: Everything lines up perfectly
2. **Predictable Layout**: Consistent sizing makes UI predictable
3. **Easy Maintenance**: Change one constant, update everywhere
4. **Responsive Behavior**: Clear min/max bounds for resizing
5. **Professional Feel**: Pixel-perfect alignment = professional tool

## 🚀 Future Enhancements

- [ ] User-resizable panels with snap-to-grid
- [ ] Saved layout presets
- [ ] Per-view layout customization
- [ ] Responsive breakpoints for smaller screens

## 📝 Notes

- All constants exported from `src/lib/layout-constants.ts`
- Use inline styles for dynamic measurements (heights, widths)
- Use Tailwind for spacing where possible (p-4, gap-2, etc.)
- Always consider 4px grid when adding custom spacing
- Test alignment in both Timeline and Mixer views
