# Flow Responsive Design System

A comprehensive responsive design system for consistent scaling across all screen resolutions and sizes.

## Features

- **Viewport-based scaling**: UI elements scale proportionally based on screen size
- **High-DPI support**: Optimized for Retina displays and high-resolution monitors
- **Breakpoint-aware**: Different scale factors for different screen sizes
- **CSS Custom Properties**: Easy-to-use CSS variables for consistent sizing
- **Zoom-aware**: Handles browser zoom levels gracefully
- **Performance optimized**: Debounced resize handlers and efficient calculations

## Usage

### Automatic Initialization

The responsive system is automatically initialized when the app loads. No manual setup required.

### CSS Custom Properties

Use Flow's responsive CSS custom properties in your styles:

```css
.my-component {
  /* Use scaled spacing */
  padding: var(--flow-spacing-md);
  gap: var(--flow-spacing-lg);
  
  /* Use scaled typography */
  font-size: var(--flow-font-lg);
  
  /* Use scaled border radius */
  border-radius: var(--flow-radius-lg);
  
  /* Use scaled component sizes */
  height: var(--flow-button-height-md);
}
```

### Utility Classes

Use Flow's responsive utility classes:

```tsx
<div className="flow-text-lg flow-p-md flow-spacing-lg flow-rounded-lg">
  Content
</div>
```

### JavaScript API

Access scale factors and breakpoints programmatically:

```typescript
import { getScaleFactor, getCurrentBreakpoint, scaleValue } from '@/core/responsive';

// Get current scale factor (0.75 - 1.15)
const scale = getScaleFactor();

// Get current breakpoint ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl')
const breakpoint = getCurrentBreakpoint();

// Scale a value
const scaledSize = scaleValue(100); // Returns scaled pixel value
```

## Breakpoints

| Breakpoint | Min Width | Scale Factor | Use Case |
|------------|-----------|--------------|----------|
| `xs` | 0px | 0.75 | Mobile phones |
| `sm` | 640px | 0.85 | Small tablets |
| `md` | 768px | 0.9 | Tablets |
| `lg` | 1024px | 0.95 | Small laptops |
| `xl` | 1280px | 1.0 | Standard (reference) |
| `2xl` | 1536px | 1.05 | Large desktops |
| `3xl` | 1920px | 1.1 | 4K displays |
| `4xl` | 2560px | 1.15 | Ultra-wide / 4K |

## Best Practices

1. **Use CSS custom properties** instead of fixed pixel values
2. **Prefer rem units** for typography (they scale with the root font size)
3. **Use clamp()** for fluid sizing when appropriate
4. **Test on multiple resolutions** to ensure consistency
5. **Consider high-DPI displays** - the system handles this automatically

## Migration Guide

### Replacing Fixed Pixel Values

**Before:**
```css
.component {
  padding: 16px;
  font-size: 14px;
  border-radius: 8px;
}
```

**After:**
```css
.component {
  padding: var(--flow-spacing-md);
  font-size: var(--flow-font-md);
  border-radius: var(--flow-radius-md);
}
```

### Replacing Hardcoded Sizes in Components

**Before:**
```tsx
<div style={{ width: '200px', height: '40px' }}>
```

**After:**
```tsx
<div style={{ 
  width: 'var(--flow-button-height-lg)', 
  height: 'var(--flow-button-height-md)' 
}}>
```

Or use the scale system:
```tsx
import { scaleValue } from '@/core/responsive';

<div style={{ 
  width: `${scaleValue(200)}px`, 
  height: `${scaleValue(40)}px` 
}}>
```

## Technical Details

- Scale factors are calculated based on viewport width
- High-DPI displays (>1.5x) get a slight adjustment to prevent UI from being too small
- Updates are debounced to 150ms for performance
- CSS custom properties are updated on window resize and orientation change
- The system uses a 1920px reference width (xl breakpoint) as the baseline

