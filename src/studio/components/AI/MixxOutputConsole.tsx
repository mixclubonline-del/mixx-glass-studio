/**
 * Mixx Output Console
 * AI stem player, visualizer, plugin routing, export controls
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Download, Share2, Settings } from 'lucide-react';
import { AITrackData } from './MixxAIStudio';
import { useToast } from '@/hooks/use-toast';

interface MixxOutputConsoleProps {
  trackData: AITrackData;
  onRegenerate: () => void;
}

const PLUGIN_CHAIN = ['MixxVerb', 'MixxDelay', 'MixxTune', 'MixxGlue'];

export const MixxOutputConsole: React.FC<MixxOutputConsoleProps> = ({
  trackData,
  onRegenerate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [refineMix, setRefineMix] = useState(true);
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Exporting track",
      description: "Your AI-generated track is being rendered with the full plugin chain"
    });
    // TODO: Implement actual export
  };

  const handleLoadToArrange = () => {
    toast({
      title: "Loading to Arrange view",
      description: "All stems routed through MixxMaster with auto-applied plugins"
    });
    // TODO: Implement loading stems to timeline
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Settings size={20} className="text-blue-400 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Mixx Output Console</h3>
            <p className="text-xs text-muted-foreground">Auto-routed through MixxMaster • {trackData.bpm} BPM • {trackData.key}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="glass">
            {trackData.genre}
          </Badge>
          <Badge variant="outline" className="glass">
            {trackData.mood}
          </Badge>
        </div>
      </div>

      {/* Stem Player */}
      <div className="glass rounded-xl p-4 border border-border/30 space-y-3">
        <div className="text-sm font-medium text-foreground mb-3">AI-Generated Stems</div>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(trackData.stems).map(([name, path]) => (
            <div
              key={name}
              className="glass rounded-lg p-3 border border-border/20 hover:border-primary/40 transition-all cursor-pointer"
            >
              <div className="text-xs font-medium text-foreground capitalize mb-1">{name}</div>
              <div className="h-12 bg-background/50 rounded flex items-center justify-center">
                <div className="flex gap-0.5 items-end">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
                      style={{
                        height: `${20 + Math.random() * 80}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plugin Chain Display */}
      <div className="glass rounded-xl p-4 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-foreground">Auto-Applied Plugin Chain</div>
          <button
            onClick={() => setRefineMix(!refineMix)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              refineMix
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
                : 'glass border border-border/30 text-muted-foreground'
            }`}
          >
            Refine Mix {refineMix ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="flex gap-2">
          {PLUGIN_CHAIN.map((plugin, index) => (
            <React.Fragment key={plugin}>
              <div className="flex-1 glass rounded-lg p-3 border border-primary/20 text-center">
                <div className="text-xs font-medium text-foreground">{plugin}</div>
                <div className="text-[0.65rem] text-muted-foreground mt-1">Active</div>
              </div>
              {index < PLUGIN_CHAIN.length - 1 && (
                <div className="flex items-center">
                  <div className="w-4 h-0.5 bg-primary/40"></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Transport & Export Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          variant="outline"
          className="h-12 rounded-xl"
        >
          {isPlaying ? (
            <>
              <Pause size={16} className="mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play size={16} className="mr-2" />
              Play
            </>
          )}
        </Button>

        <Button
          onClick={onRegenerate}
          variant="outline"
          className="h-12 rounded-xl"
        >
          <RotateCcw size={16} className="mr-2" />
          Regenerate
        </Button>

        <Button
          onClick={handleLoadToArrange}
          variant="outline"
          className="h-12 rounded-xl"
        >
          <Share2 size={16} className="mr-2" />
          Load to Arrange
        </Button>

        <Button
          onClick={handleExport}
          className="h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
        >
          <Download size={16} className="mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
};
