/**
 * Piano Roll Overlay - For drawing 808 slides and MIDI notes
 */

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Grid3x3, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PianoRollOverlayProps {
  regionId: string;
  onClose: () => void;
}

export const PianoRollOverlay: React.FC<PianoRollOverlayProps> = ({
  regionId,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);
    
    // Draw piano roll
    drawPianoRoll(ctx, rect.width, rect.height);
  }, []);
  
  const drawPianoRoll = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Background
    ctx.fillStyle = 'hsl(240 15% 4%)';
    ctx.fillRect(0, 0, width, height);
    
    // Piano keys (left side)
    const keyHeight = 20;
    const numKeys = Math.floor(height / keyHeight);
    const keyWidth = 60;
    
    for (let i = 0; i < numKeys; i++) {
      const y = i * keyHeight;
      const note = (numKeys - i - 1) % 12;
      const isBlackKey = [1, 3, 6, 8, 10].includes(note);
      
      // Key background
      ctx.fillStyle = isBlackKey ? 'hsl(240 10% 15%)' : 'hsl(240 10% 20%)';
      ctx.fillRect(0, y, keyWidth, keyHeight);
      
      // Key border
      ctx.strokeStyle = 'hsl(240 10% 10%)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, keyWidth, keyHeight);
      
      // Note name
      if (!isBlackKey) {
        const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const octave = Math.floor((numKeys - i - 1) / 12);
        const noteName = noteNames[Math.floor(note / 2)] + octave;
        
        ctx.fillStyle = 'hsl(0 0% 60%)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(noteName, keyWidth / 2, y + keyHeight / 2);
      }
    }
    
    // Grid (right side)
    const gridStart = keyWidth;
    const gridWidth = width - keyWidth;
    const beatWidth = gridWidth / 16; // 16th notes
    
    // Vertical lines (beats)
    for (let i = 0; i <= 16; i++) {
      const x = gridStart + i * beatWidth;
      const is4Beat = i % 4 === 0;
      
      ctx.strokeStyle = is4Beat ? 'hsl(191 100% 50% / 0.3)' : 'hsl(0 0% 30% / 0.2)';
      ctx.lineWidth = is4Beat ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines (notes)
    for (let i = 0; i <= numKeys; i++) {
      const y = i * keyHeight;
      ctx.strokeStyle = 'hsl(0 0% 30% / 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gridStart, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Example 808 slide visualization
    ctx.fillStyle = 'hsl(280 90% 65% / 0.6)';
    ctx.fillRect(gridStart + beatWidth * 0, height / 2, beatWidth * 2, keyHeight);
    
    // Slide line
    ctx.strokeStyle = 'hsl(280 90% 65%)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gridStart + beatWidth * 0, height / 2 + keyHeight / 2);
    ctx.lineTo(gridStart + beatWidth * 2, height / 2 - keyHeight * 3);
    ctx.stroke();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[90vw] h-[80vh] bg-background rounded-lg border border-gradient shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Piano Roll - 808 Editor</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={snapEnabled ? 'secondary' : 'ghost'}
              onClick={() => setSnapEnabled(!snapEnabled)}
            >
              <Grid3x3 className="h-3 w-3 mr-1" />
              Snap
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
          />
        </div>
        
        {/* Help */}
        <div className="px-4 py-2 border-t border-border/30 text-xs text-muted-foreground flex gap-4">
          <span>• Click to add notes</span>
          <span>• Drag to draw slides</span>
          <span>• Right-click to delete</span>
          <span>• Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
