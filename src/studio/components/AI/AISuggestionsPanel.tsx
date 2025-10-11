/**
 * AI Suggestions Panel - Shows real-time mixing suggestions
 */

import React from 'react';
import { useBeastModeStore } from '@/store/beastModeStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Volume2,
  Sliders,
  Radio,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AISuggestionsPanel: React.FC = () => {
  const { currentSuggestions, aiSuggestions, removeSuggestion } = useBeastModeStore();
  
  if (!aiSuggestions || currentSuggestions.length === 0) {
    return null;
  }
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'eq': return <Sliders className="w-4 h-4" />;
      case 'compression': return <Radio className="w-4 h-4" />;
      case 'volume': return <Volume2 className="w-4 h-4" />;
      case 'pan': return <Radio className="w-4 h-4" />;
      case 'effect': return <Sparkles className="w-4 h-4" />;
      case 'arrangement': return <TrendingUp className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };
  
  return (
    <Card className="glass border-primary/30 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/30 bg-gradient-to-r from-purple-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold">AI Suggestions</h3>
              <p className="text-[0.65rem] text-muted-foreground">
                {currentSuggestions.length} active recommendation{currentSuggestions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Suggestions List */}
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-2">
          {currentSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="glass-glow rounded p-3 space-y-2 border border-primary/20 hover:border-primary/40 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <div className="text-primary mt-0.5">
                    {getIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium">{suggestion.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {suggestion.trackName}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getConfidenceColor(suggestion.confidence))}
                >
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
              
              {/* Description */}
              <p className="text-xs text-muted-foreground">{suggestion.description}</p>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    suggestion.action();
                    removeSuggestion(suggestion.id);
                  }}
                  className="flex-1 gap-1 h-7 text-xs"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSuggestion(suggestion.id)}
                  className="gap-1 h-7 text-xs"
                >
                  <XCircle className="w-3 h-3" />
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
