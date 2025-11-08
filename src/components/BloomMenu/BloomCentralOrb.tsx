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
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-lg",
          "bg-gradient-radial from-primary/15 via-accent/10 to-transparent"
        )}
        style={{
          opacity: isOpen ? 1 : 0.4,
          transform: isOpen ? 'scale(1.3)' : 'scale(1)',
          transition: 'all 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}
      />
      
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-md",
          "bg-gradient-radial from-primary/20 via-accent/15 to-transparent"
        )}
        style={{
          opacity: isOpen ? 0.8 : 0.3,
          transform: isOpen ? 'scale(1.15)' : 'scale(1)',
          transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}
      />

      {/* Main orb */}
      <button
        className={cn(
          "relative w-16 h-16 rounded-full",
          "glass-ultra border border-primary/20",
          "flex items-center justify-center",
          "cursor-grab active:cursor-grabbing",
          "group",
          isOpen && "bloom-orb-open",
          isSubMenu && "bloom-orb-submenu"
        )}
        style={{
          transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), border-color 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.2)';
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        {/* Inner core with rotation */}
        <div className={cn(
          "absolute inset-3 rounded-full",
          "bg-gradient-conic from-primary via-accent to-primary",
          "opacity-10 blur-sm",
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
          "absolute top-2 left-2 w-6 h-6 rounded-full",
          "bg-gradient-radial from-white/20 to-transparent",
          "blur-sm opacity-40",
          "group-hover:opacity-60 transition-opacity duration-300"
        )} />
      </button>
    </div>
  );
};
