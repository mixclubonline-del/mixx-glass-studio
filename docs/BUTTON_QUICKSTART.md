# Button System Quick Start

## Immediate Application (5 minutes)

### Step 1: CSS is Already Imported ✅

The button styles are already imported in `src/index.css`. All you need to do is apply the polyfill.

### Step 2: Add Polyfill to App Initialization

In `src/App.tsx`, add this near the top of your component:

```tsx
import { applyButtonPolyfill } from './utils/buttonPolyfill';

// Inside your FlowRuntime component (or main App component):
useEffect(() => {
  applyButtonPolyfill();
}, []);
```

This will automatically style ALL existing buttons immediately.

### Step 3: Mark Critical Buttons as Primary

For mission-critical buttons (Play, Record, Save, Bloom), add the `primary` class:

```tsx
// In your transport/play button
<button className="primary" onClick={handlePlay}>
  Play
</button>

// Or use the React component
import { Button } from './components/ui';

<Button variant="primary" onClick={handlePlay}>
  Play
</Button>
```

## Using the React Component (Recommended for New Code)

```tsx
import { Button } from '@/components/ui';

// Primary (strong affordance)
<Button variant="primary" onClick={handlePlay}>
  <PlayIcon />
  Play
</Button>

// Secondary (default glass)
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

// Icon-only (must have aria-label)
<Button variant="icon" aria-label="Mute" onClick={handleMute}>
  <MuteIcon />
</Button>
```

## What Gets Styled Automatically

The polyfill automatically:
- ✅ Finds all `<button>` elements
- ✅ Adds `.button-mixx` base class
- ✅ Detects variant (primary if text contains "play", "record", "save")
- ✅ Detects icon-only buttons (no text, has SVG or aria-label)
- ✅ Ensures keyboard accessibility
- ✅ Watches for dynamically added buttons

## Manual Override

If you need to manually set a variant:

```tsx
import { applyButtonStyle } from './utils/buttonPolyfill';

const buttonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (buttonRef.current) {
    applyButtonStyle(buttonRef.current, 'primary');
  }
}, []);
```

## Next Steps

1. ✅ CSS imported - DONE
2. ⏳ Add polyfill to App.tsx - DO THIS NOW
3. ⏳ Mark 5 critical buttons as `primary` - DO THIS NOW
4. ⏳ Run accessibility audit - DO THIS NEXT

## Testing

After adding the polyfill, check:
- [ ] All buttons have glass aesthetic
- [ ] Hover states work (lift effect)
- [ ] Active states work (press down)
- [ ] Focus-visible ring appears on Tab navigation
- [ ] Icon-only buttons have aria-label
- [ ] Disabled buttons are visually distinct
