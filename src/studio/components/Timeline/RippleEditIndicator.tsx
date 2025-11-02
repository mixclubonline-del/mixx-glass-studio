/**
 * Ripple Edit Indicator - Shows when ripple mode is active
 */

import React from 'react';
import { Waves } from 'lucide-react';

interface RippleEditIndicatorProps {
  active: boolean;
}

export const RippleEditIndicator: React.FC<RippleEditIndicatorProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-ultra px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in">
      <Waves size={16} className="text-accent animate-pulse" />
      <span className="text-sm font-medium text-foreground">Ripple Edit Mode</span>
      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
    </div>
  );
};
