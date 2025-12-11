/**
 * MixxGlass Style Composer
 * 
 * Utility for composing multiple style objects into one
 * Handles conflicts and merges properly
 */

import type { CSSProperties } from 'react';

/**
 * Compose multiple style objects into one
 * Later styles override earlier ones
 */
export function composeStyles(...styles: (CSSProperties | undefined | null | false)[]): CSSProperties {
  return styles.reduce((acc, style) => {
    if (!style) return acc;
    return { ...acc, ...style };
  }, {} as CSSProperties);
}

/**
 * Conditional style composition
 */
export function conditionalStyle(
  condition: boolean,
  style: CSSProperties
): CSSProperties | undefined {
  return condition ? style : undefined;
}

/**
 * Style builder pattern for fluent API
 */
export class StyleBuilder {
  private styles: CSSProperties = {};

  /**
   * Add style object
   */
  add(style: CSSProperties | undefined | null | false): this {
    if (style) {
      this.styles = { ...this.styles, ...style };
    }
    return this;
  }

  /**
   * Add conditional style
   */
  addIf(condition: boolean, style: CSSProperties): this {
    if (condition) {
      this.styles = { ...this.styles, ...style };
    }
    return this;
  }

  /**
   * Build final style object
   */
  build(): CSSProperties {
    return this.styles;
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.styles = {};
    return this;
  }
}

/**
 * Create a new style builder
 */
export function createStyleBuilder(): StyleBuilder {
  return new StyleBuilder();
}

/**
 * Shorthand for composing styles
 */
export const style = composeStyles;


