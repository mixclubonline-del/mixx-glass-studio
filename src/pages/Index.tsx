import { useState, useEffect, useRef } from 'react';
import { AudioEngine, EffectParams } from '@/audio/AudioEngine';
import { TransportControls } from '@/studio/components/TransportControls';
import { AdvancedTimeline } from '@/studio/components/Timeline/AdvancedTimeline';
import { TrackLoader } from '@/studio/components/TrackLoader';
import { EffectsRack } from '@/studio/components/EffectsRack';
import { MixerWindow } from '@/studio/components/Mixer/MixerWindow';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PeakLevel, EQParams, CompressorParams } from '@/types/audio';

const Index = () => {
  const { toast } = useToast();
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [view, setView] = useState<'arrange' | 'mix'>('arrange');
  const [peakLevels, setPeakLevels] = useState<Map<string, PeakLevel>>(new Map());
  const [masterPeak, setMasterPeak] = useState<PeakLevel>({ left: -60, right: -60 });
  
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
        
        // Update peak meters
        const newPeaks = new Map<string, PeakLevel>();
        audioEngineRef.current.getTracks().forEach(track => {
          newPeaks.set(track.id, audioEngineRef.current!.getTrackPeakLevel(track.id));
        });
        setPeakLevels(newPeaks);
        setMasterPeak(audioEngineRef.current.getMasterPeakLevel());
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

        {/* Advanced Timeline */}
        <div className="h-96">
          <AdvancedTimeline
            tracks={tracks}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            bpm={audioEngineRef.current?.bpm || 120}
            onSeek={handleSeek}
            onTrackMuteToggle={handleMuteToggle}
            onTrackSoloToggle={(id) => {
              const track = tracks.find(t => t.id === id);
              if (track && audioEngineRef.current) {
                audioEngineRef.current.setTrackSolo(id, !track.channelStrip.isSolo());
                setTracks([...audioEngineRef.current.getTracks()]);
              }
            }}
          />
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 justify-center">
          <Button
            variant={view === 'arrange' ? 'default' : 'outline'}
            onClick={() => setView('arrange')}
          >
            Arrange
          </Button>
          <Button
            variant={view === 'mix' ? 'default' : 'outline'}
            onClick={() => setView('mix')}
          >
            Mix
          </Button>
        </div>

        {/* Main workspace */}
        {view === 'arrange' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TrackLoader
                tracks={tracks}
                onLoadTrack={handleLoadTrack}
                onRemoveTrack={handleRemoveTrack}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
              />
            </div>
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
        ) : (
          <div className="h-[600px]">
            <MixerWindow
              tracks={audioEngineRef.current?.getTracks() || []}
              buses={audioEngineRef.current?.getBuses() || []}
              masterBus={audioEngineRef.current?.['masterBus']}
              peakLevels={peakLevels}
              masterPeakLevel={masterPeak}
              onTrackEQChange={(id, params) => audioEngineRef.current?.setTrackEQ(id, params)}
              onTrackCompressorChange={(id, params) => audioEngineRef.current?.setTrackCompressor(id, params)}
              onTrackSendChange={(id, busId, amount) => audioEngineRef.current?.setTrackSend(id, busId, amount, false)}
              onTrackPanChange={(id, pan) => audioEngineRef.current?.setTrackPan(id, pan)}
              onTrackVolumeChange={(id, vol) => audioEngineRef.current?.setTrackVolume(id, vol)}
              onTrackSoloToggle={(id) => audioEngineRef.current?.setTrackSolo(id, !audioEngineRef.current.getTracks().find(t => t.id === id)?.channelStrip.isSolo())}
              onTrackMuteToggle={(id) => handleMuteToggle(id)}
              onMasterVolumeChange={(vol) => audioEngineRef.current?.['masterBus']?.channelStrip.setVolume(vol)}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </div>
        )}

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