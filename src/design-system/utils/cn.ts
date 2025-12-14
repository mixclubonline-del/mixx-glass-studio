/**
 * MixxGlass Class Name Utility
 * 
 * Utility for conditionally joining class names
 * Similar to clsx/tailwind-merge but for our design system
 */

type ClassValue = string | number | boolean | undefined | null | Record<string, boolean> | ClassValue[];

/**
 * Conditionally join class names
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}


