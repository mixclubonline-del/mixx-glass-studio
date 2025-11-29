# Adaptive Layout System

The Adaptive Layout System provides contextual, platform-aware layout adaptation for Mixx Club Studio. The Studio adapts its layout based on platform, screen size, orientation, and device capabilities.

## Overview

The system consists of three core components:

1. **Platform Detection** (`platformDetection.ts`) - Detects platform, OS, device type, and capabilities
2. **Adaptive Layout Hook** (`useAdaptiveLayout.ts`) - Provides reactive layout configuration
3. **Adaptive Utilities** (`adaptiveUtils.ts`) - Helper functions for components

## Layout Modes

The system provides four layout modes that adapt to context:

- **compact**: Mobile/tablet portrait, minimal UI
- **standard**: Desktop/laptop, balanced layout (default)
- **expanded**: Large desktop, more space for content
- **immersive**: Ultra-wide/4K, maximum content area

## Platform Detection

The platform detection system identifies:

- **Platform**: `desktop` | `mobile` | `tablet` | `visionos` | `unknown`
- **OS**: `macos` | `windows` | `linux` | `ios` | `android` | `visionos` | `unknown`
- **Device Type**: `phone` | `tablet` | `desktop` | `tv` | `wearable` | `unknown`
- **Orientation**: `portrait` | `landscape`
- **Capabilities**: Touch support, high-DPI, Tauri environment

## Usage

### Basic Usage in Components

```tsx
import { useAdaptiveLayout } from '@/core/responsive';

function MyComponent() {
  const layout = useAdaptiveLayout();
  
  return (
    <div style={{ 
      width: layout.trackHeaderWidth,
      padding: layout.timelinePadding 
    }}>
      {/* Component content */}
    </div>
  );
}
```

### Using Adaptive Utilities

```tsx
import { useAdaptiveLayout } from '@/core/responsive';
import { 
  getResponsiveWidth, 
  shouldShowComponent,
  getTouchTargetSize 
} from '@/core/responsive/adaptiveUtils';

function AdaptiveComponent() {
  const layout = useAdaptiveLayout();
  
  const width = getResponsiveWidth(200, layout, {
    minWidth: 120,
    maxWidth: 400,
    useViewport: true
  });
  
  const showSidebar = shouldShowComponent('sidebar', layout);
  const buttonSize = getTouchTargetSize(32, layout);
  
  return (
    <>
      {showSidebar && <Sidebar width={width} />}
      <button style={{ width: buttonSize, height: buttonSize }}>
        Touch-friendly button
      </button>
    </>
  );
}
```

### Using CSS Custom Properties

The system automatically sets CSS custom properties on the root element:

```css
.my-component {
  /* Use adaptive dimensions */
  height: var(--adaptive-header-height);
  padding: var(--adaptive-timeline-padding);
  
  /* Use data attributes for conditional styling */
  .flow-root[data-layout-mode="compact"] & {
    font-size: 0.875rem;
  }
  
  .flow-root[data-platform="mobile"] & {
    padding: 8px;
  }
}
```

## Layout Configuration

The `AdaptiveLayoutConfig` provides:

### Dimensions
- `headerHeight`: Adaptive header height
- `dockHeight`: Adaptive dock height
- `bloomWidth`: Bloom HUD width
- `bloomHeight`: Bloom HUD height
- `trackHeaderWidth`: Track header column width
- `timelinePadding`: Timeline content padding

### Visibility Flags
- `showBloom`: Whether to show Bloom HUD
- `showDock`: Whether to show Flow Dock
- `showTrackHeaders`: Whether to show track headers
- `showMixer`: Whether to show mixer console

### Layout Capabilities
- `canShowSidebar`: Whether sidebar can be displayed
- `canShowMultiColumn`: Whether multi-column layouts are supported

### Mode Flags
- `isCompact`: True if in compact mode
- `isExpanded`: True if in expanded mode
- `isImmersive`: True if in immersive mode

## Responsive Breakpoints

The system uses the same breakpoints as the responsive scale system:

| Breakpoint | Min Width | Layout Mode | Use Case |
|------------|-----------|-------------|----------|
| `xs` | 0px | compact | Mobile phones |
| `sm` | 640px | compact | Small tablets |
| `md` | 768px | compact/standard | Tablets |
| `lg` | 1024px | standard | Small laptops |
| `xl` | 1280px | standard | Standard (reference) |
| `2xl` | 1536px | expanded | Large desktops |
| `3xl` | 1920px | immersive | 4K displays |
| `4xl` | 2560px | immersive | Ultra-wide / 4K |

## Platform-Specific Adaptations

### Mobile
- Compact mode by default
- Bloom HUD hidden in portrait
- Reduced padding and spacing
- Touch-optimized targets (min 44px)

### Tablet
- Compact in portrait, standard in landscape
- Smaller Bloom HUD
- Adaptive track headers
- Touch support enabled

### Desktop
- Standard mode for most screens
- Expanded mode for large displays
- Immersive mode for ultra-wide/4K
- Full feature set available

### VisionOS
- Immersive mode by default
- Maximum content area
- Optimized for spatial computing

## Best Practices

1. **Use the hook, not direct detection**: Always use `useAdaptiveLayout()` rather than calling platform detection directly
2. **Prefer CSS custom properties**: Use CSS variables when possible for better performance
3. **Test on multiple platforms**: Verify layouts on different devices and orientations
4. **Respect touch targets**: Use `getTouchTargetSize()` for interactive elements on touch devices
5. **Progressive enhancement**: Start with compact layout, enhance for larger screens
6. **Maintain Flow**: Don't break the creative flow with layout changes - adapt smoothly

## Integration with FlowLayout

The `FlowLayout` component automatically uses adaptive layout:

```tsx
<FlowLayout
  header={<Header />}
  bloomHUD={<BloomHUD />}
  dock={<FlowDock />}
>
  {/* Timeline content */}
</FlowLayout>
```

The layout automatically:
- Adjusts header and dock heights
- Shows/hides Bloom HUD based on context
- Adapts padding and spacing
- Responds to orientation changes
- Updates on window resize

## Performance

- Layout calculations are memoized
- Resize handlers are debounced (150ms)
- CSS custom properties update efficiently
- No layout thrashing on resize

## Future Enhancements

- Custom layout presets per user
- Manual layout mode override
- Layout state persistence
- Multi-monitor support
- Window management integration



