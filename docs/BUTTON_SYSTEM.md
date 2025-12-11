# Professional Button System

## Overview

A consistent button "dialect" across the whole app with glassy pill design, subtle depth, light-purple accents, pressed/hover states, focus-visible for accessibility, and reduced-motion support.

## Two Implementation Options

### 1. React + Tailwind Button Component (Recommended)

**Location:** `src/components/ui/Button.tsx`

**Usage:**
```tsx
import { Button } from '@/components/ui';

// Primary (gradient, strong affordance)
<Button variant="primary">Play</Button>
<Button variant="primary" size="lg">Record</Button>

// Secondary (glass, default)
<Button variant="secondary">Select</Button>
<Button variant="secondary" size="sm">Cancel</Button>

// Ghost (transparent, subtle)
<Button variant="ghost">More Options</Button>

// Icon-only
<Button variant="icon" aria-label="Mute">
  <MuteIcon />
</Button>
```

**Variants:**
- `primary` - Gradient background (`#8B7BFF` → `#6E56FF`), white text, stronger shadow
- `secondary` - Glass background with backdrop blur, muted text (default)
- `ghost` - Transparent, subtle hover
- `icon` - Square icon-only button (40x40px)

**Sizes:**
- `sm` - Small (px-2.5 py-1.5, text-sm)
- `md` - Medium (px-3.5 py-2, text-sm) - default
- `lg` - Large (px-4.5 py-2.5, text-base)

**Features:**
- ✅ Hover lift effect (`translateY(-2px)`)
- ✅ Active press down (`translateY(0.5px) scale(0.995)`)
- ✅ Focus-visible ring for keyboard navigation
- ✅ Disabled states (opacity + cursor)
- ✅ Reduced motion support
- ✅ Full TypeScript support

### 2. Plain CSS + JS Polyfill (Immediate Global Application)

**Location:** `src/styles/mixx-button.css`

**Automatic Application:**
```tsx
import { applyButtonPolyfill } from '@/utils/buttonPolyfill';

// In your app initialization (e.g., App.tsx or main.tsx)
useEffect(() => {
  applyButtonPolyfill();
}, []);
```

This automatically:
- Finds all `<button>` elements
- Adds `.button-mixx` class
- Determines variant (primary/secondary/ghost/icon) based on content/classes
- Ensures keyboard accessibility
- Watches for dynamically added buttons

**Manual Application:**
```tsx
import { applyButtonStyle } from '@/utils/buttonPolyfill';

const buttonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (buttonRef.current) {
    applyButtonStyle(buttonRef.current, 'primary');
  }
}, []);
```

**CSS Classes:**
- `.button-mixx` - Base class (applied automatically)
- `.button-mixx.primary` - Primary variant
- `.button-mixx.secondary` - Secondary variant (default)
- `.button-mixx.ghost` - Ghost variant
- `.button-mixx.icon` - Icon-only variant

## Tailwind Tokens

Added to `tailwind.config.ts`:

```ts
colors: {
  'mixx-bg': '#F6F6FA',
  'mixx-glass-tint': 'rgba(238,232,255,0.56)',
  'mixx-accent': '#8B7BFF',
  'mixx-accent-strong': '#6E56FF',
  'mixx-muted': '#4B4B57',
},
boxShadow: {
  'mixx-elev': '0 8px 30px rgba(26,21,44,0.08)',
  'mixx-focus': '0 0 0 4px rgba(110,86,255,0.12)',
},
borderRadius: {
  'mixx-lg': '12px',
  'mixx-xl': '14px',
},
```

## Accessibility Requirements

### Non-Negotiables

1. **Icon-only buttons MUST have accessible name:**
   ```tsx
   <Button variant="icon" aria-label="Mute">
     <MuteIcon />
   </Button>
   ```
   - `aria-label` is required
   - `title` is helpful but not sufficient

2. **Focus-visible styles:**
   - Keyboard users get visible focus ring
   - Mouse-only users don't see focus glow
   - Uses `:focus-visible` pseudo-class

3. **Disabled states:**
   - Visual: `opacity: 0.52`
   - Functional: `disabled` attribute
   - Cursor: `not-allowed`

4. **Use semantic HTML:**
   - Prefer `<button>` over `<div role="button">`
   - Only use `role="button"` for non-button elements

## Rollout Strategy

### Phase 1: Immediate Global Application (CSS Polyfill)

1. ✅ CSS file already imported in `src/index.css`
2. Add polyfill to app initialization:
   ```tsx
   // In App.tsx or main.tsx
   import { applyButtonPolyfill } from '@/utils/buttonPolyfill';
   
   useEffect(() => {
     applyButtonPolyfill();
   }, []);
   ```
3. This gives immediate visual upgrade across entire app

### Phase 2: Critical Buttons (React Component)

Replace mission-critical buttons with React component:

1. **Play button** - `variant="primary"`
2. **Record button** - `variant="primary"`
3. **Bloom Menu trigger** - `variant="primary"` or `variant="icon"`
4. **Save button** - `variant="primary"`
5. **Recall last import** - `variant="primary"`

### Phase 3: Gradual Migration

- Replace buttons in high-traffic areas first
- Use React component for new buttons
- Keep CSS polyfill for legacy buttons until migration complete

## Finding High-Usage Buttons

Quick console command to find most-used buttons:

```js
// In browser console
const buttons = Array.from(document.querySelectorAll('button'));
const textCounts = {};
buttons.forEach(btn => {
  const text = btn.textContent?.trim() || 'icon';
  textCounts[text] = (textCounts[text] || 0) + 1;
});
Object.entries(textCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
```

## Design Tokens Reference

```css
--mixx-bg: #F6F6FA
--mixx-glass-tint: rgba(238,232,255,0.56)
--mixx-accent: #8B7BFF
--mixx-accent-strong: #6E56FF
--mixx-muted: #4B4B57
--mixx-elev: 0 8px 30px rgba(26,21,44,0.08)
--mixx-focus: 0 0 0 4px rgba(110,86,255,0.12)
--btn-radius: 12px
```

## Examples

### Transport Controls
```tsx
<Button variant="primary" onClick={handlePlayPause}>
  {isPlaying ? <PauseIcon /> : <PlayIcon />}
  {isPlaying ? 'Pause' : 'Play'}
</Button>
```

### Bloom Menu
```tsx
<Button variant="icon" aria-label="Open Bloom Menu" onClick={openBloom}>
  <BloomIcon />
</Button>
```

### Save Status
```tsx
<Button variant="primary" disabled={!hasChanges} onClick={handleSave}>
  <SaveIcon />
  Save Project
</Button>
```

### Secondary Actions
```tsx
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>
<Button variant="ghost" onClick={handleMore}>
  More Options
</Button>
```

## Testing Checklist

- [ ] All icon-only buttons have `aria-label`
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus-visible ring appears on keyboard focus
- [ ] Disabled buttons are visually distinct and non-interactive
- [ ] Reduced motion preference is respected
- [ ] Hover states work on all variants
- [ ] Active states provide tactile feedback
- [ ] Primary buttons stand out from secondary
- [ ] Glass aesthetic is consistent across variants
