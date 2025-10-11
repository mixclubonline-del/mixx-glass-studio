/**
 * A/B Compare - Compare two mix versions
 */

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBetaFeaturesStore } from '@/store/betaFeaturesStore';
import { GitCompare, Play, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ABCompare: React.FC = () => {
  const {
    compareMode,
    versionA,
    versionB,
    activeVersion,
    switchVersion,
    exitCompareMode,
  } = useBetaFeaturesStore();
  
  // Keyboard shortcut for switching
  useEffect(() => {
    if (!compareMode) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        switchVersion();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [compareMode, switchVersion]);
  
  if (!compareMode || !versionA || !versionB) {
    return null;
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <Card className="glass border-primary/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <h3 className="text-sm font-bold">A/B Compare Mode</h3>
            <p className="text-xs text-muted-foreground">Press Space to switch</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exitCompareMode}
          className="gap-2"
        >
          <Square className="w-3 h-3" />
          Exit
        </Button>
      </div>
      
      {/* Version Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Version A */}
        <div
          className={cn(
            "p-3 rounded border transition-all cursor-pointer",
            activeVersion === 'A'
              ? "bg-primary/20 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              : "bg-background/50 border-border opacity-50 hover:opacity-75"
          )}
          onClick={activeVersion === 'B' ? switchVersion : undefined}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={activeVersion === 'A' ? 'default' : 'outline'} className="text-xs">
                Version A
              </Badge>
              {activeVersion === 'A' && (
                <Play className="w-4 h-4 text-primary animate-pulse" />
              )}
            </div>
            <h4 className="text-sm font-medium truncate">{versionA.name}</h4>
            <p className="text-xs text-muted-foreground">
              {formatDate(versionA.timestamp)}
            </p>
            {versionA.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {versionA.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Version B */}
        <div
          className={cn(
            "p-3 rounded border transition-all cursor-pointer",
            activeVersion === 'B'
              ? "bg-accent/20 border-accent shadow-[0_0_20px_hsl(var(--accent)/0.3)]"
              : "bg-background/50 border-border opacity-50 hover:opacity-75"
          )}
          onClick={activeVersion === 'A' ? switchVersion : undefined}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={activeVersion === 'B' ? 'default' : 'outline'} className="text-xs bg-accent text-accent-foreground">
                Version B
              </Badge>
              {activeVersion === 'B' && (
                <Play className="w-4 h-4 text-accent animate-pulse" />
              )}
            </div>
            <h4 className="text-sm font-medium truncate">{versionB.name}</h4>
            <p className="text-xs text-muted-foreground">
              {formatDate(versionB.timestamp)}
            </p>
            {versionB.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {versionB.description}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Switch Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={switchVersion}
        className="w-full gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Switch to {activeVersion === 'A' ? 'Version B' : 'Version A'}
        <span className="text-xs text-muted-foreground ml-auto">SPACE</span>
      </Button>
      
      {/* Active Indicator */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div
          className={cn(
            "h-2 w-2 rounded-full transition-all",
            activeVersion === 'A' ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-muted"
          )}
        />
        <span className="text-xs font-medium text-muted-foreground">A / B</span>
        <div
          className={cn(
            "h-2 w-2 rounded-full transition-all",
            activeVersion === 'B' ? "bg-accent shadow-[0_0_10px_hsl(var(--accent))]" : "bg-muted"
          )}
        />
      </div>
    </Card>
  );
};
