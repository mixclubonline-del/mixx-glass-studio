/**
 * Timeline Tooltip - Context-aware tooltips for timeline features
 */

import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface TimelineTooltipProps {
  feature: 'snap' | 'ripple' | 'tools' | 'automation' | 'takes' | 'groups' | 'templates';
  children?: React.ReactNode;
}

const tooltipContent = {
  snap: {
    title: 'Snap to Grid',
    description: 'Aligns regions to grid lines, region edges, or zero-crossings',
    shortcuts: ['Click to cycle modes', 'Grid → Magnetic → Zero-Crossing'],
  },
  ripple: {
    title: 'Ripple Edit Mode',
    description: 'Automatically shifts subsequent regions when editing',
    shortcuts: ['Cmd+Shift+R to toggle', 'Affects move and delete operations'],
  },
  tools: {
    title: 'Editing Tools',
    description: 'Specialized tools for different editing tasks',
    shortcuts: ['1-5 for quick tool switching', 'Each tool has unique behavior'],
  },
  automation: {
    title: 'Automation Lanes',
    description: 'Draw parameter automation directly on timeline',
    shortcuts: ['Click to add points', 'Drag to modify', 'Delete to remove'],
  },
  takes: {
    title: 'Take Lanes',
    description: 'Record and comp multiple takes per region',
    shortcuts: ['Expand to see all takes', 'Click to select active take'],
  },
  groups: {
    title: 'Track Groups',
    description: 'Group tracks with unified VCA control',
    shortcuts: ['Select tracks and create group', 'VCA fader controls all'],
  },
  templates: {
    title: 'Track Templates',
    description: 'Save and load complete session configurations',
    shortcuts: ['Quick session setup', 'Custom workflow presets'],
  },
};

export const TimelineTooltip: React.FC<TimelineTooltipProps> = ({ feature, children }) => {
  const content = tooltipContent[feature];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-accent/50 transition-colors">
              <HelpCircle className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{content.title}</h4>
            <p className="text-xs text-muted-foreground">{content.description}</p>
            {content.shortcuts.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border/50">
                {content.shortcuts.map((shortcut, i) => (
                  <p key={i} className="text-xs font-mono text-primary/80">
                    {shortcut}
                  </p>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
