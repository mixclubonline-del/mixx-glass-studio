/**
 * Mastering Panel - Professional mastering tools with LUFS metering
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Maximize2,
  Activity,
  Download,
  Play,
  Square,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MasteringPreset {
  name: string;
  platform: string;
  targetLUFS: number;
  ceiling: number;
  stereoWidth: number;
}

const MASTERING_PRESETS: MasteringPreset[] = [
  { name: 'Spotify Loud', platform: 'spotify', targetLUFS: -14, ceiling: -1, stereoWidth: 100 },
  { name: 'Apple Music', platform: 'apple', targetLUFS: -16, ceiling: -1, stereoWidth: 100 },
  { name: 'YouTube', platform: 'youtube', targetLUFS: -13, ceiling: -1, stereoWidth: 100 },
  { name: 'SoundCloud', platform: 'soundcloud', targetLUFS: -14, ceiling: -1, stereoWidth: 100 },
  { name: 'Club Master', platform: 'club', targetLUFS: -8, ceiling: -0.3, stereoWidth: 80 },
  { name: 'Mastering', platform: 'master', targetLUFS: -16, ceiling: -1, stereoWidth: 100 },
];

interface MasteringPanelProps {
  onClose?: () => void;
}

export const MasteringPanel: React.FC<MasteringPanelProps> = ({ onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState<MasteringPreset>(MASTERING_PRESETS[0]);
  const [limiterThreshold, setLimiterThreshold] = useState(-1);
  const [limiterRelease, setLimiterRelease] = useState(50);
  const [stereoWidth, setStereoWidth] = useState(100);
  const [multibandEnabled, setMultibandEnabled] = useState(false);
  const [lowRatio, setLowRatio] = useState(2);
  const [midRatio, setMidRatio] = useState(1.5);
  const [highRatio, setHighRatio] = useState(1.5);
  const [currentLUFS, setCurrentLUFS] = useState(-16.5);
  const [peakLevel, setPeakLevel] = useState(-3.2);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const meterCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawLUFSMeter();
  }, [currentLUFS, selectedPreset]);

  const drawLUFSMeter = () => {
    const canvas = meterCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 300;
    const height = 80;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = 'hsl(240 15% 4%)';
    ctx.fillRect(0, 0, width, height);

    // Scale
    const lufsRange = 30; // -30 to 0 LUFS
    const targetLUFS = selectedPreset.targetLUFS;
    
    // Target zone
    const targetX = ((targetLUFS + 30) / lufsRange) * width;
    ctx.fillStyle = 'hsla(142, 100%, 50%, 0.1)';
    ctx.fillRect(targetX - 20, 0, 40, height);

    // Current level
    const currentX = ((currentLUFS + 30) / lufsRange) * width;
    const gradient = ctx.createLinearGradient(0, 0, currentX, 0);
    gradient.addColorStop(0, 'hsl(142 100% 50%)');
    gradient.addColorStop(0.7, 'hsl(45 100% 60%)');
    gradient.addColorStop(1, 'hsl(0 100% 60%)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height / 2 - 10, currentX, 20);

    // Scale markers
    ctx.fillStyle = 'hsl(0 0% 50%)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    
    for (let lufs = -30; lufs <= 0; lufs += 5) {
      const x = ((lufs + 30) / lufsRange) * width;
      ctx.fillText(`${lufs}`, x, height - 5);
      
      // Tick
      ctx.strokeStyle = 'hsl(0 0% 30%)';
      ctx.beginPath();
      ctx.moveTo(x, height - 15);
      ctx.lineTo(x, height - 20);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = 'hsl(0 0% 70%)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LUFS-I', 5, 15);
    
    ctx.textAlign = 'right';
    ctx.fillText(`${currentLUFS.toFixed(1)} LUFS`, width - 5, 15);
  };

  const applyPreset = (preset: MasteringPreset) => {
    setSelectedPreset(preset);
    setLimiterThreshold(preset.ceiling);
    setStereoWidth(preset.stereoWidth);
    toast.success(`Applied ${preset.name} preset`);
  };

  const analyzeAudio = () => {
    setIsAnalyzing(true);
    toast.info('Analyzing audio...');
    
    // Simulate analysis
    setTimeout(() => {
      setCurrentLUFS(-12.3 + Math.random() * 2);
      setPeakLevel(-2.1 + Math.random());
      setIsAnalyzing(false);
      toast.success('Analysis complete');
    }, 1500);
  };

  const exportMaster = () => {
    toast.success('Exporting mastered audio...');
    // Export logic would go here
  };

  return (
    <div className="border border-border/30 rounded-lg bg-background/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-gradient-to-r from-primary/20 to-purple-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Mastering Suite</h2>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Settings className="h-3 w-3 mr-1" />
                {selectedPreset.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border-border z-[60]">
              {MASTERING_PRESETS.map((preset) => (
                <DropdownMenuItem key={preset.name} onClick={() => applyPreset(preset)}>
                  {preset.name} ({preset.targetLUFS} LUFS)
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            variant={isAnalyzing ? 'secondary' : 'default'}
            onClick={analyzeAudio}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Square className="h-3 w-3 mr-1" /> : <Activity className="h-3 w-3 mr-1" />}
            Analyze
          </Button>

          <Button size="sm" variant="default" onClick={exportMaster}>
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* LUFS Meter */}
      <div className="p-4 border-b border-border/30 bg-muted/10">
        <canvas ref={meterCanvasRef} className="w-full" />
        
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Target:</span>
              <span className="ml-2 font-mono text-primary">{selectedPreset.targetLUFS} LUFS</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current:</span>
              <span className={cn(
                "ml-2 font-mono",
                Math.abs(currentLUFS - selectedPreset.targetLUFS) < 1 ? "text-green-400" : "text-yellow-400"
              )}>
                {currentLUFS.toFixed(1)} LUFS
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Peak:</span>
              <span className="ml-2 font-mono text-red-400">{peakLevel.toFixed(1)} dB</span>
            </div>
          </div>
          
          <div className="text-muted-foreground">
            {Math.abs(currentLUFS - selectedPreset.targetLUFS) < 1 
              ? '✓ In target range' 
              : `Adjust by ${(selectedPreset.targetLUFS - currentLUFS).toFixed(1)} dB`}
          </div>
        </div>
      </div>

      {/* Limiter Controls */}
      <div className="p-4 space-y-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Final Limiter</Label>
          <Maximize2 className="h-4 w-4 text-primary" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Ceiling</Label>
              <span className="text-xs text-muted-foreground">{limiterThreshold.toFixed(1)} dB</span>
            </div>
            <Slider
              value={[limiterThreshold]}
              onValueChange={([v]) => setLimiterThreshold(v)}
              min={-3}
              max={-0.1}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Release</Label>
              <span className="text-xs text-muted-foreground">{limiterRelease} ms</span>
            </div>
            <Slider
              value={[limiterRelease]}
              onValueChange={([v]) => setLimiterRelease(v)}
              min={10}
              max={200}
              step={5}
            />
          </div>
        </div>
      </div>

      {/* Stereo Width */}
      <div className="p-4 space-y-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Stereo Width</Label>
          <span className="text-xs text-muted-foreground">{stereoWidth}%</span>
        </div>
        <Slider
          value={[stereoWidth]}
          onValueChange={([v]) => setStereoWidth(v)}
          min={0}
          max={150}
          step={5}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Mono</span>
          <span>Natural</span>
          <span>Wide</span>
        </div>
      </div>

      {/* Multiband Compression */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Multiband Compression</Label>
          <Button
            size="sm"
            variant={multibandEnabled ? 'secondary' : 'ghost'}
            onClick={() => setMultibandEnabled(!multibandEnabled)}
            className="h-6"
          >
            {multibandEnabled ? 'ON' : 'OFF'}
          </Button>
        </div>

        {multibandEnabled && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-red-400">Low (80-400Hz)</Label>
                <span className="text-xs text-muted-foreground">{lowRatio.toFixed(1)}:1</span>
              </div>
              <Slider
                value={[lowRatio]}
                onValueChange={([v]) => setLowRatio(v)}
                min={1}
                max={6}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-yellow-400">Mid (400Hz-5kHz)</Label>
                <span className="text-xs text-muted-foreground">{midRatio.toFixed(1)}:1</span>
              </div>
              <Slider
                value={[midRatio]}
                onValueChange={([v]) => setMidRatio(v)}
                min={1}
                max={6}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-cyan-400">High (5kHz+)</Label>
                <span className="text-xs text-muted-foreground">{highRatio.toFixed(1)}:1</span>
              </div>
              <Slider
                value={[highRatio]}
                onValueChange={([v]) => setHighRatio(v)}
                min={1}
                max={6}
                step={0.1}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
