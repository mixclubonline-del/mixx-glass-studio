/**
 * Always Visible AI Panel - Persistent PrimeBrain assistant
 */

import React from 'react';
import { Sparkles, Lightbulb, Wand2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AlwaysVisibleAIPanel: React.FC = () => {
  const suggestions = [
    {
      icon: <Lightbulb className="h-4 w-4" />,
      title: "Add Reverb",
      description: "Track 2 sounds dry. Try adding a plate reverb for depth.",
    },
    {
      icon: <Wand2 className="h-4 w-4" />,
      title: "Adjust EQ",
      description: "Bass frequencies are competing. Cut 200Hz on Track 1.",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: "Compress Vocals",
      description: "Vocals need consistency. Apply 3:1 ratio compression.",
    },
  ];

  return (
    <div className="w-[320px] border-l border-border/50 bg-background/60 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="h-[80px] border-b border-border/30 flex items-center justify-center gap-3 px-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="relative">
          <Brain className="h-6 w-6 text-primary animate-pulse" />
          <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent tracking-tight">
          PrimeBrain
        </h3>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* AI Status */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/30 shadow-lg shadow-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-semibold tracking-wide">Listening...</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Analyzing your mix in real-time. I'll suggest improvements as you work.
            </p>
          </div>

          {/* Suggestions */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suggestions
            </h4>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full p-4 rounded-xl bg-gradient-to-br from-muted/20 to-muted/5 hover:from-muted/30 hover:to-muted/10 border border-border/20 hover:border-primary/30 transition-all duration-300 text-left group shadow-sm hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary group-hover:scale-125 transition-transform duration-300">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-1.5 tracking-wide">{suggestion.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {suggestion.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                Auto-Master
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Mix Analysis
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Stem Separate
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Voice Isolate
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
