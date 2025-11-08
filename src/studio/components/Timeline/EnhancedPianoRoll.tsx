/**
 * Enhanced Piano Roll - Full MIDI editor with velocity, scales, and chords
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  X, 
  Grid3x3, 
  Music, 
  Scissors,
  Copy,
  Trash2,
  Save,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MIDINote {
  id: string;
  pitch: number; // 0-127 MIDI note
  startBeat: number;
  durationBeats: number;
  velocity: number; // 0-1
}

interface EnhancedPianoRollProps {
  regionId: string;
  onClose: () => void;
  onSave: (notes: MIDINote[]) => void;
}

const SCALES = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

const CHORDS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  seventh: [0, 4, 7, 10],
  diminished: [0, 3, 6],
};

export const EnhancedPianoRoll: React.FC<EnhancedPianoRollProps> = ({
  regionId,
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const velocityCanvasRef = useRef<HTMLCanvasElement>(null);
  const [notes, setNotes] = useState<MIDINote[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [snapGrid, setSnapGrid] = useState(4); // 16th notes
  const [activeScale, setActiveScale] = useState<keyof typeof SCALES>('chromatic');
  const [rootNote, setRootNote] = useState(60); // C4
  const [tool, setTool] = useState<'draw' | 'select' | 'erase'>('draw');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  
  // Constants
  const KEY_HEIGHT = 16;
  const KEY_WIDTH = 60;
  const BEAT_WIDTH = 48;
  const TOTAL_BEATS = 32;
  const NUM_OCTAVES = 4;
  const NUM_KEYS = NUM_OCTAVES * 12;
  const VELOCITY_HEIGHT = 80;

  useEffect(() => {
    drawPianoRoll();
    drawVelocityLane();
  }, [notes, selectedNotes, activeScale, rootNote]);

  const drawPianoRoll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = KEY_WIDTH + BEAT_WIDTH * TOTAL_BEATS;
    const height = NUM_KEYS * KEY_HEIGHT;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Background
    ctx.fillStyle = 'hsl(240 15% 4%)';
    ctx.fillRect(0, 0, width, height);

    // Draw piano keys
    for (let i = 0; i < NUM_KEYS; i++) {
      const y = i * KEY_HEIGHT;
      const pitch = (NUM_KEYS - i - 1) + 36; // Start from C2
      const noteInOctave = pitch % 12;
      const isBlackKey = [1, 3, 6, 8, 10].includes(noteInOctave);
      
      // Highlight scale notes
      const isInScale = SCALES[activeScale].includes((pitch - rootNote + 12) % 12);
      
      // Key background
      if (isInScale && activeScale !== 'chromatic') {
        ctx.fillStyle = 'hsl(191 50% 15%)';
      } else {
        ctx.fillStyle = isBlackKey ? 'hsl(240 10% 12%)' : 'hsl(240 10% 18%)';
      }
      ctx.fillRect(0, y, KEY_WIDTH, KEY_HEIGHT);

      // Key border
      ctx.strokeStyle = 'hsl(240 10% 8%)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, KEY_WIDTH, KEY_HEIGHT);

      // Note name for C notes
      if (noteInOctave === 0) {
        const octave = Math.floor(pitch / 12) - 1;
        ctx.fillStyle = 'hsl(0 0% 50%)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${octave}`, KEY_WIDTH / 2, y + KEY_HEIGHT / 2);
      }
    }

    // Draw grid
    const gridStart = KEY_WIDTH;
    
    // Horizontal lines
    for (let i = 0; i <= NUM_KEYS; i++) {
      const y = i * KEY_HEIGHT;
      ctx.strokeStyle = 'hsl(0 0% 20% / 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gridStart, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines (beats)
    for (let i = 0; i <= TOTAL_BEATS; i++) {
      const x = gridStart + i * BEAT_WIDTH;
      const isMeasure = i % 4 === 0;
      
      ctx.strokeStyle = isMeasure ? 'hsl(191 100% 50% / 0.2)' : 'hsl(0 0% 30% / 0.15)';
      ctx.lineWidth = isMeasure ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw notes
    notes.forEach((note) => {
      const x = gridStart + note.startBeat * BEAT_WIDTH;
      const y = (NUM_KEYS - (note.pitch - 36)) * KEY_HEIGHT;
      const w = note.durationBeats * BEAT_WIDTH;
      const h = KEY_HEIGHT - 2;

      const isSelected = selectedNotes.includes(note.id);

      // Note body
      const velocityAlpha = 0.3 + note.velocity * 0.5;
      ctx.fillStyle = isSelected 
        ? `hsla(320, 100%, 60%, ${velocityAlpha})`
        : `hsla(191, 100%, 50%, ${velocityAlpha})`;
      ctx.fillRect(x + 1, y + 1, w - 2, h);

      // Note border
      ctx.strokeStyle = isSelected ? 'hsl(320 100% 70%)' : 'hsl(191 100% 60%)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(x + 1, y + 1, w - 2, h);

      // Velocity indicator (subtle)
      const velHeight = h * note.velocity;
      ctx.fillStyle = isSelected 
        ? 'hsla(320, 100%, 80%, 0.3)'
        : 'hsla(191, 100%, 70%, 0.3)';
      ctx.fillRect(x + 1, y + 1 + (h - velHeight), w - 2, velHeight);
    });
  }, [notes, selectedNotes, activeScale, rootNote]);

  const drawVelocityLane = useCallback(() => {
    const canvas = velocityCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = KEY_WIDTH + BEAT_WIDTH * TOTAL_BEATS;
    canvas.width = width;
    canvas.height = VELOCITY_HEIGHT;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${VELOCITY_HEIGHT}px`;

    // Background
    ctx.fillStyle = 'hsl(240 15% 6%)';
    ctx.fillRect(0, 0, width, VELOCITY_HEIGHT);

    // Grid
    const gridStart = KEY_WIDTH;
    for (let i = 0; i <= TOTAL_BEATS; i++) {
      const x = gridStart + i * BEAT_WIDTH;
      const isMeasure = i % 4 === 0;
      
      ctx.strokeStyle = isMeasure ? 'hsl(191 100% 50% / 0.2)' : 'hsl(0 0% 30% / 0.1)';
      ctx.lineWidth = isMeasure ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VELOCITY_HEIGHT);
      ctx.stroke();
    }

    // Velocity bars
    notes.forEach((note) => {
      const x = gridStart + note.startBeat * BEAT_WIDTH;
      const w = note.durationBeats * BEAT_WIDTH;
      const h = VELOCITY_HEIGHT * note.velocity;
      const isSelected = selectedNotes.includes(note.id);

      ctx.fillStyle = isSelected ? 'hsl(320 100% 60%)' : 'hsl(191 100% 50%)';
      ctx.fillRect(x + 2, VELOCITY_HEIGHT - h, w - 4, h);
    });

    // Label
    ctx.fillStyle = 'hsl(0 0% 50%)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VELOCITY', KEY_WIDTH / 2, VELOCITY_HEIGHT / 2);
  }, [notes, selectedNotes]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < KEY_WIDTH) return; // Clicked on piano keys

    const beat = Math.floor((x - KEY_WIDTH) / BEAT_WIDTH);
    const snappedBeat = Math.round(beat * snapGrid) / snapGrid;
    
    const keyIndex = Math.floor(y / KEY_HEIGHT);
    const pitch = (NUM_KEYS - keyIndex - 1) + 36;

    if (tool === 'draw') {
      // Check if note exists at this position
      const existingNote = notes.find(
        (n) => Math.abs(n.startBeat - snappedBeat) < 0.01 && n.pitch === pitch
      );

      if (existingNote) {
        // Delete note
        setNotes((prev) => prev.filter((n) => n.id !== existingNote.id));
        toast.info('Note deleted');
      } else {
        // Add note
        const newNote: MIDINote = {
          id: `note-${Date.now()}`,
          pitch,
          startBeat: snappedBeat,
          durationBeats: 1 / snapGrid,
          velocity: 0.8,
        };
        setNotes((prev) => [...prev, newNote]);
        toast.success('Note added');
      }
    } else if (tool === 'select') {
      // Find clicked note
      const clickedNote = notes.find((n) => {
        const nx = KEY_WIDTH + n.startBeat * BEAT_WIDTH;
        const ny = (NUM_KEYS - (n.pitch - 36)) * KEY_HEIGHT;
        const nw = n.durationBeats * BEAT_WIDTH;
        const nh = KEY_HEIGHT;
        
        return x >= nx && x <= nx + nw && y >= ny && y <= ny + nh;
      });

      if (clickedNote) {
        if (e.shiftKey) {
          setSelectedNotes((prev) =>
            prev.includes(clickedNote.id)
              ? prev.filter((id) => id !== clickedNote.id)
              : [...prev, clickedNote.id]
          );
        } else {
          setSelectedNotes([clickedNote.id]);
        }
      } else {
        setSelectedNotes([]);
      }
    }
  };

  const handleVelocityClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = velocityCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < KEY_WIDTH) return;

    const beat = (x - KEY_WIDTH) / BEAT_WIDTH;
    const velocity = 1 - y / VELOCITY_HEIGHT;

    // Find note at this beat
    const note = notes.find((n) => 
      beat >= n.startBeat && beat <= n.startBeat + n.durationBeats
    );

    if (note) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === note.id ? { ...n, velocity: Math.max(0, Math.min(1, velocity)) } : n
        )
      );
    }
  };

  const addChord = (type: keyof typeof CHORDS) => {
    if (selectedNotes.length === 0) {
      toast.error('Select a note first');
      return;
    }

    const baseNote = notes.find((n) => n.id === selectedNotes[0]);
    if (!baseNote) return;

    const chordIntervals = CHORDS[type];
    const newNotes: MIDINote[] = chordIntervals.slice(1).map((interval, i) => ({
      id: `chord-${Date.now()}-${i}`,
      pitch: baseNote.pitch + interval,
      startBeat: baseNote.startBeat,
      durationBeats: baseNote.durationBeats,
      velocity: baseNote.velocity,
    }));

    setNotes((prev) => [...prev, ...newNotes]);
    toast.success(`Added ${type} chord`);
  };

  const deleteSelected = () => {
    setNotes((prev) => prev.filter((n) => !selectedNotes.includes(n.id)));
    setSelectedNotes([]);
    toast.success('Deleted selected notes');
  };

  const handleSave = () => {
    onSave(notes);
    toast.success('MIDI saved');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Music className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Enhanced Piano Roll</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Tool Selection */}
          <div className="flex gap-1 bg-muted/20 rounded-md p-1">
            <Button
              size="sm"
              variant={tool === 'draw' ? 'secondary' : 'ghost'}
              onClick={() => setTool('draw')}
            >
              Draw
            </Button>
            <Button
              size="sm"
              variant={tool === 'select' ? 'secondary' : 'ghost'}
              onClick={() => setTool('select')}
            >
              Select
            </Button>
          </div>

          {/* Scale Selection */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Grid3x3 className="h-3 w-3 mr-1" />
                {activeScale}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border-border z-[60]">
              {Object.keys(SCALES).map((scale) => (
                <DropdownMenuItem
                  key={scale}
                  onClick={() => setActiveScale(scale as keyof typeof SCALES)}
                >
                  {scale}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Chord Tools */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                Chords
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border-border z-[60]">
              {Object.keys(CHORDS).map((chord) => (
                <DropdownMenuItem
                  key={chord}
                  onClick={() => addChord(chord as keyof typeof CHORDS)}
                >
                  {chord}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedNotes.length > 0 && (
            <Button size="sm" variant="outline" onClick={deleteSelected}>
              <Trash2 className="h-3 w-3 mr-1" />
              Delete ({selectedNotes.length})
            </Button>
          )}

          <Button size="sm" variant="default" onClick={handleSave}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>

          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-2 border-b border-border/30 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Grid:</Label>
          <Button
            size="sm"
            variant={snapGrid === 2 ? 'secondary' : 'outline'}
            onClick={() => setSnapGrid(2)}
          >
            1/8
          </Button>
          <Button
            size="sm"
            variant={snapGrid === 4 ? 'secondary' : 'outline'}
            onClick={() => setSnapGrid(4)}
          >
            1/16
          </Button>
          <Button
            size="sm"
            variant={snapGrid === 8 ? 'secondary' : 'outline'}
            onClick={() => setSnapGrid(8)}
          >
            1/32
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {notes.length} notes • {selectedNotes.length} selected
        </div>
      </div>

      {/* Piano Roll Canvas */}
      <div className="flex-1 overflow-auto">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="cursor-crosshair border-b border-border/30"
        />
      </div>

      {/* Velocity Lane */}
      <div className="border-t border-border/30">
        <canvas
          ref={velocityCanvasRef}
          onClick={handleVelocityClick}
          className="cursor-ns-resize"
        />
      </div>
    </div>
  );
};
