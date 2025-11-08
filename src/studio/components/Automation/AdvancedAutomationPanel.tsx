/**
 * Advanced Automation Panel - Professional automation with curves, LFO, and recording
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Activity,
  Circle,
  Trash2,
  Copy,
  Waves,
  TrendingUp,
  Radio,
  Save,
  Play,
  Square
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type CurveType = 'linear' | 'exponential' | 'logarithmic' | 'scurve' | 'hold';

interface AutomationPoint {
  time: number; // beats
  value: number; // 0-1
  curve: CurveType;
}

interface AdvancedAutomationPanelProps {
  trackId: string;
  parameter: string;
  height?: number;
  totalBeats?: number;
  onClose?: () => void;
}

export const AdvancedAutomationPanel: React.FC<AdvancedAutomationPanelProps> = ({
  trackId,
  parameter,
  height = 120,
  totalBeats = 32,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<AutomationPoint[]>([
    { time: 0, value: 0.5, curve: 'linear' },
  ]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [lfoEnabled, setLfoEnabled] = useState(false);
  const [lfoRate, setLfoRate] = useState(4); // beats
  const [lfoDepth, setLfoDepth] = useState(0.5);
  const [lfoShape, setLfoShape] = useState<'sine' | 'square' | 'saw' | 'triangle'>('sine');

  const BEAT_WIDTH = 48;
  const width = BEAT_WIDTH * totalBeats;

  useEffect(() => {
    drawAutomation();
  }, [points, selectedPoint, lfoEnabled, lfoRate, lfoDepth, lfoShape]);

  const applyCurve = (
    t: number,
    startValue: number,
    endValue: number,
    curve: CurveType
  ): number => {
    if (curve === 'hold') return startValue;
    
    const delta = endValue - startValue;
    
    switch (curve) {
      case 'exponential':
        return startValue + delta * Math.pow(t, 2);
      case 'logarithmic':
        return startValue + delta * Math.sqrt(t);
      case 'scurve':
        return startValue + delta * (t * t * (3 - 2 * t));
      case 'linear':
      default:
        return startValue + delta * t;
    }
  };

  const getLfoValue = (time: number): number => {
    const phase = (time / lfoRate) * Math.PI * 2;
    
    switch (lfoShape) {
      case 'sine':
        return Math.sin(phase) * lfoDepth;
      case 'square':
        return (Math.sin(phase) > 0 ? 1 : -1) * lfoDepth;
      case 'saw':
        return ((phase % (Math.PI * 2)) / (Math.PI * 2) - 0.5) * 2 * lfoDepth;
      case 'triangle':
        return (Math.abs((phase % (Math.PI * 2)) / Math.PI - 1) - 0.5) * 2 * lfoDepth;
      default:
        return 0;
    }
  };

  const getValueAtTime = (time: number): number => {
    if (points.length === 0) return 0.5;
    if (points.length === 1) {
      const base = points[0].value;
      return lfoEnabled ? Math.max(0, Math.min(1, base + getLfoValue(time))) : base;
    }

    // Find surrounding points
    let prevPoint = points[0];
    let nextPoint = points[points.length - 1];

    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        prevPoint = points[i];
        nextPoint = points[i + 1];
        break;
      }
    }

    if (time < points[0].time) {
      const base = points[0].value;
      return lfoEnabled ? Math.max(0, Math.min(1, base + getLfoValue(time))) : base;
    }
    if (time > points[points.length - 1].time) {
      const base = points[points.length - 1].value;
      return lfoEnabled ? Math.max(0, Math.min(1, base + getLfoValue(time))) : base;
    }

    const t = (time - prevPoint.time) / (nextPoint.time - prevPoint.time);
    const base = applyCurve(t, prevPoint.value, nextPoint.value, prevPoint.curve);
    
    return lfoEnabled ? Math.max(0, Math.min(1, base + getLfoValue(time))) : base;
  };

  const drawAutomation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Background
    ctx.fillStyle = 'hsl(240 15% 4%)';
    ctx.fillRect(0, 0, width, height);

    // Grid
    for (let i = 0; i <= totalBeats; i++) {
      const x = i * BEAT_WIDTH;
      const isMeasure = i % 4 === 0;
      
      ctx.strokeStyle = isMeasure ? 'hsl(191 100% 50% / 0.2)' : 'hsl(0 0% 30% / 0.1)';
      ctx.lineWidth = isMeasure ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Center line
    ctx.strokeStyle = 'hsl(0 0% 30% / 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw automation curve
    ctx.beginPath();
    ctx.strokeStyle = lfoEnabled ? 'hsl(320 100% 60%)' : 'hsl(191 100% 50%)';
    ctx.lineWidth = 2;

    const samples = width;
    for (let i = 0; i <= samples; i++) {
      const time = (i / samples) * totalBeats;
      const value = getValueAtTime(time);
      const x = i;
      const y = (1 - value) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw fill under curve
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = lfoEnabled 
      ? 'hsla(320, 100%, 60%, 0.1)' 
      : 'hsla(191, 100%, 50%, 0.1)';
    ctx.fill();

    // Draw points
    points.forEach((point, index) => {
      const x = (point.time / totalBeats) * width;
      const y = (1 - point.value) * height;
      const isSelected = selectedPoint === index;

      // Point
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? 'hsl(320 100% 60%)' : 'hsl(191 100% 60%)';
      ctx.fill();
      ctx.strokeStyle = 'hsl(0 0% 10%)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Curve type indicator
      if (index < points.length - 1) {
        ctx.fillStyle = 'hsl(0 0% 70%)';
        ctx.font = '8px monospace';
        ctx.fillText(point.curve[0].toUpperCase(), x + 8, y - 8);
      }
    });
  }, [points, selectedPoint, lfoEnabled, lfoRate, lfoDepth, lfoShape, width, height, totalBeats]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = (x / width) * totalBeats;
    const value = 1 - y / height;

    // Check if clicking near existing point
    const clickedPointIndex = points.findIndex((p) => {
      const px = (p.time / totalBeats) * width;
      const py = (1 - p.value) * height;
      return Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2)) < 10;
    });

    if (clickedPointIndex !== -1) {
      if (e.shiftKey) {
        // Delete point
        setPoints((prev) => prev.filter((_, i) => i !== clickedPointIndex));
        setSelectedPoint(null);
        toast.info('Point deleted');
      } else {
        setSelectedPoint(clickedPointIndex);
      }
    } else {
      // Add new point
      const newPoint: AutomationPoint = {
        time: Math.max(0, Math.min(totalBeats, time)),
        value: Math.max(0, Math.min(1, value)),
        curve: 'linear',
      };
      setPoints((prev) => [...prev, newPoint].sort((a, b) => a.time - b.time));
      toast.success('Point added');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedPoint === null || !e.buttons) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = (x / width) * totalBeats;
    const value = 1 - y / height;

    setPoints((prev) => {
      const newPoints = [...prev];
      newPoints[selectedPoint] = {
        ...newPoints[selectedPoint],
        time: Math.max(0, Math.min(totalBeats, time)),
        value: Math.max(0, Math.min(1, value)),
      };
      return newPoints.sort((a, b) => a.time - b.time);
    });
  };

  const changeCurveType = (curve: CurveType) => {
    if (selectedPoint === null) {
      toast.error('Select a point first');
      return;
    }

    setPoints((prev) => {
      const newPoints = [...prev];
      newPoints[selectedPoint] = { ...newPoints[selectedPoint], curve };
      return newPoints;
    });
    toast.success(`Curve: ${curve}`);
  };

  const generateLFO = () => {
    const newPoints: AutomationPoint[] = [];
    const cycles = Math.floor(totalBeats / lfoRate);
    
    for (let i = 0; i <= cycles * 4; i++) {
      const time = (i / (cycles * 4)) * totalBeats;
      const lfoValue = getLfoValue(time);
      const value = 0.5 + lfoValue;
      
      newPoints.push({
        time,
        value: Math.max(0, Math.min(1, value)),
        curve: 'linear',
      });
    }

    setPoints(newPoints);
    toast.success('LFO pattern generated');
  };

  const clearAutomation = () => {
    setPoints([{ time: 0, value: 0.5, curve: 'linear' }]);
    setSelectedPoint(null);
    toast.info('Automation cleared');
  };

  return (
    <div className="border border-border/30 rounded-lg bg-background/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium">{parameter}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Curve Type */}
          {selectedPoint !== null && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 px-2">
                  <TrendingUp className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border-border z-[60]">
                <DropdownMenuItem onClick={() => changeCurveType('linear')}>
                  Linear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeCurveType('exponential')}>
                  Exponential
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeCurveType('logarithmic')}>
                  Logarithmic
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeCurveType('scurve')}>
                  S-Curve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeCurveType('hold')}>
                  Hold
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* LFO Toggle */}
          <Button
            size="sm"
            variant={lfoEnabled ? 'secondary' : 'ghost'}
            className="h-6 px-2"
            onClick={() => setLfoEnabled(!lfoEnabled)}
          >
            <Waves className="h-3 w-3" />
          </Button>

          {/* Recording */}
          <Button
            size="sm"
            variant={isRecording ? 'destructive' : 'ghost'}
            className="h-6 px-2"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? <Square className="h-3 w-3" /> : <Radio className="h-3 w-3" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2"
            onClick={clearAutomation}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* LFO Controls */}
      {lfoEnabled && (
        <div className="px-3 py-2 border-b border-border/30 bg-muted/10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {(['sine', 'square', 'saw', 'triangle'] as const).map((shape) => (
                <Button
                  key={shape}
                  size="sm"
                  variant={lfoShape === shape ? 'secondary' : 'ghost'}
                  className="h-6 px-2 text-xs"
                  onClick={() => setLfoShape(shape)}
                >
                  {shape}
                </Button>
              ))}
            </div>

            <Button size="sm" variant="outline" className="h-6" onClick={generateLFO}>
              Generate
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rate (beats)</Label>
              <Slider
                value={[lfoRate]}
                onValueChange={([v]) => setLfoRate(v)}
                min={0.25}
                max={16}
                step={0.25}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Depth</Label>
              <Slider
                value={[lfoDepth]}
                onValueChange={([v]) => setLfoDepth(v)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="cursor-crosshair w-full"
      />

      {/* Info */}
      <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border/30">
        {points.length} points • Click to add • Shift+Click to delete • Drag to move
        {isRecording && <span className="text-red-500 ml-2">● RECORDING</span>}
      </div>
    </div>
  );
};
