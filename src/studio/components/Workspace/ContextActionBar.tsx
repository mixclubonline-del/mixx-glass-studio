/**
 * Context Action Bar - Bottom toolbar with Bloom menu integration
 */

import React from 'react';
import { Upload, Wand2, TrendingUp, ScissorsLineDashed, Sliders, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewStore } from '@/store/viewStore';

interface ContextActionBarProps {
  onBloomMenuClick?: () => void;
}

export const ContextActionBar: React.FC<ContextActionBarProps> = ({ onBloomMenuClick }) => {
  const togglePanel = useViewStore((state) => state.togglePanel);

  const actions = [
    { icon: Upload, label: 'Import', action: () => togglePanel('browser') },
    { icon: Wand2, label: 'FX', action: () => togglePanel('effects') },
    { icon: TrendingUp, label: 'Automation', action: () => togglePanel('automation') },
    { icon: ScissorsLineDashed, label: 'Split', action: () => {} },
    { icon: Sliders, label: 'Mixer', action: () => togglePanel('mixer') },
  ];

  return (
    <div className="h-[64px] border-t border-border/50 flex items-center justify-between px-8 bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-xl shadow-2xl">
      {/* Left: Context Actions */}
      <div className="flex items-center gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={action.action}
            className="gap-2 hover:bg-gradient-to-r hover:from-primary/15 hover:to-primary/5 transition-all duration-200 px-4 py-2"
          >
            <action.icon className="h-4 w-4" />
            <span className="text-sm font-medium tracking-wide">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Right: Bloom Menu Trigger */}
      <Button
        onClick={onBloomMenuClick}
        className="gap-3 bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 shadow-lg shadow-primary/30 px-6 py-5 text-base font-semibold tracking-wide transition-all duration-300 hover:scale-105"
      >
        <Sparkles className="h-5 w-5 animate-pulse" />
        <span>Bloom Menu</span>
      </Button>
    </div>
  );
};
