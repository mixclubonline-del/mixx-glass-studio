/**
 * Audio Test Loader - Quick test component for loading and playing sample audio
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, Play, Pause, Square, Volume2, Info } from 'lucide-react';
import { IceFireFader } from '../Controls/IceFireFader';

export const AudioTestLoader = () => {
  const { audioEngine, transport, play, pause, stop, masterVolume, setMasterVolume } = useProject();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedFiles, setLoadedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBuffer, setCurrentBuffer] = useState<AudioBuffer | null>(null);

  const handleLoadFile = async (file: File) => {
    if (!audioEngine) return;

    setIsLoading(true);
    try {
      const trackId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      
      // Load into audio engine
      await audioEngine.loadTrack(trackId, file.name, file);
      
      // Get the loaded track
      const tracks = audioEngine.getTracks();
      const loadedTrack = tracks.find(t => t.id === trackId);
      
      if (loadedTrack?.buffer) {
        setLoadedFiles(prev => [...prev, `${file.name} (${loadedTrack.buffer!.duration.toFixed(2)}s)`]);
        setCurrentBuffer(loadedTrack.buffer);
        
        toast({
          title: "✅ Audio Loaded",
          description: `${file.name} - ${loadedTrack.buffer.duration.toFixed(2)}s`,
        });

        console.log('🎵 Test audio loaded:', {
          trackId,
          fileName: file.name,
          duration: loadedTrack.buffer.duration,
          channels: loadedTrack.buffer.numberOfChannels,
          sampleRate: loadedTrack.buffer.sampleRate,
          totalTracks: tracks.length
        });
      }
    } catch (error) {
      console.error('Failed to load test audio:', error);
      toast({
        title: "❌ Load Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('audio/')) {
          handleLoadFile(file);
        } else {
          toast({
            title: "Invalid File",
            description: `${file.name} is not an audio file`,
            variant: "destructive"
          });
        }
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlayPause = async () => {
    if (transport.isPlaying) {
      pause();
      console.log('🎵 Test: Paused playback');
    } else {
      await play();
      console.log('🎵 Test: Started playback');
    }
  };

  const handleStop = () => {
    stop();
    console.log('🎵 Test: Stopped playback');
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
    console.log(`🎵 Test: Master volume set to ${(value * 100).toFixed(0)}%`);
  };

  // Draw waveform when buffer changes
  useEffect(() => {
    if (!canvasRef.current || !currentBuffer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get audio data from first channel
    const channelData = currentBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / rect.width);
    const amp = rect.height / 2;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, 'hsl(var(--prime))');
    gradient.addColorStop(0.5, 'hsl(var(--prime-glow))');
    gradient.addColorStop(1, 'hsl(var(--prime))');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'hsl(var(--prime))';
    ctx.lineWidth = 1;

    // Draw waveform
    ctx.beginPath();
    ctx.moveTo(0, amp);

    for (let i = 0; i < rect.width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = channelData[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;

      ctx.fillRect(i, yMin, 1, yMax - yMin);
    }

    ctx.stroke();
  }, [currentBuffer]);

  return (
    <Card className="glass p-6 space-y-4 border-prime/20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Audio Test Loader</h3>
          <p className="text-sm text-muted-foreground">Quick load and test audio playback</p>
        </div>
        <Info size={18} className="text-muted-foreground" />
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id="audio-file-input"
        name="audioFile"
      />

      {/* Load Button */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        variant="prime"
        className="w-full"
        aria-label="Load audio test files"
        aria-describedby="audio-loader-description"
      >
        <Upload size={16} className="mr-2" aria-hidden="true" />
        {isLoading ? 'Loading...' : 'Load Test Audio'}
      </Button>
      <span id="audio-loader-description" className="sr-only">
        Click to open file picker and select audio files for testing
      </span>

      {/* Waveform Display */}
      {currentBuffer && (
        <div className="space-y-2" role="region" aria-label="Audio waveform visualization">
          <Label className="text-xs text-muted-foreground" id="waveform-label">Waveform</Label>
          <div className="glass-inset rounded overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-24"
              style={{ display: 'block' }}
              role="img"
              aria-labelledby="waveform-label"
              aria-describedby="waveform-description"
            />
            <span id="waveform-description" className="sr-only">
              Visual representation of the audio waveform showing amplitude over time
            </span>
          </div>
        </div>
      )}

      {/* Loaded Files List */}
      {loadedFiles.length > 0 && (
        <div className="space-y-2" role="region" aria-label="Loaded audio files">
          <Label className="text-xs text-muted-foreground" id="loaded-files-label">
            Loaded Files ({loadedFiles.length})
          </Label>
          <div 
            className="max-h-32 overflow-y-auto space-y-1 glass-inset rounded p-2"
            role="list"
            aria-labelledby="loaded-files-label"
            aria-live="polite"
          >
            {loadedFiles.map((file, idx) => (
              <div key={idx} className="text-xs text-foreground font-mono" role="listitem">
                {idx + 1}. {file}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transport Controls */}
      <div className="flex items-center gap-2" role="group" aria-label="Playback controls">
        <Button
          onClick={handlePlayPause}
          disabled={loadedFiles.length === 0}
          variant={transport.isPlaying ? 'destructive' : 'glass'}
          size="icon"
          aria-label={transport.isPlaying ? 'Pause playback' : 'Play audio'}
          aria-pressed={transport.isPlaying}
        >
          {transport.isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </Button>
        <Button
          onClick={handleStop}
          disabled={!transport.isPlaying && transport.currentTime === 0}
          variant="glass"
          size="icon"
          aria-label="Stop playback and reset to beginning"
        >
          <Square size={16} aria-hidden="true" />
        </Button>
        <div 
          className="flex-1 text-xs font-mono text-muted-foreground text-center"
          role="timer"
          aria-live="off"
          aria-label={`Current playback time: ${transport.currentTime.toFixed(2)} seconds`}
        >
          {transport.currentTime.toFixed(2)}s
        </div>
      </div>

      {/* Master Volume */}
      <div className="space-y-2" role="region" aria-label="Master volume control">
        <Label htmlFor="master-volume-fader" className="text-xs flex items-center gap-2">
          <Volume2 size={14} aria-hidden="true" />
          Master Volume
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <IceFireFader
              id="master-volume-fader"
              value={masterVolume}
              onChange={handleMasterVolumeChange}
              height={60}
              width={24}
              showScale={false}
              ariaLabel={`Master volume: ${(masterVolume * 100).toFixed(0)} percent`}
              ariaValueText={`${(masterVolume * 100).toFixed(0)}%`}
            />
          </div>
          <span 
            className="text-xs font-mono text-muted-foreground w-12"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {(masterVolume * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Debug Info */}
      <div 
        className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30"
        role="region"
        aria-label="Debug information"
        aria-live="polite"
      >
        <div role="status">Tracks: {audioEngine.getTracks().length}</div>
        <div role="status">Playing: {transport.isPlaying ? 'Yes' : 'No'}</div>
        <div role="status">Time: {transport.currentTime.toFixed(2)}s</div>
      </div>
    </Card>
  );
};
