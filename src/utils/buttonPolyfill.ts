/**
 * Button Polyfill Script
 * 
 * Automatically applies .button-mixx class to all existing <button> elements
 * without requiring markup changes. Run this once on app initialization.
 * 
 * Usage:
 * ```tsx
 * import { applyButtonPolyfill } from '@/utils/buttonPolyfill';
 * 
 * useEffect(() => {
 *   applyButtonPolyfill();
 * }, []);
 * ```
 */

export function applyButtonPolyfill() {
  const processed = new Set<HTMLElement>();

  const processButton = (btn: HTMLButtonElement) => {
    // Skip if already processed
    if (processed.has(btn) || btn.classList.contains('button-mixx')) {
      return;
    }

    processed.add(btn);

    // Determine variant based on existing classes/content
    const text = btn.textContent?.trim() || '';
    const hasIconOnly = !text && (btn.querySelector('svg') || btn.getAttribute('aria-label'));

    // Add base class
    btn.classList.add('button-mixx');

    // Determine variant
    if (btn.classList.contains('primary') || 
        btn.textContent?.toLowerCase().includes('play') ||
        btn.textContent?.toLowerCase().includes('record') ||
        btn.textContent?.toLowerCase().includes('save')) {
      btn.classList.add('primary');
    } else if (hasIconOnly) {
      btn.classList.add('icon');
    } else if (btn.classList.contains('ghost')) {
      btn.classList.add('ghost');
    } else {
      btn.classList.add('secondary');
    }

    // Ensure keyboard focusability
    if (!btn.hasAttribute('tabindex') && btn.disabled) {
      btn.setAttribute('tabindex', '-1');
    } else if (!btn.hasAttribute('tabindex')) {
      btn.setAttribute('tabindex', '0');
    }

    // Ensure accessibility for icon-only buttons
    if (hasIconOnly && !btn.getAttribute('aria-label') && !btn.getAttribute('title')) {
      console.warn('[ButtonPolyfill] Icon-only button missing aria-label:', btn);
    }
  };

  // Process all existing buttons
  // Use setTimeout to ensure DOM is ready
  const processAll = () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(processButton);
    const styled = document.querySelectorAll('button.button-mixx');
    console.log('[ButtonPolyfill] Applied to', styled.length, 'of', buttons.length, 'buttons');
    
    // Visual debug: Log first few buttons
    if (styled.length > 0) {
      console.log('[ButtonPolyfill] Sample styled buttons:', 
        Array.from(styled).slice(0, 3).map(btn => ({
          text: btn.textContent?.trim() || 'icon',
          classes: Array.from(btn.classList).join(' ')
        }))
      );
    }
  };
  
  // Try immediately, then retry after delay
  processAll();
  setTimeout(processAll, 100);
  setTimeout(processAll, 500);

  // Watch for dynamically added buttons
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // Check if the added node is a button
          if (element.tagName === 'BUTTON') {
            processButton(element as HTMLButtonElement);
          }
          
          // Check for buttons within the added node
          element.querySelectorAll?.('button').forEach(processButton);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
  };
}

/**
 * Manual application for specific buttons
 */
export function applyButtonStyle(button: HTMLButtonElement, variant: 'primary' | 'secondary' | 'ghost' | 'icon' = 'secondary') {
  button.classList.add('button-mixx', variant);
}
