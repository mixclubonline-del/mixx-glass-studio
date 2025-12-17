/**
 * AURA Button Component
 * 
 * Professional button with AURA Design System styling.
 * Glassy pill, subtle depth, AURA palette accents, pressed/hover states,
 * focus-visible for accessibility, and reduced-motion support.
 */

import React from "react";
import clsx from "clsx";
import { 
  AuraPalette, 
  AuraEffects, 
  auraAlpha 
} from "../../theme/aura-tokens";

// Extract palette colors
const { violet, cyan, indigo } = AuraPalette;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "icon" | "aura";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const sizeMap = {
    sm: "px-2.5 py-1.5 text-sm",
    md: "px-3.5 py-2 text-sm",
    lg: "px-4.5 py-2.5 text-base",
  };

  // Standard Tailwind variants
  const variantClassMap: Record<string, string> = {
    primary: "text-white shadow-lg",
    secondary: "backdrop-blur-md border text-white/80",
    ghost: "bg-transparent hover:bg-white/6",
    icon: "p-2 rounded-lg",
    aura: "text-white shadow-lg border",
  };

  // AURA-specific inline styles for complex gradients
  const variantStyleMap: Record<string, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(180deg, ${violet.DEFAULT} 0%, ${indigo.DEFAULT} 100%)`,
      boxShadow: AuraEffects.glow.md,
    },
    secondary: {
      background: auraAlpha(indigo[900], 0.4),
      borderColor: auraAlpha(violet.DEFAULT, 0.25),
    },
    ghost: {
      color: auraAlpha(violet[300], 0.8),
    },
    icon: {
      background: auraAlpha(violet[900], 0.3),
    },
    aura: {
      background: `linear-gradient(135deg, 
        ${auraAlpha(violet.DEFAULT, 0.8)} 0%, 
        ${auraAlpha(cyan.DEFAULT, 0.6)} 50%,
        ${auraAlpha(violet.DEFAULT, 0.8)} 100%
      )`,
      backgroundSize: '200% 200%',
      borderColor: auraAlpha(violet.DEFAULT, 0.4),
      boxShadow: AuraEffects.auraGlow.medium,
      animation: 'aura-holographic 4s ease infinite',
    },
  };

  // Hover styles applied via pseudo-class would need CSS, 
  // so we use onMouseEnter/Leave for dynamic styles
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const getHoverStyle = (): React.CSSProperties => {
    if (!isHovered || disabled) return {};
    
    switch (variant) {
      case 'primary':
      case 'aura':
        return {
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: AuraEffects.auraGlow.intense,
        };
      case 'secondary':
        return {
          background: auraAlpha(indigo[800], 0.5),
          borderColor: auraAlpha(violet.DEFAULT, 0.4),
        };
      case 'icon':
        return {
          background: auraAlpha(violet[800], 0.4),
        };
      default:
        return {};
    }
  };

  const getPressedStyle = (): React.CSSProperties => {
    if (!isPressed || disabled) return {};
    return {
      transform: 'translateY(1px) scale(0.98)',
    };
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      className={clsx(
        base,
        sizeMap[size],
        variantClassMap[variant],
        "motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none",
        className
      )}
      style={{
        ...variantStyleMap[variant],
        ...getHoverStyle(),
        ...getPressedStyle(),
        ...style,
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        rest.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        setIsPressed(false);
        rest.onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        setIsPressed(true);
        rest.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setIsPressed(false);
        rest.onMouseUp?.(e);
      }}
    >
      {children}
    </button>
  );
}

// Named export for convenience
export { Button };
