# Button System Debug Guide

## Quick Test

Open browser console and run:
```js
// Check if polyfill ran
console.log('Styled buttons:', document.querySelectorAll('button.button-mixx').length);
console.log('Total buttons:', document.querySelectorAll('button').length);

// Check CSS variables
const root = getComputedStyle(document.documentElement);
console.log('--mixx-accent:', root.getPropertyValue('--mixx-accent'));
```

## Common Issues

### 1. Buttons not getting styled
**Check:**
- Open DevTools → Elements → Find a button
- Check if it has `button-mixx` class
- Check console for `[ButtonPolyfill] Applied to X buttons`

**Fix:**
- Ensure polyfill runs: Check `App.tsx` useEffect
- Check CSS import: `src/index.css` should have `@import './styles/mixx-button.css';`
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### 2. Styles being overridden
**Check:**
- Inspect button in DevTools
- Look for inline `style` attributes
- Check if Tailwind classes are overriding

**Fix:**
- CSS uses `!important` for critical properties
- Primary variant should override with gradient
- If still not working, check CSS specificity

### 3. Primary buttons not showing gradient
**Check:**
- Button should have both `button-mixx` and `primary` classes
- Check computed styles in DevTools
- Verify `--mixx-accent` CSS variable is set

**Fix:**
- Ensure class is: `className="button-mixx primary"`
- Check Tailwind config has `mixx-accent` color
- Verify CSS file is loaded (check Network tab)

## Manual Test

1. **Open browser console**
2. **Run test function:**
   ```js
   // Import test function (or paste from testButtonStyles.ts)
   testButtonStyles();
   ```
3. **Check output:**
   - Should show button counts
   - Should show variant breakdown
   - Should show CSS variable status

## Force Apply Styles

If polyfill isn't working, manually apply:
```js
// In browser console
document.querySelectorAll('button').forEach(btn => {
  if (!btn.classList.contains('button-mixx')) {
    btn.classList.add('button-mixx', 'secondary');
  }
});
```

## Verify CSS is Loaded

1. Open DevTools → Network tab
2. Filter by CSS
3. Look for `mixx-button.css`
4. Should show status 200

## Check Specificity

In DevTools, inspect a button and check:
- Which styles are applied (green checkmark)
- Which styles are overridden (strikethrough)
- Computed styles show final values

If `.button-mixx.primary` styles are strikethrough, increase CSS specificity.
