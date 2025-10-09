import { useState, useEffect, useRef } from 'react';
import { AudioEngine, EffectParams } from '@/audio/AudioEngine';
import { TransportControls } from '@/studio/components/TransportControls';
import { Timeline } from '@/studio/components/Timeline';
import { TrackLoader } from '@/studio/components/TrackLoader';
import { EffectsRack } from '@/studio/components/EffectsRack';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  
  // Effect parameters
  const [effects, setEffects] = useState({
    reverbMix: 0.3,
    delayTime: 0.375,
    delayFeedback: 0.4,
    delayMix: 0.2,
    limiterThreshold: -1.0
  });

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      if (audioEngineRef.current) {
        const time = audioEngineRef.current.getCurrentTime();
        setCurrentTime(time);
        
        if (time >= duration && duration > 0) {
          handleStop();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const handleLoadTrack = async (file: File) => {
    if (!audioEngineRef.current) return;
    
    try {
      const id = `track-${Date.now()}-${Math.random()}`;
      await audioEngineRef.current.loadTrack(id, file.name, file);
      
      const newTracks = audioEngineRef.current.getTracks();
      setTracks(newTracks);
      setDuration(audioEngineRef.current.getDuration());
      
      toast({
        title: 'Track loaded',
        description: `${file.name} added to mix`,
      });
    } catch (error) {
      toast({
        title: 'Error loading track',
        description: 'Failed to decode audio file',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveTrack = (id: string) => {
    if (!audioEngineRef.current) return;
    
    audioEngineRef.current.removeTrack(id);
    const newTracks = audioEngineRef.current.getTracks();
    setTracks(newTracks);
    setDuration(audioEngineRef.current.getDuration());
  };

  const handleVolumeChange = (id: string, volume: number) => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.setTrackVolume(id, volume);
    setTracks([...audioEngineRef.current.getTracks()]);
  };

  const handleMuteToggle = (id: string) => {
    if (!audioEngineRef.current) return;
    const track = tracks.find(t => t.id === id);
    if (track) {
      audioEngineRef.current.setTrackMute(id, !track.muted);
      setTracks([...audioEngineRef.current.getTracks()]);
    }
  };

  const handlePlay = () => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
    if (!audioEngineRef.current) return;
    const wasPlaying = isPlaying;
    
    if (wasPlaying) {
      audioEngineRef.current.pause();
    }
    
    setCurrentTime(time);
    
    if (wasPlaying) {
      audioEngineRef.current.play();
    }
  };

  const handleEffectChange = (param: string, value: number) => {
    if (!audioEngineRef.current) return;
    
    audioEngineRef.current.updateEffect(param as keyof EffectParams, value);
    setEffects(prev => ({ ...prev, [param]: value }));
  };

  const handleExport = async () => {
    if (!audioEngineRef.current) return;
    
    setIsExporting(true);
    
    try {
      const blob = await audioEngineRef.current.exportMix();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mixx-club-export-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Mix exported',
        description: 'Your mix has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to render mix',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 gradient-animate opacity-10 pointer-events-none" />
      
      {/* Grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--prime-500)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--prime-500)) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <header className="text-center space-y-2 mb-8">
          <h1 className="text-5xl font-bold neon-text tracking-tight">
            Mixx Club Pro Studio
          </h1>
          <p className="text-muted-foreground">
            The artist in the engineer — putting their hands on The Mixx
          </p>
          <div className="text-xs text-muted-foreground/60">
            Created by <span className="text-[hsl(var(--prime-500))]">Ravenis Prime</span>
          </div>
        </header>

        {/* Transport Controls */}
        <TransportControls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onExport={handleExport}
          isExporting={isExporting}
        />

        {/* Timeline */}
        <Timeline
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={handleSeek}
        />

        {/* Main workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Track Loader */}
          <div className="lg:col-span-2">
            <TrackLoader
              tracks={tracks}
              onLoadTrack={handleLoadTrack}
              onRemoveTrack={handleRemoveTrack}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
            />
          </div>

          {/* Effects Rack */}
          <div>
            <EffectsRack
              reverbMix={effects.reverbMix}
              delayTime={effects.delayTime}
              delayFeedback={effects.delayFeedback}
              delayMix={effects.delayMix}
              limiterThreshold={effects.limiterThreshold}
              onEffectChange={handleEffectChange}
            />
          </div>
        </div>

        {/* Footer branding */}
        <footer className="text-center text-sm text-muted-foreground/50 pt-8">
          <p>Mixx Club: where the sound meets the soul</p>
          <p className="text-xs mt-1">Prime built it for the future — 2030-ready</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;