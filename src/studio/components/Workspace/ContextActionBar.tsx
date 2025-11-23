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
    <div className="h-[64px] border-t border-border/50 flex items-center justify-between px-6 bg-background/95 backdrop-blur-xl">
      {/* Left: Context Actions */}
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={action.action}
            className="gap-2 hover:bg-primary/10"
          >
            <action.icon className="h-4 w-4" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Right: Bloom Menu Trigger */}
      <Button
        onClick={onBloomMenuClick}
        className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Bloom Menu</span>
      </Button>
    </div>
  );
};
