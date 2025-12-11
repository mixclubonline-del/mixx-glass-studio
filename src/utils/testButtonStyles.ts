/**
 * Test utility to verify button styles are working
 * Run this in browser console to check button styling
 */

export function testButtonStyles() {
  const buttons = document.querySelectorAll('button');
  const styled = document.querySelectorAll('button.button-mixx');
  
  console.log('=== Button Style Test ===');
  console.log(`Total buttons: ${buttons.length}`);
  console.log(`Styled buttons (.button-mixx): ${styled.length}`);
  console.log(`Coverage: ${((styled.length / buttons.length) * 100).toFixed(1)}%`);
  
  // Check variants
  const primary = document.querySelectorAll('button.button-mixx.primary');
  const secondary = document.querySelectorAll('button.button-mixx.secondary');
  const icon = document.querySelectorAll('button.button-mixx.icon');
  const ghost = document.querySelectorAll('button.button-mixx.ghost');
  
  console.log('\nVariants:');
  console.log(`  Primary: ${primary.length}`);
  console.log(`  Secondary: ${secondary.length}`);
  console.log(`  Icon: ${icon.length}`);
  console.log(`  Ghost: ${ghost.length}`);
  
  // Check for buttons without styles
  const unstyled = Array.from(buttons).filter(btn => !btn.classList.contains('button-mixx'));
  if (unstyled.length > 0) {
    console.log(`\n⚠️  ${unstyled.length} buttons without .button-mixx class:`);
    unstyled.slice(0, 5).forEach(btn => {
      console.log(`  - ${btn.textContent?.trim() || 'icon'} (${btn.className || 'no class'})`);
    });
  }
  
  // Check CSS variables
  const root = getComputedStyle(document.documentElement);
  const accent = root.getPropertyValue('--mixx-accent').trim();
  console.log(`\nCSS Variables:`);
  console.log(`  --mixx-accent: ${accent || 'NOT SET'}`);
  
  return {
    total: buttons.length,
    styled: styled.length,
    variants: {
      primary: primary.length,
      secondary: secondary.length,
      icon: icon.length,
      ghost: ghost.length,
    },
    unstyled: unstyled.length,
  };
}

// Auto-run in browser console
if (typeof window !== 'undefined') {
  (window as any).testButtonStyles = testButtonStyles;
}
