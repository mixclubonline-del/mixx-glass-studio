/**
 * Professional Button Component
 * 
 * Consistent button "dialect" across the whole app.
 * Glassy pill, subtle depth, light-purple accents, pressed/hover states,
 * focus-visible for accessibility, and reduced-motion support.
 */

import React from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-mixx-lg transition-transform duration-150 focus:outline-none focus-visible:shadow-mixx-focus focus-visible:ring-0 disabled:opacity-60 disabled:cursor-not-allowed";

  const sizeMap = {
    sm: "px-2.5 py-1.5 text-sm",
    md: "px-3.5 py-2 text-sm",
    lg: "px-4.5 py-2.5 text-base",
  };

  const variantMap = {
    primary: "bg-gradient-to-b from-mixx-accent to-mixx-accent-strong text-white shadow-mixx-elev hover:shadow-[0_12px_36px_rgba(110,86,255,0.25)]",
    secondary:
      "backdrop-blur-md bg-white/12 border border-white/18 text-mixx-muted hover:bg-white/20",
    ghost:
      "bg-transparent text-mixx-muted hover:bg-white/6",
    icon:
      "p-2 bg-white/6 rounded-lg hover:bg-white/12",
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      className={clsx(
        base,
        sizeMap[size],
        variantMap[variant],
        "active:translate-y-0.5 active:scale-[0.995]",
        "hover:translate-y-[-2px]",
        "motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none",
        className
      )}
    >
      {children}
    </button>
  );
}
