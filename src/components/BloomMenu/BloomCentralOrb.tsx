/**
 * Bloom Central Orb - Glowing central sphere
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface BloomCentralOrbProps {
  isOpen: boolean;
  isSubMenu: boolean;
  onClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
}

export const BloomCentralOrb: React.FC<BloomCentralOrbProps> = ({
  isOpen,
  isSubMenu,
  onClick,
  onMouseDown,
  icon
}) => {
  return (
    <div className="relative">
      {/* Outer glow rings */}
      <div className={cn(
        "absolute inset-0 rounded-full blur-xl transition-all duration-700",
        "bg-gradient-radial from-primary/30 via-accent/20 to-transparent",
        isOpen && "scale-150 opacity-100",
        !isOpen && "scale-100 opacity-60"
      )} />
      
      <div className={cn(
        "absolute inset-0 rounded-full blur-lg transition-all duration-500",
        "bg-gradient-radial from-primary/40 via-accent/30 to-transparent",
        isOpen && "scale-125 opacity-100 animate-pulse",
        !isOpen && "scale-100 opacity-40"
      )} />

      {/* Main orb */}
      <button
        className={cn(
          "relative w-20 h-20 rounded-full",
          "glass-ultra border border-primary/30",
          "flex items-center justify-center",
          "transition-all duration-600 cursor-grab active:cursor-grabbing",
          "hover:scale-110 hover:border-primary/50",
          "group",
          isOpen && "bloom-orb-open",
          isSubMenu && "bloom-orb-submenu"
        )}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        {/* Inner core with rotation */}
        <div className={cn(
          "absolute inset-2 rounded-full",
          "bg-gradient-conic from-primary via-accent to-primary",
          "opacity-20 blur-sm",
          isOpen && "animate-spin-slow"
        )} />
        
        {/* Icon or pattern */}
        <div className="relative z-10 text-foreground group-hover:scale-110 transition-transform duration-300">
          {icon || (
            <div className="w-6 h-6 relative">
              <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping opacity-50" />
              <div className="absolute inset-0 border-2 border-primary rounded-full" />
              <div className="absolute inset-2 border-2 border-accent rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Highlight glare */}
        <div className={cn(
          "absolute top-2 left-2 w-8 h-8 rounded-full",
          "bg-gradient-radial from-white/40 to-transparent",
          "blur-sm opacity-60",
          "group-hover:opacity-100 transition-opacity duration-300"
        )} />
      </button>
    </div>
  );
};
