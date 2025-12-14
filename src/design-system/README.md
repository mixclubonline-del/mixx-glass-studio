# MixxGlass Design System

**Proprietary styling system replacing Tailwind CSS**

## Philosophy

MixxGlass Design System embodies the three core doctrines:
- **Reductionist Engineering**: Only what earns pixels
- **Flow**: Preserve creator momentum, no friction
- **Mixx Recall**: System remembers, users don't

## Core Principles

1. **No Raw Numbers**: Communicate through color, temperature, motion, form
2. **ALS Integration**: All styling utilities are ALS-aware
3. **Glass Aesthetic**: Native glass/3D layers, no plain backgrounds
4. **Flow-Conscious**: Minimal friction, adaptive interactions

---

## Architecture

### Core Utilities (`core/`)
- `spacing.ts` - Spacing scale utilities
- `typography.ts` - Typography system
- `colors.ts` - Color palette with ALS integration
- `layout.ts` - Layout utilities (flex, grid, positioning)
- `effects.ts` - Glass effects, shadows, glows
- `transitions.ts` - Animation utilities

### Glass Primitives (`glass/`)
- `surfaces.ts` - Glass surface styles
- `borders.ts` - Glass border utilities
- `backdrop.ts` - Backdrop blur utilities
- `transforms.ts` - 3D transform utilities

### ALS Integration (`als/`)
- `temperature.ts` - Temperature-based styling
- `energy.ts` - Energy-based styling
- `pulse.ts` - Pulse animation utilities
- `feedback.ts` - ALS feedback integration

### Responsive (`responsive/`)
- Integrates with existing Flow responsive system
- Viewport-aware scaling
- High-DPI support

---

## Usage

### Basic Styling

```tsx
import { glass, spacing, typography } from '@/design-system';

<div style={{
  ...glass.surface({ intensity: 'medium' }),
  ...spacing.p(4),
  ...spacing.gap(2),
  ...typography.body(),
}}>
  Content
</div>
```

### ALS-Aware Styling

```tsx
import { als, glass } from '@/design-system';

<div style={{
  ...glass.surface({ intensity: 'medium' }),
  ...als.temperature(0.7), // Hot temperature
  ...als.pulse({ channel: 'momentum', intensity: 0.8 }),
}}>
  ALS-aware content
</div>
```

### Responsive Styling

```tsx
import { responsive, glass } from '@/design-system';

<div style={{
  ...glass.surface(),
  ...responsive.padding({ xs: 2, md: 4, lg: 6 }),
  ...responsive.fontSize({ xs: 'sm', md: 'lg' }),
}}>
  Responsive content
</div>
```

---

## Migration Strategy

1. **Phase 1**: Build core utilities (current)
2. **Phase 2**: Create CSS-in-JS runtime
3. **Phase 3**: Migrate MixxGlass components first
4. **Phase 4**: Migrate mixer components
5. **Phase 5**: Migrate remaining components
6. **Phase 6**: Remove Tailwind dependency

---

*Context improved by Giga AI - Used existing glassStyles, alsHelpers, and responsive system to design proprietary design system architecture.*


