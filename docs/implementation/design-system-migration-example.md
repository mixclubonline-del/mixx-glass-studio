# MixxGlass Design System - Migration Example

## ✅ Proof of Concept: Button Component

**Prime, we've migrated the MixxGlass Button component to use the proprietary design system.**

### Before (Tailwind Classes)

```tsx
<button
  className={`mixxglass-button px-4 py-2 text-base ${className}`}
  style={buttonStyle}
>
  <div className="absolute inset-0 rounded-inherit pointer-events-none" />
  <span className="relative z-10">{children}</span>
</button>
```

### After (Design System)

```tsx
import { spacing, typography, transitions, composeStyles } from '@/design-system';

<button
  className={`mixxglass-button ${className}`}
  style={composeStyles(
    baseStyles,
    glassSurface,
    spacing.px(4),
    spacing.py(2),
    typography.size('base'),
    transitions.transform.scale(animatedScale.scale),
    transitions.transition.standard(['transform', 'box-shadow'], 250, 'ease-out'),
  )}
>
  <div style={composeStyles({
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
  })} />
  <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
</button>
```

### Benefits

1. **No External Dependencies**: Removed Tailwind classes
2. **Type-Safe**: Full TypeScript support
3. **ALS Integration**: Native ALS-aware styling
4. **Responsive**: Integrates with Flow responsive system
5. **Composable**: Easy to combine styles

---

## Migration Pattern

### Step 1: Import Design System

```tsx
import { spacing, typography, layout, effects, transitions, glass, als, composeStyles } from '@/design-system';
```

### Step 2: Replace Tailwind Classes

**Spacing:**
- `px-4` → `spacing.px(4)`
- `py-2` → `spacing.py(2)`
- `gap-2` → `spacing.gap(2)`
- `m-4` → `spacing.m(4)`

**Typography:**
- `text-base` → `typography.size('base')`
- `font-bold` → `typography.weight('bold')`
- `text-center` → `typography.align('center')`
- `uppercase` → `typography.transform('uppercase')`

**Layout:**
- `flex` → `layout.flex.container()`
- `flex-col` → `layout.flex.container('col')`
- `justify-center` → `layout.flex.justify.center`
- `items-center` → `layout.flex.align.center`
- `grid` → `layout.grid.container()`
- `grid-cols-2` → `layout.grid.cols(2)`

**Effects:**
- `rounded-lg` → `effects.border.radius.lg`
- `shadow-lg` → `effects.shadow.glass('medium')`
- `backdrop-blur-md` → `effects.backdrop.blur('medium')`

**Transitions:**
- `transition-all` → `transitions.transition.standard('all')`
- `hover:scale-105` → Use `transitions.transition.flow.hover()` + state

### Step 3: Compose Styles

```tsx
const styles = composeStyles(
  glass.surface({ intensity: 'medium' }),
  spacing.p(4),
  spacing.gap(2),
  typography.body(),
  layout.flex.container('row'),
  layout.flex.justify.center,
  effects.shadow.glass('medium'),
  transitions.transition.flow.hover(),
  als.temperature(0.7),
);
```

### Step 4: Apply to Component

```tsx
<div style={styles}>
  Content
</div>
```

---

## Next Components to Migrate

1. ✅ Button (complete)
2. ⏳ Input
3. ⏳ Toggle
4. ⏳ Slider
5. ⏳ Fader
6. ⏳ Meter

---

**Status:** ✅ Proof of concept complete - Design system works!

*Context improved by Giga AI - Used Button component migration as proof of concept for design system usage.*


