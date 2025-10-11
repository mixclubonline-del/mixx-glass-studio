/**
 * Beast Mode Control Panel - Toggle AI enhancement features
 */

import React from 'react';
import { useBeastModeStore, type BeastModeLevel } from '@/store/beastModeStore';
import { primeBrain } from '@/ai/primeBrain';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Brain, 
  Eye, 
  Lightbulb, 
  Sparkles, 
  Activity,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const BeastModePanel: React.FC = () => {
  const {
    level,
    isActive,
    visualEnhancement,
    aiSuggestions,
    autoEnhance,
    predictivePreload,
    ambientIntensity,
    confidenceScore,
    processingActivity,
    setLevel,
    toggleFeature,
    setAmbientIntensity,
  } = useBeastModeStore();
  
  const [expanded, setExpanded] = React.useState(false);
  const [status, setStatus] = React.useState<any>(null);
  
  // Update status periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      const primeStatus = primeBrain.getStatus();
      setStatus(primeStatus);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const levels: { value: BeastModeLevel; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'off', label: 'Off', icon: <Eye className="w-4 h-4" />, color: 'text-muted-foreground' },
    { value: 'observe', label: 'Observe', icon: <Eye className="w-4 h-4" />, color: 'text-blue-400' },
    { value: 'suggest', label: 'Suggest', icon: <Lightbulb className="w-4 h-4" />, color: 'text-yellow-400' },
    { value: 'enhance', label: 'Enhance', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-400' },
    { value: 'beast', label: 'BEAST', icon: <Zap className="w-4 h-4" />, color: 'text-red-400' },
  ];
  
  return (
    <Card className="glass border-primary/30 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className={cn(
              "w-5 h-5 transition-all",
              isActive ? "text-primary animate-pulse" : "text-muted-foreground"
            )} />
            <div>
              <h3 className="text-sm font-bold">Prime Beast Mode</h3>
              <p className="text-[0.65rem] text-muted-foreground">
                AI Enhancement System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
              {level.toUpperCase()}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Level Selector */}
      <div className="p-3 space-y-3">
        <div className="flex gap-1">
          {levels.map((lvl) => (
            <Button
              key={lvl.value}
              variant={level === lvl.value ? "default" : "outline"}
              size="sm"
              onClick={() => setLevel(lvl.value)}
              className={cn(
                "flex-1 gap-1 transition-all",
                level === lvl.value && "shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
              )}
            >
              <span className={cn(level === lvl.value ? "text-primary-foreground" : lvl.color)}>
                {lvl.icon}
              </span>
              <span className="text-xs">{lvl.label}</span>
            </Button>
          ))}
        </div>
        
        {/* Confidence Score */}
        {isActive && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">AI Confidence</span>
              <span className="text-primary font-mono">{Math.round(confidenceScore * 100)}%</span>
            </div>
            <Progress value={confidenceScore * 100} className="h-1" />
          </div>
        )}
      </div>
      
      {/* Expanded Controls */}
      {expanded && (
        <div className="p-3 space-y-4 border-t border-border/30 bg-background/50">
          {/* Feature Toggles */}
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2">
              <Settings2 className="w-3 h-3" />
              Features
            </label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Visual Enhancement</span>
                <Switch
                  checked={visualEnhancement}
                  onCheckedChange={() => toggleFeature('visualEnhancement')}
                  disabled={!isActive}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">AI Suggestions</span>
                <Switch
                  checked={aiSuggestions}
                  onCheckedChange={() => toggleFeature('aiSuggestions')}
                  disabled={!isActive}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Auto Enhance</span>
                <Switch
                  checked={autoEnhance}
                  onCheckedChange={() => toggleFeature('autoEnhance')}
                  disabled={!isActive}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Predictive Preload</span>
                <Switch
                  checked={predictivePreload}
                  onCheckedChange={() => toggleFeature('predictivePreload')}
                  disabled={!isActive}
                />
              </div>
            </div>
          </div>
          
          {/* Ambient Intensity */}
          {visualEnhancement && (
            <div className="space-y-2">
              <label className="text-xs font-medium">Ambient Intensity</label>
              <Slider
                value={[ambientIntensity * 100]}
                onValueChange={([value]) => setAmbientIntensity(value / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}
          
          {/* Processing Activity */}
          {processingActivity.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-2">
                <Activity className="w-3 h-3 animate-pulse" />
                Processing
              </label>
              <div className="space-y-1">
                {processingActivity.map((activity) => (
                  <div key={activity.id} className="text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{activity.description}</span>
                      <span>{Math.round(activity.progress * 100)}%</span>
                    </div>
                    <Progress value={activity.progress * 100} className="h-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Status Info */}
          {status && (
            <div className="text-[0.65rem] text-muted-foreground space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Control History:</span>
                <span>{status.controlHistory}</span>
              </div>
              <div className="flex justify-between">
                <span>Audio Buffer:</span>
                <span>{status.audioBuffer}</span>
              </div>
              <div className="flex justify-between">
                <span>Mood:</span>
                <span className="text-primary">{status.ambientState?.mood}</span>
              </div>
              <div className="flex justify-between">
                <span>Energy:</span>
                <span className="text-primary">
                  {(status.ambientState?.energy * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
