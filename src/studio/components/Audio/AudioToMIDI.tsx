import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Download, Play, Square, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { YINDetector } from '@/audio/pitch/YINDetector';

export interface MIDINote {
  note: number;
  velocity: number;
  startTime: number;
  duration: number;
  frequency: number;
}

interface AudioToMIDIProps {
  audioBuffer?: AudioBuffer;
  onMIDIGenerated?: (notes: MIDINote[]) => void;
}

export const AudioToMIDI: React.FC<AudioToMIDIProps> = ({
  audioBuffer,
  onMIDIGenerated
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [midiNotes, setMidiNotes] = useState<MIDINote[]>([]);
  
  // Pitch detection settings
  const [pitchThreshold, setPitchThreshold] = useState(0.1);
  const [minFrequency, setMinFrequency] = useState(80); // E2
  const [maxFrequency, setMaxFrequency] = useState(1200); // D6
  
  // Quantization settings
  const [quantize, setQuantize] = useState<'none' | '1/4' | '1/8' | '1/16' | '1/32'>('1/16');
  const [quantizeStrength, setQuantizeStrength] = useState(100);
  
  // Velocity settings
  const [velocitySensitivity, setVelocitySensitivity] = useState(80);
  const [minVelocity, setMinVelocity] = useState(20);
  const [maxVelocity, setMaxVelocity] = useState(127);
  
  // Advanced settings
  const [minNoteDuration, setMinNoteDuration] = useState(50); // ms
  const [glideThreshold, setGlideThreshold] = useState(50); // cents
  const [monoMode, setMonoMode] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const frequencyToMIDI = (frequency: number): number => {
    return Math.round(12 * Math.log2(frequency / 440) + 69);
  };

  const quantizeTime = (time: number, bpm: number = 120): number => {
    if (quantize === 'none') return time;
    
    const beatsPerSecond = bpm / 60;
    const divisions = {
      '1/4': 1,
      '1/8': 2,
      '1/16': 4,
      '1/32': 8
    }[quantize] || 4;
    
    const gridSize = (1 / beatsPerSecond) / divisions;
    const quantized = Math.round(time / gridSize) * gridSize;
    
    // Blend between original and quantized based on strength
    const strength = quantizeStrength / 100;
    return time * (1 - strength) + quantized * strength;
  };

  const detectPitchAndOnsets = async (buffer: AudioBuffer): Promise<MIDINote[]> => {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const detector = new YINDetector(sampleRate);
    
    const hopSize = 512;
    const notes: MIDINote[] = [];
    let currentNote: MIDINote | null = null;
    
    for (let i = 0; i < channelData.length - hopSize; i += hopSize) {
      const frame = channelData.slice(i, i + hopSize);
      const time = i / sampleRate;
      
      // Calculate RMS for velocity
      const rms = Math.sqrt(
        frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length
      );
      
      // Detect pitch
      const pitchResult = detector.detect(frame);
      const frequency = pitchResult.frequency;
      
      setProgress((i / channelData.length) * 100);
      
      // Check if we have a valid pitch
      if (
        frequency > 0 &&
        frequency >= minFrequency &&
        frequency <= maxFrequency &&
        rms > pitchThreshold &&
        pitchResult.confidence > 0.5
      ) {
        const midiNote = frequencyToMIDI(frequency);
        const velocity = Math.max(
          minVelocity,
          Math.min(maxVelocity, Math.round(rms * 127 * (velocitySensitivity / 100)))
        );
        
        if (!currentNote) {
          // Start new note
          currentNote = {
            note: midiNote,
            velocity,
            startTime: time,
            duration: 0,
            frequency
          };
        } else {
          // Check if pitch changed significantly (glide detection)
          const cents = 1200 * Math.log2(frequency / currentNote.frequency);
          
          if (Math.abs(cents) > glideThreshold || (monoMode && midiNote !== currentNote.note)) {
            // End current note and start new one
            currentNote.duration = time - currentNote.startTime;
            
            if (currentNote.duration * 1000 >= minNoteDuration) {
              notes.push(currentNote);
            }
            
            currentNote = {
              note: midiNote,
              velocity,
              startTime: time,
              duration: 0,
              frequency
            };
          } else {
            // Continue current note
            currentNote.duration = time - currentNote.startTime;
          }
        }
      } else {
        // No pitch detected, end current note
        if (currentNote) {
          currentNote.duration = time - currentNote.startTime;
          
          if (currentNote.duration * 1000 >= minNoteDuration) {
            notes.push(currentNote);
          }
          
          currentNote = null;
        }
      }
    }
    
    // Close final note if exists
    if (currentNote) {
      currentNote.duration = (channelData.length / sampleRate) - currentNote.startTime;
      if (currentNote.duration * 1000 >= minNoteDuration) {
        notes.push(currentNote);
      }
    }
    
    return notes;
  };

  const handleConvert = async () => {
    if (!audioBuffer) {
      toast({
        title: "No Audio",
        description: "Please load an audio file first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const detectedNotes = await detectPitchAndOnsets(audioBuffer);
      
      // Apply quantization
      const quantizedNotes = detectedNotes.map(note => ({
        ...note,
        startTime: quantizeTime(note.startTime)
      }));
      
      setMidiNotes(quantizedNotes);
      
      if (onMIDIGenerated) {
        onMIDIGenerated(quantizedNotes);
      }

      toast({
        title: "Conversion Complete",
        description: `Detected ${quantizedNotes.length} MIDI notes`
      });

    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleExportMIDI = () => {
    if (midiNotes.length === 0) {
      toast({
        title: "No MIDI Data",
        description: "Convert audio first before exporting",
        variant: "destructive"
      });
      return;
    }

    // Create MIDI file data (simplified)
    const midiData = createMIDIFile(midiNotes);
    const blob = new Blob([new Uint8Array(midiData)], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audio-to-midi.mid';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "MIDI Exported",
      description: "MIDI file has been downloaded"
    });
  };

  const handlePreview = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
    } else if (audioBuffer) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);
    }
  };

  const getNoteNameFromMIDI = (midiNote: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
  };

  return (
    <Card className="bg-background/40 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Audio to MIDI Converter</CardTitle>
        <CardDescription>
          Convert monophonic audio to MIDI with pitch detection and quantization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleConvert}
            disabled={!audioBuffer || isProcessing}
            className="flex-1"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isProcessing ? 'Converting...' : 'Convert to MIDI'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!audioBuffer}
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportMIDI}
            disabled={midiNotes.length === 0}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              Analyzing audio... {progress.toFixed(0)}%
            </p>
          </div>
        )}

        {/* Pitch Detection Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Music className="w-4 h-4" />
            Pitch Detection
          </div>

          <div className="space-y-2">
            <Label>Detection Threshold</Label>
            <Slider
              value={[pitchThreshold * 100]}
              onValueChange={(v) => setPitchThreshold(v[0] / 100)}
              min={1}
              max={50}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-right">
              {(pitchThreshold * 100).toFixed(0)}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Frequency</Label>
              <Slider
                value={[minFrequency]}
                onValueChange={(v) => setMinFrequency(v[0])}
                min={40}
                max={500}
                step={10}
              />
              <div className="text-xs text-muted-foreground">
                {minFrequency} Hz ({getNoteNameFromMIDI(frequencyToMIDI(minFrequency))})
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Frequency</Label>
              <Slider
                value={[maxFrequency]}
                onValueChange={(v) => setMaxFrequency(v[0])}
                min={500}
                max={2000}
                step={50}
              />
              <div className="text-xs text-muted-foreground">
                {maxFrequency} Hz ({getNoteNameFromMIDI(frequencyToMIDI(maxFrequency))})
              </div>
            </div>
          </div>
        </div>

        {/* Quantization Settings */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Quantization</div>

          <div className="space-y-2">
            <Label>Grid Size</Label>
            <Select value={quantize} onValueChange={(v: any) => setQuantize(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="1/4">1/4 Note</SelectItem>
                <SelectItem value="1/8">1/8 Note</SelectItem>
                <SelectItem value="1/16">1/16 Note</SelectItem>
                <SelectItem value="1/32">1/32 Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {quantize !== 'none' && (
            <div className="space-y-2">
              <Label>Quantize Strength</Label>
              <Slider
                value={[quantizeStrength]}
                onValueChange={(v) => setQuantizeStrength(v[0])}
                min={0}
                max={100}
                step={1}
              />
              <div className="text-xs text-muted-foreground text-right">
                {quantizeStrength}%
              </div>
            </div>
          )}
        </div>

        {/* Velocity Settings */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Velocity</div>

          <div className="space-y-2">
            <Label>Velocity Sensitivity</Label>
            <Slider
              value={[velocitySensitivity]}
              onValueChange={(v) => setVelocitySensitivity(v[0])}
              min={0}
              max={200}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-right">
              {velocitySensitivity}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Velocity</Label>
              <Slider
                value={[minVelocity]}
                onValueChange={(v) => setMinVelocity(v[0])}
                min={1}
                max={127}
                step={1}
              />
              <div className="text-xs text-muted-foreground text-right">
                {minVelocity}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Velocity</Label>
              <Slider
                value={[maxVelocity]}
                onValueChange={(v) => setMaxVelocity(v[0])}
                min={1}
                max={127}
                step={1}
              />
              <div className="text-xs text-muted-foreground text-right">
                {maxVelocity}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Advanced</div>

          <div className="space-y-2">
            <Label>Min Note Duration</Label>
            <Slider
              value={[minNoteDuration]}
              onValueChange={(v) => setMinNoteDuration(v[0])}
              min={10}
              max={500}
              step={10}
            />
            <div className="text-xs text-muted-foreground text-right">
              {minNoteDuration} ms
            </div>
          </div>

          <div className="space-y-2">
            <Label>Glide Threshold</Label>
            <Slider
              value={[glideThreshold]}
              onValueChange={(v) => setGlideThreshold(v[0])}
              min={10}
              max={200}
              step={10}
            />
            <div className="text-xs text-muted-foreground text-right">
              {glideThreshold} cents
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Monophonic Mode</Label>
            <Switch checked={monoMode} onCheckedChange={setMonoMode} />
          </div>
        </div>

        {/* MIDI Notes Display */}
        {midiNotes.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Detected Notes ({midiNotes.length})
            </div>
            <ScrollArea className="h-48 border border-border/50 rounded-lg">
              <div className="p-4 space-y-2">
                {midiNotes.map((note, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-background/60 p-2 rounded"
                  >
                    <span className="font-medium">
                      {getNoteNameFromMIDI(note.note)} (MIDI {note.note})
                    </span>
                    <span className="text-muted-foreground">
                      {note.startTime.toFixed(2)}s - {note.duration.toFixed(2)}s
                    </span>
                    <span className="text-muted-foreground">
                      Vel: {note.velocity}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to create a basic MIDI file
function createMIDIFile(notes: MIDINote[]): Uint8Array {
  // Simplified MIDI file creation (Type 0, 1 track, 480 ticks per quarter note)
  const header = [
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Header length
    0x00, 0x00, // Format type 0
    0x00, 0x01, // Number of tracks
    0x01, 0xE0  // Ticks per quarter note (480)
  ];

  const trackEvents: number[] = [];
  const ticksPerSecond = 480; // Simplified, assumes 120 BPM

  notes.forEach(note => {
    const startTicks = Math.round(note.startTime * ticksPerSecond);
    const durationTicks = Math.round(note.duration * ticksPerSecond);

    // Note On
    trackEvents.push(...encodeVariableLength(startTicks));
    trackEvents.push(0x90, note.note, note.velocity);

    // Note Off
    trackEvents.push(...encodeVariableLength(durationTicks));
    trackEvents.push(0x80, note.note, 0x00);
  });

  // End of track
  trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

  const track = [
    0x4D, 0x54, 0x72, 0x6B, // "MTrk"
    ...numberToBytes(trackEvents.length, 4),
    ...trackEvents
  ];

  return new Uint8Array([...header, ...track]);
}

function encodeVariableLength(value: number): number[] {
  const bytes: number[] = [];
  bytes.unshift(value & 0x7F);
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7F) | 0x80);
    value >>= 7;
  }
  return bytes;
}

function numberToBytes(num: number, bytes: number): number[] {
  const result: number[] = [];
  for (let i = bytes - 1; i >= 0; i--) {
    result.push((num >> (i * 8)) & 0xFF);
  }
  return result;
}
