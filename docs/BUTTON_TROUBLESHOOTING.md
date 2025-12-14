# Button System Troubleshooting

## Quick Checks

### 1. Verify CSS is loaded
Look at the **bottom-right corner** of your browser window. You should see a small purple badge that says "Button CSS loaded". If you don't see it:
- CSS file might not be loading
- Check browser console for errors
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### 2. Check console for polyfill
Open browser console (F12) and look for:
```
[ButtonPolyfill] Applied to X of Y buttons
```
If you don't see this:
- Polyfill might not be running
- Check `App.tsx` useEffect
- Check for JavaScript errors

### 3. Inspect a button
1. Right-click any button → Inspect
2. Check if it has `button-mixx` class
3. Check computed styles for:
   - `backdrop-filter: blur(8px)`
   - `background` (should be gradient for primary)
   - `box-shadow`

## Common Fixes

### CSS not loading
**Symptom:** No purple badge, buttons look unchanged

**Fix:**
1. Check `src/index.css` has: `@import './styles/mixx-button.css';`
2. Restart dev server: `npm run dev`
3. Clear browser cache
4. Check Network tab → look for `mixx-button.css` → should be 200 status

### Polyfill not running
**Symptom:** No console log, buttons don't have `button-mixx` class

**Fix:**
1. Check `src/App.tsx` line ~1232 has the useEffect
2. Check console for errors
3. Manually run in console:
   ```js
   document.querySelectorAll('button').forEach(btn => {
     btn.classList.add('button-mixx', 'secondary');
   });
   ```

### Styles being overridden
**Symptom:** Buttons have `button-mixx` class but look unchanged

**Fix:**
1. Check if inline `style` attributes are overriding
2. Check if Tailwind classes are conflicting
3. CSS uses `!important` but inline styles win
4. Solution: Remove conflicting inline styles or update components

### Primary buttons not showing gradient
**Symptom:** Primary buttons look like secondary

**Fix:**
1. Verify button has BOTH classes: `button-mixx primary`
2. Check CSS variable: `--mixx-accent` should be `#8B7BFF`
3. In DevTools, check computed `background` property
4. If overridden, check what's overriding it

## Manual Test

Paste this in browser console:
```js
// Create test button
const test = document.createElement('button');
test.className = 'button-mixx primary';
test.textContent = 'TEST';
test.style.position = 'fixed';
test.style.top = '10px';
test.style.right = '10px';
test.style.zIndex = '99999';
document.body.appendChild(test);

// Check styles
const styles = window.getComputedStyle(test);
console.log('Background:', styles.background);
console.log('Backdrop filter:', styles.backdropFilter);
console.log('Box shadow:', styles.boxShadow);

// If this button looks styled, CSS is working
// If not, CSS isn't loading or being overridden
```

## Force Apply (Temporary)

If nothing else works, manually apply to all buttons:
```js
// In browser console
document.querySelectorAll('button').forEach(btn => {
  btn.classList.add('button-mixx');
  if (!btn.classList.contains('primary') && 
      !btn.classList.contains('icon') && 
      !btn.classList.contains('ghost')) {
    btn.classList.add('secondary');
  }
});
```

## Next Steps

1. **Check the purple badge** (bottom-right) - confirms CSS loaded
2. **Check console logs** - confirms polyfill ran
3. **Inspect a button** - confirms classes applied
4. **Run manual test** - creates visible test button

If all checks pass but still no visual change, the issue is likely:
- Inline styles overriding CSS
- Tailwind classes conflicting
- Need to restart dev server
